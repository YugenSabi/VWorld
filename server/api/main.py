import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .database import init_db
from .database.database import SessionLocal
from .database.crud_environment import get_environment
from .llm.simulation import get_simulation
from .websocket.ws_logic import points_update_task


init_db()

from .routers.api import (
    agents,
    memory,
    mood,
    events,
    relationships,
    environment,
    llm_interaction,
    simulation,
)
from .routers.ws import points_router, agents_router
from .routers.ws.points import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    points_task = asyncio.create_task(points_update_task(manager))

    sim = get_simulation()
    db = SessionLocal()
    try:
        env = get_environment(db)
        sim.set_speed(env.time_speed)
    finally:
        db.close()

    auto_start = os.getenv("VWORLD_AUTO_START_SIMULATION", "1") not in {"0", "false", "False"}
    if auto_start and not sim.is_running:
        await sim.start()

    yield

    points_task.cancel()
    try:
        await points_task
    except asyncio.CancelledError:
        pass

    if sim.is_running:
        await sim.stop()


app = FastAPI(title="VWorld Multi-Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(memory.router)
app.include_router(mood.router)
app.include_router(events.router)
app.include_router(relationships.router)
app.include_router(environment.router)
app.include_router(llm_interaction.router)
app.include_router(simulation.router)

app.include_router(points_router)
app.include_router(agents_router)


@app.get("/test")
async def test_page():
    file_path = Path(__file__).parent / "test_front.html"
    return FileResponse(file_path)
