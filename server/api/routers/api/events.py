from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...database.crud_events import create_event, get_events
from ... import models

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=models.EventResponse)
def create_new_event(event: models.EventCreate, db: Session = Depends(get_db)):
    return create_event(db, event)


@router.get("", response_model=list[models.EventResponse])
def list_all_events(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return get_events(db, skip=skip, limit=limit)
