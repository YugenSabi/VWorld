from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio

from api.websocket.manager import ConnectionManager
from api.websocket.ws_logic import points_update_task

router = APIRouter()

manager = ConnectionManager()

# задача обновления
update_task = None

@router.websocket("/ws/points")
async def websocket_endpoint(websocket: WebSocket):
    global update_task
    
    await manager.connect(websocket)
    
    # Запускаем задачу обновления только один раз
    if update_task is None or update_task.done():
        update_task = asyncio.create_task(points_update_task(manager))
    
    try:
        await manager.broadcast_points()
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "add_point":
                screen_width = message.get("screen_width", 800)
                screen_height = message.get("screen_height", 600)
                center_x = screen_width / 2
                center_y = screen_height / 2
                
                manager.add_point(center_x, center_y)
                await manager.broadcast_points()
                
            elif message["type"] == "move_point":
                point_id = message["point_id"]
                target_x = message["x"]
                target_y = message["y"]
                manager.move_point_to(point_id, target_x, target_y)
                await manager.broadcast_points()
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
