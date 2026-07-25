"""
Calendar Service — Google Calendar integration, slot generation, and reminders.

Handles:
- Generating available time slots from business hours
- Google Calendar OAuth flow and event creation
- Checking availability against existing bookings
- Sending SMS reminders (24hr + 2hr before appointment)
"""
import logging
import json
from datetime import datetime, timedelta, timezone, time
from typing import Optional, Dict, Any, List
import uuid

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import async_session_maker
from models.business import Business
from models.booking import Booking
from models.lead import Lead
from services.twilio_service import twilio_service

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Google Calendar client (lazy-loaded)
# ──────────────────────────────────────────────────────────────────────


def _get_google_service(credentials: Optional[dict] = None):
    """Build a Google Calendar API service. Uses API key if no OAuth creds."""
    try:
        from googleapiclient.discovery import build
    except ImportError:
        logger.warning("google-api-python-client not installed. Google Calendar features disabled.")
        return None

    if credentials and credentials.get("access_token"):
        from google.oauth2.credentials import Credentials

        creds = Credentials(
            token=credentials.get("access_token"),
            refresh_token=credentials.get("refresh_token"),
            token_uri=settings.GOOGLE_TOKEN_URI,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
        return build("calendar", "v3", credentials=creds)
    elif settings.GOOGLE_CALENDAR_API_KEY:
        return build("calendar", "v3", developerKey=settings.GOOGLE_CALENDAR_API_KEY)
    return None


# ──────────────────────────────────────────────────────────────────────
# Slot Generation
# ──────────────────────────────────────────────────────────────────────


def parse_business_hours(business_hours: Optional[str]) -> Dict[str, List[Dict[str, str]]]:
    """
    Parse business hours from the Business model. Expected format:
    JSON string like '{"monday": {"start": "08:00", "end": "17:00"}, ...}'
    or a simple string like "Mon-Fri 8am-5pm".

    Returns normalized dict: {"mon": [{"start": "08:00", "end": "17:00"}], ...}
    """
    default_hours = {
        day: [{"start": "08:00", "end": "17:00"}]
        for day in ["mon", "tue", "wed", "thu", "fri"]
    }

    if not business_hours:
        return default_hours

    # Try parsing as JSON first
    try:
        parsed = json.loads(business_hours)
        if isinstance(parsed, dict):
            result = {}
            day_map = {
                "monday": "mon", "tuesday": "tue", "wednesday": "wed",
                "thursday": "thu", "friday": "fri", "saturday": "sat", "sunday": "sun",
            }
            for day_key, hours in parsed.items():
                short = day_map.get(day_key.lower(), day_key.lower()[:3])
                if isinstance(hours, dict) and "start" in hours:
                    result[short] = [{"start": hours["start"], "end": hours["end"]}]
                elif isinstance(hours, list):
                    result[short] = hours
            return result if result else default_hours
    except (json.JSONDecodeError, TypeError):
        pass

    # Simple string format — just return defaults
    return default_hours


class CalendarService:
    """Manages bookings, slots, and Google Calendar integration."""

    def __init__(self):
        pass

    # ── Slot Generation ────────────────────────────────────────────

    async def get_available_slots(
        self,
        db: AsyncSession,
        business_id,
        date: Optional[datetime] = None,
        slot_duration_minutes: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Generate available time slots for a business on a given date.
        Excludes slots that overlap with existing bookings.
        """
        date = date or datetime.now(timezone.utc)
        # Normalize to date only
        if hasattr(date, "date"):
            target_date = date.date()
        else:
            target_date = date

        # Get business hours
        result = await db.execute(select(Business).where(Business.id == business_id))
        business = result.scalar_one_or_none()
        if not business:
            return []

        hours = parse_business_hours(business.business_hours)

        # Map weekday number (0=Monday) to our day keys
        weekday = target_date.weekday()
        day_keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        day_key = day_keys[weekday]

        if day_key not in hours:
            return []

        # Get existing bookings for that day
        day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, time.max, tzinfo=timezone.utc)

        result = await db.execute(
            select(Booking).where(
                and_(
                    Booking.business_id == business_id,
                    Booking.scheduled_at >= day_start,
                    Booking.scheduled_at <= day_end,
                    Booking.status.in_(["pending", "confirmed"]),
                )
            )
        )
        existing_bookings = result.scalars().all()
        booked_slots = {b.scheduled_at for b in existing_bookings if b.scheduled_at}

        # Generate slots
        slots = []
        for window in hours[day_key]:
            try:
                start_h, start_m = map(int, window["start"].split(":"))
                end_h, end_m = map(int, window["end"].split(":"))
            except (ValueError, KeyError):
                continue

            current = datetime.combine(target_date, time(start_h, start_m), tzinfo=timezone.utc)
            end = datetime.combine(target_date, time(end_h, end_m), tzinfo=timezone.utc)

            while current + timedelta(minutes=slot_duration_minutes) <= end:
                # Check if slot conflicts with existing bookings
                if current not in booked_slots:
                    slots.append({
                        "time": current.isoformat(),
                        "formatted": current.strftime("%I:%M %p"),
                    })
                current += timedelta(minutes=slot_duration_minutes)

        return slots

    # ── Booking Management ─────────────────────────────────────────

    async def create_booking(
        self,
        db: AsyncSession,
        lead_id,
        business_id,
        scheduled_at: datetime,
        service_type: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Booking:
        """Create a new booking. Validates the slot is available."""
        # Validate slot is available
        result = await db.execute(
            select(Booking).where(
                and_(
                    Booking.business_id == business_id,
                    Booking.scheduled_at == scheduled_at,
                    Booking.status.in_(["pending", "confirmed"]),
                )
            )
        )
        conflict = result.scalar_one_or_none()
        if conflict:
            raise ValueError(f"Time slot {scheduled_at.isoformat()} is already booked")

        booking = Booking(
            lead_id=lead_id,
            business_id=business_id,
            scheduled_at=scheduled_at,
            status="pending",
            service_type=service_type,
            notes=notes,
        )
        db.add(booking)
        await db.commit()
        await db.refresh(booking)
        logger.info(f"Created booking {booking.id} for lead {lead_id} at {scheduled_at.isoformat()}")
        return booking

    async def confirm_booking(self, db: AsyncSession, booking_id) -> Booking:
        """Confirm a pending booking."""
        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")
        if booking.status != "pending":
            raise ValueError(f"Booking {booking_id} is not pending (current: {booking.status})")

        booking.status = "confirmed"
        await db.commit()
        await db.refresh(booking)

        # Update lead status
        result = await db.execute(select(Lead).where(Lead.id == booking.lead_id))
        lead = result.scalar_one_or_none()
        if lead:
            lead.status = "booked"
            await db.commit()

        # Try sending confirmation via Google Calendar + SMS
        await self._sync_to_google(db, booking)
        await self._send_booking_sms(db, booking, "confirmed")

        return booking

    async def cancel_booking(self, db: AsyncSession, booking_id) -> Booking:
        """Cancel a booking."""
        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")
        if booking.status in ("completed", "cancelled"):
            raise ValueError(f"Booking {booking_id} is already {booking.status}")

        booking.status = "cancelled"
        await db.commit()
        await db.refresh(booking)

        await self._send_booking_sms(db, booking, "cancelled")
        return booking

    async def complete_booking(self, db: AsyncSession, booking_id) -> Booking:
        """Mark a booking as completed."""
        result = await db.execute(select(Booking).where(Booking.id == booking_id))
        booking = result.scalar_one_or_none()
        if not booking:
            raise ValueError(f"Booking {booking_id} not found")

        booking.status = "completed"
        await db.commit()
        await db.refresh(booking)
        return booking

    # ── Google Calendar Integration ────────────────────────────────

    def get_google_oauth_url(self, business_id) -> str:
        """Generate the Google OAuth authorization URL for a business."""
        if not settings.GOOGLE_CLIENT_ID:
            return ""

        from google_auth_oauthlib.flow import Flow

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": settings.GOOGLE_AUTH_URI,
                    "token_uri": settings.GOOGLE_TOKEN_URI,
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=["https://www.googleapis.com/auth/calendar.events"],
        )
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        auth_url, state = flow.authorization_url(
            access_type="offline", prompt="consent", state=str(business_id)
        )
        return auth_url

    async def handle_oauth_callback(
        self, db: AsyncSession, code: str, state: str
    ) -> bool:
        """Handle OAuth callback, exchange code for tokens, store in business settings."""
        try:
            business_id = uuid.UUID(state)
        except ValueError:
            logger.error(f"Invalid OAuth state: {state}")
            return False

        try:
            from google_auth_oauthlib.flow import Flow

            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "auth_uri": settings.GOOGLE_AUTH_URI,
                        "token_uri": settings.GOOGLE_TOKEN_URI,
                        "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                    }
                },
                scopes=["https://www.googleapis.com/auth/calendar.events"],
            )
            flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
            flow.fetch_token(code=code)

            credentials = {
                "access_token": flow.credentials.token,
                "refresh_token": flow.credentials.refresh_token,
                "token_uri": settings.GOOGLE_TOKEN_URI,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
            }

            result = await db.execute(select(Business).where(Business.id == business_id))
            business = result.scalar_one_or_none()
            if not business:
                return False

            current_settings = business.settings or {}
            current_settings["google_credentials"] = credentials
            business.settings = current_settings
            business.calendar_connected = True
            await db.commit()

            logger.info(f"Google Calendar connected for business {business_id}")
            return True
        except Exception as e:
            logger.error(f"OAuth callback error: {e}")
            return False

    async def _sync_to_google(self, db: AsyncSession, booking: Booking):
        """Create a Google Calendar event for a confirmed booking."""
        result = await db.execute(
            select(Business).where(Business.id == booking.business_id)
        )
        business = result.scalar_one_or_none()
        if not business or not business.calendar_connected:
            return

        credentials = (business.settings or {}).get("google_credentials")
        service = _get_google_service(credentials)
        if not service:
            return

        try:
            result_lead = await db.execute(
                select(Lead).where(Lead.id == booking.lead_id)
            )
            lead = result_lead.scalar_one_or_none()

            event = {
                "summary": f"LeadHive: {booking.service_type or 'Appointment'}",
                "description": (
                    f"Lead: {lead.name or lead.phone if lead else 'N/A'}\n"
                    f"Service: {booking.service_type or 'N/A'}\n"
                    f"Notes: {booking.notes or 'N/A'}"
                ),
                "start": {
                    "dateTime": booking.scheduled_at.isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": (
                        booking.scheduled_at + timedelta(hours=1)
                    ).isoformat(),
                    "timeZone": "UTC",
                },
            }
            service.events().insert(calendarId="primary", body=event).execute()
            logger.info(f"Created Google Calendar event for booking {booking.id}")
        except Exception as e:
            logger.error(f"Failed to create Google Calendar event: {e}")

    # ── SMS Notifications ──────────────────────────────────────────

    async def _send_booking_sms(
        self, db: AsyncSession, booking: Booking, action: str
    ):
        """Send SMS notification about booking status change."""
        result = await db.execute(select(Lead).where(Lead.id == booking.lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            return

        messages = {
            "confirmed": (
                f"Your appointment is confirmed for "
                f"{booking.scheduled_at.strftime('%A %B %d at %I:%M %p')}. "
                f"We'll send a reminder before your appointment."
            ),
            "cancelled": (
                f"Your appointment for "
                f"{booking.scheduled_at.strftime('%A %B %d at %I:%M %p')} "
                f"has been cancelled. Reply to reschedule."
            ),
            "reminder_24h": (
                f"Reminder: Your appointment is tomorrow at "
                f"{booking.scheduled_at.strftime('%I:%M %p')}. "
                f"Reply YES to confirm or call to reschedule."
            ),
            "reminder_2h": (
                f"Reminder: Your appointment is in 2 hours at "
                f"{booking.scheduled_at.strftime('%I:%M %p')}."
            ),
        }

        body = messages.get(action, "")
        if not body:
            return

        try:
            await twilio_service.send_sms(lead.phone, body)
            logger.info(f"Sent {action} SMS to {lead.phone} for booking {booking.id}")
        except Exception as e:
            logger.error(f"Failed to send booking SMS: {e}")

    # ── Reminder Scheduler ─────────────────────────────────────────

    async def check_and_send_reminders(self, session_maker=None):
        """
        Send reminders for upcoming confirmed bookings.
        - 24 hours before: send reminder
        - 2 hours before: send reminder
        """
        sent_count = 0
        try:
            maker = session_maker or async_session_maker
            async with maker() as db:
                now = datetime.now(timezone.utc)
                window_24h = now + timedelta(hours=24)
                window_2h = now + timedelta(hours=2)

                # Find confirmed bookings in the reminder windows
                result = await db.execute(
                    select(Booking).where(
                        and_(
                            Booking.status == "confirmed",
                            Booking.scheduled_at > now,
                            Booking.scheduled_at <= window_24h,
                        )
                    )
                )
                upcoming = result.scalars().all()

                for booking in upcoming:
                    # Normalize to timezone-aware for safe comparison
                    sched = booking.scheduled_at
                    if sched.tzinfo is None:
                        sched = sched.replace(tzinfo=timezone.utc)
                    time_until = sched - now
                    hours_until = time_until.total_seconds() / 3600

                    # Determine which reminder to send
                    if booking.reminders_sent == 0 and hours_until <= 24:
                        await self._send_booking_sms(db, booking, "reminder_24h")
                        booking.reminders_sent = 1
                        sent_count += 1
                    elif booking.reminders_sent == 1 and hours_until <= 2:
                        await self._send_booking_sms(db, booking, "reminder_2h")
                        booking.reminders_sent = 2
                        sent_count += 1

                if sent_count > 0:
                    await db.commit()

                return sent_count
        except Exception as e:
            logger.error(f"Error in check_and_send_reminders: {e}")
            return sent_count


# Singleton
calendar_service = CalendarService()