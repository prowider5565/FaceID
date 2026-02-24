from common.pydantic_basemodel import BaseModel


class GetUser(BaseModel):
    id: int
    full_name: str
    position: 
