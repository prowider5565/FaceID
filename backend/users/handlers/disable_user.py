from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from users.models import User


def disable_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
