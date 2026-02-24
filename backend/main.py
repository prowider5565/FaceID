from contextlib import asynccontextmanager
from pathlib import Path
import subprocess
import sys

from fastapi import FastAPI, Request
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from config.database import SessionLocal
from config.settings import settings
from users import router as users_router
from users.models import User
from users.schemas import GetUser
from ws import extract_webhook_payload, router as websockets_router, ws_manager
from ws.schema import AttendanceEventDataSchema, WebhookAttendanceResponseSchema
from ws.types import DirectionType, EventType


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment.lower() == "development":
        backend_dir = Path(__file__).resolve().parent
        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_dir,
            check=True,
        )

    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users_router)
app.include_router(websockets_router)
add_pagination(app)


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


@app.post("/webhook")
async def webhook(request: Request):
    raw = await request.body()
    content_type = request.headers.get("content-type", "")
    payload = extract_webhook_payload(raw=raw, content_type=content_type)
    if payload is None:
        return {"ok": False, "detail": "Could not parse webhook JSON payload"}

    payload_dict = payload if isinstance(payload, dict) else {}
    user = _resolve_user_from_payload(payload_dict)
    response_payload = WebhookAttendanceResponseSchema(
        event_type=EventType.ATTENDANCE,
        data=AttendanceEventDataSchema(
            user=GetUser.model_validate(user) if user is not None else None,
            attendance_date=payload_dict.get("dateTime"),
            direction=DirectionType.CHECK_IN,
        ),
    ).model_dump(mode="json")

    await ws_manager.broadcast_json(response_payload)
    return response_payload
