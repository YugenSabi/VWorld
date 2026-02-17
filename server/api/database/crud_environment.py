from sqlalchemy.orm import Session

from .models import Environment


ENVIRONMENT_ROW_ID = 1


def get_or_create_environment(db: Session) -> Environment:
    # Return singleton environment row or create it on first access.
    env = db.query(Environment).filter(Environment.id == ENVIRONMENT_ROW_ID).first()
    if env is None:
        env = Environment(id=ENVIRONMENT_ROW_ID, weather='sunny', time_speed=1.0)
        db.add(env)
        db.commit()
        db.refresh(env)
    return env


def get_environment(db: Session) -> Environment:
    # Return current environment.
    return get_or_create_environment(db)


def update_weather(db: Session, weather: str) -> Environment:
    # Update weather and normalize to lowercase for a stable contract.
    env = get_or_create_environment(db)
    env.weather = weather.lower()
    db.commit()
    db.refresh(env)
    return env


def update_time_speed(db: Session, speed: float) -> Environment:
    # Update world time speed.
    env = get_or_create_environment(db)
    env.time_speed = speed
    db.commit()
    db.refresh(env)
    return env
