import json

from .config import get_llm
from .prompts import EMOTION_ANALYSIS_PROMPT


DEFAULT_MOOD = {"joy": 20, "anger": 5, "sadness": 5, "fear": 5, "neutral": 65}


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
        "joy": "весёлое, радостное",
        "anger": "злое, раздражённое",
        "sadness": "грустное, печальное",
        "fear": "тревожное, напуганное",
        "neutral": "спокойное, нейтральное",
    }
    return descriptions.get(dom, "нейтральное")


def mood_to_style(mood: dict) -> str:
    dom = dominant_emotion(mood)
    styles = {
        "joy": "Ты говоришь весело, шутишь, используешь восклицания. Ты настроен позитивно.",
        "anger": "Ты говоришь резко, грубовато, раздражённо. Можешь огрызаться.",
        "sadness": "Ты говоришь тихо, кратко, с грустью. Можешь вздыхать.",
        "fear": "Ты говоришь неуверенно, тревожно, озираешься. Можешь заикаться.",
        "neutral": "Ты говоришь спокойно, ровно, без особых эмоций.",
    }
    return styles.get(dom, styles["neutral"])


def analyze_emotion_change(personality: str, current_mood: dict, event: str) -> dict:
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
            total = sum(new_mood.values())
            if total > 0:
                new_mood = {k: round(v * 100 / total) for k, v in new_mood.items()}
                return new_mood
    except Exception:
        pass
    return current_mood.copy()


def analyze_sympathy_change(message: str) -> int:
    llm = get_llm()
    from .prompts import SYMPATHY_ANALYSIS_PROMPT
    prompt = SYMPATHY_ANALYSIS_PROMPT.format(message=message)
    try:
        response = llm.invoke(prompt).content.strip()
        val = int(response)
        return max(-3, min(3, val))
    except Exception:
        return 0
