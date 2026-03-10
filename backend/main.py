from contextlib import asynccontextmanager
from datetime import datetime, time, timezone
from pathlib import Path
import subprocess
import sys

from fastapi import FastAPI, Request
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, select
from sqlalchemy import desc

from attendance.models import Attendance
from cameras import router as cameras_router
from cameras.models import Camera
from config.database import SessionLocal
from config.settings import settings
from users import router as users_router
from users.models import User
from ws.manager import ws_manager
from users.schemas import GetUser
from ws.schema import (
    AttendanceEventDataSchema,
    CameraEnrollmentDataSchema,
    WebhookAttendanceResponseSchema,
    WebhookCameraEnrollmentResponseSchema,
)
from ws.types import DirectionType, EventType
from ws.routes import router as ws_router
from webhooks.handlers import  webhook_router
from attendance.handlers import attendance_router


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
app.include_router(cameras_router)
app.include_router(users_router)
app.include_router(ws_router)
app.include_router(webhook_router)
app.include_router(attendance_router)
add_pagination(app)
