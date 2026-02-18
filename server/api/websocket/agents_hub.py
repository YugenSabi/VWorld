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
                models.AgentResponse.from_agent(agent).model_dump(mode="json")
                for agent in agents
            ]
        finally:
            db.close()

        await self.broadcast("agents_update", {"agents": serialized})

    async def send_agent_created(self, agent: Any) -> None:
        serialized = models.AgentResponse.from_agent(agent).model_dump(mode="json")
        await self.broadcast("agent_created", {"agent": serialized})

    async def send_agent_deleted(self, agent_id: int) -> None:
        await self.broadcast("agent_deleted", {"agentId": agent_id})

    async def send_agent_mood_changed(self, agent_id: int, mood: str) -> None:
        await self.broadcast("agent_mood_changed", {"agentId": agent_id, "mood": mood})

    async def send_agent_moved(self, agent_id: int, x: float, y: float) -> None:
        await self.broadcast("agent_moved", {"agentId": agent_id, "x": x, "y": y})

    async def send_agent_dialogue(
        self,
        agent_id1: int, name1: str,
        agent_id2: int, name2: str,
        messages: list[dict],
    ) -> None:
        await self.broadcast("agent_dialogue", {
            "agentId1": agent_id1,
            "name1": name1,
            "agentId2": agent_id2,
            "name2": name2,
            "messages": messages,
        })

    async def send_agent_thought(self, agent_id: int, thought: str) -> None:
        await self.broadcast("agent_thought", {"agentId": agent_id, "thought": thought})


agents_hub = AgentsHub()
