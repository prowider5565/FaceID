from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import paginate

from users.filters import apply_role_filter, apply_search
from users.models import User
from users.types import Role


def get_all_users(
    db: Session,
    search: str | None,
    role: Role | None,
    params: Params,
) -> Page[User]:
    query = select(User)

    query = apply_search(query, search)
    query = apply_role_filter(query, role)

    query = query.order_by(User.id.asc())
    return paginate(db, query, params)
