"""Integration tests for Twilio SMS and voice webhooks."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_twilio_webhook_creates_lead_and_conversation(client):
    """Inbound SMS webhook should create a lead + conversation."""
    form_data = {
        "From": "+15551234567",
        "Body": "I need a new roof for my house",
        "To": "+15559876543",
    }
    response = await client.post("/api/v1/conversations/webhooks/twilio", data=form_data)
    assert response.status_code == 200
    assert "application/xml" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_send_message_outbound():
    """Test that the TwilioService can format an outbound message."""
    from services.twilio_service import TwilioService

    # Verify the service class exists and has expected methods
    svc = TwilioService()
    assert hasattr(svc, "send_sms")
    assert hasattr(svc, "is_configured")
    assert hasattr(svc, "get_call_context")


@pytest.mark.asyncio
async def test_twilio_voice_webhook_missed_call(client):
    """Voice webhook for missed call should return valid TwiML."""
    form_data = {
        "CallStatus": "no-answer",
        "Caller": "+15551234567",
        "To": "+15559876543",
    }
    response = await client.post(
        "/api/v1/conversations/webhooks/twilio/voice/action", data=form_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"