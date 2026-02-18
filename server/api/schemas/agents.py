from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from .memory import MemoryResponse
from .relationships import RelationshipResponse


class AgentBase(BaseModel):
    name: str
    personality: str = ""
    mood: str = "neutral"
    current_plan: str = ""


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    personality: Optional[str] = None
    mood: Optional[str] = None
    current_plan: Optional[str] = None


class AgentResponse(AgentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AgentProfileCharacter(BaseModel):
    personality: str
    mood: str
    current_plan: str


class AgentProfile(BaseModel):
    agent: AgentResponse
    character: AgentProfileCharacter
    memories: list[MemoryResponse]
    relationships: list[RelationshipResponse]
