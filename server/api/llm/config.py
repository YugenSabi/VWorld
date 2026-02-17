import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

_embedding_instance = None


class GeminiLLM:

    def __init__(self, temperature: float = 0.7):
        self.temperature = temperature
        self.api_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
            f"?key={GEMINI_API_KEY}"
        )

    def invoke(self, prompt: str) -> "LLMResponse":
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": self.temperature},
        }
        try:
            response = requests.post(self.api_url, json=payload, timeout=30)
            data = response.json()
            content = data["candidates"][0]["content"]["parts"][0]["text"]
            return LLMResponse(content=content)
        except Exception as e:
            return LLMResponse(content=f"[Gemini error: {e}]")


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
