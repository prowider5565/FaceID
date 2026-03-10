from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from hikvision.helpers import enroll_user_with_face
from users.models import User
from users.schemas import CreateUserBody
from config.settings import settings


def create_user(db: Session, payload: CreateUserBody) -> User:
    existing = db.execute(
        select(User).where(User.phone_number == payload.phone_number.strip())
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        phone_number=payload.phone_number.strip(),
        hourly_rate=payload.hourly_rate,
        position=(payload.position or "").strip(),
        shift=payload.shift,
        role=payload.role,
        is_active=payload.is_active,
        gender=payload.gender,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    created_user = user
    registration = enroll_user_with_face(
        host=settings.hikvision_host,
        port=settings.hikvision_port,
        username=settings.hikvision_username,
        password=settings.hikvision_password,
        employee_no=str(created_user.id),
        name=created_user.full_name,
        gender=created_user.gender,
        image_path="/home/mateo/Public/FaceID/test/face.jpg",
    )
    user_creation_status = registration.get("userCreate", {}).get("ok")
    face_upload_status = registration.get("faceUpload", {}).get("ok")
    if not user_creation_status or not face_upload_status:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Failed to enroll user with Hikvision device.",
        )

    return user
