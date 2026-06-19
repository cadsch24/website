from sqlalchemy import String, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from typing import Optional
from database import Base

class ContentIdea(Base):
    __tablename__ = "content_ideas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"))
    
    platform: Mapped[str] = mapped_column(String(50)) # Instagram, Facebook, Google
    topic: Mapped[str] = mapped_column(String(255))
    hook: Mapped[Optional[str]] = mapped_column(Text)
    caption: Mapped[Optional[str]] = mapped_column(Text)
    cta: Mapped[Optional[str]] = mapped_column(String(255))
    
    status: Mapped[str] = mapped_column(String(50), default="draft") # draft, published
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    business: Mapped["Business"] = relationship(back_populates="content_ideas")
