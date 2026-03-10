from datetime import datetime

from attendance.types import Shift
from common.pydantic_basemodel import BaseModel


class ShiftSchema(BaseModel):
    id: int
    shift: Shift
    start_time: datetime
    end_time: datetime


class CreateShiftBody(BaseModel):
    shift: Shift
    start_time: datetime
    end_time: datetime
