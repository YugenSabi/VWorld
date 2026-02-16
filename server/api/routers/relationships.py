import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.crud_agents import get_agent
from ..database.crud_relationships import (
    upsert_relationship,
    get_relationship_graph,
    get_agent_relationships,
)
from .. import models

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/relationships", tags=["relationships"])


@router.post("", response_model=models.RelationshipResponse)
def create_or_update_relationship(rel: models.RelationshipCreate, db: Session = Depends(get_db)):
    #создает или обновляет отношение между агентами
    logger.info("POST /relationships")
    return upsert_relationship(db, rel)


@router.get("", response_model=models.RelationshipGraph)
def get_all_relationships(db: Session = Depends(get_db)):
    #возвращает все отношения для графа
    logger.info("GET /relationships")
    return get_relationship_graph(db)


@router.get("/agents/{agent_id}", response_model=list[models.RelationshipResponse])
def get_agent_relationships_by_id(agent_id: int, db: Session = Depends(get_db)):
    #возвращает все отношения для конкретного агента
    logger.info("GET /relationships/agents/%s", agent_id)
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    relationships = get_agent_relationships(db, agent_id)
    return [models.RelationshipResponse.model_validate(r) for r in relationships]
