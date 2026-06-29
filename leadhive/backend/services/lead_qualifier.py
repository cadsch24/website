import json
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel
from openai import AsyncOpenAI
from config import settings
from models.lead import Lead
from models.conversation import Conversation
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import async_session_maker
from models.business import Business
from services.twilio_service import twilio_service
import uuid

logger = logging.getLogger(__name__)

class LeadQualificationResult(BaseModel):
    job_type: Optional[str] = None
    urgency: Optional[str] = None
    location: Optional[str] = None
    budget_range: Optional[str] = None
    sentiment: Optional[str] = None
    tag: str  # hot, warm, cold
    ai_summary: str

class LeadQualifier:
    def __init__(self):
        # We don't initialize here because settings might not have the key yet during app startup
        # or it might be passed via environment. We'll lazy init or check in qualify_lead.
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not set. Lead qualification will fail.")
                return None
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def qualify_lead(self, lead_id: uuid.UUID, db: Optional[AsyncSession] = None) -> Optional[LeadQualificationResult]:
        """
        Analyzes the conversation history for a lead and extracts qualification details.
        """
        client = self.client
        if not client:
            return None

        # If no session provided, create one
        if db is None:
            async with async_session_maker() as session:
                return await self._qualify_with_session(lead_id, session)
        else:
            return await self._qualify_with_session(lead_id, db)

    async def _qualify_with_session(self, lead_id: uuid.UUID, db: AsyncSession) -> Optional[LeadQualificationResult]:
        try:
            # 1. Fetch conversation history
            result = await db.execute(
                select(Conversation)
                .where(Conversation.lead_id == lead_id)
                .order_by(Conversation.created_at.asc())
            )
            conversations = result.scalars().all()
            
            if not conversations:
                logger.info(f"No conversation history found for lead {lead_id}")
                return None

            # 2. Format conversation for prompt
            history_text = ""
            for conv in conversations:
                sender = "Customer" if conv.direction == "inbound" else "Assistant"
                history_text += f"{sender}: {conv.content}\n"

            # 3. Call OpenAI
            system_prompt = """
            You are an expert lead qualification assistant for local service businesses (roofers, plumbers, HVAC, etc.).
            Analyze the conversation between the Customer and the Assistant.
            Extract the following fields in JSON format:
            - job_type: The service they need (e.g., roof repair, plumbing leak, HVAC install).
            - urgency: How soon they need it (e.g., emergency, immediate, next week, flexible).
            - location: The city, area, or address mentioned.
            - budget_range: Any mention of price, budget, or 'getting an estimate'.
            - sentiment: The customer's mood/intent (e.g., ready to hire, shopping around, frustrated).
            - tag: Classify as 'hot' (urgent + service match), 'warm' (interested but not urgent), or 'cold' (uninterested, wrong service, or spam).
            - ai_summary: A concise 1-2 sentence summary of the lead's status and needs.
            
            Return ONLY a valid JSON object.
            """

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Conversation history:\n{history_text}"}
                ],
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            if not content:
                logger.error("Empty response from OpenAI")
                return None

            raw_result = json.loads(content)
            result_obj = LeadQualificationResult(**raw_result)

            # 4. Update Lead in database
            await db.execute(
                update(Lead)
                .where(Lead.id == lead_id)
                .values(
                    job_type=result_obj.job_type,
                    urgency=result_obj.urgency,
                    location=result_obj.location,
                    budget_range=result_obj.budget_range,
                    tag=result_obj.tag,
                    ai_summary=result_obj.ai_summary,
                    status="qualified" if result_obj.tag in ["hot", "warm"] else "new"
                )
            )
            await db.commit()
            
            logger.info(f"Lead {lead_id} qualified as {result_obj.tag}")

            # 5. Notify business owner of high-value leads
            if result_obj.tag == "hot":
                try:
                    # Get business for owner's notification number
                    result = await db.execute(select(Business).where(Business.id == conversations[0].business_id))
                    business = result.scalar_one_or_none()
                    if business and business.settings:
                        owner_phone = business.settings.get("forwarding_number")
                        if owner_phone:
                            lead_info = f"Hot Lead! {result_obj.job_type} in {result_obj.location}. Summary: {result_obj.ai_summary}"
                            await twilio_service.send_sms(owner_phone, lead_info)
                            logger.info(f"Notified owner {owner_phone} of hot lead {lead_id}")
                except Exception as notify_err:
                    logger.error(f"Failed to notify owner of hot lead {lead_id}: {notify_err}")

            return result_obj

        except Exception as e:
            logger.error(f"Error qualifying lead {lead_id}: {e}")
            await db.rollback()
            return None

lead_qualifier = LeadQualifier()
