from datetime import datetime
from pydantic import BaseModel


class MemoryCreate(BaseModel):
    #создает новую память
    content: str


class MemoryResponse(BaseModel):
    #возвращает данные памяти
    id: int
    agent_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemoryWithSummary(BaseModel):
    #возвращает память с суммарией
    memories: list[MemoryResponse]
    summary: str
