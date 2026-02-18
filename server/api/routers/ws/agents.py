from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ...websocket.agents_hub import agents_hub


router = APIRouter()


@router.websocket("/ws/agents")
async def agents_websocket(websocket: WebSocket):
    await agents_hub.connect(websocket)
    await agents_hub.send_agents_update()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        agents_hub.disconnect(websocket)
    except Exception:
        agents_hub.disconnect(websocket)
