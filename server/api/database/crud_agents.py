import random
import math
from typing import Optional
from sqlalchemy.orm import Session

from .models import Agent, Point
from .crud_points import create_point, delete_point
from .. import models


def get_agents(db: Session, skip: int = 0, limit: int = 100) -> list[Agent]:
    #возвращает все агента с пагинацией
    return db.query(Agent).offset(skip).limit(limit).all()


def get_agent(db: Session, agent_id: int) -> Optional[Agent]:
    #возвращает конкретного агента по id
    return db.query(Agent).filter(Agent.id == agent_id).first()


def _next_point_id(db: Session) -> str:
    """Generate next point_id like 'agent_point_0', 'agent_point_1', etc."""
    existing = db.query(Point).filter(Point.id.like("agent_point_%")).all()
    max_counter = -1
    for p in existing:
        try:
            counter = int(p.id.split("agent_point_")[1])
            if counter > max_counter:
                max_counter = counter
        except (ValueError, IndexError):
            pass
    return f"agent_point_{max_counter + 1}"


def create_agent(db: Session, agent: models.AgentCreate) -> Agent:
    #создает нового агента + точку на карте
    # Random position in % (10-90 range to stay within viewport)
    x = random.uniform(10, 90)
    y = random.uniform(10, 90)

    # Random initial target
    radius = 5  # % units
    angle = random.uniform(0, 2 * math.pi)
    target_x = x + radius * math.cos(angle)
    target_y = y + radius * math.sin(angle)

    # Clamp to 5-95
    target_x = max(5, min(95, target_x))
    target_y = max(5, min(95, target_y))

    point_id = _next_point_id(db)
    create_point(db, point_id, x, y, target_x, target_y, speed=0.3)

    db_agent = Agent(
        name=agent.name,
        personality=agent.personality,
        mood=agent.mood,
        current_plan=agent.current_plan,
        point_id=point_id,
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
    #удаляет агента по id и его точку
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return False
    # Delete associated point
    if db_agent.point_id:
        delete_point(db, db_agent.point_id)
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
