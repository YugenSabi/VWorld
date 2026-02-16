import asyncio
import random
import math
from sqlalchemy.orm import Session

from api.database import get_db
from api.database.crud_points import update_point_position


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
                radius = 30
                angle = random.uniform(0, 2 * math.pi)
                old_target_x = point["target_x"]
                old_target_y = point["target_y"]
                point["target_x"] = point["x"] + radius * math.cos(angle)
                point["target_y"] = point["y"] + radius * math.sin(angle)
                target_changed = (point["target_x"] != old_target_x or point["target_y"] != old_target_y)
            
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


async def points_update_task(manager):
    #задача для обновления позиций точек
    while True:
        update_points(manager)
        await manager.broadcast_points()
        await asyncio.sleep(0.016)  # ~60 FPS
