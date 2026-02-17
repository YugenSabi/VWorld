import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_TIMEOUT_SECONDS = float(os.environ.get("GEMINI_TIMEOUT_SECONDS", "20"))
GEMINI_MAX_RETRIES = int(os.environ.get("GEMINI_MAX_RETRIES", "3"))
GEMINI_RETRY_BASE_SECONDS = float(os.environ.get("GEMINI_RETRY_BASE_SECONDS", "2"))
GEMINI_MAX_PROMPT_CHARS = int(os.environ.get("GEMINI_MAX_PROMPT_CHARS", "12000"))

_embedding_instance = None


class GeminiLLM:
    def __init__(self, temperature: float = 0.7):
        self.temperature = temperature
        self.api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
            f"?key={GEMINI_API_KEY}"
        )
        self._session = requests.Session()

    def invoke(self, prompt: str, max_retries: int | None = None) -> "LLMResponse":
        if not GEMINI_API_KEY:
            return LLMResponse(content="[Gemini error: GEMINI_API_KEY is not set]")

        retries = GEMINI_MAX_RETRIES if max_retries is None else max_retries
        safe_prompt = (prompt or "")[:GEMINI_MAX_PROMPT_CHARS]

        payload = {
            "contents": [{"parts": [{"text": safe_prompt}]}],
            "generationConfig": {"temperature": self.temperature},
        }

        for attempt in range(retries):
            try:
                response = self._session.post(self.api_url, json=payload, timeout=GEMINI_TIMEOUT_SECONDS)

                if response.status_code == 429:
                    wait = min((2 ** attempt) * GEMINI_RETRY_BASE_SECONDS, 20)
                    time.sleep(wait)
                    continue

                if response.status_code >= 500:
                    wait = min((attempt + 1) * GEMINI_RETRY_BASE_SECONDS, 10)
                    time.sleep(wait)
                    continue

                data = response.json()
                if "error" in data:
                    msg = data["error"].get("message", "unknown")
                    return LLMResponse(content=f"[Gemini error: {msg}]")

                candidates = data.get("candidates") or []
                if not candidates:
                    return LLMResponse(content="[Gemini error: empty response]")

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    return LLMResponse(content="[Gemini error: no parts in response]")

                content = (parts[0].get("text") or "").strip()
                if not content:
                    return LLMResponse(content="[Gemini error: blank content]")

                return LLMResponse(content=content)

            except requests.Timeout:
                if attempt < retries - 1:
                    time.sleep(min((attempt + 1) * GEMINI_RETRY_BASE_SECONDS, 10))
                    continue
                return LLMResponse(content="[Gemini error: timeout]")
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(min((attempt + 1) * GEMINI_RETRY_BASE_SECONDS, 10))
                    continue
                return LLMResponse(content=f"[Gemini error: {e}]")

        return LLMResponse(content="[Gemini error: max retries exceeded]")


class LLMResponse:
    def __init__(self, content: str):
        self.content = content


_llm_instance = None


def get_llm() -> GeminiLLM:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GeminiLLM(temperature=0.7)
    return _llm_instance


class EmbeddingModel:
    def __init__(self):
        self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(text).tolist()


def get_embedding_model() -> EmbeddingModel:
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = EmbeddingModel()
    return _embedding_instance
