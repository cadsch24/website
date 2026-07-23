import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel
from typing import List, Optional
import uuid

from database import get_async_session
from models.followup_sequence import FollowupSequence
from models.scheduled_message import ScheduledMessage
from models.lead import Lead
from services.followup_engine import followup_engine

logger = logging.getLogger(__name__)
router = APIRouter()

# ──────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ──────────────────────────────────────────────────────────────────────


class StepSchema(BaseModel):
    delay_hours: float
    template: str
    prompt_context: str = ""


class CreateSequenceSchema(BaseModel):
    business_id: str
    name: str
    trigger_event: str = "lead_created"
    steps: List[StepSchema]


class UpdateSequenceSchema(BaseModel):
    name: Optional[str] = None
    trigger_event: Optional[str] = None
    steps: Optional[List[StepSchema]] = None
    active: Optional[bool] = None


class SequenceResponse(BaseModel):
    id: str
    business_id: str
    name: str
    trigger_event: str
    steps: list
    active: bool
    created_at: str


class ScheduleFollowupSchema(BaseModel):
    lead_id: str
    business_id: str
    trigger_event: str = "lead_created"
    sequence_id: Optional[str] = None


# ──────────────────────────────────────────────────────────────────────
# Sequence Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.post("/sequences", response_model=SequenceResponse)
async def create_sequence(
    body: CreateSequenceSchema,
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new follow-up sequence."""
    steps_dicts = [s.model_dump() for s in body.steps]
    sequence = await followup_engine.create_sequence(
        db,
        uuid.UUID(body.business_id),
        body.name,
        body.trigger_event,
        steps_dicts,
    )
    return _sequence_to_response(sequence)


@router.get("/sequences", response_model=List[SequenceResponse])
async def list_sequences(
    business_id: str = Query(..., description="Filter by business ID"),
    db: AsyncSession = Depends(get_async_session),
):
    """List all sequences for a business."""
    result = await db.execute(
        select(FollowupSequence).where(
            FollowupSequence.business_id == uuid.UUID(business_id)
        ).order_by(FollowupSequence.created_at.desc())
    )
    sequences = result.scalars().all()
    return [_sequence_to_response(s) for s in sequences]


@router.get("/sequences/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(
    sequence_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single sequence by ID."""
    result = await db.execute(
        select(FollowupSequence).where(FollowupSequence.id == uuid.UUID(sequence_id))
    )
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return _sequence_to_response(sequence)


@router.patch("/sequences/{sequence_id}", response_model=SequenceResponse)
async def update_sequence(
    sequence_id: str,
    body: UpdateSequenceSchema,
    db: AsyncSession = Depends(get_async_session),
):
    """Update a follow-up sequence."""
    result = await db.execute(
        select(FollowupSequence).where(FollowupSequence.id == uuid.UUID(sequence_id))
    )
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    update_values = {}
    if body.name is not None:
        update_values["name"] = body.name
    if body.trigger_event is not None:
        update_values["trigger_event"] = body.trigger_event
    if body.steps is not None:
        update_values["steps"] = [s.model_dump() for s in body.steps]
    if body.active is not None:
        update_values["active"] = body.active

    if update_values:
        await db.execute(
            update(FollowupSequence)
            .where(FollowupSequence.id == uuid.UUID(sequence_id))
            .values(**update_values)
        )
        await db.commit()
        await db.refresh(sequence)

    return _sequence_to_response(sequence)


@router.delete("/sequences/{sequence_id}")
async def delete_sequence(
    sequence_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Delete a follow-up sequence."""
    result = await db.execute(
        select(FollowupSequence).where(FollowupSequence.id == uuid.UUID(sequence_id))
    )
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    await db.execute(
        delete(FollowupSequence).where(FollowupSequence.id == uuid.UUID(sequence_id))
    )
    await db.commit()
    return {"status": "ok", "detail": "Sequence deleted"}


@router.post("/sequences/{sequence_id}/toggle")
async def toggle_sequence(
    sequence_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Toggle a sequence's active state."""
    result = await db.execute(
        select(FollowupSequence).where(FollowupSequence.id == uuid.UUID(sequence_id))
    )
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")

    new_active = not sequence.active
    await db.execute(
        update(FollowupSequence)
        .where(FollowupSequence.id == uuid.UUID(sequence_id))
        .values(active=new_active)
    )
    await db.commit()
    return {"status": "ok", "active": new_active}


# ──────────────────────────────────────────────────────────────────────
# Scheduling Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.post("/schedule")
async def schedule_followups(
    body: ScheduleFollowupSchema,
    db: AsyncSession = Depends(get_async_session),
):
    """Schedule follow-up messages for a lead based on active sequences."""
    sequence_id = uuid.UUID(body.sequence_id) if body.sequence_id else None
    scheduled_ids = await followup_engine.schedule_followups_for_lead(
        db,
        uuid.UUID(body.lead_id),
        uuid.UUID(body.business_id),
        trigger_event=body.trigger_event,
        sequence_id=sequence_id,
    )
    return {
        "status": "ok",
        "scheduled_count": len(scheduled_ids),
        "scheduled_message_ids": [str(sid) for sid in scheduled_ids],
    }


@router.post("/schedule/no-show")
async def schedule_no_show(
    lead_id: str = Query(...),
    business_id: str = Query(...),
    db: AsyncSession = Depends(get_async_session),
):
    """Shortcut to schedule a no-show reschedule follow-up."""
    scheduled_ids = await followup_engine.schedule_no_show_followup(
        db, uuid.UUID(lead_id), uuid.UUID(business_id)
    )
    return {
        "status": "ok",
        "scheduled_count": len(scheduled_ids),
        "scheduled_message_ids": [str(sid) for sid in scheduled_ids],
    }


# ──────────────────────────────────────────────────────────────────────
# Scheduled Message Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.get("/scheduled-messages")
async def list_scheduled_messages(
    business_id: str = Query(..., description="Filter by business ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    lead_id: Optional[str] = Query(None, description="Filter by lead ID"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_async_session),
):
    """List scheduled messages for a business."""
    query = (
        select(ScheduledMessage)
        .where(ScheduledMessage.business_id == uuid.UUID(business_id))
        .order_by(ScheduledMessage.scheduled_at.asc())
    )
    if status:
        query = query.where(ScheduledMessage.status == status)
    if lead_id:
        query = query.where(ScheduledMessage.lead_id == uuid.UUID(lead_id))

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    return [
        {
            "id": str(m.id),
            "lead_id": str(m.lead_id),
            "business_id": str(m.business_id),
            "sequence_id": str(m.sequence_id) if m.sequence_id else None,
            "sequence_step": m.sequence_step,
            "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
            "status": m.status,
            "message_content": m.message_content,
            "template_used": m.template_used,
            "sent_at": m.sent_at.isoformat() if m.sent_at else None,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


# ──────────────────────────────────────────────────────────────────────
# Scheduler Control
# ──────────────────────────────────────────────────────────────────────


@router.post("/run-scheduler")
async def run_scheduler():
    """
    Manually trigger the follow-up scheduler to send any due messages.
    In production, this runs automatically every few minutes.
    """
    sent_count = await followup_engine.check_and_send_due_messages()
    return {"status": "ok", "messages_sent": sent_count}


@router.post("/generate-content")
async def generate_missing_content():
    """Generate AI content for any scheduled messages missing it."""
    await followup_engine.generate_missing_content()
    return {"status": "ok", "detail": "Content generation triggered"}


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def _sequence_to_response(seq: FollowupSequence) -> dict:
    return {
        "id": str(seq.id),
        "business_id": str(seq.business_id),
        "name": seq.name,
        "trigger_event": seq.trigger_event,
        "steps": seq.steps,
        "active": seq.active,
        "created_at": seq.created_at.isoformat() if seq.created_at else None,
    }