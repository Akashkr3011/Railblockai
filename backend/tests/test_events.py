import pytest
from app.schemas.events import RailBlockEvent, EventType, SimulationState
from app.services.events_manager import event_manager
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_event_schema_validation():
    event_data = {
        "event_type": "MAINTENANCE_UPDATED",
        "source": "MaintenanceService",
        "data_timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {"id": "123", "status": "APPROVED"},
        "simulation_state": "SIMULATED"
    }
    event = RailBlockEvent(**event_data)
    assert event.event_type == EventType.MAINTENANCE_UPDATED
    assert event.source == "MaintenanceService"
    assert event.data_quality == 1.0 # Default
    assert event.simulation_state == SimulationState.SIMULATED

@pytest.mark.asyncio
async def test_event_manager_broadcast():
    ws_mock = AsyncMock(spec=WebSocket)
    await event_manager.connect(ws_mock)
    
    assert ws_mock in event_manager.active_connections
    
    event = RailBlockEvent(
        event_type=EventType.MAINTENANCE_UPDATED,
        source="TEST",
        data_timestamp=datetime.now(timezone.utc),
        payload={}
    )
    
    await event_manager.broadcast(event)
    
    ws_mock.send_text.assert_called_once()
    event_manager.disconnect(ws_mock)
    assert ws_mock not in event_manager.active_connections
