"""
Follow-up Engine — Smart scheduling and sending of follow-up SMS messages.

The engine supports:
- Configurable sequences (1hr, 24hr, 3 days) stored in followup_sequences table
- AI-personalized messages via OpenAI based on lead context
- Template types: estimate_followup, reactivation, no_show_reschedule
- A scheduler (check_and_send_due_messages) intended to run every few minutes
- Creating scheduled messages when trigger events occur
"""
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from openai import AsyncOpenAI
from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import async_session_maker
from models.lead import Lead
from models.business import Business
from models.conversation import Conversation
from models.followup_sequence import FollowupSequence
from models.scheduled_message import ScheduledMessage
from services.twilio_service import twilio_service

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Templates
# ──────────────────────────────────────────────────────────────────────

FOLLOWUP_TEMPLATES = {
    "estimate_followup": {
        "subject": "Estimate follow-up",
        "system_prompt": (
            "You are a friendly SMS assistant for a local service business. "
            "Write a brief, warm text message (under 160 characters) checking in "
            "on a recent estimate provided to the customer. "
            "Ask if they have questions or if they'd like to move forward. "
            "Use the customer's name if available. Do NOT use markdown, do NOT use emoji."
        ),
    },
    "reactivation": {
        "subject": "Re-engagement",
        "system_prompt": (
            "You are a friendly SMS assistant for a local service business. "
            "Write a brief, warm text message (under 160 characters) re-engaging "
            "a customer who showed interest but hasn't responded recently. "
            "Ask if they are still interested or if they need help. "
            "Use the customer's name if available. Do NOT use markdown, do NOT use emoji."
        ),
    },
    "no_show_reschedule": {
        "subject": "No-show reschedule",
        "system_prompt": (
            "You are a friendly SMS assistant for a local service business. "
            "Write a brief, warm text message (under 160 characters) following up "
            "on a missed appointment. Offer to help reschedule. "
            "Use the customer's name if available. Do NOT use markdown, do NOT use emoji."
        ),
    },
}

# Default sequence — used if a business hasn't configured their own
DEFAULT_SEQUENCE_STEPS = [
    {"delay_hours": 1, "template": "estimate_followup", "prompt_context": "Check in on estimate"},
    {"delay_hours": 24, "template": "reactivation", "prompt_context": "Still interested?"},
    {"delay_hours": 72, "template": "reactivation", "prompt_context": "Final check-in, any questions?"},
]

# ──────────────────────────────────────────────────────────────────────
# AI Personalization
# ──────────────────────────────────────────────────────────────────────


