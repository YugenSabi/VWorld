from __future__ import annotations

import json
from typing import Any, Set

from fastapi import WebSocket
from .. import models
from ..database.database import SessionLocal
from ..database.crud_agents import get_agents


class AgentsHub:
    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast(self, event_type: str, data: Any) -> None:
        if not self.active_connections:
            return

        payload = json.dumps({"type": event_type, "data": data}, default=str)
        disconnected: list[WebSocket] = []
        for ws in self.active_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    async def send_agents_update(self) -> None:
        db = SessionLocal()
        try:
            agents = get_agents(db, skip=0, limit=1000)
            serialized = [
                models.AgentResponse.model_validate(agent).model_dump(mode="json")
                for agent in agents
            ]
        finally:
            db.close()

        await self.broadcast("agents_update", {"agents": serialized})

    async def send_agent_created(self, agent: Any) -> None:
        serialized = models.AgentResponse.model_validate(agent).model_dump(mode="json")
        await self.broadcast("agent_created", {"agent": serialized})

    async def send_agent_deleted(self, agent_id: int) -> None:
        await self.broadcast("agent_deleted", {"agentId": agent_id})

    async def send_agent_mood_changed(self, agent_id: int, mood: str) -> None:
        await self.broadcast("agent_mood_changed", {"agentId": agent_id, "mood": mood})


agents_hub = AgentsHub()
