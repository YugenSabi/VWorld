from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.crud_agents import (
    get_agents,
    get_agent,
    create_agent,
    update_agent,
    delete_agent,
    get_agent_profile,
)
from ..database.crud_relationships import (
    get_agent_relationships as get_rels,
)
from .. import models


router = APIRouter(prefix="/agents", tags=["agents"])

# зависимость для сессии
DBSession = Annotated[Session, Depends(get_db)]


def get_agent_or_404(agent_id: int, db: DBSession):
    #возвращает агента или вызывает 404 ошибку
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return agent


@router.get("", response_model=list[models.AgentResponse])
def list_agents(
    db: DBSession,
    skip: int = 0,
    limit: int = 100,
):
    #возвращает список всех агентов
    return get_agents(db, skip=skip, limit=limit)


@router.get("/{agent_id}", response_model=models.AgentResponse)
def get_agent_by_id(
    agent=Depends(get_agent_or_404),
):
    #возвращает подробный профиль конкретного агента
    return agent


@router.post(
    "",
    response_model=models.AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_agent(
    agent_data: models.AgentCreate,
    db: DBSession,
):
    #создает нового агента
    return create_agent(db, agent_data)


@router.patch("/{agent_id}", response_model=models.AgentResponse)
def update_agent_by_id(
    agent_id: int,
    agent_data: models.AgentUpdate,
    db: DBSession,
):
    #обновляет данные агента
    updated = update_agent(db, agent_id, agent_data)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return updated


@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_agent_by_id(
    agent_id: int,
    db: DBSession,
):
    #удаляет агента
    deleted = delete_agent(db, agent_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return None


@router.get(
    "/{agent_id}/profile",
    response_model=models.AgentProfile,
)
def get_agent_profile_by_id(
    agent_id: int,
    db: DBSession,
):
    #возвращает полный профиль агента с персонажем, памятью и отношениями
    profile = get_agent_profile(db, agent_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return profile


@router.get(
    "/{agent_id}/relationships",
    response_model=list[models.RelationshipResponse],
)
def get_agent_relationships(
    agent_id: int,
    db: DBSession,
):
    #возвращает все отношения для конкретного агента
    # проверка на существование агента
    get_agent_or_404(agent_id, db)

    relationships = get_rels(db, agent_id)

    return [
        models.RelationshipResponse.model_validate(r)
        for r in relationships
    ]
