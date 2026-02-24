from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from cameras.models import Camera
from cameras.schemas import CameraOut, RegisterCameraBody
from cameras.types import CameraPosition, CameraStatus
from config.database import get_db

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.post("/register", response_model=CameraOut)
def register_camera(payload: RegisterCameraBody, db: Session = Depends(get_db)) -> CameraOut:
    ip = payload.ip_address.strip()
    device_name = payload.device_name.strip()

    existing = db.execute(select(Camera).where(Camera.ip_address == ip)).scalar_one_or_none()
    if existing is not None:
        return CameraOut.model_validate(existing)

    max_id = db.execute(select(func.max(Camera.id))).scalar_one_or_none()
    next_id = int(max_id or 0) + 1

    camera = Camera(
        id=next_id,
        ip_address=ip,
        device_name=device_name,
        position=CameraPosition.ALL,
        status=CameraStatus.ONLINE,
    )

    db.add(camera)
    db.commit()
    db.refresh(camera)
    return CameraOut.model_validate(camera)
