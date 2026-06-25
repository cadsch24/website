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

logger = logging.getLogger(__name__)
router = APIRouter()

async def trigger_missed_call_followup(from_number: str, business: Business, db: AsyncSession):
    """
    Helper to trigger an instant SMS follow-up for a missed call.
    """
    try:
        # 1. Check if missed call recovery is enabled
        if not business.settings or not business.settings.get("missed_call_recovery_enabled", True):
            logger.info(f"Missed call recovery disabled for business {business.id}")
            return

        # 2. Find or create lead
        result = await db.execute(
            select(Lead).where(Lead.phone == from_number, Lead.business_id == business.id)
        )
        lead = result.scalar_one_or_none()
        
        if not lead:
            lead = Lead(
                phone=from_number,
                business_id=business.id,
                status="new"
            )
            db.add(lead)
            await db.flush()
            logger.info(f"Created new lead {lead.id} for missed call from {from_number}")
        
        # 3. Get message template from settings or use default
        message_body = business.settings.get(
            "missed_call_text", 
            "Hi! Sorry we missed your call. How can we help you today?"
        )

        # 4. Send SMS
        await twilio_service.send_sms(from_number, message_body)

        # 5. Store conversation
        conversation = Conversation(
            lead_id=lead.id,
            business_id=business.id,
            content=f"[Missed Call Follow-up] {message_body}",
            direction="outbound",
            channel="sms"
        )
        db.add(conversation)
        await db.commit()
        logger.info(f"Sent missed call follow-up to {from_number}")

    except Exception as e:
        logger.error(f"Error in trigger_missed_call_followup: {e}")
        # Rollback if error occurred during commit
        await db.rollback()
        raise e

@router.post("/webhooks/twilio")
async def twilio_webhook(
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

        # 1. Find business by To number (the Twilio number assigned to the business)
        result = await db.execute(select(Business).where(Business.phone == to_number))
        business = result.scalar_one_or_none()
        
        if not business:
            # For development/demo: if business not found by phone, use the first one
            result = await db.execute(select(Business))
            business = result.scalars().first()
            
            if not business:
                logger.error(f"No business found in database for Twilio number {to_number}")
                # We return a 200 to Twilio to avoid retries, but nothing to process
                return Response(content=str(MessagingResponse()), media_type="application/xml")

        # 2. Find or create lead by From number (the customer's phone number)
        result = await db.execute(
            select(Lead).where(Lead.phone == from_number, Lead.business_id == business.id)
        )
        lead = result.scalar_one_or_none()
        
        if not lead:
            lead = Lead(
                phone=from_number,
                business_id=business.id,
                status="new"
            )
            db.add(lead)
            await db.flush() # Flush to get lead.id
            logger.info(f"Created new lead for phone {from_number}")

        # 3. Store conversation record
        conversation = Conversation(
            lead_id=lead.id,
            business_id=business.id,
            content=body,
            direction="inbound",
            channel="sms"
        )
        db.add(conversation)
        await db.commit()

        # 4. (Future) Trigger AI Nurture Logic
        # For now, we just acknowledge receipt
        
        twiml = MessagingResponse()
        # Optional: twiml.message("Thanks for reaching out! One of our team members (or AI) will get back to you shortly.")
        
        return Response(content=str(twiml), media_type="application/xml")

    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}")
        # Return empty TwiML on error to avoid Twilio error sounds/retries if preferred
        return Response(content=str(MessagingResponse()), media_type="application/xml")

@router.post("/webhooks/twilio/voice")
async def twilio_voice_webhook(
    request: Request,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Initial voice webhook. Dials the business owner's number.
    """
    try:
        form_data = await request.form()
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        
        # Find business
        result = await db.execute(select(Business).where(Business.phone == to_number))
        business = result.scalar_one_or_none()
        
        if not business:
            result = await db.execute(select(Business))
            business = result.scalars().first()
            if not business:
                resp = VoiceResponse()
                resp.say("Thank you for calling.")
                return Response(content=str(resp), media_type="application/xml")

        forwarding_number = business.settings.get("forwarding_number") if business.settings else None
        
        response = VoiceResponse()
        if forwarding_number:
            # Action URL to catch if the call was answered or missed
            action_url = f"/api/v1/conversations/webhooks/twilio/voice/action?from_number={from_number}&business_id={business.id}"
            dial = Dial(timeout=20, action=action_url, method="POST")
            dial.number(forwarding_number)
            response.append(dial)
        else:
            # Missed call by default if no forwarding
            response.say("Sorry, no one is available. We will text you shortly.")
            await trigger_missed_call_followup(from_number, business, db)
            
        return Response(content=str(response), media_type="application/xml")
    except Exception as e:
        logger.error(f"Error in twilio_voice_webhook: {e}")
        return Response(content=str(VoiceResponse()), media_type="application/xml")

@router.post("/webhooks/twilio/voice/action")
async def twilio_voice_action(
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
        
        logger.info(f"Voice action for {from_number}, status: {dial_status}")
        
        if dial_status in ["no-answer", "busy", "failed", "canceled"]:
            u_id = uuid.UUID(business_id)
            result = await db.execute(select(Business).where(Business.id == u_id))
            business = result.scalar_one_or_none()
            if business:
                await trigger_missed_call_followup(from_number, business, db)
        
        return Response(content=str(VoiceResponse()), media_type="application/xml")
    except Exception as e:
        logger.error(f"Error in twilio_voice_action: {e}")
        return Response(content=str(VoiceResponse()), media_type="application/xml")

@router.post("/send")
async def send_message(
    lead_id: str,
    body: str,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Manual endpoint to send an outbound SMS to a lead.
    """
    # 1. Find lead and business
    u_id = uuid.UUID(lead_id)
    result = await db.execute(
        select(Lead).where(Lead.id == u_id)
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # 2. Send via Twilio
    try:
        # In a real app, we'd use the business's specific Twilio credentials if they vary
        # For now, use the global service
        sid = await twilio_service.send_sms(lead.phone, body)
        
        # 3. Store outbound conversation
        conversation = Conversation(
            lead_id=lead.id,
            business_id=lead.business_id,
            content=body,
            direction="outbound",
            channel="sms"
        )
        db.add(conversation)
        await db.commit()
        
        return {"status": "sent", "sid": sid}
    except Exception as e:
        logger.error(f"Failed to send outbound SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

