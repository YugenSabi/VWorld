from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...database.crud_events import create_event
from ...database.crud_environment import (
    get_or_create_environment,
    update_weather as crud_update_weather,
    update_time_speed as crud_update_time_speed,
)
from ... import models
from ...models import WeatherUpdate, EnvironmentEventCreate, TimeSpeedUpdate

router = APIRouter(prefix="/environment", tags=["environment"])


@router.patch("/weather", response_model=models.EnvironmentResponse)
def update_weather(weather: WeatherUpdate, db: Session = Depends(get_db)):
    #обновляет погоду в окружении
    env = crud_update_weather(db, weather.weather)
    create_event(db, models.EventCreate(content=f"Weather changed to: {env.weather}"))
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.post("/event", response_model=models.EventResponse)
def add_environment_event(event: EnvironmentEventCreate, db: Session = Depends(get_db)):
    #добавляет новое событие в окружение
    return create_event(db, models.EventCreate(content=event.content))


@router.patch("/speed", response_model=models.EnvironmentResponse)
def update_time_speed(speed: TimeSpeedUpdate, db: Session = Depends(get_db)):
    #обновляет скорость времени в окружении
    env = crud_update_time_speed(db, speed.speed)
    create_event(db, models.EventCreate(content=f"Time speed changed to: {env.time_speed}x"))
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.get("/weather", response_model=models.EnvironmentResponse)
def get_weather(db: Session = Depends(get_db)):
    #возвращает текущую погоду
    env = get_or_create_environment(db)
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)


@router.get("/speed", response_model=models.EnvironmentResponse)
def get_time_speed(db: Session = Depends(get_db)):
    #возвращает текущую скорость времени
    env = get_or_create_environment(db)
    return models.EnvironmentResponse(weather=env.weather, speed=env.time_speed)
