from datetime import datetime
from pydantic import BaseModel


class EventCreate(BaseModel):
    content: str


class EventResponse(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
