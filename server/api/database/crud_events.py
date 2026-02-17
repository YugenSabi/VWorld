"""CRUD operations for events."""

from sqlalchemy.orm import Session

from .models import Event
from .. import models


def create_event(db: Session, event: models.EventCreate) -> Event:
    #создает новое событие
    db_event = Event(content=event.content)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_events(db: Session, skip: int = 0, limit: int = 1000) -> list[Event]:
    #возвращает все события с пагинацией
    return db.query(Event).order_by(Event.created_at.desc()).offset(skip).limit(limit).all()
