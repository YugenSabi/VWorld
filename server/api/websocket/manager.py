from fastapi import WebSocket
from typing import Dict, Set
import json
import random
import math
from sqlalchemy.orm import Session

from api.database import get_db
from api.database.crud_points import (
    get_all_points,
    create_point,
    update_point_position,
    update_point_target
)

POINT_DEFAULT_SPEED = 1.5


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.points: Dict[str, dict] = {}  # {point_id: {x, y, target_x, target_y, speed}}
        self.point_counter = 0
        self._load_points_from_db()
    
    def _load_points_from_db(self):
        db = next(get_db())
        try:
            db_points = get_all_points(db)
            for db_point in db_points:
                self.points[db_point.id] = {
                    "id": db_point.id,
                    "x": db_point.x,
                    "y": db_point.y,
                    "target_x": db_point.target_x,
                    "target_y": db_point.target_y,
                    "speed": db_point.speed
                }
                if db_point.id.startswith("point_"):
                    try:
                        counter = int(db_point.id.split("_")[1])
                        if counter >= self.point_counter:
                            self.point_counter = counter + 1
                    except ValueError:
                        pass
        finally:
            db.close()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
    
    def add_point(self, x: float, y: float) -> str:
        point_id = f"point_{self.point_counter}"
        self.point_counter += 1
        
        radius = 30
        angle = random.uniform(0, 2 * math.pi)
        target_x = x + radius * math.cos(angle)
        target_y = y + radius * math.sin(angle)
        
        self.points[point_id] = {
            "id": point_id,
            "x": x,
            "y": y,
            "target_x": target_x,
            "target_y": target_y,
            "speed": POINT_DEFAULT_SPEED
        }
        
        db = next(get_db())
        try:
            create_point(db, point_id, x, y, target_x, target_y, POINT_DEFAULT_SPEED)
        finally:
            db.close()
        
        return point_id
    
    def move_point_to(self, point_id: str, target_x: float, target_y: float):
        if point_id in self.points:
            self.points[point_id]["target_x"] = target_x
            self.points[point_id]["target_y"] = target_y
            
            db = next(get_db())
            try:
                update_point_target(db, point_id, target_x, target_y)
            finally:
                db.close()
    
    def reload_from_db(self):
        """Reload points from DB (called when agents are created/deleted)."""
        self._load_points_from_db()

    async def broadcast_points(self):
        if not self.active_connections:
            return
        
        points_for_client = [
            {"id": p["id"], "x": p["x"], "y": p["y"]}
            for p in self.points.values()
        ]
        message = json.dumps({
            "type": "points_update",
            "points": points_for_client
        })
        
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        
        for conn in disconnected:
            self.disconnect(conn)
