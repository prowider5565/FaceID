from pydantic import BaseModel as BM


class BaseModel(BM):
    """Read ORM objects correctly with orm_mode True"""

    class Config:
        from_attributes = True