class FollowUpEngine:
    """Core engine for scheduling and sending follow-up messages."""

    def __init__(self):
        self._openai_client = None

    @property
    def openai_client(self):
        if self._openai_client is None:
            if not settings.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not set. AI personalization will fall back to templates.")
                return None
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    # ── Sequence Management ──────────────────────────────────────────

    async def create_sequence(
        self,
        db: AsyncSession,
        business_id,
        name: str,
        trigger_event: str,
        steps: List[Dict[str, Any]],
    ) -> FollowupSequence:
        """Create a new follow-up sequence for a business."""
        sequence = FollowupSequence(
            business_id=business_id,
            name=name,
            trigger_event=trigger_event,
            steps=steps,
            active=True,
        )
        db.add(sequence)
        await db.commit()
        await db.refresh(sequence)
        logger.info(f"Created follow-up sequence {sequence.id} for business {business_id}")
        return sequence

    async def get_active_sequences(
        self, db: AsyncSession, business_id, trigger_event: Optional[str] = None
    ) -> List[FollowupSequence]:
        """Get all active sequences for a business, optionally filtered by trigger_event."""
        query = select(FollowupSequence).where(
            FollowupSequence.business_id == business_id,
            FollowupSequence.active == True,
        )
        if trigger_event:
            query = query.where(FollowupSequence.trigger_event == trigger_event)
        result = await db.execute(query)
        return list(result.scalars().all())

    # ── Scheduling ────────────────────────────────────────────────────

    async def schedule_followups_for_lead(
        self,
        db: AsyncSession,
        lead_id,
        business_id,
        trigger_event: str = "lead_created",
        sequence_id=None,
    ):
        """
        Schedule follow-up messages for a lead based on the business's
        active sequences matching the trigger event.

        Called when a trigger event occurs (lead created, booking no-show, etc.).
        """
        # Find matching sequences
        if sequence_id:
            result = await db.execute(
                select(FollowupSequence).where(
                    FollowupSequence.id == sequence_id,
                    FollowupSequence.active == True,
                )
            )
            sequences = [result.scalar_one_or_none()] if result.scalar_one_or_none() else []
        else:
            sequences = await self.get_active_sequences(db, business_id, trigger_event)

        if not sequences:
            logger.info(f"No active sequences found for business {business_id}, event '{trigger_event}'")
            return []

        scheduled_ids = []
        now = datetime.now(timezone.utc)

        for seq in sequences:
            steps = seq.steps if isinstance(seq.steps, list) else []
            for step_idx, step in enumerate(steps):
                delay_hours = step.get("delay_hours", 24)
                template = step.get("template", "reactivation")
                prompt_context = step.get("prompt_context", "")

                scheduled_at = now + timedelta(hours=delay_hours)

                msg = ScheduledMessage(
                    lead_id=lead_id,
                    business_id=business_id,
                    sequence_id=seq.id,
                    sequence_step=step_idx,
                    scheduled_at=scheduled_at,
                    status="scheduled",
                    template_used=template,
                )
                db.add(msg)
                await db.flush()
                scheduled_ids.append((msg.id, template, prompt_context))
                logger.info(
                    f"Scheduled {template} for lead {lead_id} at {scheduled_at.isoformat()}"
                )

        await db.commit()

        # Pre-generate AI content in background (best-effort, don't block)
        for msg_id, template, prompt_context in scheduled_ids:
            try:
                await self._generate_message_content(db, msg_id, template, prompt_context)
            except Exception as e:
                logger.error(f"Failed to pre-generate content for msg {msg_id}: {e}")

        return [sid for sid, _, _ in scheduled_ids]

    async def schedule_no_show_followup(self, db: AsyncSession, lead_id, business_id):
        """Shortcut: schedule a no-show reschedule follow-up."""
        return await self.schedule_followups_for_lead(
            db, lead_id, business_id, trigger_event="no_show"
        )

    # ── AI Content Generation ────────────────────────────────────────

    async def _generate_message_content(
        self,
        db: AsyncSession,
        message_id,
        template_name: str,
        prompt_context: str = "",
    ):
        """Generate personalized message content for a scheduled message using AI or template fallback."""
        client = self.openai_client

        # Fetch the scheduled message with lead info
        result = await db.execute(
            select(ScheduledMessage).where(ScheduledMessage.id == message_id)
        )
        msg = result.scalar_one_or_none()
        if not msg:
            return

        # Fetch lead info
        result = await db.execute(select(Lead).where(Lead.id == msg.lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            return

        # Fetch lead's conversation history for context
        result = await db.execute(
            select(Conversation)
            .where(Conversation.lead_id == lead.id)
            .order_by(Conversation.created_at.asc())
        )
        conversations = result.scalars().all()

        # Build AI prompt
        template_info = FOLLOWUP_TEMPLATES.get(template_name, FOLLOWUP_TEMPLATES["reactivation"])

        content = None
        if client:
            try:
                history_text = ""
                for conv in conversations[-5:]:  # last 5 messages
                    sender = "Customer" if conv.direction == "inbound" else "Assistant"
                    history_text += f"{sender}: {conv.content}\n"

                user_context = f"Customer name: {lead.name or 'Unknown'}\n"
                user_context += f"Job type: {lead.job_type or 'Not specified'}\n"
                user_context += f"Lead status: {lead.status}\n"
                user_context += f"Additional context: {prompt_context}\n"
                if history_text:
                    user_context += f"\nRecent conversation:\n{history_text}"

                response = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": template_info["system_prompt"]},
                        {"role": "user", "content": user_context},
                    ],
                )
                content = response.choices[0].message.content
                if content:
                    content = content.strip().strip('"').strip("'")
            except Exception as e:
                logger.error(f"AI content generation failed for msg {message_id}: {e}")

        # Fallback to template string if AI failed or unavailable
        if not content:
            content = self._fallback_template(template_name, lead, prompt_context)

        # Update the scheduled message with generated content
        await db.execute(
            update(ScheduledMessage)
            .where(ScheduledMessage.id == message_id)
            .values(message_content=content)
        )
        await db.commit()
        logger.info(f"Generated content for scheduled message {message_id}: {content[:80]}...")

    def _fallback_template(self, template_name: str, lead, prompt_context: str) -> str:
        """Simple template-based fallback when AI is unavailable."""
        name = lead.name or "there"
        job = lead.job_type or "service"

        templates = {
            "estimate_followup": (
                f"Hi {name}, just checking in on your estimate for {job}. "
                f"Any questions or would you like to move forward?"
            ),
            "reactivation": (
                f"Hi {name}, just checking in — are you still interested in {job}? "
                f"Happy to help if you need anything."
            ),
            "no_show_reschedule": (
                f"Hi {name}, sorry we missed you for your appointment. "
                f"Would you like to reschedule? Just let us know a good time."
            ),
        }
        return templates.get(template_name, templates["reactivation"])

    # ── Scheduler ─────────────────────────────────────────────────────

    async def check_and_send_due_messages(self):
        """
        Main scheduler function. Checks for scheduled messages that are due
        and sends them via Twilio.

        This should be called periodically (e.g., every 2-5 minutes via
        BackgroundTasks, apscheduler, or a cron-like loop).
        """
        sent_count = 0
        try:
            async with async_session_maker() as db:
                now = datetime.now(timezone.utc)

                # Find all scheduled messages that are due
                result = await db.execute(
                    select(ScheduledMessage).where(
                        and_(
                            ScheduledMessage.status == "scheduled",
                            ScheduledMessage.scheduled_at <= now,
                        )
                    )
                )
                due_messages = result.scalars().all()

                if not due_messages:
                    return 0

                logger.info(f"Found {len(due_messages)} due follow-up messages to send")

                for msg in due_messages:
                    try:
                        await self._send_scheduled_message(db, msg)
                        sent_count += 1
                    except Exception as e:
                        logger.error(f"Failed to send scheduled message {msg.id}: {e}")
                        await db.rollback()

                return sent_count
        except Exception as e:
            logger.error(f"Error in check_and_send_due_messages: {e}")
            return sent_count

    async def _send_scheduled_message(self, db: AsyncSession, msg: ScheduledMessage):
        """Send a single scheduled message and update its status."""
        # Fetch lead for phone number
        result = await db.execute(select(Lead).where(Lead.id == msg.lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            logger.warning(f"Lead {msg.lead_id} not found for scheduled message {msg.id}")
            await db.execute(
                update(ScheduledMessage)
                .where(ScheduledMessage.id == msg.id)
                .values(status="skipped")
            )
            await db.commit()
            return

        # Generate content if not already set
        if not msg.message_content:
            await self._generate_message_content(
                db, msg.id, msg.template_used or "reactivation", ""
            )
            # Re-fetch after generation
            await db.refresh(msg)

        content = msg.message_content
        if not content:
            logger.warning(f"No content for scheduled message {msg.id}, skipping")
            await db.execute(
                update(ScheduledMessage)
                .where(ScheduledMessage.id == msg.id)
                .values(status="skipped")
            )
            await db.commit()
            return

        # Send via Twilio
        try:
            sid = await twilio_service.send_sms(lead.phone, content)

            # Record the outbound conversation
            conversation = Conversation(
                lead_id=lead.id,
                business_id=msg.business_id,
                content=content,
                direction="outbound",
                channel="sms",
            )
            db.add(conversation)

            # Mark as sent
            await db.execute(
                update(ScheduledMessage)
                .where(ScheduledMessage.id == msg.id)
                .values(
                    status="sent",
                    sent_at=datetime.now(timezone.utc),
                    message_content=content,
                )
            )
            await db.commit()
            logger.info(f"Sent scheduled message {msg.id} to {lead.phone} (SID: {sid})")
        except Exception as e:
            logger.error(f"Failed to send message {msg.id} to {lead.phone}: {e}")
            raise

    # ── Bulk Scheduler (for missed content) ──────────────────────────

    async def generate_missing_content(self):
        """Generate AI content for any scheduled messages missing it."""
        try:
            async with async_session_maker() as db:
                result = await db.execute(
                    select(ScheduledMessage).where(
                        and_(
                            ScheduledMessage.status == "scheduled",
                            ScheduledMessage.message_content == None,
                        )
                    )
                )
                missing = result.scalars().all()
                for msg in missing:
                    try:
                        await self._generate_message_content(
                            db, msg.id, msg.template_used or "reactivation", ""
                        )
                    except Exception as e:
                        logger.error(f"Failed to generate content for msg {msg.id}: {e}")
        except Exception as e:
            logger.error(f"Error in generate_missing_content: {e}")


# Singleton
followup_engine = FollowUpEngine()