from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

from .memory import MemoryResponse
from .relationships import RelationshipResponse


class AgentBase(BaseModel):
    name: str
    type: str = "agent"
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
            type=getattr(agent, 'type', 'agent') or 'agent',
            personality=agent.personality,
            mood=agent.mood,
            current_plan=agent.current_plan,
            x=x,
            y=y,
            created_at=agent.created_at,
        )


class AgentProfileCharacter(BaseModel):
    personality: str
    mood: str
    current_plan: str


class AgentProfile(BaseModel):
    agent: AgentResponse
    character: AgentProfileCharacter
    memories: list[MemoryResponse]
    relationships: list[RelationshipResponse]


WeatherType = Literal["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"]


class AgentPreset(BaseModel):
    id: str
    name: str
    personality: str = ""
    mood: str = "neutral"
    current_plan: str = ""
    weather_tags: list[WeatherType] = []


class AgentPresetSpawnRequest(BaseModel):
    preset_id: str


class MobPreset(BaseModel):
    id: str
    name: str
    personality: str = ""
    mood: str = "neutral"
    current_plan: str = ""


class MobPresetSpawnRequest(BaseModel):
    preset_id: str
