from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from ... import models
from ...database import get_db
from ...database.crud_agents import get_agent
from ...database.crud_mood import update_agent_mood
from ...websocket.agents_hub import agents_hub


router = APIRouter(prefix="/agents/{agent_id}/mood", tags=["mood"])


@router.patch("", response_model=models.AgentResponse)
def update_mood(
    agent_id: int,
    mood: models.MoodUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    updated = update_agent_mood(db, agent_id, mood.mood)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent not found")

    background_tasks.add_task(agents_hub.send_agent_mood_changed, agent_id, updated.mood)
    background_tasks.add_task(agents_hub.send_agents_update)
    return updated


@router.get("", response_model=models.AgentResponse)
def get_current_mood(agent_id: int, db: Session = Depends(get_db)):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
