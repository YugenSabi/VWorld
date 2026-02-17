import asyncio
import random
from sqlalchemy.orm import Session

from .agent_ai import AgentBrain
from ..database.database import SessionLocal
from ..database.crud_agents import get_agents
from ..database.crud_environment import get_environment


class SimulationLoop:
    def __init__(self):
        self._running = False
        self._task = None
        self._tick_interval = 30.0
        self._last_results = []

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def last_results(self) -> list:
        return self._last_results

    def set_speed(self, speed: float):
        self._tick_interval = max(3.0, 30.0 / speed)

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
                self._last_results = [{"error": str(e)}]
            await asyncio.sleep(self._tick_interval)

    async def _tick(self):
        db = SessionLocal()
        try:
            agents = get_agents(db)
            if not agents:
                self._last_results = []
                return

            results = []

            for agent in agents:
                try:
                    brain = AgentBrain(agent.id, db)
                    plan = brain.generate_plan()
                    results.append(plan)
                except Exception as e:
                    results.append({
                        "agent_id": agent.id,
                        "agent_name": agent.name,
                        "error": str(e),
                    })

            if len(agents) >= 2:
                pair = random.sample(agents, 2)
                try:
                    brain = AgentBrain(pair[0].id, db)
                    chat_result = brain.start_chat(pair[1].id)
                    results.append({
                        "type": "auto_chat",
                        "dialogue": chat_result.get("dialogue", []),
                    })
                except Exception as e:
                    results.append({
                        "type": "auto_chat",
                        "error": str(e),
                    })

            self._last_results = results

        finally:
            db.close()


_simulation = SimulationLoop()


def get_simulation() -> SimulationLoop:
    return _simulation
