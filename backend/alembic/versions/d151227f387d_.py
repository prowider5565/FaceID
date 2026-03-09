"""add gender column

Revision ID: d151227f387d
Revises: 936edf7a3804
Create Date: 2026-03-09 15:19:55.679897
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d151227f387d"
down_revision: Union[str, Sequence[str], None] = "936edf7a3804"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


gender_enum = sa.Enum(
    "male",
    "female",
    "unknown",
    name="gender",
)


def upgrade() -> None:
    """Upgrade schema."""

    # create enum type
    gender_enum.create(op.get_bind(), checkfirst=True)

    # add column
    op.add_column(
        "users",
        sa.Column("gender", gender_enum, nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""

    # remove column
    op.drop_column("users", "gender")

    # drop enum type
    gender_enum.drop(op.get_bind(), checkfirst=True)