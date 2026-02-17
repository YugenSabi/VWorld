from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db
from ...database.crud_agents import get_agent
from ...database.crud_memory import get_memories
from ... import models
from ...llm.agent_ai import summarize_memories, persist_agent_memory

router = APIRouter(prefix="/agents/{agent_id}/memory", tags=["memory"])


@router.post("", response_model=models.MemoryResponse)
def add_agent_memory(agent_id: int, memory: models.MemoryCreate, db: Session = Depends(get_db)):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return persist_agent_memory(db, agent_id, memory.content)


@router.get("", response_model=models.MemoryWithSummary)
def get_agent_memories(agent_id: int, db: Session = Depends(get_db)):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    memories = get_memories(db, agent_id)
    summary = summarize_memories(memories)
    return models.MemoryWithSummary(
        memories=[models.MemoryResponse.model_validate(m) for m in memories],
        summary=summary,
    )


@router.get("/summary", response_model=str)
def get_memory_summary(agent_id: int, db: Session = Depends(get_db)):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    memories = get_memories(db, agent_id)
    return summarize_memories(memories)
