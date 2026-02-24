from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from fastapi_pagination import Page, Params

from config.database import get_db
from users.handlers import create_user, disable_user, get_all_users, update_user
from users.schemas import CreateUserBody, GetUser, UpdateUserBody
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


@router.post("", response_model=GetUser)
def create_user_route(
    payload: CreateUserBody,
    db: Session = Depends(get_db),
) -> GetUser:
    return create_user(db=db, payload=payload)


@router.put("/{user_id}", response_model=GetUser)
def update_user_route(
    user_id: int,
    payload: UpdateUserBody,
    db: Session = Depends(get_db),
) -> GetUser:
    return update_user(db=db, user_id=user_id, payload=payload)


@router.patch("/{user_id}/disable", response_model=GetUser)
def disable_user_route(
    user_id: int,
    db: Session = Depends(get_db),
) -> GetUser:
    return disable_user(db=db, user_id=user_id)
