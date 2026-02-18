from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...database import get_db
from ...database.crud_environment import get_or_create_environment, update_time_speed as crud_update_time_speed
from ...llm.simulation import get_simulation

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SpeedRequest(BaseModel):
    speed: float = Field(ge=0.1, le=10.0, default=1.0)


@router.post("/start")
async def start_simulation(db: Session = Depends(get_db)):
    sim = get_simulation()
    env = get_or_create_environment(db)
    sim.set_speed(env.time_speed)
    if sim.is_running:
        return {"status": "already_running", "speed": env.time_speed}
    await sim.start()
    return {"status": "started", "speed": env.time_speed}


@router.post("/stop")
async def stop_simulation():
    sim = get_simulation()
    if not sim.is_running:
        return {"status": "not_running"}
    await sim.stop()
    return {"status": "stopped"}


@router.get("/status")
def simulation_status():
    sim = get_simulation()
    return {
        "running": sim.is_running,
        "last_results": sim.last_results,
    }


@router.post("/speed")
def set_simulation_speed(request: SpeedRequest, db: Session = Depends(get_db)):
    env = crud_update_time_speed(db, request.speed)
    sim = get_simulation()
    sim.set_speed(env.time_speed)
    return {"speed": env.time_speed, "running": sim.is_running}
