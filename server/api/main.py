from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from .database import init_db


init_db()

from .routers.api import (
    agents,
    memory,
    mood,
    events,
    relationships,
    environment,
    llm_interaction,
)
from .routers.ws import points_router, agents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    #начало жизни приложения
    init_db()
    yield


app = FastAPI(title="VWorld Multi-Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# регистрация роутеров
app.include_router(agents.router)
app.include_router(memory.router)
app.include_router(mood.router)
app.include_router(events.router)
app.include_router(relationships.router)
app.include_router(environment.router)
app.include_router(llm_interaction.router)

# WebSocket роутеры
app.include_router(points_router)
app.include_router(agents_router)

# Статический роут для тестовой страницы
@app.get("/test")
async def test_page():
    """Возвращает тестовую HTML страницу"""
    file_path = Path(__file__).parent / "test_front.html"
    return FileResponse(file_path)
