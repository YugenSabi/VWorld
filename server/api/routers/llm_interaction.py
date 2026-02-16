from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..database.crud_agents import get_agent
from ..llm.agent_ai import summarize_memories

router = APIRouter(prefix="/agents/{agent_id}", tags=["llm"])


class PlanRequest(BaseModel):
    #запрос для генерации плана агента
    goals: str = ""


class MessageRequest(BaseModel):
    #запрос для отправки сообщения другому агенту
    to_agent_id: int
    message: str


@router.post("/plan")
def get_agent_plan(agent_id: int, request: PlanRequest, db: Session = Depends(get_db)):
    #возвращает план действий агента на основе целей
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # заглушка плана действий агента
    return {
        "agent_id": agent_id,
        "plan": f"ЗАГЛУШКА LLM: План для {agent.name} с целями: {request.goals}",
        "actions": [
            "Действие 1: Заглушка LLM",
            "Действие 2: Заглушка LLM",
        ],
    }


@router.post("/message")
def send_agent_message(agent_id: int, request: MessageRequest, db: Session = Depends(get_db)):
    #отправляет сообщение другому агенту
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    to_agent = get_agent(db, request.to_agent_id)
    if not to_agent:
        raise HTTPException(status_code=404, detail="Target agent not found")
    
    # заглушка ответа от другого агента
    return {
        "from_agent_id": agent_id,
        "to_agent_id": request.to_agent_id,
        "message": request.message,
        "response": f"ЗАГЛУШКА LLM: Ответ от {to_agent.name}",
    }
