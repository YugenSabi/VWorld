import random
from typing import Annotated, Literal

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
from ...database.crud_environment import get_environment
from ...database.crud_events import create_event
from ...database.crud_relationships import get_agent_relationships as get_rels
from ...llm.config import get_llm
from ...websocket.agents_hub import agents_hub


router = APIRouter(prefix="/agents", tags=["agents"])
DBSession = Annotated[Session, Depends(get_db)]

DEFAULT_PRESET_WEATHER: Literal["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"] = "sunny"
AGENT_PRESETS: list[models.AgentPreset] = [
    models.AgentPreset(
        id="mira_rivera",
        name="Mira Rivera",
        personality=(
            "Urban analyst. Notices details, argues with facts, dislikes empty talk. "
            "Prefers clear weather and pragmatic decisions."
        ),
        mood="focused",
        current_plan="Collect signals from citizens and keep routes efficient.",
        weather_tags=["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"],
    ),
    models.AgentPreset(
        id="dorian_frost",
        name="Dorian Frost",
        personality=(
            "Tactical coordinator. Disciplined and direct, gets sharp when he sees chaos. "
            "Works best in cold and structured conditions."
        ),
        mood="calm",
        current_plan="Maintain order on key routes and coordinate team actions.",
        weather_tags=["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"],
    ),
    models.AgentPreset(
        id="lyra_quill",
        name="Lyra Quill",
        personality=(
            "Communicator and mediator. Emotional and open, quickly reads mood of others. "
            "Good at reducing tension before conflicts escalate."
        ),
        mood="cheerful",
        current_plan="Keep dialogue alive between participants and mediate disputes.",
        weather_tags=["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"],
    ),
]

MOB_PRESETS: list[models.MobPreset] = [
    models.MobPreset(
        id="dog_buddy",
        name="Buddy",
        personality="Friendly dog: playful, active, likes people.",
        mood="happy",
        current_plan="Run around and explore the area.",
    ),
    models.MobPreset(
        id="cat_murka",
        name="Murka",
        personality="Independent cat: proud, careful, curious.",
        mood="calm",
        current_plan="Observe from a safe spot and avoid noise.",
    ),
    models.MobPreset(
        id="bird_chizh",
        name="Chizh",
        personality="Small bird: quick, vocal, cautious.",
        mood="cheerful",
        current_plan="Move between points and watch people.",
    ),
]


def get_agent_or_404(agent_id: int, db: DBSession):
    agent = get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


def _reload_points_manager():
    try:
        from ...routers.ws.points import manager

        manager.reload_from_db()
    except Exception:
        pass


def _build_world_notice_reaction(db: DBSession, subject_name: str, action: str):
    return None


@router.get("")
def list_agents(db: DBSession, skip: int = 0, limit: int = 100):
    agents = get_agents(db, skip=skip, limit=limit)
    return [models.AgentResponse.from_agent(a) for a in agents]


@router.get("/presets", response_model=list[models.AgentPreset])
def list_agent_presets(weather: str = DEFAULT_PRESET_WEATHER):
    return AGENT_PRESETS


