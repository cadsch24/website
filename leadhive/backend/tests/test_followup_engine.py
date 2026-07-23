"""
Tests for the Follow-Up Engine — sequence creation, scheduling, and sending.
"""
import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from main import app
from models import Business, Lead, FollowupSequence, ScheduledMessage, Conversation
from services.followup_engine import followup_engine


# ──────────────────────────────────────────────────────────────────────
# Sequence Creation
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_sequence(db_session):
    """Test creating a follow-up sequence."""
    business = Business(name="Test Biz", phone="+1111", twilio_connected=True)
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    steps = [
        {"delay_hours": 1, "template": "estimate_followup", "prompt_context": "Check in"},
        {"delay_hours": 24, "template": "reactivation", "prompt_context": "Still interested?"},
    ]

    sequence = await followup_engine.create_sequence(
        db_session, business.id, "Test Sequence", "lead_created", steps
    )

    assert sequence is not None
    assert sequence.name == "Test Sequence"
    assert sequence.trigger_event == "lead_created"
    assert len(sequence.steps) == 2
    assert sequence.active is True
    assert sequence.business_id == business.id


@pytest.mark.asyncio
async def test_get_active_sequences(db_session):
    """Test retrieving active sequences for a business."""
    business = Business(name="Get Seq Biz", phone="+2222")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    # Create two sequences
    await followup_engine.create_sequence(
        db_session, business.id, "Seq 1", "lead_created",
        [{"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""}]
    )
    await followup_engine.create_sequence(
        db_session, business.id, "Seq 2", "no_show",
        [{"delay_hours": 24, "template": "no_show_reschedule", "prompt_context": ""}]
    )

    # Should find 1 for lead_created
    seqs = await followup_engine.get_active_sequences(db_session, business.id, "lead_created")
    assert len(seqs) == 1
    assert seqs[0].name == "Seq 1"

    # Should find both
    seqs_all = await followup_engine.get_active_sequences(db_session, business.id)
    assert len(seqs_all) == 2


# ──────────────────────────────────────────────────────────────────────
# Scheduling
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_schedule_followups_for_lead(db_session):
    """Test scheduling follow-up messages for a lead."""
    business = Business(name="Schedule Biz", phone="+3333")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+4444", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Create a sequence
    await followup_engine.create_sequence(
        db_session, business.id, "Default", "lead_created",
        [
            {"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""},
            {"delay_hours": 24, "template": "reactivation", "prompt_context": ""},
        ]
    )

    # Schedule follow-ups
    scheduled_ids = await followup_engine.schedule_followups_for_lead(
        db_session, lead.id, business.id, "lead_created"
    )

    assert len(scheduled_ids) == 2

    # Verify in database
    result = await db_session.execute(
        select(ScheduledMessage).where(ScheduledMessage.lead_id == lead.id)
    )
    messages = result.scalars().all()
    assert len(messages) == 2
    assert messages[0].status == "scheduled"
    assert messages[0].sequence_step == 0
    assert messages[1].sequence_step == 1
    assert messages[0].template_used == "estimate_followup"
    assert messages[1].template_used == "reactivation"


@pytest.mark.asyncio
async def test_schedule_followups_no_matching_sequence(db_session):
    """Test scheduling with no matching sequences."""
    business = Business(name="No Seq Biz", phone="+5555")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+6666", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # No sequences created — should return empty
    scheduled_ids = await followup_engine.schedule_followups_for_lead(
        db_session, lead.id, business.id, "lead_created"
    )
    assert scheduled_ids == []


@pytest.mark.asyncio
async def test_schedule_no_show_followup(db_session):
    """Test the no-show shortcut."""
    business = Business(name="No Show Biz", phone="+7777")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+8888", business_id=business.id, status="booked")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Create no_show sequence
    await followup_engine.create_sequence(
        db_session, business.id, "No Show Seq", "no_show",
        [{"delay_hours": 1, "template": "no_show_reschedule", "prompt_context": ""}]
    )

    scheduled_ids = await followup_engine.schedule_no_show_followup(
        db_session, lead.id, business.id
    )
    assert len(scheduled_ids) == 1


# ──────────────────────────────────────────────────────────────────────
# Template Fallback
# ──────────────────────────────────────────────────────────────────────


def test_fallback_templates():
    """Test the fallback template strings."""
    # We need a mock lead-like object
    class MockLead:
        name = "John"
        job_type = "roof repair"
        status = "new"

    lead = MockLead()

    result_estimate = followup_engine._fallback_template("estimate_followup", lead, "")
    assert "John" in result_estimate
    assert "roof repair" in result_estimate

    result_reactivation = followup_engine._fallback_template("reactivation", lead, "")
    assert "John" in result_reactivation

    result_no_show = followup_engine._fallback_template("no_show_reschedule", lead, "")
    assert "reschedule" in result_no_show


def test_fallback_template_no_name():
    """Test fallback template when lead has no name."""
    class MockLead:
        name = None
        job_type = "plumbing"
        status = "new"

    lead = MockLead()
    result = followup_engine._fallback_template("estimate_followup", lead, "")
    assert "there" in result  # Falls back to "there"


# ──────────────────────────────────────────────────────────────────────
# Scheduler
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_check_and_send_due_messages(db_session, test_session_maker, monkeypatch):
    """Test the scheduler sending due messages."""
    business = Business(name="Due Biz", phone="+9999")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+1010", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Create a scheduled message that's due (scheduled in the past)
    past_time = datetime.now(timezone.utc) - timedelta(hours=2)
    msg = ScheduledMessage(
        lead_id=lead.id,
        business_id=business.id,
        sequence_step=0,
        scheduled_at=past_time,
        status="scheduled",
        template_used="estimate_followup",
        message_content="Hi John, just checking in on your estimate. Any questions?",
    )
    db_session.add(msg)
    await db_session.commit()

    # Mock Twilio
    sent_sms = []

    async def mock_send_sms(to_number, body):
        sent_sms.append((to_number, body))
        return "mock_sid_due"

    from services.twilio_service import twilio_service
    monkeypatch.setattr(twilio_service, "send_sms", mock_send_sms)

    # Run scheduler with test session maker
    sent_count = await followup_engine.check_and_send_due_messages(session_maker=test_session_maker)

    assert sent_count == 1
    assert len(sent_sms) == 1
    assert sent_sms[0][0] == "+1010"
    assert "estimate" in sent_sms[0][1]

    # Verify message status updated - expire cached object first
    await db_session.refresh(msg)
    assert msg.status == "sent"
    assert msg.sent_at is not None

    # Verify conversation was created
    result = await db_session.execute(
        select(Conversation).where(Conversation.lead_id == lead.id)
    )
    conv = result.scalar_one_or_none()
    assert conv is not None
    assert conv.direction == "outbound"
    assert conv.channel == "sms"


@pytest.mark.asyncio
async def test_scheduler_skips_future_messages(db_session):
    """Test that the scheduler does not send future messages."""
    business = Business(name="Future Biz", phone="+1112")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+1113", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Schedule message in the future
    future_time = datetime.now(timezone.utc) + timedelta(hours=24)
    msg = ScheduledMessage(
        lead_id=lead.id,
        business_id=business.id,
        sequence_step=0,
        scheduled_at=future_time,
        status="scheduled",
        template_used="reactivation",
        message_content="Hi, are you still interested?",
    )
    db_session.add(msg)
    await db_session.commit()

    sent_count = await followup_engine.check_and_send_due_messages()
    assert sent_count == 0


@pytest.mark.asyncio
async def test_scheduler_skips_already_sent_messages(db_session):
    """Test the scheduler does not resend already-sent messages."""
    business = Business(name="Sent Biz", phone="+1114")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+1115", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    past_time = datetime.now(timezone.utc) - timedelta(hours=2)
    msg = ScheduledMessage(
        lead_id=lead.id,
        business_id=business.id,
        sequence_step=0,
        scheduled_at=past_time,
        status="sent",  # Already sent
        template_used="reactivation",
        message_content="Hi there",
    )
    db_session.add(msg)
    await db_session.commit()

    sent_count = await followup_engine.check_and_send_due_messages()
    assert sent_count == 0


# ──────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_api_create_sequence(db_session):
    """Test the sequence creation API endpoint."""
    business = Business(name="API Biz", phone="+1116")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    payload = {
        "business_id": str(business.id),
        "name": "API Sequence",
        "trigger_event": "lead_created",
        "steps": [
            {"delay_hours": 1, "template": "estimate_followup", "prompt_context": "Check in"},
        ],
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/followup/sequences", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "API Sequence"
    assert data["trigger_event"] == "lead_created"
    assert len(data["steps"]) == 1
    assert data["active"] is True


@pytest.mark.asyncio
async def test_api_list_sequences(db_session):
    """Test listing sequences via API."""
    business = Business(name="List Biz", phone="+1117")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    # Create a sequence
    await followup_engine.create_sequence(
        db_session, business.id, "List Seq", "lead_created",
        [{"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""}]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            f"/api/v1/followup/sequences?business_id={business.id}"
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "List Seq"


@pytest.mark.asyncio
async def test_api_schedule_followups(db_session):
    """Test the schedule follow-ups API endpoint."""
    business = Business(name="Schedule API Biz", phone="+1118")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+1119", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Create a sequence first
    await followup_engine.create_sequence(
        db_session, business.id, "API Seq", "lead_created",
        [{"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""}]
    )

    payload = {
        "lead_id": str(lead.id),
        "business_id": str(business.id),
        "trigger_event": "lead_created",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/followup/schedule", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["scheduled_count"] == 1


@pytest.mark.asyncio
async def test_api_run_scheduler(db_session, monkeypatch):
    """Test the scheduler trigger API endpoint returns correct shape."""
    # Mock the engine's check_and_send_due_messages to avoid actual DB access
    async def mock_scheduler(session_maker=None):
        return 1

    monkeypatch.setattr(
        followup_engine, "check_and_send_due_messages", mock_scheduler
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/followup/run-scheduler")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["messages_sent"] == 1


@pytest.mark.asyncio
async def test_api_toggle_sequence(db_session):
    """Test toggling sequence active state."""
    business = Business(name="Toggle Biz", phone="+1122")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    seq = await followup_engine.create_sequence(
        db_session, business.id, "Toggle Seq", "lead_created",
        [{"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""}]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/followup/sequences/{seq.id}/toggle")

    assert response.status_code == 200
    assert response.json()["active"] is False

    # Toggle back
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/followup/sequences/{seq.id}/toggle")

    assert response.json()["active"] is True


@pytest.mark.asyncio
async def test_api_delete_sequence(db_session):
    """Test deleting a sequence."""
    business = Business(name="Delete Biz", phone="+1123")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    seq = await followup_engine.create_sequence(
        db_session, business.id, "Delete Seq", "lead_created",
        [{"delay_hours": 1, "template": "estimate_followup", "prompt_context": ""}]
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.delete(f"/api/v1/followup/sequences/{seq.id}")

    assert response.status_code == 200

    # Verify gone
    result = await db_session.execute(
        select(FollowupSequence).where(FollowupSequence.id == seq.id)
    )
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_api_get_sequence_not_found(db_session):
    """Test 404 for non-existent sequence."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/followup/sequences/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_api_list_scheduled_messages(db_session):
    """Test listing scheduled messages via API."""
    business = Business(name="List Msg Biz", phone="+1124")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+1125", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    msg = ScheduledMessage(
        lead_id=lead.id,
        business_id=business.id,
        sequence_step=0,
        scheduled_at=datetime.now(timezone.utc) + timedelta(hours=1),
        status="scheduled",
        template_used="estimate_followup",
        message_content="Test content",
    )
    db_session.add(msg)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            f"/api/v1/followup/scheduled-messages?business_id={business.id}"
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "scheduled"
    assert data[0]["template_used"] == "estimate_followup"
    assert data[0]["message_content"] == "Test content"