import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.websocket.manager import ConnectionManager

router = APIRouter()

manager = ConnectionManager()


@router.websocket("/ws/points")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

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
