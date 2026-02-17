from datetime import datetime
from pydantic import BaseModel


class EventCreate(BaseModel):
    #создает новое событие
    content: str


class EventResponse(BaseModel):
    #возвращает данные события
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
