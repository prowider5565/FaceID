from datetime import datetime

from pydantic import BaseModel, Field

from cameras.types import CameraPosition, CameraStatus


class RegisterCameraBody(BaseModel):
    ip_address: str = Field(min_length=1, max_length=64)
    device_name: str = Field(min_length=1, max_length=255)


class CameraOut(BaseModel):
    id: int
    ip_address: str
    device_name: str
    position: CameraPosition
    status: CameraStatus
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True
