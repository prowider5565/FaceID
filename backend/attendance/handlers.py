from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func, cast, Date, Time, and_
from sqlalchemy.orm import aliased
from sqlalchemy.orm import Session

from attendance.models import Attendance, ShiftDuration
from attendance.schema import CreateShiftBody, ShiftSchema
from users.models import User
from ws.types import DirectionType
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


@attendance_router.get("/pie-chart-percentages")
async def get_percentages_piechart(db: Session = Depends(get_db)):
    # First fetch all employees and count
    # then fetch the number of day off employees
    # fetch the number of present employees
    # fetch the number of late employees
    today_attendance = (
        select(
            Attendance.user_id,
            func.min(Attendance.attendance_date).label("first_checkin"),
        )
        .where(
            cast(Attendance.attendance_date, Date) == func.current_date(),
            Attendance.direction == DirectionType.CHECK_IN,
        )
        .group_by(Attendance.user_id)
        .cte("today_attendance")
    )

    ta = aliased(today_attendance)

    # --- main query ---
    query = (
        select(
            func.count().filter(User.is_day_off).label("day_off"),
            func.count()
            .filter(and_(ta.c.user_id.is_not(None), ~User.is_day_off))
            .label("present"),
            func.count()
            .filter(and_(ta.c.user_id.is_(None), ~User.is_day_off))
            .label("absent"),
            func.count()
            .filter(
                and_(
                    ta.c.user_id.is_not(None),
                    cast(ta.c.first_checkin, Time)
                    > cast(ShiftDuration.start_time, Time),
                    ~User.is_day_off,
                )
            )
            .label("late"),
        )
        .select_from(User)
        .outerjoin(ta, ta.c.user_id == User.id)
        .outerjoin(
            ShiftDuration,
            and_(
                ShiftDuration.shift == User.shift,
                ShiftDuration.latest.is_(True),
            ),
        )
        .where(User.is_active.is_(True))
    )
    percentages = db.execute(query).first()
    day_off = percentages.day_off
    present = percentages.present
    absent = percentages.absent
    late = percentages.late
    total = day_off + present + absent
    result = {
        "day_off_percentage": (day_off / total) * 100 if total else 0,
        "present_percentage": (present / total) * 100 if total else 0,
        "absent_percentage": (absent / total) * 100 if total else 0,
        "late_percentage": (late / total) * 100 if total else 0,
    }
    return result