from typing import Optional
from sqlalchemy.orm import Session

from .models import Agent
from .. import models


def update_agent_mood(db: Session, agent_id: int, mood: str) -> Optional[Agent]:
    from .crud_agents import update_agent
    return update_agent(db, agent_id, models.AgentUpdate(mood=mood))
