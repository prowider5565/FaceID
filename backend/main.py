from contextlib import asynccontextmanager
from pathlib import Path
import subprocess
import sys

from fastapi import FastAPI, Request
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from users import router as users_router
from ws import extract_webhook_payload, router as websockets_router, ws_manager


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


@app.post("/webhook")
async def webhook(request: Request):
    raw = await request.body()
    content_type = request.headers.get("content-type", "")
    payload = extract_webhook_payload(raw=raw, content_type=content_type)
    if payload is None:
        return {"ok": False, "detail": "Could not parse webhook JSON payload"}

    listeners = await ws_manager.connection_count()
    await ws_manager.broadcast_json(payload)

    return {"ok": True, "broadcast_listeners": listeners}
