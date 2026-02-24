from sqlalchemy import BigInteger, Column, DateTime, Enum, String, func

from cameras.types import CameraPosition, CameraStatus
from config.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(BigInteger, primary_key=True, index=True)
    ip_address = Column(String(64), unique=True, nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    position = Column(Enum(CameraPosition), nullable=False)
    status = Column(Enum(CameraStatus), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
