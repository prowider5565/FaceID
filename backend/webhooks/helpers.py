from sqlalchemy import select
from datetime import datetime, timezone

from config.database import SessionLocal
from users.models import User
from cameras.models import Camera

def _resolve_user_from_payload(payload: dict) -> User | None:
    event = payload.get("AccessControllerEvent") if isinstance(payload, dict) else None
    employee_no = event.get("employeeNoString") if isinstance(event, dict) else None
    event_name = event.get("name") if isinstance(event, dict) else None

    db = SessionLocal()
    try:
        user = None
        if employee_no:
            try:
                user_id = int(str(employee_no).strip())
                print(user_id)
                user = db.get(User, user_id)
            except ValueError:
                user = db.execute(
                    select(User).where(User.phone_number == str(employee_no).strip())
                ).scalar_one_or_none()

        if user is None and event_name:
            user = db.execute(
                select(User).where(User.full_name == str(event_name).strip())
            ).scalar_one_or_none()

        return user
    finally:
        db.close()


def _parse_attendance_datetime(raw_value: object) -> datetime:
    if isinstance(raw_value, datetime):
        return raw_value
    if isinstance(raw_value, str):
        text = raw_value.strip()
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


def check_camera(ip_addr: str) -> Camera | None:
    db = SessionLocal()
    try:
        return db.execute(
            select(Camera).where(Camera.ip_address == ip_addr)
        ).scalar_one_or_none()
    finally:
        db.close()

