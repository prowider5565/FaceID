from fastapi import APIRouter, Request
from sqlalchemy import and_, desc, select
from sqlalchemy.orm import Session
from datetime import datetime, time, timezone

from config.database import SessionLocal
from ws.manager import ws_manager
from ws.schema import (
    AttendanceEventDataSchema,
    CameraEnrollmentDataSchema,
    EventType,
    WebhookAttendanceResponseSchema,
    WebhookCameraEnrollmentResponseSchema,
)
from ws.types import DirectionType
from users.models import User
from attendance.models import Attendance
from webhooks.helpers import check_camera, _resolve_user_from_payload, _parse_attendance_datetime
from .payload import extract_webhook_payload
from users.schemas import GetUser

webhook_router = APIRouter(prefix="/webhooks")


@webhook_router.post("/attendance")
async def webhook(request: Request):
    raw = await request.body()
    content_type = request.headers.get("content-type", "")
    payload = extract_webhook_payload(raw=raw, content_type=content_type)
    if payload is None:
        return {"ok": False, "detail": "Could not parse webhook JSON payload"}

    payload_dict = payload if isinstance(payload, dict) else {}

    ip_address = str(payload_dict.get("ipAddress") or "").strip()
    access_event = payload_dict.get("AccessControllerEvent")
    device_name = "Unknown Device"
    if isinstance(access_event, dict):
        device_name = str(access_event.get("deviceName") or device_name)

    if ip_address and check_camera(ip_address) is None:
        camera_enrollment_payload = WebhookCameraEnrollmentResponseSchema(
            event_type=EventType.CAMERA_ENROLLMENT,
            data=CameraEnrollmentDataSchema(
                ip_address=ip_address,
                device_name=device_name,
            ),
        ).model_dump(mode="json")
        await ws_manager.broadcast_json(camera_enrollment_payload)

    user = _resolve_user_from_payload(payload_dict)
    attendance_dt = _parse_attendance_datetime(payload_dict.get("dateTime"))

    direction = DirectionType.CHECK_IN
    if user is not None:
        db = SessionLocal()
        try:
            tz = attendance_dt.tzinfo or timezone.utc
            start_of_day = datetime.combine(attendance_dt.date(), time.min).replace(tzinfo=tz)
            end_of_day = datetime.combine(attendance_dt.date(), time.max).replace(tzinfo=tz)

            last_attendance = db.execute(
                select(Attendance)
                .where(
                    and_(
                        Attendance.user_id == user.id,
                        Attendance.attendance_date >= start_of_day,
                        Attendance.attendance_date <= end_of_day,
                    )
                )
                .order_by(desc(Attendance.attendance_date))
                .limit(1)
            ).scalar_one_or_none()

            if last_attendance is not None and last_attendance.direction == DirectionType.CHECK_IN:
                direction = DirectionType.CHECK_OUT

            db.add(
                Attendance(
                    user_id=user.id,
                    attendance_date=attendance_dt,
                    direction=direction,
                )
            )
            db.commit()
        finally:
            db.close()

    attendance_payload = WebhookAttendanceResponseSchema(
        event_type=EventType.ATTENDANCE,
        data=AttendanceEventDataSchema(
            user=GetUser.model_validate(user) if user is not None else None,
            attendance_date=attendance_dt,
            direction=direction,
        ),
    ).model_dump(mode="json")

    print(attendance_payload)
    await ws_manager.broadcast_json(attendance_payload)
    return attendance_payload