from typing import Optional
from sqlalchemy.orm import Session

from .models import Memory, Agent
from .. import models


def add_memory(db: Session, agent_id: int, memory: models.MemoryCreate) -> Optional[Memory]:
    db_agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not db_agent:
        return None
    db_memory = Memory(agent_id=agent_id, content=memory.content)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory


def get_memories(db: Session, agent_id: int) -> list[Memory]:
    return db.query(Memory).filter(Memory.agent_id == agent_id).order_by(Memory.created_at.desc()).all()
