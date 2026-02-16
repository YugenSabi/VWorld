from typing import Optional
from sqlalchemy.orm import Session

from .models import Agent
from .. import models


def get_agents(db: Session, skip: int = 0, limit: int = 100) -> list[Agent]:
    #возвращает все агента с пагинацией
    return db.query(Agent).offset(skip).limit(limit).all()


def get_agent(db: Session, agent_id: int) -> Optional[Agent]:
    #возвращает конкретного агента по id
    return db.query(Agent).filter(Agent.id == agent_id).first()


def create_agent(db: Session, agent: models.AgentCreate) -> Agent:
    #создает нового агента
    db_agent = Agent(
        name=agent.name,
        personality=agent.personality,
        mood=agent.mood,
        current_plan=agent.current_plan,
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def update_agent(db: Session, agent_id: int, agent: models.AgentUpdate) -> Optional[Agent]:
    #обновляет данные агента
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return None
    data = agent.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_agent, key, value)
    db.commit()
    db.refresh(db_agent)
    return db_agent


def delete_agent(db: Session, agent_id: int) -> bool:
    #удаляет агента по id
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return False
    db.delete(db_agent)
    db.commit()
    return True


def get_agent_profile(db: Session, agent_id: int) -> Optional[models.AgentProfile]:
    #возвращает профиль агента с памятью и отношениями
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return None

    from .models import Memory, Relationship
    
    memories = db.query(Memory).filter(Memory.agent_id == agent_id).order_by(Memory.created_at.desc()).all()
    relationships = (
        db.query(Relationship)
        .filter(
            (Relationship.agent_from_id == agent_id) | (Relationship.agent_to_id == agent_id)
        )
        .all()
    )

    return models.AgentProfile(
        agent=models.AgentResponse.model_validate(db_agent),
        character=models.AgentProfileCharacter(
            personality=db_agent.personality,
            mood=db_agent.mood,
            current_plan=db_agent.current_plan,
        ),
        memories=[models.MemoryResponse.model_validate(m) for m in memories],
        relationships=[models.RelationshipResponse.model_validate(r) for r in relationships],
    )
