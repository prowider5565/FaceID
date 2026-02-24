from sqlalchemy import Select, or_

from users.models import User
from users.types import Role


def apply_search(query: Select, value: str | None):
    if not value:
        return query

    pattern = f"%{value.strip()}%"
    return query.where(
        or_(
            User.full_name.ilike(pattern),
            User.position.ilike(pattern),
        )
    )


def apply_role_filter(query: Select, role: Role | None):
    if role is None:
        return query
    return query.where(User.role == role)
