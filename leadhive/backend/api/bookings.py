"""
Bookings API — CRUD for bookings, slot availability, Google Calendar OAuth.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_async_session
from models.booking import Booking
from models.business import Business
from models.lead import Lead
from services.calendar_service import calendar_service

logger = logging.getLogger(__name__)
router = APIRouter()

# ──────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ──────────────────────────────────────────────────────────────────────


class CreateBookingSchema(BaseModel):
    lead_id: str
    business_id: str
    scheduled_at: str  # ISO 8601 datetime
    service_type: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    lead_id: str
    business_id: str
    scheduled_at: str
    status: str
    service_type: Optional[str] = None
    notes: Optional[str] = None
    reminders_sent: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SlotResponse(BaseModel):
    time: str
    formatted: str


def _booking_to_response(b: Booking) -> dict:
    return {
        "id": str(b.id),
        "lead_id": str(b.lead_id),
        "business_id": str(b.business_id),
        "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else None,
        "status": b.status,
        "service_type": b.service_type,
        "notes": b.notes,
        "reminders_sent": b.reminders_sent,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "updated_at": b.updated_at.isoformat() if b.updated_at else None,
    }


# ──────────────────────────────────────────────────────────────────────
# Slot Availability (must be before {booking_id} routes)
# ──────────────────────────────────────────────────────────────────────


@router.get("/slots")
async def get_available_slots(
    business_id: str = Query(..., description="Business ID"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    slot_duration_minutes: int = Query(60, ge=15, le=240),
    db: AsyncSession = Depends(get_async_session),
):
    """Get available time slots for a business."""
    target_date = None
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    slots = await calendar_service.get_available_slots(
        db,
        uuid.UUID(business_id),
        date=target_date,
        slot_duration_minutes=slot_duration_minutes,
    )
    return {"status": "ok", "data": slots, "count": len(slots)}


# ──────────────────────────────────────────────────────────────────────
# Booking CRUD
# ──────────────────────────────────────────────────────────────────────


@router.post("/")
async def create_booking(
    body: CreateBookingSchema,
    db: AsyncSession = Depends(get_async_session),
):
    """Create a new booking (pending status)."""
    try:
        scheduled_dt = datetime.fromisoformat(body.scheduled_at)
        if scheduled_dt.tzinfo is None:
            scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scheduled_at format. Use ISO 8601.")

    if scheduled_dt < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book in the past.")

    try:
        booking = await calendar_service.create_booking(
            db,
            uuid.UUID(body.lead_id),
            uuid.UUID(body.business_id),
            scheduled_dt,
            body.service_type,
            body.notes,
        )
        return {"status": "ok", "data": _booking_to_response(booking)}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/")
async def list_bookings(
    business_id: str = Query(..., description="Filter by business ID"),
    lead_id: Optional[str] = Query(None, description="Filter by lead ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_async_session),
):
    """List bookings for a business, with optional filters."""
    query = select(Booking).where(
        Booking.business_id == uuid.UUID(business_id)
    )
    if lead_id:
        query = query.where(Booking.lead_id == uuid.UUID(lead_id))
    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.scheduled_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    bookings = result.scalars().all()

    return {
        "status": "ok",
        "data": [_booking_to_response(b) for b in bookings],
        "count": len(bookings),
    }


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Get a single booking by ID."""
    result = await db.execute(
        select(Booking).where(Booking.id == uuid.UUID(booking_id))
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "ok", "data": _booking_to_response(booking)}


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: str,
    scheduled_at: Optional[str] = None,
    service_type: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_async_session),
):
    """Update booking fields (not status — use confirm/cancel endpoints)."""
    result = await db.execute(
        select(Booking).where(Booking.id == uuid.UUID(booking_id))
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if scheduled_at is not None:
        try:
            dt = datetime.fromisoformat(scheduled_at)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            booking.scheduled_at = dt
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format")
    if service_type is not None:
        booking.service_type = service_type
    if notes is not None:
        booking.notes = notes

    await db.commit()
    await db.refresh(booking)
    return {"status": "ok", "data": _booking_to_response(booking)}


@router.post("/{booking_id}/confirm")
async def confirm_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Confirm a pending booking."""
    try:
        booking = await calendar_service.confirm_booking(
            db, uuid.UUID(booking_id)
        )
        return {"status": "ok", "data": _booking_to_response(booking)}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Cancel a booking."""
    try:
        booking = await calendar_service.cancel_booking(
            db, uuid.UUID(booking_id)
        )
        return {"status": "ok", "data": _booking_to_response(booking)}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/{booking_id}/complete")
async def complete_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_async_session),
):
    """Mark a booking as completed."""
    try:
        booking = await calendar_service.complete_booking(
            db, uuid.UUID(booking_id)
        )
        return {"status": "ok", "data": _booking_to_response(booking)}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


# ──────────────────────────────────────────────────────────────────────
# Google Calendar OAuth
# ──────────────────────────────────────────────────────────────────────


@router.get("/google/auth")
async def google_oauth_url(
    business_id: str = Query(..., description="Business ID"),
):
    """Get the Google OAuth authorization URL."""
    auth_url = calendar_service.get_google_oauth_url(uuid.UUID(business_id))
    if not auth_url:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar not configured. Set GOOGLE_CLIENT_ID.",
        )
    return {"status": "ok", "auth_url": auth_url}


@router.get("/google/callback")
async def google_oauth_callback(
    code: str = Query(..., description="OAuth authorization code"),
    state: str = Query(..., description="OAuth state (business ID)"),
    db: AsyncSession = Depends(get_async_session),
):
    """Handle Google OAuth callback."""
    success = await calendar_service.handle_oauth_callback(db, code, state)
    if not success:
        raise HTTPException(status_code=400, detail="OAuth callback failed.")
    return {"status": "ok", "detail": "Google Calendar connected successfully."}


# ──────────────────────────────────────────────────────────────────────
# Reminders
# ──────────────────────────────────────────────────────────────────────


@router.post("/reminders/trigger")
async def trigger_reminders():
    """Manually trigger the reminder scheduler."""
    sent = await calendar_service.check_and_send_reminders()
    return {"status": "ok", "reminders_sent": sent}