from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi_pagination import add_pagination
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from users import router as users_router
import json
import re
import subprocess
import sys


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
add_pagination(app)


@app.post("/webhook")
async def webhook(request: Request):
    raw = await request.body()

    print("=== RAW BYTES ===")
    print(raw)

    content_type = request.headers.get("content-type", "")
    print("Content-Type:", content_type)

    # Extract boundary
    match = re.search(r"boundary=(.+)", content_type)
    if not match:
        print("No boundary found")
        return {"ok": False}

    boundary = match.group(1).encode()
    parts = raw.split(b"--" + boundary)

    for part in parts:
        if b"AccessControllerEvent" in part:
            # Split headers and body
            _, body = part.split(b"\r\n\r\n", 1)
            body = body.strip(b"\r\n--")

            try:
                decoded = json.loads(body.decode("utf-8"))
                print("=== DECODED JSON ===")
                print(json.dumps(decoded, indent=2))
            except Exception as e:
                print("JSON decode failed:", e)
                print(body)

    return {"ok": True}
