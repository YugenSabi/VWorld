from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ... import models
from ...database import get_db
from ...database.crud_agents import get_agents
from ...database.crud_environment import (
    get_or_create_environment,
    update_time_speed as crud_update_time_speed,
    update_weather as crud_update_weather,
)
from ...database.crud_events import create_event
from ...llm.agent_ai import persist_agent_memory
from ...llm.simulation import get_simulation
from ...models import EnvironmentEventCreate, TimeSpeedUpdate, WeatherUpdate
from ...websocket.agents_hub import agents_hub

router = APIRouter(prefix="/environment", tags=["environment"])


def _plan_reaction(weather: str) -> str:
    by_weather = {
        "rainy": "Снизить темп и чаще сверяться с командой.",
        "snowy": "Двигаться аккуратнее и держать устойчивый ритм.",
        "sunny": "Быстрее входить в контакт и использовать активные зоны.",
        "stormy": "Сфокусироваться на безопасности и коротких шагах.",
        "cloudy": "Сохранять стабильный рабочий темп.",
        "foggy": "Чаще перепроверять информацию и не спешить.",
    }
    return by_weather.get(weather, by_weather["cloudy"])


def _apply_weather_reactions(db: Session, weather: str):
    agents = get_agents(db, skip=0, limit=1000)
    if not agents:
        return

    for agent in agents:
        base_plan = (agent.current_plan or "").strip()
        addon = _plan_reaction(weather)
        agent.current_plan = f"{base_plan} {addon}".strip() if base_plan else addon
    db.commit()


def _remember_world_event_for_agents(db: Session, text: str):
    agents = [
        a
        for a in get_agents(db, skip=0, limit=1000)
        if (getattr(a, "type", "agent") or "agent") == "agent"
    ]
    for agent in agents:
        try:
            persist_agent_memory(db, agent.id, text, memory_type="world")
        except Exception:
            continue


@router.patch("/weather", response_model=models.EnvironmentResponse)
def update_weather(
    weather: WeatherUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    previous = get_or_create_environment(db).weather
    env = crud_update_weather(db, weather.weather)
    change_text = f"Начался новый этап дня: погода изменилась с {previous} на {env.weather}."
    create_event(db, models.EventCreate(content=change_text))
    _remember_world_event_for_agents(db, change_text)
    _apply_weather_reactions(db, env.weather)
    background_tasks.add_task(agents_hub.send_agents_update)
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.post("/event", response_model=models.EventResponse)
def add_environment_event(event: EnvironmentEventCreate, db: Session = Depends(get_db)):
    return create_event(db, models.EventCreate(content=event.content))


@router.patch("/speed", response_model=models.EnvironmentResponse)
def update_time_speed(speed: TimeSpeedUpdate, db: Session = Depends(get_db)):
    env = crud_update_time_speed(db, speed.speed)
    get_simulation().set_speed(env.time_speed)
    create_event(db, models.EventCreate(content=f"Time speed changed to: {env.time_speed}x"))
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.get("/weather", response_model=models.EnvironmentResponse)
def get_weather(db: Session = Depends(get_db)):
    env = get_or_create_environment(db)
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.get("/speed", response_model=models.EnvironmentResponse)
def get_time_speed(db: Session = Depends(get_db)):
    env = get_or_create_environment(db)
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)
