from sqlalchemy import BigInteger, Boolean, Column, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship

from config.database import Base
from ws.types import DirectionType
from .types import Shift


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    attendance_date = Column(DateTime(timezone=True), nullable=False, index=True)
    direction = Column(Enum(DirectionType), nullable=False)

    user = relationship("User", back_populates="attendance")


class ShiftDuration(Base):
    __tablename__ = "shift_duration"

    id = Column(BigInteger, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    shift = Column(Enum(Shift), nullable=False)
    latest = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
