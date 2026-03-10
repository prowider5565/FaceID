from sqlalchemy import (
    Column,
    BigInteger,
    Boolean,
    DateTime,
    Numeric,
    String,
    func,
    Enum,
)

from users.types import Gender, Role
from attendance.types import Shift
from config.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(32), unique=True, nullable=False, index=True)
    gender = Column(Enum(Gender), nullable=True, default=Gender.unknown)

    hourly_rate = Column(Numeric(10, 2), nullable=False)
    position = Column(String(128), nullable=False)

    shift = Column(Enum(Shift), nullable=False)
    role = Column(Enum(Role), nullable=False)

    is_day_off = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    attendance = relationship("Attendance", back_populates="user")
