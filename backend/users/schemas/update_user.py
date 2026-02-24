from pydantic import BaseModel, Field

from users.types import Role, Shift


class UpdateUserBody(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone_number: str = Field(min_length=1, max_length=32)
    hourly_rate: float = Field(gt=0)
    position: str = Field(min_length=1, max_length=128)
    shift: Shift
    role: Role
    is_active: bool
