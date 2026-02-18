import json
import os

from .config import get_llm
from .prompts import EMOTION_ANALYSIS_PROMPT, SYMPATHY_ANALYSIS_PROMPT


DEFAULT_MOOD = {"joy": 20, "anger": 5, "sadness": 5, "fear": 5, "neutral": 65}
USE_LLM_EMOTION_ANALYSIS = os.environ.get("VWORLD_LLM_EMOTION_ANALYSIS", "0") in {"1", "true", "True"}
USE_LLM_SYMPATHY_ANALYSIS = os.environ.get("VWORLD_LLM_SYMPATHY_ANALYSIS", "0") in {"1", "true", "True"}


def parse_mood(mood_str: str) -> dict:
    if not mood_str or mood_str == "neutral":
        return DEFAULT_MOOD.copy()
    try:
        mood = json.loads(mood_str)
        if isinstance(mood, dict) and all(k in mood for k in DEFAULT_MOOD):
            return mood
    except (json.JSONDecodeError, TypeError):
        pass
    return DEFAULT_MOOD.copy()


def mood_to_json(mood: dict) -> str:
    return json.dumps(mood, ensure_ascii=False)


def dominant_emotion(mood: dict) -> str:
    return max(mood, key=mood.get)


def mood_description(mood: dict) -> str:
    dom = dominant_emotion(mood)
    descriptions = {
        "joy": "веселое, радостное",
        "anger": "злое, раздраженное",
        "sadness": "грустное, печальное",
        "fear": "тревожное, напряженное",
        "neutral": "спокойное, нейтральное",
    }
    return descriptions.get(dom, "нейтральное")


def mood_to_style(mood: dict) -> str:
    dom = dominant_emotion(mood)
    styles = {
        "joy": "Говоришь бодро, с теплой энергией, иногда с легкой шуткой.",
        "anger": "Говоришь резко и сухо, склонен к жестким формулировкам.",
        "sadness": "Говоришь тише и короче, больше осторожности и сомнений.",
        "fear": "Говоришь настороженно, с акцентом на риски и безопасность.",
        "neutral": "Говоришь спокойно, по делу, без лишних эмоций.",
    }
    return styles.get(dom, styles["neutral"])


def _normalize_mood(mood: dict) -> dict:
    total = sum(max(0, int(v)) for v in mood.values())
    if total <= 0:
        return DEFAULT_MOOD.copy()
    normalized = {k: max(0, int(v)) for k, v in mood.items()}
    total = sum(normalized.values())
    normalized = {k: round(v * 100 / total) for k, v in normalized.items()}
    diff = 100 - sum(normalized.values())
    normalized["neutral"] = max(0, normalized.get("neutral", 0) + diff)
    return normalized


def _heuristic_emotion_change(current_mood: dict, event: str) -> dict:
    mood = parse_mood(json.dumps(current_mood, ensure_ascii=False))
    text = (event or "").lower()

    pos = ("друж", "успех", "помог", "солн", "улучш", "довер", "познаком")
    neg = ("конфликт", "угроз", "шторм", "ошибка", "потер", "враг", "удален")
    anx = ("туман", "опас", "риск", "неизвест")

    if any(w in text for w in pos):
        mood["joy"] += 8
        mood["neutral"] -= 6
    if any(w in text for w in neg):
        mood["anger"] += 6
        mood["sadness"] += 4
        mood["neutral"] -= 6
    if any(w in text for w in anx):
        mood["fear"] += 7
        mood["neutral"] -= 5

    for key in ("joy", "anger", "sadness", "fear", "neutral"):
        mood[key] = max(0, mood.get(key, 0))

    return _normalize_mood(mood)


def analyze_emotion_change(personality: str, current_mood: dict, event: str) -> dict:
    if not USE_LLM_EMOTION_ANALYSIS:
        return _heuristic_emotion_change(current_mood, event)

    llm = get_llm()
    prompt = EMOTION_ANALYSIS_PROMPT.format(
        personality=personality,
        current_mood=json.dumps(current_mood, ensure_ascii=False),
        event=event,
    )
    try:
        response = llm.invoke(prompt).content.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1] if "\n" in response else response
            response = response.rsplit("```", 1)[0]
        new_mood = json.loads(response)
        if isinstance(new_mood, dict) and all(k in new_mood for k in DEFAULT_MOOD):
            return _normalize_mood(new_mood)
    except Exception:
        pass
    return _heuristic_emotion_change(current_mood, event)


def _heuristic_sympathy_change(message: str) -> int:
    text = (message or "").lower()
    positive = ("спасибо", "отлично", "класс", "друж", "поддерж", "давай")
    negative = ("плохо", "ненавиж", "уходи", "ошиб", "бред", "злю")

    pos_score = sum(1 for w in positive if w in text)
    neg_score = sum(1 for w in negative if w in text)
    score = pos_score - neg_score

    if score >= 2:
        return 2
    if score == 1:
        return 1
    if score == 0:
        return 0
    if score == -1:
        return -1
    return -2


def analyze_sympathy_change(message: str) -> int:
    if not USE_LLM_SYMPATHY_ANALYSIS:
        return _heuristic_sympathy_change(message)

    llm = get_llm()
    prompt = SYMPATHY_ANALYSIS_PROMPT.format(message=message)
    try:
        response = llm.invoke(prompt).content.strip()
        val = int(response)
        return max(-3, min(3, val))
    except Exception:
        return _heuristic_sympathy_change(message)
