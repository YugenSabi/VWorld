from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db
from ...database.crud_agents import get_agent
from ...database.crud_mood import update_agent_mood
from ... import models

router = APIRouter(prefix="/agents/{agent_id}/mood", tags=["mood"])


@router.patch("", response_model=models.AgentResponse)
def update_mood(agent_id: int, mood: models.MoodUpdate, db: Session = Depends(get_db)):
    #обновляет настроение агента
    updated = update_agent_mood(db, agent_id, mood.mood)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent not found")
    return updated


@router.get("", response_model=models.AgentResponse)
def get_current_mood(agent_id: int, db: Session = Depends(get_db)):
    #возвращает текущее настроение агента
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
