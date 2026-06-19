from sqlalchemy import String, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from typing import Optional, List
from database import Base

class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    business_hours: Mapped[Optional[str]] = mapped_column(String(255))
    calendar_connected: Mapped[bool] = mapped_column(default=False)
    twilio_connected: Mapped[bool] = mapped_column(default=False)
    settings: Mapped[Optional[dict]] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    leads: Mapped[List["Lead"]] = relationship(back_populates="business")
    conversations: Mapped[List["Conversation"]] = relationship(back_populates="business")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="business")
    followup_sequences: Mapped[List["FollowupSequence"]] = relationship(back_populates="business")
    content_ideas: Mapped[List["ContentIdea"]] = relationship(back_populates="business")
