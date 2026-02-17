import asyncio
import math
import random
import time

from .agent_ai import AgentBrain
from ..database.database import SessionLocal
from ..database.crud_agents import get_agents
from ..database.crud_events import create_event
from ..websocket.agents_hub import agents_hub
from .. import models


class SimulationLoop:
    def __init__(self):
        self._running = False
        self._task = None
        self._tick_interval = 30.0
        self._last_results = []
        # Cooldown: (agent_id_1, agent_id_2) -> last_chat_timestamp
        self._chat_cooldowns: dict[tuple[int, int], float] = {}
        self._chat_cooldown_seconds = 60.0

    @staticmethod
    def _is_llm_error(text: str) -> bool:
        return not text or text.startswith("[Gemini error")

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def last_results(self) -> list:
        return self._last_results

    def set_speed(self, speed: float):
        self._tick_interval = max(5.0, 30.0 / speed)

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _loop(self):
        while self._running:
            try:
                await self._tick()
            except Exception as e:
                print(f"[Simulation] Tick error: {e}")
                self._last_results = [{"error": str(e)}]
            await asyncio.sleep(self._tick_interval)

    def _get_agent_position(self, agent) -> tuple[float, float]:
        """Get agent position from linked point."""
        if agent.point:
            return (agent.point.x, agent.point.y)
        return (50.0, 50.0)

    def _distance(self, pos1: tuple[float, float], pos2: tuple[float, float]) -> float:
        """Distance in % units between two positions."""
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        return math.sqrt(dx * dx + dy * dy)

    def _can_chat(self, id1: int, id2: int) -> bool:
        """Check if two agents can chat (not on cooldown)."""
        key = (min(id1, id2), max(id1, id2))
        last = self._chat_cooldowns.get(key, 0)
        return (time.time() - last) > self._chat_cooldown_seconds

    def _mark_chatted(self, id1: int, id2: int):
        """Mark that two agents just chatted."""
        key = (min(id1, id2), max(id1, id2))
        self._chat_cooldowns[key] = time.time()

    async def _tick(self):
        db = SessionLocal()
        try:
            agents = get_agents(db)
            if not agents:
                self._last_results = []
                return

            results = []

            # 1. Each agent generates a plan (thought)
            for agent in agents:
                try:
                    brain = AgentBrain(agent.id, db)
                    plan = brain.generate_plan()
                    results.append(plan)

                    # Broadcast thought bubble
                    thought_text = plan.get("plan", "")
                    if thought_text and not self._is_llm_error(thought_text):
                        # Truncate for bubble
                        short = thought_text[:80] + ("..." if len(thought_text) > 80 else "")
                        await agents_hub.send_agent_thought(agent.id, short)

                    # Broadcast mood change
                    db.refresh(agent)
                    await agents_hub.send_agent_mood_changed(agent.id, agent.mood)
                except Exception as e:
                    results.append({
                        "agent_id": agent.id,
                        "agent_name": agent.name,
                        "error": str(e),
                    })

            # 2. Proximity-based auto-chats
            db.expire_all()  # Refresh all from DB
            agents = get_agents(db)  # Re-fetch with fresh data
            proximity_threshold = 20.0  # % units

            for i, a1 in enumerate(agents):
                for a2 in agents[i + 1:]:
                    pos1 = self._get_agent_position(a1)
                    pos2 = self._get_agent_position(a2)
                    dist = self._distance(pos1, pos2)

                    if dist < proximity_threshold and self._can_chat(a1.id, a2.id):
                        try:
                            brain = AgentBrain(a1.id, db)
                            chat_result = brain.start_chat(a2.id)
                            dialogue = chat_result.get("dialogue", [])
                            if not dialogue:
                                continue

                            bad_dialogue = any(
                                self._is_llm_error(m.get("text", ""))
                                for m in dialogue
                            )
                            if bad_dialogue:
                                continue

                            self._mark_chatted(a1.id, a2.id)

                            results.append({
                                "type": "auto_chat",
                                "dialogue": dialogue,
                            })

                            # Broadcast dialogue
                            messages = [
                                {"speaker": m["speaker"], "text": m["text"]}
                                for m in dialogue
                            ]
                            await agents_hub.send_agent_dialogue(
                                a1.id, a1.name,
                                a2.id, a2.name,
                                messages,
                            )

                            # Log as event
                            if dialogue:
                                first_msg = dialogue[0]["text"][:50]
                                create_event(db, models.EventCreate(
                                    content=f"{a1.name} and {a2.name} talked: \"{first_msg}...\""
                                ))

                            # Broadcast mood updates
                            db.refresh(a1)
                            db.refresh(a2)
                            await agents_hub.send_agent_mood_changed(a1.id, a1.mood)
                            await agents_hub.send_agent_mood_changed(a2.id, a2.mood)

                        except Exception as e:
                            results.append({
                                "type": "auto_chat",
                                "error": str(e),
                            })
                        # Only one auto-chat per tick to avoid API overload
                        break
                else:
                    continue
                break

            self._last_results = results

            # Broadcast full agents update after each tick
            await agents_hub.send_agents_update()

        finally:
            db.close()


_simulation = SimulationLoop()


def get_simulation() -> SimulationLoop:
    return _simulation
