from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional

from ...database import get_db
from ...database.crud_agents import get_agent, get_agents
from ...database.crud_events import create_event
from ...llm.agent_ai import AgentBrain
from ...websocket.agents_hub import agents_hub
from ... import models

router = APIRouter(tags=["llm"])



class PlanRequest(BaseModel):
    goals: str = ""


class MessageRequest(BaseModel):
    to_agent_id: int
    message: str


class ReactRequest(BaseModel):
    event: str


class ChatRequest(BaseModel):
    target_agent_id: int
    topic: str = ""


class WorldEventRequest(BaseModel):
    event: str



@router.post("/agents/{agent_id}/plan")
async def generate_plan(
    agent_id: int,
    request: PlanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Generate an action plan for the agent using LLM."""
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    brain = AgentBrain(agent_id, db)
    result = brain.generate_plan()

    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, agent_id, agent.mood
    )
    background_tasks.add_task(agents_hub.send_agents_update)

    return result


@router.post("/agents/{agent_id}/message")
async def send_message(
    agent_id: int,
    request: MessageRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send a message from one agent to another and get LLM-generated response."""
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    to_agent = get_agent(db, request.to_agent_id)
    if not to_agent:
        raise HTTPException(status_code=404, detail="Target agent not found")

    brain = AgentBrain(request.to_agent_id, db)
    result = brain.respond_to_message(agent_id, request.message)

    db.refresh(agent)
    db.refresh(to_agent)
    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, agent_id, agent.mood
    )
    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, request.to_agent_id, to_agent.mood
    )
    background_tasks.add_task(agents_hub.send_agents_update)

    return result


@router.post("/agents/{agent_id}/react")
async def react_to_event(
    agent_id: int,
    request: ReactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Agent reacts to a world event using LLM."""
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    brain = AgentBrain(agent_id, db)
    result = brain.react_to_event(request.event)

    db.refresh(agent)
    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, agent_id, agent.mood
    )
    background_tasks.add_task(agents_hub.send_agents_update)

    return result


@router.post("/agents/{agent_id}/chat")
async def start_chat(
    agent_id: int,
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Initiate a dialogue between two agents. The initiator speaks first, target responds."""
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    target = get_agent(db, request.target_agent_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target agent not found")

    brain = AgentBrain(agent_id, db)
    result = brain.start_chat(request.target_agent_id, request.topic)

    db.refresh(agent)
    db.refresh(target)
    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, agent_id, agent.mood
    )
    background_tasks.add_task(
        agents_hub.send_agent_mood_changed, request.target_agent_id, target.mood
    )
    background_tasks.add_task(agents_hub.send_agents_update)

    return result


@router.post("/agents/{agent_id}/memory/summary")
async def summarize_agent_memories(
    agent_id: int,
    db: Session = Depends(get_db),
):
    """Summarize and compress agent memories using LLM."""
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    brain = AgentBrain(agent_id, db)
    result = brain.summarize_memories()

    return result



@router.post("/world/tick")
async def world_tick(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """One simulation tick: all agents generate plans and optionally interact."""
    agents = get_agents(db)
    if not agents:
        return {"tick_results": [], "message": "No agents in the world"}

    results = []
    for agent in agents:
        try:
            brain = AgentBrain(agent.id, db)
            plan = brain.generate_plan()
            results.append(plan)
        except Exception as e:
            results.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "error": str(e),
            })

    background_tasks.add_task(agents_hub.send_agents_update)

    return {"tick_results": results}


@router.post("/world/event")
async def world_event(
    request: WorldEventRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Broadcast a world event to all agents. Each agent reacts individually."""
    agents = get_agents(db)
    if not agents:
        return {"reactions": [], "message": "No agents in the world"}

    create_event(db, models.EventCreate(content=request.event))

    reactions = []
    for agent in agents:
        try:
            brain = AgentBrain(agent.id, db)
            reaction = brain.react_to_event(request.event)
            reactions.append(reaction)
        except Exception as e:
            reactions.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "error": str(e),
            })

    background_tasks.add_task(agents_hub.send_agents_update)

    return {"event": request.event, "reactions": reactions}
