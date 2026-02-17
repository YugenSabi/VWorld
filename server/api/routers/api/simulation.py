from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ...database import get_db
from ...llm.simulation import get_simulation

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SpeedRequest(BaseModel):
    speed: float = Field(ge=0.1, le=10.0, default=1.0)


@router.post("/start")
async def start_simulation():
    """Запускает автономный game loop."""
    sim = get_simulation()
    if sim.is_running:
        return {"status": "already_running"}
    await sim.start()
    return {"status": "started"}


@router.post("/stop")
async def stop_simulation():
    """Останавливает game loop."""
    sim = get_simulation()
    if not sim.is_running:
        return {"status": "not_running"}
    await sim.stop()
    return {"status": "stopped"}


@router.get("/status")
def simulation_status():
    """Возвращает статус и последние результаты симуляции."""
    sim = get_simulation()
    return {
        "running": sim.is_running,
        "last_results": sim.last_results,
    }


@router.post("/speed")
def set_simulation_speed(request: SpeedRequest):
    """Устанавливает скорость симуляции."""
    sim = get_simulation()
    sim.set_speed(request.speed)
    return {"speed": request.speed}
