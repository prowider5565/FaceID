from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, Text, func, JSON

from config.database import Base
from users.types import Role
from .types import EventType


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True)
    payload = Column(JSON, nullable=False)
    event_type = Column(Enum(EventType))
    is_read = Column(Boolean, nullable=False, default=False)
    receiver = Column(Enum(Role), nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
