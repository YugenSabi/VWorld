import asyncio
import math
import os
import random

from sqlalchemy.orm import Session

from api.database import get_db
from api.database.crud_agents import get_agents
from api.database.crud_points import update_point_position


_point_to_agent: dict[str, int] = {}
_broadcast_counter = 0
POINTS_TICK_SECONDS = float(os.getenv("VWORLD_POINTS_TICK_SECONDS", "0.05"))
ROAD_ZONES: list[tuple[float, float, float, float]] = [
    (34.0, 44.0, 68.0, 66.0),
]


def _nearest_road_point(x: float, y: float) -> tuple[float, float]:
    best_x, best_y = x, y
    best_dist = float("inf")
    for x1, y1, x2, y2 in ROAD_ZONES:
        cx = max(x1, min(x2, x))
        cy = max(y1, min(y2, y))
        dist = (cx - x) ** 2 + (cy - y) ** 2
        if dist < best_dist:
            best_dist = dist
            best_x, best_y = cx, cy
    return best_x, best_y


def _refresh_point_agent_map(db: Session):
    global _point_to_agent
    agents = get_agents(db, limit=1000)
    _point_to_agent = {a.point_id: a.id for a in agents if a.point_id}


def update_points(manager):
    db = next(get_db())
    try:
        for point_id, point in manager.points.items():
            old_x = point["x"]
            old_y = point["y"]

            dx = point["target_x"] - point["x"]
            dy = point["target_y"] - point["y"]
            distance = math.sqrt(dx * dx + dy * dy)

            target_changed = False
            if distance > 0.5:
                move_distance = min(point["speed"], distance)
                point["x"] += (dx / distance) * move_distance
                point["y"] += (dy / distance) * move_distance
            else:
                radius = 2.8 if point_id.startswith("agent_point_") else 4.2
                angle = random.uniform(0, 2 * math.pi)
                old_target_x = point["target_x"]
                old_target_y = point["target_y"]
                next_target_x = point["x"] + radius * math.cos(angle)
                next_target_y = point["y"] + radius * math.sin(angle)
                point["target_x"], point["target_y"] = _nearest_road_point(next_target_x, next_target_y)
                target_changed = (point["target_x"] != old_target_x or point["target_y"] != old_target_y)

            point["x"], point["y"] = _nearest_road_point(point["x"], point["y"])

            position_changed = abs(point["x"] - old_x) > 0.1 or abs(point["y"] - old_y) > 0.1
            if position_changed or target_changed:
                update_point_position(
                    db,
                    point_id,
                    point["x"],
                    point["y"],
                    point["target_x"],
                    point["target_y"],
                )
    finally:
        db.close()


async def points_update_task(manager):
    global _broadcast_counter

    db = next(get_db())
    try:
        _refresh_point_agent_map(db)
    finally:
        db.close()

    from api.websocket.agents_hub import agents_hub

    while True:
        await asyncio.to_thread(update_points, manager)

        if manager.active_connections:
            await manager.broadcast_points()

        _broadcast_counter += 1
        if _broadcast_counter % 10 == 0:
            for point_id, point in manager.points.items():
                agent_id = _point_to_agent.get(point_id)
                if agent_id is not None:
                    await agents_hub.send_agent_moved(agent_id, point["x"], point["y"])

        if _broadcast_counter % 300 == 0:
            db = next(get_db())
            try:
                _refresh_point_agent_map(db)
            finally:
                db.close()

        await asyncio.sleep(POINTS_TICK_SECONDS)
