from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from .memory import MemoryResponse
from .relationships import RelationshipResponse


class AgentBase(BaseModel):
    #базовый класс для агента
    name: str
    personality: str = ""
    mood: str = "neutral"
    current_plan: str = ""


class AgentCreate(AgentBase):
    #создает нового агента
    pass


class AgentUpdate(BaseModel):
    #обновляет данные агента
    name: Optional[str] = None
    personality: Optional[str] = None
    mood: Optional[str] = None
    current_plan: Optional[str] = None


class AgentResponse(AgentBase):
    #возвращает данные агента
    id: int
    x: float = 50.0
    y: float = 50.0
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_agent(cls, agent) -> "AgentResponse":
        """Create response with position from linked Point."""
        x = agent.point.x if agent.point else 50.0
        y = agent.point.y if agent.point else 50.0
        return cls(
            id=agent.id,
            name=agent.name,
            personality=agent.personality,
            mood=agent.mood,
            current_plan=agent.current_plan,
            x=x,
            y=y,
            created_at=agent.created_at,
        )


class AgentProfileCharacter(BaseModel):
    #информация о персонаже агента
    personality: str
    mood: str
    current_plan: str


class AgentProfile(BaseModel):
    #полный профиль агента с памятью и отношениями
    agent: AgentResponse
    character: AgentProfileCharacter
    memories: list[MemoryResponse]
    relationships: list[RelationshipResponse]
