from typing import Optional, List
from sqlalchemy.orm import Session

from .models import Point


def get_all_points(db: Session) -> List[Point]:
    """Р’РѕР·РІСЂР°С‰Р°РµС‚ РІСЃРµ С‚РѕС‡РєРё РёР· Р±Р°Р·С‹ РґР°РЅРЅС‹С…."""
    return db.query(Point).all()


def get_point(db: Session, point_id: str) -> Optional[Point]:
    """Р’РѕР·РІСЂР°С‰Р°РµС‚ С‚РѕС‡РєСѓ РїРѕ ID."""
    return db.query(Point).filter(Point.id == point_id).first()


def create_point(
    db: Session,
    point_id: str,
    x: float,
    y: float,
    target_x: float,
    target_y: float,
    speed: float = 1.5
) -> Point:
    """РЎРѕР·РґР°РµС‚ РЅРѕРІСѓСЋ С‚РѕС‡РєСѓ РІ Р±Р°Р·Рµ РґР°РЅРЅС‹С…."""
    db_point = Point(
        id=point_id,
        x=x,
        y=y,
        target_x=target_x,
        target_y=target_y,
        speed=speed
    )
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    return db_point


def update_point_position(
    db: Session,
    point_id: str,
    x: float,
    y: float,
    target_x: float,
    target_y: float
) -> Optional[Point]:
    """РћР±РЅРѕРІР»СЏРµС‚ РїРѕР·РёС†РёСЋ С‚РѕС‡РєРё Рё РµС‘ С†РµР»СЊ."""
    db_point = get_point(db, point_id)
    if not db_point:
        return None
    db_point.x = x
    db_point.y = y
    db_point.target_x = target_x
    db_point.target_y = target_y
    db.commit()
    db.refresh(db_point)
    return db_point


def update_point_target(
    db: Session,
    point_id: str,
    target_x: float,
    target_y: float
) -> Optional[Point]:
    """РћР±РЅРѕРІР»СЏРµС‚ С‚РѕР»СЊРєРѕ С†РµР»РµРІСѓСЋ РїРѕР·РёС†РёСЋ С‚РѕС‡РєРё."""
    db_point = get_point(db, point_id)
    if not db_point:
        return None
    db_point.target_x = target_x
    db_point.target_y = target_y
    db.commit()
    db.refresh(db_point)
    return db_point


def delete_point(db: Session, point_id: str) -> bool:
    """РЈРґР°Р»СЏРµС‚ С‚РѕС‡РєСѓ РёР· Р±Р°Р·С‹ РґР°РЅРЅС‹С…."""
    db_point = get_point(db, point_id)
    if not db_point:
        return False
    db.delete(db_point)
    db.commit()
    return True
