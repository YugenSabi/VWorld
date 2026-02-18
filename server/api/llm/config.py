import hashlib
import os
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

GENAPI_API_KEY = os.environ.get("GENAPI_API_KEY", "")
GENAPI_MODEL = os.environ.get("GENAPI_MODEL", "gemini-3-flash")
GENAPI_BASE_URL = os.environ.get("GENAPI_BASE_URL", "https://api.gen-api.ru/api/v1")

LLM_TIMEOUT_SECONDS = float(os.environ.get("LLM_TIMEOUT_SECONDS", "25"))
LLM_MAX_RETRIES = int(os.environ.get("LLM_MAX_RETRIES", "2"))
LLM_RETRY_BASE_SECONDS = float(os.environ.get("LLM_RETRY_BASE_SECONDS", "2"))
LLM_MAX_PROMPT_CHARS = int(os.environ.get("LLM_MAX_PROMPT_CHARS", "12000"))
LLM_TEMPERATURE = float(os.environ.get("LLM_TEMPERATURE", "0.7"))

_embedding_instance = None
_llm_instance = None


class LLMResponse:
    def __init__(self, content: str):
        self.content = content


def _extract_text(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                extracted = _extract_text(item)
                if extracted:
                    parts.append(extracted)
        return " ".join(p.strip() for p in parts if p.strip()).strip()
    if isinstance(value, dict):
        for key in ("text", "content", "message", "output", "result", "response", "choices"):
            if key in value:
                extracted = _extract_text(value.get(key))
                if extracted:
                    return extracted
        for nested in value.values():
            extracted = _extract_text(nested)
            if extracted:
                return extracted
    return ""


def _pick_best_text(*candidates: Any) -> str:
    texts = []
    for candidate in candidates:
        text = _extract_text(candidate)
        if text:
            texts.append(text.strip())
    if not texts:
        return ""
    texts.sort(key=len, reverse=True)
    return texts[0]


class GenApiLLM:
    def __init__(self, temperature: float = 0.7):
        self.temperature = temperature
        self._session = requests.Session()

    @property
    def api_url(self) -> str:
        base = GENAPI_BASE_URL.rstrip("/")
        model = GENAPI_MODEL.strip()
        return f"{base}/networks/{model}"

    def invoke(self, prompt: str, max_retries: int | None = None) -> LLMResponse:
        if not GENAPI_API_KEY:
            return LLMResponse(content="[GenAPI error: GENAPI_API_KEY is not set]")

        retries = LLM_MAX_RETRIES if max_retries is None else max_retries
        safe_prompt = (prompt or "")[:LLM_MAX_PROMPT_CHARS]
        payload = {
            "is_sync": True,
            "model": GENAPI_MODEL,
            "messages": [{"role": "user", "content": safe_prompt}],
            "temperature": self.temperature,
            "max_tokens": 700,
        }
        headers = {
            "Authorization": f"Bearer {GENAPI_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        for attempt in range(retries):
            try:
                response = self._session.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                    timeout=LLM_TIMEOUT_SECONDS,
                )
                if response.status_code in (429, 500, 502, 503, 504):
                    if attempt < retries - 1:
                        time.sleep(min((attempt + 1) * LLM_RETRY_BASE_SECONDS, 12))
                        continue

                data = response.json()
                if response.status_code >= 400:
                    if "errors_validation" in data:
                        return LLMResponse(content=f"[GenAPI error: validation {data['errors_validation']}]")
                    if "error" in data:
                        return LLMResponse(content=f"[GenAPI error: {data.get('error')}]")
                    return LLMResponse(content=f"[GenAPI error: HTTP {response.status_code}]")
                if "error" in data:
                    if data.get("error") is True and "errors_validation" in data:
                        return LLMResponse(content=f"[GenAPI error: validation {data['errors_validation']}]")
                    return LLMResponse(content=f"[GenAPI error: {data['error']}]")

                output = data.get("output")
                content = _pick_best_text(output, data.get("response"), data.get("choices"))
                if not content:
                    status_value = str(data.get("status", "unknown"))
                    return LLMResponse(content=f"[GenAPI error: empty output, status={status_value}]")

                return LLMResponse(content=content)
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(min((attempt + 1) * LLM_RETRY_BASE_SECONDS, 12))
                    continue
                return LLMResponse(content=f"[GenAPI error: {e}]")

        return LLMResponse(content="[GenAPI error: max retries exceeded]")


def get_llm():
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GenApiLLM(temperature=LLM_TEMPERATURE)
    return _llm_instance


class EmbeddingModel:
    def __init__(self):
        self.model: Any | None = None
        self._fallback_dim = 128
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception:
            self.model = None

    def embed_query(self, text: str) -> list[float]:
        if self.model is not None:
            return self.model.encode(text).tolist()
        return self._fallback_embed(text)

    def _fallback_embed(self, text: str) -> list[float]:
        vec = [0.0] * self._fallback_dim
        tokens = (text or "").lower().split()
        if not tokens:
            return vec

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:2], "big") % self._fallback_dim
            sign = 1.0 if (digest[2] % 2 == 0) else -1.0
            vec[idx] += sign

        norm = sum(v * v for v in vec) ** 0.5
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec


def get_embedding_model() -> EmbeddingModel:
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = EmbeddingModel()
    return _embedding_instance
