from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from fastapi_pagination import Page, Params

from config.database import get_db
from users.handlers import get_all_users
from users.schemas import GetUser
from users.types import Role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/all", response_model=Page[GetUser])
def get_users(
    search: str | None = Query(
        default=None, description="Search by full name or position"
    ),
    role: Role | None = Query(default=None, description="Filter by role"),
    params: Params = Depends(),
    db: Session = Depends(get_db),
) -> Page[GetUser]:
    return get_all_users(db=db, search=search, role=role, params=params)
