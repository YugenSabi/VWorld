from sqlalchemy.orm import Session

from .config import get_llm, get_embedding_model
from .memory_store import get_memory_store
from .emotions import (
    parse_mood,
    mood_to_json,
    mood_description,
    mood_to_style,
    analyze_emotion_change,
    analyze_sympathy_change,
)
from .prompts import (
    SYSTEM_PROMPT,
    PLAN_PROMPT,
    MESSAGE_PROMPT,
    EVENT_REACTION_PROMPT,
    SUMMARIZE_PROMPT,
    CHAT_INIT_PROMPT,
)
from ..database.models import Agent, Relationship, Memory
from ..database.crud_environment import get_environment
from ..database.crud_relationships import upsert_relationship, get_agent_relationships
from ..database.crud_agents import get_agent, get_agents
from .. import models


def persist_agent_memory(db: Session, agent_id: int, text: str, memory_type: str = "episode") -> Memory:
    embeddings = get_embedding_model()
    memory_store = get_memory_store()
    vec = embeddings.embed_query(text)
    memory_store.add_memory(agent_id, text, vec, memory_type)
    db_memory = Memory(agent_id=agent_id, content=text)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory


class AgentBrain:
    def __init__(self, agent_id: int, db: Session):
        self.agent_id = agent_id
        self.db = db
        self.llm = get_llm()
        self.embeddings = get_embedding_model()
        self.memory_store = get_memory_store()
        self.agent = get_agent(db, agent_id)

    def _get_system_prompt(self) -> str:
        mood = parse_mood(self.agent.mood)
        return SYSTEM_PROMPT.format(
            name=self.agent.name,
            personality=self.agent.personality,
            mood_description=mood_description(mood),
            mood_style=mood_to_style(mood),
        )

    def _get_relevant_memories(self, query: str, k: int = 5) -> str:
        vec = self.embeddings.embed_query(query)
        memories = self.memory_store.search(self.agent_id, vec, k=k)
        if not memories:
            return "Нет воспоминаний."
        return "\n".join([f"- {text}" for _, text in memories])

    def _get_relationships_text(self) -> str:
        rels = get_agent_relationships(self.db, self.agent_id)
        if not rels:
            return "Пока ни с кем не знаком."
        parts = []
        for r in rels:
            other_id = r.agent_to_id if r.agent_from_id == self.agent_id else r.agent_from_id
            other = get_agent(self.db, other_id)
            if other:
                level = "друг" if r.sympathy > 3 else "враг" if r.sympathy < -3 else "знакомый"
                parts.append(f"- {other.name}: {level} (симпатия: {r.sympathy})")
        return "\n".join(parts) if parts else "Пока ни с кем не знаком."

    def _save_memory(self, text: str, memory_type: str = "episode"):
        persist_agent_memory(self.db, self.agent_id, text, memory_type)

    def _update_mood(self, event: str) -> dict:
        mood = parse_mood(self.agent.mood)
        new_mood = analyze_emotion_change(self.agent.personality, mood, event)
        self.agent.mood = mood_to_json(new_mood)
        self.db.commit()
        self.db.refresh(self.agent)
        return new_mood

    def _update_sympathy(self, other_agent_id: int, message: str) -> int:
        change = analyze_sympathy_change(message)
        if change == 0:
            return 0
        existing = (
            self.db.query(Relationship)
            .filter(
                Relationship.agent_from_id == self.agent_id,
                Relationship.agent_to_id == other_agent_id,
            )
            .first()
        )
        current = existing.sympathy if existing else 0
        new_sympathy = max(-10, min(10, current + change))
        upsert_relationship(
            self.db,
            models.RelationshipCreate(
                agent_from_id=self.agent_id,
                agent_to_id=other_agent_id,
                sympathy=new_sympathy,
            ),
        )
        return change

    def generate_plan(self) -> dict:
        env = get_environment(self.db)
        from ..database.crud_events import get_events
        events = get_events(self.db, limit=5)
        events_text = "\n".join([f"- {e.content}" for e in events]) if events else "Ничего особенного."
        memories_text = self._get_relevant_memories("план действия что делать")
        relationships_text = self._get_relationships_text()

        system = self._get_system_prompt()
        plan_prompt = PLAN_PROMPT.format(
            weather=env.weather,
            events=events_text,
            memories=memories_text,
            relationships=relationships_text,
        )
        response = self.llm.invoke(system + "\n\n" + plan_prompt).content

        self.agent.current_plan = response
        self.db.commit()
        self._save_memory(f"Я решил: {response}", memory_type="plan")
        new_mood = self._update_mood(f"Составил план: {response}")

        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent.name,
            "plan": response,
            "mood": new_mood,
        }

    def respond_to_message(self, from_agent_id: int, message: str) -> dict:
        from_agent = get_agent(self.db, from_agent_id)
        if not from_agent:
            return {"error": "Agent not found"}

        rel = (
            self.db.query(Relationship)
            .filter(
                Relationship.agent_from_id == self.agent_id,
                Relationship.agent_to_id == from_agent_id,
            )
            .first()
        )
        sympathy = rel.sympathy if rel else 0
        past = self._get_relevant_memories(f"разговор с {from_agent.name}: {message}")

        system = self._get_system_prompt()
        msg_prompt = MESSAGE_PROMPT.format(
            speaker_name=from_agent.name,
            message=message,
            sympathy=sympathy,
            past_conversations=past,
        )
        response = self.llm.invoke(system + "\n\n" + msg_prompt).content

        # Память обоим
        self._save_memory(f"{from_agent.name} сказал мне: '{message}'. Я ответил: '{response}'")
        other_event = f"Я сказал {self.agent.name}: '{message}'. {self.agent.name} ответил: '{response}'"
        persist_agent_memory(self.db, from_agent_id, other_event)

        sympathy_change = self._update_sympathy(from_agent_id, message)
        new_mood = self._update_mood(f"{from_agent.name} сказал: {message}")

        return {
            "from_agent_id": from_agent_id,
            "from_agent_name": from_agent.name,
            "to_agent_id": self.agent_id,
            "to_agent_name": self.agent.name,
            "message": message,
            "response": response,
            "mood": new_mood,
            "sympathy_change": sympathy_change,
        }

    def react_to_event(self, event_text: str) -> dict:
        memories_text = self._get_relevant_memories(event_text)
        system = self._get_system_prompt()
        event_prompt = EVENT_REACTION_PROMPT.format(
            event=event_text,
            memories=memories_text,
        )
        response = self.llm.invoke(system + "\n\n" + event_prompt).content

        self._save_memory(f"Произошло: {event_text}. Моя реакция: {response}")
        new_mood = self._update_mood(event_text)

        return {
            "agent_id": self.agent_id,
            "agent_name": self.agent.name,
            "event": event_text,
            "reaction": response,
            "mood": new_mood,
        }

    def start_chat(self, target_agent_id: int, topic: str = "") -> dict:
        target = get_agent(self.db, target_agent_id)
        if not target:
            return {"error": "Target agent not found"}

        topic_context = f"Тема: {topic}" if topic else "Просто хочешь пообщаться."
        system1 = self._get_system_prompt()
        init_prompt = CHAT_INIT_PROMPT.format(
            target_name=target.name,
            topic_context=topic_context,
        )
        first_message = self.llm.invoke(system1 + "\n\n" + init_prompt).content

        target_brain = AgentBrain(target_agent_id, self.db)
        response_data = target_brain.respond_to_message(self.agent_id, first_message)

        self._save_memory(
            f"Я начал разговор с {target.name}: '{first_message}'. "
            f"{target.name} ответил: '{response_data['response']}'"
        )
        self._update_sympathy(target_agent_id, response_data["response"])
        self._update_mood(f"Поговорил с {target.name}")
        self.db.refresh(target)

        return {
            "dialogue": [
                {"speaker": self.agent.name, "speaker_id": self.agent_id, "text": first_message},
                {"speaker": target.name, "speaker_id": target_agent_id, "text": response_data["response"]},
            ],
            "initiator_mood": parse_mood(self.agent.mood),
            "responder_mood": parse_mood(target.mood),
        }

    def summarize_memories(self) -> dict:
        all_memories = self.memory_store.get_all_memories(self.agent_id)
        count = len(all_memories)
        if count < 5:
            return {"summary": "Слишком мало воспоминаний.", "memories_count": count}

        memories_text = "\n".join([f"- {m}" for m in all_memories[:30]])
        prompt = SUMMARIZE_PROMPT.format(name=self.agent.name, memories=memories_text)
        summary = self.llm.invoke(prompt).content

        if count > 50:
            self.memory_store.delete_old_episodes(self.agent_id, keep_last=10)
            vec = self.embeddings.embed_query(summary)
            self.memory_store.add_memory(self.agent_id, f"[СУММАРИЙ] {summary}", vec, "summary")

        return {"summary": summary, "memories_count": count}


# Legacy compatibility
def summarize_memories(memories: list) -> str:
    if not memories:
        return "Нет воспоминаний."
    return "\n".join([str(m) for m in memories[:10]])

