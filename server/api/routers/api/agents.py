from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ... import models
from ...database import get_db
from ...database.crud_agents import (
    create_agent,
    delete_agent,
    get_agent,
    get_agent_profile,
    get_agents,
    update_agent,
)
from ...database.crud_events import create_event
from ...database.crud_relationships import get_agent_relationships as get_rels
from ...websocket.agents_hub import agents_hub


router = APIRouter(prefix="/agents", tags=["agents"])
DBSession = Annotated[Session, Depends(get_db)]


def get_agent_or_404(agent_id: int, db: DBSession):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


def _reload_points_manager():
    """Notify points manager to reload from DB."""
    try:
        from ...routers.ws.points import manager
        manager.reload_from_db()
    except Exception:
        pass


@router.get("")
def list_agents(db: DBSession, skip: int = 0, limit: int = 100):
    agents = get_agents(db, skip=skip, limit=limit)
    return [models.AgentResponse.from_agent(a) for a in agents]


@router.get("/{agent_id}")
def get_agent_by_id(agent_id: int, db: DBSession):
    agent = get_agent_or_404(agent_id, db)
    return models.AgentResponse.from_agent(agent)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_new_agent(
    agent_data: models.AgentCreate,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    created = create_agent(db, agent_data)
    create_event(db, models.EventCreate(content=f"Agent added: {created.name}"))
    # Reload points manager so it picks up the new agent point
    _reload_points_manager()
    background_tasks.add_task(agents_hub.send_agent_created, created)
    background_tasks.add_task(agents_hub.send_agents_update)
    return models.AgentResponse.from_agent(created)


@router.patch("/{agent_id}")
def update_agent_by_id(
    agent_id: int,
    agent_data: models.AgentUpdate,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    updated = update_agent(db, agent_id, agent_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    background_tasks.add_task(agents_hub.send_agents_update)
    return models.AgentResponse.from_agent(updated)


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_by_id(
    agent_id: int,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    existing = get_agent(db, agent_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    deleted = delete_agent(db, agent_id)
    if deleted:
        create_event(db, models.EventCreate(content=f"Agent removed: {existing.name}"))

    # Reload points manager so deleted point is removed
    _reload_points_manager()
    background_tasks.add_task(agents_hub.send_agent_deleted, agent_id)
    background_tasks.add_task(agents_hub.send_agents_update)
    return None


@router.get("/{agent_id}/profile", response_model=models.AgentProfile)
def get_agent_profile_by_id(agent_id: int, db: DBSession):
    profile = get_agent_profile(db, agent_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return profile


@router.get("/{agent_id}/relationships", response_model=list[models.RelationshipResponse])
def get_agent_relationships(agent_id: int, db: DBSession):
    get_agent_or_404(agent_id, db)
    relationships = get_rels(db, agent_id)
    return [models.RelationshipResponse.model_validate(r) for r in relationships]
