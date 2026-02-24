from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from users.models import User
from users.schemas import UpdateUserBody


def update_user(db: Session, user_id: int, payload: UpdateUserBody) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    existing = db.execute(
        select(User).where(
            User.phone_number == payload.phone_number.strip(),
            User.id != user_id,
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already exists.",
        )

    user.full_name = payload.full_name.strip()
    user.phone_number = payload.phone_number.strip()
    user.hourly_rate = payload.hourly_rate
    user.position = payload.position.strip()
    user.shift = payload.shift
    user.role = payload.role
    user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return user
