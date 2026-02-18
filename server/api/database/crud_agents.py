import random
import math
from typing import Optional
from sqlalchemy.orm import Session

from .models import Agent, Point
from .crud_points import create_point, delete_point
from .. import models

ROAD_ZONES: list[tuple[float, float, float, float]] = [
    (34.0, 44.0, 68.0, 66.0),
]


def _random_road_point() -> tuple[float, float]:
    x1, y1, x2, y2 = random.choice(ROAD_ZONES)
    return random.uniform(x1, x2), random.uniform(y1, y2)


def _nearest_road_point(x: float, y: float) -> tuple[float, float]:
    best_x, best_y = x, y
    best_dist = float("inf")
    for x1, y1, x2, y2 in ROAD_ZONES:
        cx = max(x1, min(x2, x))
        cy = max(y1, min(y2, y))
        dist = (cx - x) ** 2 + (cy - y) ** 2
        if dist < best_dist:
            best_dist = dist
            best_x, best_y = cx, cy
    return best_x, best_y


def get_agents(db: Session, skip: int = 0, limit: int = 100) -> list[Agent]:
    return db.query(Agent).offset(skip).limit(limit).all()


def get_agent(db: Session, agent_id: int) -> Optional[Agent]:
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
    x, y = _random_road_point()

    radius = 2.8  # % units
    angle = random.uniform(0, 2 * math.pi)
    target_x = x + radius * math.cos(angle)
    target_y = y + radius * math.sin(angle)
    target_x, target_y = _nearest_road_point(target_x, target_y)

    point_id = _next_point_id(db)
    create_point(db, point_id, x, y, target_x, target_y, speed=0.14)

    db_agent = Agent(
        name=agent.name,
        type=getattr(agent, 'type', 'agent'),
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
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return False
    if db_agent.point_id:
        delete_point(db, db_agent.point_id)
    db.delete(db_agent)
    db.commit()
    return True


def get_agent_profile(db: Session, agent_id: int) -> Optional[models.AgentProfile]:
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
