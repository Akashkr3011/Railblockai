"""
RAILBLOCK AI — Simulation API
"""
from fastapi import APIRouter, HTTPException, Depends
from app.core.dependencies import get_current_user, require_traffic_controller
from typing import List, Dict, Any
from app.services.simulation.engine import sim_engine
from app.services.simulation.scenarios import DEMO_SCENARIOS

router = APIRouter()

@router.get("/scenarios", response_model=List[Dict[str, Any]], summary="List available demo scenarios")
async def list_scenarios(current_user=Depends(get_current_user)):
    return [{"id": s.id, "name": s.name, "description": s.description} for s in DEMO_SCENARIOS]

@router.get("/state", summary="Get current simulation engine state")
async def get_state(current_user=Depends(get_current_user)):
    return sim_engine.get_state()

@router.post("/{scenario_id}/load", summary="Load a scenario")
async def load_scenario(scenario_id: str, current_user=Depends(require_traffic_controller)):
    try:
        sim_engine.load_scenario(scenario_id)
        return sim_engine.get_state()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/play", summary="Play/Resume simulation")
async def play_simulation(current_user=Depends(require_traffic_controller)):
    try:
        sim_engine.play()
        return sim_engine.get_state()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/pause", summary="Pause simulation")
async def pause_simulation(current_user=Depends(require_traffic_controller)):
    sim_engine.pause()
    return sim_engine.get_state()

@router.post("/step", summary="Step to next event")
async def step_simulation(current_user=Depends(require_traffic_controller)):
    sim_engine.step()
    return sim_engine.get_state()

@router.post("/reset", summary="Reset current scenario")
async def reset_simulation(current_user=Depends(require_traffic_controller)):
    sim_engine.reset()
    return sim_engine.get_state()

@router.post("/speed", summary="Set simulation speed")
async def set_speed(speed: float, current_user=Depends(require_traffic_controller)):
    try:
        sim_engine.set_speed(speed)
        return sim_engine.get_state()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
