"""
RAILBLOCK AI — Data Sources API Routes

GET /api/v1/data-sources
GET /api/v1/data-sources/{source_name}/health

All adapters are SIMULATED. No real IR system connections.
"""
from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.adapters.tms_adapter import SimulatedTMSAdapter
from app.adapters.smms_adapter import SimulatedSMMSAdapter
from app.adapters.tdms_adapter import SimulatedTDMSAdapter
from app.adapters.coa_adapter import SimulatedCOAAdapter
from app.adapters.bdms_adapter import SimulatedBDMSAdapter
from app.adapters.timetable_adapter import SimulatedTimetableAdapter

router = APIRouter()

ADAPTERS = {
    "tms": SimulatedTMSAdapter(),
    "smms": SimulatedSMMSAdapter(),
    "tdms": SimulatedTDMSAdapter(),
    "coa": SimulatedCOAAdapter(),
    "bdms": SimulatedBDMSAdapter(),
    "timetable": SimulatedTimetableAdapter(),
}

@router.get("", summary="List all data sources and their simulation status")
async def list_data_sources(current_user=Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {
            "name": name,
            "source_system": adapter.source_system_name,
            "is_simulated": adapter.is_simulated,
            "simulation_notice": "[SIMULATION] This adapter generates synthetic data for demonstration purposes. It is NOT connected to any real Indian Railways system.",
        }
        for name, adapter in ADAPTERS.items()
    ]

@router.get("/{source_name}/health", summary="Check adapter health")
async def adapter_health(source_name: str, current_user=Depends(get_current_user)) -> dict[str, Any]:
    from fastapi import HTTPException
    adapter = ADAPTERS.get(source_name)
    if not adapter:
        raise HTTPException(status_code=404, detail=f"No adapter found for '{source_name}'")
    return await adapter.health_check()
