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
    MESSAGE_PROMPT,
    EVENT_REACTION_PROMPT,
    SUMMARIZE_PROMPT,
    CHAT_INIT_PROMPT,
    get_sympathy_hint,
)
from ..database.models import Agent, Relationship, Memory
from ..database.crud_environment import get_environment
from ..database.crud_relationships import upsert_relationship, get_agent_relationships
from ..database.crud_agents import get_agent, get_agents
from ..database.crud_events import create_event
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

    @staticmethod
    def _is_llm_error(text: str) -> bool:
        if not text:
            return True
        return text.startswith("[GenAPI error") or text.startswith("[Gemini error")

    def _build_heuristic_plan(self, weather: str, events_text: str, relationships_text: str) -> str:
        weather = (weather or "sunny").lower()
        weather_line = {
            "rainy": "Держаться рядом с укрытиями и чаще сверять обстановку с другими.",
            "snowy": "Двигаться аккуратно, выбирать безопасные маршруты и поддерживать связь.",
            "cloudy": "Сохранять рабочий ритм и проверять изменения в окружении.",
            "foggy": "Снизить темп, уточнять детали и избегать резких решений.",
            "stormy": "Сфокусироваться на безопасности и координации команды.",
            "sunny": "Активнее выходить к людям и поддерживать живой диалог.",
        }.get(weather, "Действовать спокойно и по ситуации.")
        social_line = "Поддерживать отношения: быть дружелюбнее к союзникам и осторожнее с конфликтными контактами."
        if "hostile" in events_text.lower() or "removed" in events_text.lower():
            social_line = "Учесть недавние конфликты и бережно перестроить общение с окружающими."
        if "friend" in events_text.lower() or "added" in events_text.lower():
            social_line = "Использовать новые знакомства и укреплять полезные связи."
        if "враг" in relationships_text.lower():
            social_line = "Избегать эскалации с недоброжелателями и искать нейтральный тон там, где это возможно."
        mood_line = "Оставаться в роли, говорить коротко и по делу, реагировать на реальную обстановку."
        return f"{weather_line}\n{social_line}\n{mood_line}"

    @staticmethod
    def _clean_chat_text(text: str) -> str:
        cleaned = (text or "").strip().replace("**", "").replace("*", "")
        if cleaned in {"0", "1", "null", "none", "nan"}:
            return ""
        if ":" in cleaned[:32]:
            left, right = cleaned.split(":", 1)
            if len(left.split()) <= 3:
                cleaned = right.strip()
        lowered = cleaned.lower()
        blocked_markers = (
            "цель:",
            "действие:",
            "настроение:",
            "реакция:",
            "план:",
            "технический шум",
            "нет никакого смысла",
            "странными фразами",
            "как жизнь",
            "всё супер",
            "жарко сегодня",
            "привет, ",
            "привет.",
        )
        if any(marker in lowered for marker in blocked_markers):
            return ""
        if cleaned.startswith("- "):
            cleaned = cleaned[2:].strip()
        if cleaned.endswith(",") or cleaned.endswith(";") or cleaned.endswith(":"):
            return ""
        return cleaned

    @staticmethod
    def _is_incomplete_text(text: str) -> bool:
        if not text:
            return True
        stripped = text.strip().lower()
        dangling = {
            "и", "но", "а", "что", "как", "когда", "если", "чтобы", "ли",
            "в", "на", "под", "над", "у", "с", "к", "по", "от", "до", "для", "из",
            "не", "ну", "тоже", "уже", "ещё", "еще", "тут", "там", "здесь",
        }
        if stripped.endswith(",") or stripped.endswith(";") or stripped.endswith(":"):
            return True
        parts = stripped.replace("!", ".").replace("?", ".").split()
        if not parts:
            return True
        if len(parts) < 4:
            return True
        if parts[-1] in dangling:
            return True
        if stripped.endswith("не.") or stripped.endswith("не!") or stripped.endswith("не?"):
            return True
        return False

    @staticmethod
    def _normalize_for_compare(text: str) -> str:
        cleaned = (text or "").lower().strip()
        for ch in [".", ",", "!", "?", ";", ":", "-", "—", "\n", "\t"]:
            cleaned = cleaned.replace(ch, " ")
        return " ".join(cleaned.split())

    def _voice_guideline(self) -> str:
        name = (self.agent.name or "").lower()
        personality = (self.agent.personality or "").lower()
        if "mira" in name:
            return (
                "Тон Миры: наблюдательная, практичная, иногда ироничная. "
                "Не повторяй банальное приветствие в каждом сообщении, сразу переходи к сути."
            )
        if "dorian" in name:
            return (
                "Тон Дориана: сдержанный, прямой, дисциплинированный. "
                "Можно спорить и не соглашаться, но без пафоса и без шаблонов."
            )
        if "lyra" in name:
            return (
                "Тон Лайры: эмоциональная, живая, общительная. "
                "Избегай штампов, добавляй личное отношение к ситуации."
            )
        if "тактичес" in personality or "координатор" in personality:
            return "Говори коротко и предметно, как координатор действий."
        if "коммуникатор" in personality or "эмпат" in personality:
            return "Говори человечно и тепло, но не шаблонными фразами."
        return "Говори живо, разнообразно и по ситуации, без повторов и штампов."

    def _weather_bias_hint(self, weather: str) -> str:
        name = (self.agent.name or "").lower()
        weather = (weather or "sunny").lower()
        if "mira" in name:
            return {
                "sunny": "Тебе легче думать в ясную погоду.",
                "rainy": "Дождь тебе нравится умеренно: красиво, но отвлекает от анализа.",
                "snowy": "Снег для тебя романтичный, но ты переживаешь за логистику.",
            }.get(weather, "Ты подстраиваешься под погоду рационально.")
        if "dorian" in name:
            return {
                "sunny": "Сильную жару ты не любишь, становишься резче в оценках.",
                "rainy": "Дождь не пугает тебя, но требует дисциплины и порядка.",
                "snowy": "Холод и снег тебе ближе, чувствуешь собранность.",
            }.get(weather, "Ты оцениваешь погоду через безопасность и контроль.")
        if "lyra" in name:
            return {
                "sunny": "В солнце у тебя легкое и разговорчивое настроение.",
                "rainy": "Дождь тебе нравится, ты становишься более глубокой и лиричной.",
                "snowy": "Снег тебя вдохновляет и делает настроение игривее.",
            }.get(weather, "Ты воспринимаешь погоду эмоционально и лично.")
        return "Погода влияет на твой тон, учитывай это в реплике."

    def _fallback_dialogue_line(self, weather: str) -> str:
        name = (self.agent.name or "").lower()
        weather = (weather or "sunny").lower()
        if "mira" in name:
            return {
                "sunny": "Солнце помогает видеть детали, я бы ускорила темп.",
                "rainy": "Под дождем я бы держалась ближе к укрытиям и наблюдала поток людей.",
                "snowy": "Снег красивый, но маршруты надо упростить.",
            }.get(weather, "Нужно быстро оценить обстановку и действовать аккуратно.")
        if "dorian" in name:
            return {
                "sunny": "В такую жару лучше работать короткими шагами и без лишней суеты.",
                "rainy": "Дождь терпимый, но порядок сейчас важнее скорости.",
                "snowy": "Снег норм, держим строй и не теряем темп.",
            }.get(weather, "Держимся плана и без лишних движений.")
        if "lyra" in name:
            return {
                "sunny": "На таком солнце хочется говорить честно и без масок.",
                "rainy": "Мне нравится дождь, он будто сбрасывает лишний шум в голове.",
                "snowy": "Снег бодрит, можно даже чуть легче смотреть на проблемы.",
            }.get(weather, "Погода чувствуется, но главное как мы друг с другом говорим.")
        return "Окей, услышал тебя, давай от этого и оттолкнемся."

    def _generate_message_with_retry(self, prompt_text: str, weather: str, tries: int = 2) -> str:
        candidate = ""
        for _ in range(max(1, tries)):
            raw = self.llm.invoke(prompt_text).content
            if self._is_llm_error(raw):
                continue
            candidate = self._clean_chat_text(raw)
            if not candidate:
                continue
            if self._is_incomplete_text(candidate):
                continue
            return candidate
        return candidate or self._fallback_dialogue_line(weather)

    def _get_relevant_memories(self, query: str, k: int = 5) -> str:
        vec = self.embeddings.embed_query(query)
        memories = self.memory_store.search(self.agent_id, vec, k=k)
        if not memories:
            return "РќРµС‚ РІРѕСЃРїРѕРјРёРЅР°РЅРёР№."
        return "\n".join([f"- {text}" for _, text in memories])

    def _get_relationships_text(self) -> str:
        rels = get_agent_relationships(self.db, self.agent_id)
        if not rels:
            return "РџРѕРєР° РЅРё СЃ РєРµРј РЅРµ Р·РЅР°РєРѕРј."
        parts = []
        for r in rels:
            other_id = r.agent_to_id if r.agent_from_id == self.agent_id else r.agent_from_id
            other = get_agent(self.db, other_id)
            if other:
                level = "РґСЂСѓРі" if r.sympathy > 3 else "РІСЂР°Рі" if r.sympathy < -3 else "Р·РЅР°РєРѕРјС‹Р№"
                parts.append(f"- {other.name}: {level} (СЃРёРјРїР°С‚РёСЏ: {r.sympathy})")
        return "\n".join(parts) if parts else "РџРѕРєР° РЅРё СЃ РєРµРј РЅРµ Р·РЅР°РєРѕРј."

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

        other = get_agent(self.db, other_agent_id)
        other_name = other.name if other else f"Agent {other_agent_id}"
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

        reverse_existing = (
            self.db.query(Relationship)
            .filter(
                Relationship.agent_from_id == other_agent_id,
                Relationship.agent_to_id == self.agent_id,
            )
            .first()
        )
        reverse_current = reverse_existing.sympathy if reverse_existing else 0
        reverse_delta = 1 if change > 0 else -1
        reverse_new = max(-10, min(10, reverse_current + reverse_delta))
        upsert_relationship(
            self.db,
            models.RelationshipCreate(
                agent_from_id=other_agent_id,
                agent_to_id=self.agent_id,
                sympathy=reverse_new,
            ),
        )

        crossed_friend = current < 4 <= new_sympathy
        crossed_enemy = current > -4 >= new_sympathy
        if crossed_friend:
            create_event(
                self.db,
                models.EventCreate(content=f"{self.agent.name} starts trusting {other_name}"),
            )
        if crossed_enemy:
            create_event(
                self.db,
                models.EventCreate(content=f"{self.agent.name} grows hostile toward {other_name}"),
            )
        return change

    def generate_plan(self) -> dict:
        env = get_environment(self.db)
        from ..database.crud_events import get_events
        events = get_events(self.db, limit=5)
        events_text = "\n".join([f"- {e.content}" for e in events]) if events else "РќРёС‡РµРіРѕ РѕСЃРѕР±РµРЅРЅРѕРіРѕ."
        memories_text = self._get_relevant_memories("РїР»Р°РЅ РґРµР№СЃС‚РІРёСЏ С‡С‚Рѕ РґРµР»Р°С‚СЊ")
        relationships_text = self._get_relationships_text()

        response = self._build_heuristic_plan(env.weather, events_text, relationships_text)

        self.agent.current_plan = response
        self.db.commit()
        self._save_memory(f"РЇ СЂРµС€РёР»: {response}", memory_type="plan")
        new_mood = self._update_mood(f"РЎРѕСЃС‚Р°РІРёР» РїР»Р°РЅ: {response}")

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
        past = self._get_relevant_memories(f"СЂР°Р·РіРѕРІРѕСЂ СЃ {from_agent.name}: {message}")
        env = get_environment(self.db)

        system = self._get_system_prompt()
        msg_prompt = MESSAGE_PROMPT.format(
            speaker_name=from_agent.name,
            message=message,
            weather=env.weather,
            sympathy=sympathy,
            sympathy_hint=get_sympathy_hint(sympathy),
            past_conversations=past,
        )
        response = self._generate_message_with_retry(
            system
            + "\n\n"
            + msg_prompt
            + "\n\n"
            + self._voice_guideline()
            + "\n"
            + self._weather_bias_hint(env.weather)
            + "\nНе начинай ответ с 'Привет' без причины. Не копируй типовые фразы про жару/снег.",
            env.weather,
            tries=3,
        )
        if self._is_incomplete_text(response):
            response = self._fallback_dialogue_line(env.weather)
        if self._normalize_for_compare(response) == self._normalize_for_compare(message):
            response = self._fallback_dialogue_line(env.weather)

        self._save_memory(f"{from_agent.name} СЃРєР°Р·Р°Р» РјРЅРµ: '{message}'. РЇ РѕС‚РІРµС‚РёР»: '{response}'")
        other_event = f"РЇ СЃРєР°Р·Р°Р» {self.agent.name}: '{message}'. {self.agent.name} РѕС‚РІРµС‚РёР»: '{response}'"
        persist_agent_memory(self.db, from_agent_id, other_event)

        sympathy_change = self._update_sympathy(from_agent_id, message)
        new_mood = self._update_mood(f"{from_agent.name} СЃРєР°Р·Р°Р»: {message}")

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
        if self._is_llm_error(response):
            response = "Я это заметил и буду действовать осторожно."

        self._save_memory(f"РџСЂРѕРёР·РѕС€Р»Рѕ: {event_text}. РњРѕСЏ СЂРµР°РєС†РёСЏ: {response}")
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

        topic_context = f"РўРµРјР°: {topic}" if topic else "РџСЂРѕСЃС‚Рѕ С…РѕС‡РµС€СЊ РїРѕРѕР±С‰Р°С‚СЊСЃСЏ."
        env = get_environment(self.db)
        rel = (
            self.db.query(Relationship)
            .filter(
                Relationship.agent_from_id == self.agent_id,
                Relationship.agent_to_id == target_agent_id,
            )
            .first()
        )
        sympathy = rel.sympathy if rel else 0
        system1 = self._get_system_prompt()
        init_prompt = CHAT_INIT_PROMPT.format(
            target_name=target.name,
            topic_context=topic_context,
            weather=env.weather,
            sympathy=sympathy,
            sympathy_hint=get_sympathy_hint(sympathy),
        )
        first_message = self._generate_message_with_retry(
            system1
            + "\n\n"
            + init_prompt
            + "\n\n"
            + self._voice_guideline()
            + "\n"
            + self._weather_bias_hint(env.weather)
            + "\nНачни реплику не шаблонно. Не пиши общие фразы уровня 'как жизнь?' или 'жарко сегодня'.",
            env.weather,
            tries=3,
        )
        if self._is_incomplete_text(first_message):
            first_message = self._fallback_dialogue_line(env.weather)

        target_brain = AgentBrain(target_agent_id, self.db)
        response_data = target_brain.respond_to_message(self.agent_id, first_message)
        if self._normalize_for_compare(response_data.get("response", "")) == self._normalize_for_compare(first_message):
            response_data["response"] = target_brain._fallback_dialogue_line(env.weather)

        self._save_memory(
            f"РЇ РЅР°С‡Р°Р» СЂР°Р·РіРѕРІРѕСЂ СЃ {target.name}: '{first_message}'. "
            f"{target.name} РѕС‚РІРµС‚РёР»: '{response_data['response']}'"
        )
        self._update_sympathy(target_agent_id, response_data["response"])
        self._update_mood(f"РџРѕРіРѕРІРѕСЂРёР» СЃ {target.name}")
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
            return {"summary": "РЎР»РёС€РєРѕРј РјР°Р»Рѕ РІРѕСЃРїРѕРјРёРЅР°РЅРёР№.", "memories_count": count}

        memories_text = "\n".join([f"- {m}" for m in all_memories[:30]])
        prompt = SUMMARIZE_PROMPT.format(name=self.agent.name, memories=memories_text)
        summary = self.llm.invoke(prompt).content

        if count > 50:
            self.memory_store.delete_old_episodes(self.agent_id, keep_last=10)
            vec = self.embeddings.embed_query(summary)
            self.memory_store.add_memory(self.agent_id, f"[РЎРЈРњРњРђР РР™] {summary}", vec, "summary")

        return {"summary": summary, "memories_count": count}


def summarize_memories(memories: list) -> str:
    if not memories:
        return "РќРµС‚ РІРѕСЃРїРѕРјРёРЅР°РЅРёР№."
    return "\n".join([str(m) for m in memories[:10]])

