from sqlalchemy import String, DateTime, ForeignKey, func, Text, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from typing import Optional
from database import Base


class ScheduledMessage(Base):
    __tablename__ = "scheduled_messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("leads.id"))
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("businesses.id"))
    sequence_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("followup_sequences.id"), nullable=True
    )

    sequence_step: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(
        String(50), default="scheduled"
    )  # scheduled, sent, cancelled, skipped
    message_content: Mapped[Optional[str]] = mapped_column(Text)
    template_used: Mapped[Optional[str]] = mapped_column(String(100))
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    lead: Mapped["Lead"] = relationship(back_populates="scheduled_messages")
    business: Mapped["Business"] = relationship(back_populates="scheduled_messages")
    sequence: Mapped["FollowupSequence"] = relationship(back_populates="scheduled_messages")