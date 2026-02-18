from datetime import datetime
from pydantic import BaseModel


class MemoryCreate(BaseModel):
    content: str


class MemoryResponse(BaseModel):
    id: int
    agent_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class MemoryWithSummary(BaseModel):
    memories: list[MemoryResponse]
    summary: str
