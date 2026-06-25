from fastapi import APIRouter, Request, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_session
from models import Business, Lead, Conversation
from sqlalchemy import select
import uuid
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import VoiceResponse, Dial
from services.twilio_service import twilio_service
import logging
from api.conversations import trigger_missed_call_followup

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/incoming")
async def twilio_sms_webhook(
    request: Request, 
    db: AsyncSession = Depends(get_async_session)
):
    """
    Webhook handler for inbound Twilio SMS messages.
    """
    try:
        form_data = await request.form()
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        body = form_data.get("Body")
        
        logger.info(f"Received Twilio SMS from {from_number} to {to_number}: {body}")

        if not from_number or not to_number:
            raise HTTPException(status_code=400, detail="Missing From or To number")

        # 1. Find business by To number
        result = await db.execute(select(Business).where(Business.phone == to_number))
        business = result.scalar_one_or_none()
        
        if not business:
            result = await db.execute(select(Business))
            business = result.scalars().first()
            if not business:
                return Response(content=str(MessagingResponse()), media_type="application/xml")

        # 2. Find or create lead
        result = await db.execute(
            select(Lead).where(Lead.phone == from_number, Lead.business_id == business.id)
        )
        lead = result.scalar_one_or_none()
        
        if not lead:
            lead = Lead(phone=from_number, business_id=business.id, status="new")
            db.add(lead)
            await db.flush()

        # 3. Store conversation
        conversation = Conversation(
            lead_id=lead.id,
            business_id=business.id,
            content=body,
            direction="inbound",
            channel="sms"
        )
        db.add(conversation)
        await db.commit()

        return Response(content=str(MessagingResponse()), media_type="application/xml")

    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}")
        return Response(content=str(MessagingResponse()), media_type="application/xml")

@router.post("/voice-status")
async def twilio_voice_status(
    request: Request,
    from_number: str,
    business_id: str,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Called after Dial ends.
    """
    try:
        form_data = await request.form()
        dial_status = form_data.get("DialCallStatus")
        
        if dial_status in ["no-answer", "busy", "failed", "canceled"]:
            u_id = uuid.UUID(business_id)
            result = await db.execute(select(Business).where(Business.id == u_id))
            business = result.scalar_one_or_none()
            if business:
                await trigger_missed_call_followup(from_number, business, db)
        
        return Response(content=str(VoiceResponse()), media_type="application/xml")
    except Exception as e:
        logger.error(f"Error in twilio_voice_status: {e}")
        return Response(content=str(VoiceResponse()), media_type="application/xml")
