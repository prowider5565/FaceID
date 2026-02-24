from datetime import datetime

from common.pydantic_basemodel import BaseModel
from users.types import Role, Shift


class GetUser(BaseModel):
    id: int
    full_name: str
    phone_number: str
    hourly_rate: float
    position: str
    shift: Shift
    role: Role
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None
