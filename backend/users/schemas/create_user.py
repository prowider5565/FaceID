from typing import Optional
from pydantic import BaseModel

from users.types import Gender, Role
from attendance.types import Shift


class CreateUserBody(BaseModel):
    full_name: str
    phone_number: str
    hourly_rate: float
    shift: Shift
    role: Role
    gender: Gender

    position: Optional[str] = None
    is_active: Optional[bool] = True
