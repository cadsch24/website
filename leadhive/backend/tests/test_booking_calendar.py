"""
Tests for Booking + Calendar Automation.
"""
import pytest
from datetime import datetime, timedelta, timezone, date
from httpx import AsyncClient, ASGITransport

from main import app
from models import Business, Lead, Booking
from sqlalchemy import select
from services.calendar_service import calendar_service, parse_business_hours


# ──────────────────────────────────────────────────────────────────────
# Business Hours Parsing
# ──────────────────────────────────────────────────────────────────────


def test_parse_business_hours_json():
    """Test parsing JSON-format business hours."""
    import json
    hours = json.dumps({
        "monday": {"start": "08:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "18:00"},
        "friday": {"start": "08:00", "end": "15:00"},
    })
    result = parse_business_hours(hours)
    assert "mon" in result
    assert result["mon"][0]["start"] == "08:00"
    assert result["mon"][0]["end"] == "17:00"
    assert result["tue"][0]["start"] == "09:00"
    assert result["fri"][0]["start"] == "08:00"


def test_parse_business_hours_none():
    """Test default hours when no business hours set."""
    result = parse_business_hours(None)
    assert len(result) == 5  # Mon-Fri
    assert result["mon"][0]["start"] == "08:00"
    assert result["mon"][0]["end"] == "17:00"
    assert "sat" not in result
    assert "sun" not in result


def test_parse_business_hours_invalid():
    """Test fallback on invalid input."""
    result = parse_business_hours("invalid")
    assert "mon" in result  # Falls back to defaults


# ──────────────────────────────────────────────────────────────────────
# Slot Generation
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_available_slots(db_session):
    """Test generating slots for a business."""
    business = Business(
        name="Slot Biz",
        phone="+1",
        business_hours='{"monday":{"start":"09:00","end":"11:00"}}',
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    # Use a Monday for testing
    target = date(2026, 7, 6)  # This is a Monday

    slots = await calendar_service.get_available_slots(
        db_session, business.id, date=target, slot_duration_minutes=60
    )
    assert len(slots) == 2  # 9:00 and 10:00
    assert slots[0]["formatted"] == "09:00 AM"
    assert slots[1]["formatted"] == "10:00 AM"


@pytest.mark.asyncio
async def test_get_available_slots_excludes_booked(db_session):
    """Test that booked slots are excluded from available slots."""
    business = Business(
        name="Booked Biz",
        phone="+2",
        business_hours='{"monday":{"start":"09:00","end":"11:00"}}',
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+3", business_id=business.id, status="new")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    target = date(2026, 7, 6)  # Monday

    # Book the 9:00 slot
    booked_dt = datetime(2026, 7, 6, 9, 0, tzinfo=timezone.utc)
    booking = Booking(
        lead_id=lead.id,
        business_id=business.id,
        scheduled_at=booked_dt,
        status="confirmed",
    )
    db_session.add(booking)
    await db_session.commit()

    slots = await calendar_service.get_available_slots(
        db_session, business.id, date=target, slot_duration_minutes=60
    )
    assert len(slots) == 1  # Only 10:00 available
    assert slots[0]["formatted"] == "10:00 AM"


@pytest.mark.asyncio
async def test_get_available_slots_no_hours_for_day(db_session):
    """Test returning empty slots for a day with no business hours."""
    business = Business(
        name="No Sat Biz",
        phone="+4",
        business_hours='{"monday":{"start":"09:00","end":"17:00"}}',
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    saturday = date(2026, 7, 11)  # Saturday
    slots = await calendar_service.get_available_slots(
        db_session, business.id, date=saturday
    )
    assert len(slots) == 0


# ──────────────────────────────────────────────────────────────────────
# Booking CRUD
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_booking(db_session):
    """Test creating a booking."""
    business = Business(name="Create Biz", phone="+5")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+6", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched, "roof repair", "Bring ladder"
    )

    assert booking is not None
    assert booking.status == "pending"
    assert booking.service_type == "roof repair"
    assert booking.notes == "Bring ladder"


@pytest.mark.asyncio
async def test_create_booking_conflict(db_session):
    """Test that conflicting bookings are rejected."""
    business = Business(name="Conflict Biz", phone="+7")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+8", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    lead2 = Lead(phone="+9", business_id=business.id, status="qualified")
    db_session.add(lead2)
    await db_session.commit()
    await db_session.refresh(lead2)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)

    # First booking succeeds
    await calendar_service.create_booking(db_session, lead.id, business.id, sched)

    # Second booking at same time should fail
    with pytest.raises(ValueError, match="already booked"):
        await calendar_service.create_booking(db_session, lead2.id, business.id, sched)


@pytest.mark.asyncio
async def test_confirm_booking(db_session, monkeypatch):
    """Test confirming a booking updates status and lead."""
    business = Business(name="Confirm Biz", phone="+10")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+11", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    # Mock SMS + Google sync to avoid external calls
    async def mock_noop3(*a, **kw): pass
    monkeypatch.setattr(calendar_service, "_send_booking_sms", mock_noop3)
    monkeypatch.setattr(calendar_service, "_sync_to_google", mock_noop3)

    confirmed = await calendar_service.confirm_booking(db_session, booking.id)
    assert confirmed.status == "confirmed"

    # Lead should be updated to "booked"
    result = await db_session.execute(select(Lead).where(Lead.id == lead.id))
    updated_lead = result.scalar_one_or_none()
    assert updated_lead.status == "booked"


@pytest.mark.asyncio
async def test_cancel_booking(db_session):
    """Test cancelling a booking."""
    business = Business(name="Cancel Biz", phone="+12")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+13", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    cancelled = await calendar_service.cancel_booking(db_session, booking.id)
    assert cancelled.status == "cancelled"


@pytest.mark.asyncio
async def test_cannot_cancel_completed(db_session):
    """Test that completed bookings cannot be cancelled."""
    business = Business(name="Done Biz", phone="+14")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+15", business_id=business.id, status="booked")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )
    booking.status = "completed"
    await db_session.commit()

    with pytest.raises(ValueError, match="already completed"):
        await calendar_service.cancel_booking(db_session, booking.id)


@pytest.mark.asyncio
async def test_cannot_confirm_non_pending(db_session):
    """Test that non-pending bookings cannot be confirmed."""
    business = Business(name="Non Pend Biz", phone="+16")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+17", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )
    booking.status = "confirmed"
    await db_session.commit()

    with pytest.raises(ValueError, match="not pending"):
        await calendar_service.confirm_booking(db_session, booking.id)


# ──────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_api_create_booking(db_session):
    """Test booking creation via API."""
    business = Business(name="API Biz", phone="+18")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+19", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    payload = {
        "lead_id": str(lead.id),
        "business_id": str(business.id),
        "scheduled_at": "2026-08-01T14:00:00+00:00",
        "service_type": "plumbing",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/bookings/", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["data"]["status"] == "pending"
    assert data["data"]["service_type"] == "plumbing"


@pytest.mark.asyncio
async def test_api_list_bookings(db_session):
    """Test listing bookings via API."""
    business = Business(name="List Biz", phone="+20")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+21", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/bookings/?business_id={business.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1


@pytest.mark.asyncio
async def test_api_get_booking(db_session):
    """Test getting a single booking via API."""
    business = Business(name="Get Biz", phone="+22")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+23", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/bookings/{booking.id}")

    assert response.status_code == 200
    assert response.json()["data"]["id"] == str(booking.id)


@pytest.mark.asyncio
async def test_api_confirm_booking(db_session, monkeypatch):
    """Test confirming via API."""
    business = Business(name="APIConfirm Biz", phone="+24")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+25", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    # Mock async methods to avoid Twilio/Google calls
    async def mock_noop(*a, **kw): pass
    monkeypatch.setattr(calendar_service, "_send_booking_sms", mock_noop)
    monkeypatch.setattr(calendar_service, "_sync_to_google", mock_noop)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/bookings/{booking.id}/confirm")

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "confirmed"


@pytest.mark.asyncio
async def test_api_cancel_booking(db_session, monkeypatch):
    """Test cancelling via API."""
    business = Business(name="APICancel Biz", phone="+26")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+27", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime(2026, 8, 1, 14, 0, tzinfo=timezone.utc)
    booking = await calendar_service.create_booking(
        db_session, lead.id, business.id, sched
    )

    async def mock_noop2(*a, **kw): pass
    monkeypatch.setattr(calendar_service, "_send_booking_sms", mock_noop2)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/bookings/{booking.id}/cancel")

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_api_get_slots(db_session):
    """Test slot retrieval via API."""
    business = Business(
        name="Slots API Biz",
        phone="+28",
        business_hours='{"monday":{"start":"09:00","end":"11:00"}}',
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(
            f"/api/v1/bookings/slots?business_id={business.id}&date=2026-07-06"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2


@pytest.mark.asyncio
async def test_api_past_booking_rejected(db_session):
    """Test that booking in the past is rejected."""
    business = Business(name="Past Biz", phone="+29")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+30", business_id=business.id, status="qualified")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    payload = {
        "lead_id": str(lead.id),
        "business_id": str(business.id),
        "scheduled_at": "2020-01-01T14:00:00+00:00",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/bookings/", json=payload)

    assert response.status_code == 400


# ──────────────────────────────────────────────────────────────────────
# Reminders
# ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_check_and_send_reminders(db_session, monkeypatch):
    """Test the reminder scheduler."""
    business = Business(name="Reminder Biz", phone="+31")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+32", business_id=business.id, status="booked")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # Booking 12 hours from now — should trigger 24h reminder (reminders_sent == 0)
    sched = datetime.now(timezone.utc) + timedelta(hours=12)
    booking = Booking(
        lead_id=lead.id,
        business_id=business.id,
        scheduled_at=sched,
        status="confirmed",
        reminders_sent=0,
    )
    db_session.add(booking)
    await db_session.commit()

    # Mock Twilio
    sent = []
    async def mock_send(to, body):
        sent.append((to, body))
        return "sid"

    from services.twilio_service import twilio_service
    monkeypatch.setattr(twilio_service, "send_sms", mock_send)

    from tests.conftest import async_session_maker_test
    reminders_sent = await calendar_service.check_and_send_reminders(
        session_maker=async_session_maker_test
    )

    assert reminders_sent >= 1
    assert len(sent) >= 1
    # Verify reminder text mentions "tomorrow"
    assert "tomorrow" in sent[0][1].lower()


@pytest.mark.asyncio
async def test_reminder_2h(db_session, monkeypatch):
    """Test 2-hour reminder."""
    business = Business(name="Remind2h Biz", phone="+33")
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    lead = Lead(phone="+34", business_id=business.id, status="booked")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    sched = datetime.now(timezone.utc) + timedelta(minutes=90)
    booking = Booking(
        lead_id=lead.id,
        business_id=business.id,
        scheduled_at=sched,
        status="confirmed",
        reminders_sent=1,  # Already got 24h reminder
    )
    db_session.add(booking)
    await db_session.commit()

    sent = []
    async def mock_send(to, body):
        sent.append((to, body))
        return "sid"

    from services.twilio_service import twilio_service
    monkeypatch.setattr(twilio_service, "send_sms", mock_send)

    from tests.conftest import async_session_maker_test
    reminders_sent = await calendar_service.check_and_send_reminders(
        session_maker=async_session_maker_test
    )

    assert reminders_sent >= 1
    assert "2 hours" in sent[0][1]