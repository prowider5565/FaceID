from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from attendance.models import ShiftDuration
from attendance.schema import CreateShiftBody, ShiftSchema
from config.database import get_db

attendance_router = APIRouter(prefix="/attendance", tags=["attendance"])


@attendance_router.get("/current-shifts", response_model=list[ShiftSchema])
async def get_current_shifts(db: Session = Depends(get_db)):
    shifts = db.query(ShiftDuration).filter(ShiftDuration.latest == True).all()
    return shifts


@attendance_router.post("/shifts", status_code=status.HTTP_201_CREATED)
def create_shift(payload: CreateShiftBody, db: Session = Depends(get_db)):
    shift_duration = ShiftDuration(**payload.model_dump())
    shift_type = payload.shift
    db.query(ShiftDuration).filter(ShiftDuration.shift == shift_type).update(
        {ShiftDuration.latest: False}, synchronize_session=False
    )
    db.add(shift_duration)
    db.commit()
    db.refresh(shift_duration)
    return {"msg": "Successfully created"}
