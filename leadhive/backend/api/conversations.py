from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import VoiceResponse

from database import get_async_session
from models.lead import Lead
from models.conversation import Conversation
from models.business import Business
from services.twilio_service import TwilioService

router = APIRouter()
twilio_service = TwilioService()


async def get_or_create_lead(db: AsyncSession, phone: str, business_id: str) -> Lead:
    """Find existing lead by phone + business, or create a new one."""
    result = await db.execute(
        select(Lead).where(Lead.phone == phone, Lead.business_id == business_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        lead = Lead(phone=phone, business_id=business_id, name=None)
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
    return lead


async def store_conversation(
    db: AsyncSession,
    lead_id: str,
    business_id: str,
    channel: str,
    direction: str,
    content: str,
) -> Conversation:
    """Store a conversation entry in the database."""
    conv = Conversation(
        lead_id=lead_id,
        business_id=business_id,
        channel=channel,
        direction=direction,
        content=content,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.post("/webhooks/twilio")
async def twilio_sms_webhook(request: Request, db: AsyncSession = Depends(get_async_session)):
    """
    Handle inbound SMS from Twilio.
    Creates or finds a lead and logs the conversation.
    """
    form = await request.form()
    from_number = form.get("From")
    body = form.get("Body", "")
    business_phone = form.get("To")

    # Find the business by their Twilio phone number
    result = await db.execute(
        select(Business).where(Business.phone == business_phone)
    )
    business = result.scalar_one_or_none()
    if not business:
        # Auto-create a default business if none exists
        business = Business(phone=business_phone, name="Default Business")
        db.add(business)
        await db.commit()
        await db.refresh(business)

    lead = await get_or_create_lead(db, from_number, str(business.id))
    await store_conversation(db, str(lead.id), str(business.id), "sms", "inbound", body)

    resp = MessagingResponse()
    return Response(content=str(resp), media_type="application/xml")


@router.post("/webhooks/twilio/voice")
async def twilio_voice_webhook(request: Request):
    """
    Handle inbound voice calls from Twilio.
    Forwards the call to the business owner (default behavior).
    """
    form = await request.form()
    from_number = form.get("From", "unknown")

    resp = VoiceResponse()
    resp.say("Please hold while we connect you.")
    # In production, forward to the business owner's real number
    # resp.dial(business_owner_number)
    resp.hangup()

    return Response(content=str(resp), media_type="application/xml")


@router.post("/webhooks/twilio/voice/action")
async def twilio_voice_action_webhook(
    request: Request, db: AsyncSession = Depends(get_async_session)
):
    """
    Handle voice call status callbacks from Twilio.
    Detects missed calls (no-answer, busy, failed) and triggers SMS recovery.
    """
    form = await request.form()
    call_status = form.get("CallStatus", "")
    from_number = form.get("Caller", "")
    business_phone = form.get("To", "")

    missed_statuses = {"no-answer", "busy", "failed", "canceled"}
    if call_status in missed_statuses and from_number:
        # Find business and lead
        result = await db.execute(
            select(Business).where(Business.phone == business_phone)
        )
        business = result.scalar_one_or_none()
        if business:
            lead = await get_or_create_lead(db, from_number, str(business.id))
            await store_conversation(
                db, str(lead.id), str(business.id), "voice", "missed",
                f"Missed call from {from_number} (status: {call_status})"
            )
            # Send SMS recovery message
            recovery_msg = "Hey, sorry we missed your call—what can we help you with?"
            try:
                twilio_service.send_sms(to=from_number, body=recovery_msg)
            except RuntimeError:
                pass  # Twilio not configured, skip SMS
            await store_conversation(
                db, str(lead.id), str(business.id), "sms", "outbound", recovery_msg
            )

    return {"status": "ok"}


# Export the twilio service for use by other modules
def get_twilio_service() -> TwilioService:
    return twilio_service