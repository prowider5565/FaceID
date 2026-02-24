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

from users.types import Role, Shift
from config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(32), unique=True, nullable=False, index=True)

    hourly_rate = Column(Numeric(10, 2), nullable=False)
    position = Column(String(128), nullable=False)

    shift = Column(Enum(Shift), nullable=False)
    role = Column(Enum(Role), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
