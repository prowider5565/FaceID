from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, Text, func

from config.database import Base
from users.types import Role


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    receiver = Column(Enum(Role), nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