@router.post("/presets/spawn", status_code=status.HTTP_201_CREATED)
def spawn_agent_from_preset(
    payload: models.AgentPresetSpawnRequest,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    preset = next((item for item in AGENT_PRESETS if item.id == payload.preset_id), None)
    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preset not found")

    environment = get_environment(db)
    weather = (environment.weather or DEFAULT_PRESET_WEATHER).lower()
    personality = f"{preset.personality} Current weather in world: {weather}."
    created = create_agent(
        db,
        models.AgentCreate(
            name=preset.name,
            personality=personality,
            mood="neutral",
            current_plan=preset.current_plan,
        ),
    )
    create_event(db, models.EventCreate(content=f"Preset spawned: {created.name} ({weather})"))
    reaction = _build_world_notice_reaction(db, created.name, "entered world")
    _reload_points_manager()
    background_tasks.add_task(agents_hub.send_agent_created, created)
    background_tasks.add_task(agents_hub.send_agents_update)
    if reaction and reaction.get("mode") == "dialogue":
        background_tasks.add_task(
            agents_hub.send_agent_dialogue,
            reaction["agent1_id"],
            reaction["agent1_name"],
            reaction["agent2_id"],
            reaction["agent2_name"],
            reaction["messages"],
        )
    if reaction and reaction.get("mode") == "thought":
        background_tasks.add_task(
            agents_hub.send_agent_thought,
            reaction["agent_id"],
            reaction["thought"],
        )
    return models.AgentResponse.from_agent(created)


@router.get("/mobs/presets", response_model=list[models.MobPreset])
def list_mob_presets():
    return MOB_PRESETS


@router.post("/mobs/spawn", status_code=status.HTTP_201_CREATED)
def spawn_mob_from_preset(
    payload: models.MobPresetSpawnRequest,
    db: DBSession,
    background_tasks: BackgroundTasks,
):
    preset = next((m for m in MOB_PRESETS if m.id == payload.preset_id), None)
    if not preset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mob preset not found")

    created = create_agent(
        db,
        models.AgentCreate(
            name=preset.name,
            type="mob",
            personality=preset.personality,
            mood=preset.mood,
            current_plan=preset.current_plan,
        ),
    )
    create_event(db, models.EventCreate(content=f"Mob spawned: {created.name}"))
    _reload_points_manager()
    background_tasks.add_task(agents_hub.send_agent_created, created)
    background_tasks.add_task(agents_hub.send_agents_update)
    background_tasks.add_task(_mob_appearance_reaction, created)
    return models.AgentResponse.from_agent(created)


async def _mob_appearance_reaction(mob_agent):
    from ...database.database import SessionLocal

    db = SessionLocal()
    try:
        real_agents = [a for a in get_agents(db, limit=100) if (getattr(a, "type", "agent") or "agent") == "agent"]
        if not real_agents:
            return

        llm = get_llm()
        watcher = random.choice(real_agents)
        prompt = (
            f"Ты {watcher.name}. {watcher.personality}\n"
            f"В мире появилось животное: {mob_agent.name} ({mob_agent.personality}).\n"
            "Скажи одну короткую живую реплику по-русски, без шаблонных приветствий."
        )
        thought = llm.invoke(prompt).content.strip().replace("**", "").replace("*", "")
        if not thought or thought.startswith("[GenAPI error"):
            thought = f"Смотри, {mob_agent.name} появился рядом."
        if ":" in thought[:30]:
            left, right = thought.split(":", 1)
            if len(left.split()) <= 3:
                thought = right.strip()

        await agents_hub.send_agent_thought(watcher.id, thought)

        if len(real_agents) >= 2:
            a1, a2 = random.sample(real_agents, 2)
            dialog_prompt = (
                f"Два агента обсуждают новое животное в городе.\n"
                f"Животное: {mob_agent.name} ({mob_agent.personality}).\n"
                f"Агент 1: {a1.name} - {a1.personality}\n"
                f"Агент 2: {a2.name} - {a2.personality}\n"
                "Верни ровно две короткие реплики на русском, по одной на каждого, без шаблонных приветствий."
            )
            text = llm.invoke(dialog_prompt).content.strip().replace("**", "").replace("*", "")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            if len(lines) < 2:
                lines = [
                    f"Смотри, {mob_agent.name} новенький здесь. Понаблюдаем за ним.",
                    "Да, это может поменять поведение вокруг.",
                ]
            line1, line2 = lines[0], lines[1]
            if ":" in line1[:30]:
                left, right = line1.split(":", 1)
                if len(left.split()) <= 3:
                    line1 = right.strip()
            if ":" in line2[:30]:
                left, right = line2.split(":", 1)
                if len(left.split()) <= 3:
                    line2 = right.strip()
            await agents_hub.send_agent_dialogue(
                a1.id,
                a1.name,
                a2.id,
                a2.name,
                [{"speaker": a1.name, "text": line1}, {"speaker": a2.name, "text": line2}],
            )
    except Exception as e:
        print(f"[MobReaction] Error: {e}")
    finally:
        db.close()


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
    reaction = _build_world_notice_reaction(db, created.name, "entered world")
    _reload_points_manager()
    background_tasks.add_task(agents_hub.send_agent_created, created)
    background_tasks.add_task(agents_hub.send_agents_update)
    if reaction and reaction.get("mode") == "dialogue":
        background_tasks.add_task(
            agents_hub.send_agent_dialogue,
            reaction["agent1_id"],
            reaction["agent1_name"],
            reaction["agent2_id"],
            reaction["agent2_name"],
            reaction["messages"],
        )
    if reaction and reaction.get("mode") == "thought":
        background_tasks.add_task(
            agents_hub.send_agent_thought,
            reaction["agent_id"],
            reaction["thought"],
        )
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
