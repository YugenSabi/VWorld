import asyncio
import math
import random
import time

from .agent_ai import AgentBrain
from .zones import PRIMARY_ZONES
from .. import models
from ..database.crud_agents import get_agents
from ..database.crud_relationships import upsert_relationship
from ..database.database import SessionLocal
from ..database.models import Relationship
from ..websocket.agents_hub import agents_hub


_PLAN_ZONE_KEYWORDS: dict[str, list[str]] = {
    "park": ["отдых", "парк", "спокой", "прогулк", "тихо", "расслаб"],
    "square": ["площадь", "встреч", "люди", "контакт", "знаком", "общени"],
    "road": ["маршрут", "дорог", "движени", "безопасност", "координац", "темп"],
}


def _pick_zone_for_plan(plan_text: str) -> str | None:
    if not plan_text:
        return None
    lower = plan_text.lower()
    scores: dict[str, int] = {name: 0 for name in _PLAN_ZONE_KEYWORDS}
    for zone_name, keywords in _PLAN_ZONE_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                scores[zone_name] += 1
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return random.choice([z.name for z in PRIMARY_ZONES])
    return best


def _run_agent_plan(agent_id: int):
    db = SessionLocal()
    try:
        brain = AgentBrain(agent_id, db)
        plan = brain.generate_plan()
        return {"agent_id": agent_id, "plan": plan, "mood": brain.agent.mood, "point_id": brain.agent.point_id, "error": None}
    except Exception as e:
        return {"agent_id": agent_id, "plan": None, "mood": None, "point_id": None, "error": str(e)}
    finally:
        db.close()


def _run_auto_chat(agent1_id: int, agent2_id: int):
    db = SessionLocal()
    try:
        brain = AgentBrain(agent1_id, db)
        chat_result = brain.start_chat(agent2_id)
        if chat_result.get("error"):
            return {"error": chat_result["error"]}

        dialogue = chat_result.get("dialogue", [])
        if not dialogue:
            return {"error": "empty dialogue"}

        d1 = next((m for m in dialogue if m.get("speaker_id") == agent1_id), None)
        d2 = next((m for m in dialogue if m.get("speaker_id") == agent2_id), None)
        name1 = d1["speaker"] if d1 else f"Agent {agent1_id}"
        name2 = d2["speaker"] if d2 else f"Agent {agent2_id}"

        return {"dialogue": dialogue, "name1": name1, "name2": name2, "error": None}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


def _run_social_drift():
    db = SessionLocal()
    try:
        agents = get_agents(db, skip=0, limit=1000)
        if len(agents) < 2:
            return None

        a1, a2 = random.sample(agents, 2)
        rel = (
            db.query(Relationship)
            .filter(
                Relationship.agent_from_id == a1.id,
                Relationship.agent_to_id == a2.id,
            )
            .first()
        )

        if rel is None:
            upsert_relationship(
                db,
                models.RelationshipCreate(agent_from_id=a1.id, agent_to_id=a2.id, sympathy=1),
            )
            upsert_relationship(
                db,
                models.RelationshipCreate(agent_from_id=a2.id, agent_to_id=a1.id, sympathy=1),
            )
            return None

        delta = random.choice([-1, 0, 1])
        if delta == 0:
            return None

        new_sympathy = max(-10, min(10, rel.sympathy + delta))
        upsert_relationship(
            db,
            models.RelationshipCreate(agent_from_id=a1.id, agent_to_id=a2.id, sympathy=new_sympathy),
        )
        return None
    finally:
        db.close()


