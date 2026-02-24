from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from config.database import get_db
from users.handlers import get_all_users
from users.schemas import GetUser
from users.types import Role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/all", response_model=list[GetUser])
def get_users(
    search: str | None = Query(
        default=None, description="Search by full name or position"
    ),
    role: Role | None = Query(default=None, description="Filter by role"),
    db: Session = Depends(get_db),
) -> list[GetUser]:
    return get_all_users(db=db, search=search, role=role)
