import pytest
from app.services.simulation.engine import sim_engine
from app.services.simulation.scenarios import DEMO_SCENARIOS
from unittest.mock import patch, AsyncMock
import asyncio

@pytest.fixture(autouse=True)
async def reset_engine():
    with patch.object(sim_engine, '_broadcast_state'):
        sim_engine.reset()
        yield
        sim_engine.reset()

@pytest.mark.asyncio
async def test_load_scenario():
    scenario = sim_engine.load_scenario("demo_train_delay")
    assert scenario.name == "Train Delay Affecting Block"
    state = sim_engine.get_state()
    assert state["scenario_id"] == "demo_train_delay"
    assert state["events_remaining"] == 3

@pytest.mark.asyncio
async def test_engine_step():
    sim_engine.load_scenario("demo_resource_shortage")
    
    with patch("app.services.events_manager.event_manager.broadcast", new_callable=AsyncMock) as mock_broadcast:
        sim_engine.step()
        await asyncio.sleep(0.1) # allow async task to fire
        
        # Depending on engine, it might just be 1 event broadcast per step or state update. Let's assert >= 1
        assert mock_broadcast.call_count >= 1
        
        state = sim_engine.get_state()
        assert state["events_remaining"] == 1
        assert state["time_offset_seconds"] == 5

@pytest.mark.asyncio
async def test_engine_play_pause():
    sim_engine.load_scenario("demo_normal_day")
    sim_engine.play()
    assert sim_engine.is_running == True
    assert sim_engine.is_paused == False
    
    sim_engine.pause()
    assert sim_engine.is_paused == True
