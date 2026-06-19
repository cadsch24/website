from sqlalchemy import String, JSON, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime
from database import Base

class FollowupSequence(Base):
    __tablename__ = "followup_sequences"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("businesses.id"))
    
    name: Mapped[str] = mapped_column(String(255))
    trigger_event: Mapped[str] = mapped_column(String(100))
    steps: Mapped[list] = mapped_column(JSON) # Array of steps
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    business: Mapped["Business"] = relationship(back_populates="followup_sequences")
