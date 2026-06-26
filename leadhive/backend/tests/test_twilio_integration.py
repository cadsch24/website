import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from models import Business, Lead, Conversation
from sqlalchemy import select
import uuid

@pytest.mark.asyncio
async def test_twilio_webhook_creates_lead_and_conversation(db_session: AsyncSession):
    # 1. Setup a business
    business = Business(
        name="Test Business",
        phone="+12223334444",
        twilio_connected=True
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    # 2. Simulate Twilio Webhook
    payload = {
        "From": "+15556667777",
        "To": "+12223334444",
        "Body": "Hello LeadHive!",
        "MessageSid": "SM12345"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/twilio/incoming", data=payload)

    assert response.status_code == 200
    assert "<?xml" in response.text
    assert "<Response" in response.text

    # 3. Verify Database State
    # Check Lead
    result = await db_session.execute(select(Lead).where(Lead.phone == "+15556667777"))
    lead = result.scalar_one_or_none()
    assert lead is not None
    assert lead.business_id == business.id

    # Check Conversation
    result = await db_session.execute(select(Conversation).where(Conversation.lead_id == lead.id))
    conversation = result.scalar_one_or_none()
    assert conversation is not None
    assert conversation.content == "Hello LeadHive!"
    assert conversation.direction == "inbound"

@pytest.mark.asyncio
async def test_send_message_outbound(db_session: AsyncSession, monkeypatch):
    # 1. Setup business and lead
    business = Business(name="Outbound Biz", phone="+1000")
    db_session.add(business)
    await db_session.flush()
    
    lead = Lead(phone="+1999", business_id=business.id)
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    # 2. Mock Twilio Service
    async def mock_send_sms(to_number, body):
        return "mock_sid"
    
    from services.twilio_service import twilio_service
    monkeypatch.setattr(twilio_service, "send_sms", mock_send_sms)

    # 3. Call Send Message endpoint
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            f"/api/v1/conversations/send?lead_id={lead.id}&body=Hi from AI"
        )

    assert response.status_code == 200
    assert response.json()["status"] == "sent"

    # 4. Verify Conversation stored
    result = await db_session.execute(
        select(Conversation).where(Conversation.direction == "outbound")
    )
    conv = result.scalar_one_or_none()
    assert conv is not None
    assert conv.content == "Hi from AI"
    assert conv.lead_id == lead.id

@pytest.mark.asyncio
async def test_twilio_voice_webhook_missed_call(db_session: AsyncSession, monkeypatch):
    # 1. Setup business
    business = Business(
        name="Voice Biz",
        phone="+1888",
        settings={"forwarding_number": "+1777", "missed_call_recovery_enabled": True}
    )
    db_session.add(business)
    await db_session.commit()
    await db_session.refresh(business)

    # 2. Mock Twilio Service send_sms
    async def mock_send_sms(to_number, body):
        return "mock_sid_voice"
    
    from services.twilio_service import twilio_service
    monkeypatch.setattr(twilio_service, "send_sms", mock_send_sms)

    # 3. Simulate Voice Action (Missed Call)
    payload = {
        "From": "+1666",
        "To": "+1888",
        "DialCallStatus": "no-answer"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # We call the action endpoint directly to simulate a completed Dial with no-answer
        # Using %2B instead of + for from_number
        response = await ac.post(
            f"/api/v1/twilio/voice-status?from_number=%2B1666&business_id={business.id}", 
            data=payload
        )

    assert response.status_code == 200
    assert "<?xml" in response.text

    # 4. Verify Lead and Conversation
    result = await db_session.execute(select(Lead).where(Lead.phone == "+1666"))
    lead = result.scalar_one_or_none()
    assert lead is not None

    result = await db_session.execute(select(Conversation).where(Conversation.lead_id == lead.id))
    conv = result.scalar_one_or_none()
    assert conv is not None
    assert "Missed Call" in conv.content
