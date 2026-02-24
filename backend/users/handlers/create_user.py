from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from users.models import User
from users.schemas import CreateUserBody


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
        position=payload.position.strip(),
        shift=payload.shift,
        role=payload.role,
        is_active=payload.is_active,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