class SimulationLoop:
    def __init__(self):
        self._running = False
        self._task = None
        self._tick_interval = 8.0
        self._last_results = []
        self._chat_cooldowns: dict[tuple[int, int], float] = {}
        self._chat_cooldown_seconds = 12.0
        self._tick_index = 0
        self._plan_every_n_ticks = 4
        self._last_pair_dialogue: dict[tuple[int, int], tuple[str, str]] = {}

    @staticmethod
    def _is_llm_error(text: str) -> bool:
        return (
            not text
            or text.startswith("[Gemini error")
            or text.startswith("[GenAPI error")
        )

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def last_results(self) -> list:
        return self._last_results

    def set_speed(self, speed: float):
        self._tick_interval = max(2.0, 8.0 / speed)

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
        if agent.point:
            return (agent.point.x, agent.point.y)
        return (50.0, 50.0)

    def _distance(self, pos1: tuple[float, float], pos2: tuple[float, float]) -> float:
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        return math.sqrt(dx * dx + dy * dy)

    def _can_chat(self, id1: int, id2: int) -> bool:
        key = (min(id1, id2), max(id1, id2))
        last = self._chat_cooldowns.get(key, 0)
        return (time.time() - last) > self._chat_cooldown_seconds

    def _mark_chatted(self, id1: int, id2: int):
        key = (min(id1, id2), max(id1, id2))
        self._chat_cooldowns[key] = time.time()

    @staticmethod
    def _normalize_line(text: str) -> str:
        cleaned = (text or "").lower().strip()
        for bad in ["  ", "\n", "\t", "!", "?", ".", ",", ";", ":"]:
            cleaned = cleaned.replace(bad, " ")
        return " ".join(cleaned.split())

    def _is_repetitive_dialogue(self, id1: int, id2: int, dialogue: list[dict]) -> bool:
        if len(dialogue) < 2:
            return False
        key = (min(id1, id2), max(id1, id2))
        current = (
            self._normalize_line(dialogue[0].get("text", "")),
            self._normalize_line(dialogue[1].get("text", "")),
        )
        if len(current[0]) < 6 or len(current[1]) < 6:
            return True
        prev = self._last_pair_dialogue.get(key)
        self._last_pair_dialogue[key] = current
        if not prev:
            return False
        return current == prev

    async def _tick(self):
        db = SessionLocal()
        try:
            self._tick_index += 1
            all_entities = get_agents(db)
            agents = [a for a in all_entities if (getattr(a, 'type', 'agent') or 'agent') == 'agent']
            if not agents:
                self._last_results = []
                return

            results = []

            for agent in agents:
                if self._tick_index % self._plan_every_n_ticks != agent.id % self._plan_every_n_ticks:
                    continue
                plan_result = await asyncio.to_thread(_run_agent_plan, agent.id)
                if plan_result["error"]:
                    results.append({
                        "agent_id": agent.id,
                        "agent_name": agent.name,
                        "error": plan_result["error"],
                    })
                    continue

                plan = plan_result["plan"] or {}
                results.append(plan)

                if plan_result["mood"] is not None:
                    await agents_hub.send_agent_mood_changed(agent.id, plan_result["mood"])

                point_id = plan_result.get("point_id")
                plan_text = plan.get("plan", "") if isinstance(plan, dict) else str(plan)
                if point_id and plan_text:
                    dest_zone = _pick_zone_for_plan(plan_text)
                    if dest_zone:
                        from ..routers.ws.points import manager as points_manager
                        from ..websocket.ws_logic import steer_agent_to_zone
                        steer_agent_to_zone(points_manager, point_id, dest_zone)

            db.expire_all()
            all_entities = get_agents(db)
            agents = [a for a in all_entities if (getattr(a, 'type', 'agent') or 'agent') == 'agent']
            proximity_threshold = 20.0
            did_auto_chat = False

            for i, a1 in enumerate(agents):
                for a2 in agents[i + 1:]:
                    pos1 = self._get_agent_position(a1)
                    pos2 = self._get_agent_position(a2)
                    dist = self._distance(pos1, pos2)

                    if dist < proximity_threshold and self._can_chat(a1.id, a2.id):
                        chat_result = await asyncio.to_thread(_run_auto_chat, a1.id, a2.id)
                        if chat_result.get("error"):
                            results.append({
                                "type": "auto_chat",
                                "error": chat_result["error"],
                            })
                            continue

                        dialogue = chat_result.get("dialogue", [])
                        bad_dialogue = any(self._is_llm_error(m.get("text", "")) for m in dialogue)
                        repetitive = self._is_repetitive_dialogue(a1.id, a2.id, dialogue)
                        if bad_dialogue or repetitive:
                            continue

                        self._mark_chatted(a1.id, a2.id)
                        results.append({"type": "auto_chat", "dialogue": dialogue})
                        messages = [{"speaker": m["speaker"], "text": m["text"]} for m in dialogue]
                        await agents_hub.send_agent_dialogue(
                            a1.id,
                            chat_result.get("name1", a1.name),
                            a2.id,
                            chat_result.get("name2", a2.name),
                            messages,
                        )
                        did_auto_chat = True
                        break
                else:
                    continue
                break

            if not did_auto_chat and len(agents) >= 2:
                a1, a2 = random.sample(agents, 2)
                if self._can_chat(a1.id, a2.id):
                    chat_result = await asyncio.to_thread(_run_auto_chat, a1.id, a2.id)
                    if not chat_result.get("error"):
                        dialogue = chat_result.get("dialogue", [])
                        bad_dialogue = any(self._is_llm_error(m.get("text", "")) for m in dialogue)
                        repetitive = self._is_repetitive_dialogue(a1.id, a2.id, dialogue)
                        if not bad_dialogue and not repetitive:
                            self._mark_chatted(a1.id, a2.id)
                            results.append({"type": "auto_chat_random", "dialogue": dialogue})
                            messages = [{"speaker": m["speaker"], "text": m["text"]} for m in dialogue]
                            await agents_hub.send_agent_dialogue(
                                a1.id,
                                chat_result.get("name1", a1.name),
                                a2.id,
                                chat_result.get("name2", a2.name),
                                messages,
                            )
                    else:
                        results.append({"type": "auto_chat_random", "error": chat_result["error"]})

            self._last_results = results
            await agents_hub.send_agents_update()
        finally:
            db.close()

        if self._tick_index % 2 == 0:
            await asyncio.to_thread(_run_social_drift)


_simulation = SimulationLoop()


def get_simulation() -> SimulationLoop:
    return _simulation
