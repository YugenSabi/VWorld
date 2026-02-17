import asyncio
import random
import math
from sqlalchemy.orm import Session

from api.database import get_db
from api.database.crud_points import update_point_position
from api.database.crud_agents import get_agents


# Cache: point_id -> agent_id mapping
_point_to_agent: dict[str, int] = {}


def _refresh_point_agent_map(db: Session):
    """Rebuild point_id -> agent_id cache."""
    global _point_to_agent
    agents = get_agents(db, limit=1000)
    _point_to_agent = {
        a.point_id: a.id for a in agents if a.point_id
    }


def update_points(manager):
    #обновляет позиции точек, двигая их к цели
    db = next(get_db())
    try:
        for point_id, point in manager.points.items():
            old_x = point["x"]
            old_y = point["y"]

            dx = point["target_x"] - point["x"]
            dy = point["target_y"] - point["y"]
            distance = math.sqrt(dx * dx + dy * dy)

            target_changed = False
            if distance > 0.5:  # Если не достигли цели
                move_distance = min(point["speed"], distance)
                point["x"] += (dx / distance) * move_distance
                point["y"] += (dy / distance) * move_distance
            else:
                # Достигли цели, выбираем новую случайную цель в радиусе
                radius = 8  # % units for agent points, smaller wandering
                if point_id.startswith("agent_point_"):
                    radius = 8
                else:
                    radius = 30  # original behavior for non-agent points

                angle = random.uniform(0, 2 * math.pi)
                old_target_x = point["target_x"]
                old_target_y = point["target_y"]
                point["target_x"] = max(5, min(95, point["x"] + radius * math.cos(angle)))
                point["target_y"] = max(5, min(95, point["y"] + radius * math.sin(angle)))
                target_changed = (point["target_x"] != old_target_x or point["target_y"] != old_target_y)

            # Clamp position to viewport bounds
            point["x"] = max(2, min(98, point["x"]))
            point["y"] = max(2, min(98, point["y"]))

            # Сохраняем изменения в БД только если позиция или цель изменилась
            position_changed = abs(point["x"] - old_x) > 0.1 or abs(point["y"] - old_y) > 0.1
            if position_changed or target_changed:
                update_point_position(
                    db,
                    point_id,
                    point["x"],
                    point["y"],
                    point["target_x"],
                    point["target_y"]
                )
    finally:
        db.close()


_broadcast_counter = 0


async def points_update_task(manager):
    """Task to update point positions and broadcast agent positions."""
    global _broadcast_counter

    # Initial map build
    db = next(get_db())
    try:
        _refresh_point_agent_map(db)
    finally:
        db.close()

    from api.websocket.agents_hub import agents_hub

    while True:
        update_points(manager)
        await manager.broadcast_points()

        # Every ~10 frames (~160ms), broadcast agent positions via agents WS
        _broadcast_counter += 1
        if _broadcast_counter % 10 == 0:
            for point_id, point in manager.points.items():
                agent_id = _point_to_agent.get(point_id)
                if agent_id is not None:
                    await agents_hub.send_agent_moved(agent_id, point["x"], point["y"])

        # Every ~300 frames (~5s), refresh the map in case agents were created/deleted
        if _broadcast_counter % 300 == 0:
            db = next(get_db())
            try:
                _refresh_point_agent_map(db)
            finally:
                db.close()

        await asyncio.sleep(0.016)  # ~60 FPS
