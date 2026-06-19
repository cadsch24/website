from sqlalchemy import String, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from typing import Optional
from database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"))
    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"))
    
    channel: Mapped[str] = mapped_column(String(50)) # sms, call, chat
    direction: Mapped[str] = mapped_column(String(50)) # inbound, outbound
    content: Mapped[str] = mapped_column(Text)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    lead: Mapped["Lead"] = relationship(back_populates="conversations")
    business: Mapped["Business"] = relationship(back_populates="conversations")
