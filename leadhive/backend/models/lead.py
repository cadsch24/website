from sqlalchemy import String, JSON, DateTime, ForeignKey, func, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from typing import Optional, List
from database import Base

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("businesses.id"))
    
    name: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    job_type: Mapped[Optional[str]] = mapped_column(String(100))
    urgency: Mapped[Optional[str]] = mapped_column(String(50))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    budget_range: Mapped[Optional[str]] = mapped_column(String(100))
    
    status: Mapped[str] = mapped_column(String(50), default="new") # new, contacted, qualified, booked, lost
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    tag: Mapped[Optional[str]] = mapped_column(String(50)) # hot, warm, cold
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    business: Mapped["Business"] = relationship(back_populates="leads")
    conversations: Mapped[List["Conversation"]] = relationship(back_populates="lead")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="lead")
    scheduled_messages: Mapped[List["ScheduledMessage"]] = relationship(back_populates="lead")
