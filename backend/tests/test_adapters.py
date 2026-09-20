"""
RAILBLOCK AI — Adapter Tests

Tests simulated data source adapters.
All adapters generate synthetic data and must be clearly labeled.
No real IR system connections.
"""
from __future__ import annotations

import pytest
from app.adapters.tms_adapter import SimulatedTMSAdapter
from app.adapters.smms_adapter import SimulatedSMMSAdapter
from app.adapters.tdms_adapter import SimulatedTDMSAdapter
from app.adapters.coa_adapter import SimulatedCOAAdapter
from app.adapters.bdms_adapter import SimulatedBDMSAdapter
from app.adapters.timetable_adapter import SimulatedTimetableAdapter
from app.adapters.base_adapter import DataSourceAdapter


# -------------------------------------------------------------------------
# Protocol conformance
# -------------------------------------------------------------------------

def test_tms_adapter_implements_protocol():
    adapter = SimulatedTMSAdapter()
    assert isinstance(adapter, DataSourceAdapter)

def test_smms_adapter_implements_protocol():
    assert isinstance(SimulatedSMMSAdapter(), DataSourceAdapter)

def test_tdms_adapter_implements_protocol():
    assert isinstance(SimulatedTDMSAdapter(), DataSourceAdapter)

def test_coa_adapter_implements_protocol():
    assert isinstance(SimulatedCOAAdapter(), DataSourceAdapter)

def test_bdms_adapter_implements_protocol():
    assert isinstance(SimulatedBDMSAdapter(), DataSourceAdapter)

def test_timetable_adapter_implements_protocol():
    assert isinstance(SimulatedTimetableAdapter(), DataSourceAdapter)


# -------------------------------------------------------------------------
# Simulation labeling
# -------------------------------------------------------------------------

def test_all_adapters_are_simulated():
    adapters = [
        SimulatedTMSAdapter(), SimulatedSMMSAdapter(), SimulatedTDMSAdapter(),
        SimulatedCOAAdapter(), SimulatedBDMSAdapter(), SimulatedTimetableAdapter(),
    ]
    for adapter in adapters:
        assert adapter.is_simulated is True, f"{adapter.__class__.__name__} must set is_simulated=True"


def test_source_system_names_contain_simulated():
    adapters = [
        SimulatedTMSAdapter(), SimulatedSMMSAdapter(), SimulatedTDMSAdapter(),
        SimulatedCOAAdapter(), SimulatedBDMSAdapter(), SimulatedTimetableAdapter(),
    ]
    for adapter in adapters:
        assert "SIMULATED" in adapter.source_system_name, \
            f"{adapter.__class__.__name__} source_system_name must contain 'SIMULATED'"


# -------------------------------------------------------------------------
# TMS Adapter
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tms_fetch_maintenance():
    adapter = SimulatedTMSAdapter()
    result = await adapter.fetch_maintenance_requests(limit=5)
    assert result.is_simulated is True
    assert result.source_system == "SIMULATED_TMS"
    assert len(result.records) <= 5
    assert len(result.records) > 0
    for rec in result.records:
        assert rec.is_simulated is True
        assert rec.source_system == "SIMULATED_TMS"
        assert "SIMULATED_TMS" in rec.payload["title"]


@pytest.mark.asyncio
async def test_tms_health_check():
    adapter = SimulatedTMSAdapter()
    health = await adapter.health_check()
    assert health["status"] == "ok"
    assert health["is_simulated"] is True


# -------------------------------------------------------------------------
# TDMS Adapter (most critical — track defects)
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_tdms_fetch_defects():
    adapter = SimulatedTDMSAdapter()
    result = await adapter.fetch_defects(limit=10)
    assert result.is_simulated is True
    assert result.source_system == "SIMULATED_TDMS"
    for rec in result.records:
        assert rec.source_system == "SIMULATED_TDMS"
        assert "SIMULATED_TDMS" in rec.payload["description"]


@pytest.mark.asyncio
async def test_tdms_maintenance_includes_critical():
    """TDMS should sometimes generate CRITICAL priority tasks."""
    adapter = SimulatedTDMSAdapter()
    results = []
    for _ in range(5):
        result = await adapter.fetch_maintenance_requests(limit=12)
        results.extend(result.records)
    priorities = [r.payload.get("priority") for r in results]
    # Should have at least HIGH priority tasks (from SAFETY_CRITICAL defects)
    assert "HIGH" in priorities or "CRITICAL" in priorities


# -------------------------------------------------------------------------
# BDMS Adapter
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_bdms_tasks_are_bridge_category():
    adapter = SimulatedBDMSAdapter()
    result = await adapter.fetch_maintenance_requests(limit=6)
    for rec in result.records:
        assert rec.payload["category"] == "BRIDGE"
        assert "[SIMULATED_BDMS]" in rec.payload["title"]


# -------------------------------------------------------------------------
# Timetable Adapter
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_timetable_fetch_schedules():
    adapter = SimulatedTimetableAdapter()
    result = await adapter.fetch_train_schedules(limit=5)
    assert result.is_simulated is True
    assert len(result.records) > 0
    for rec in result.records:
        assert rec.record_type == "TrainSchedule"
        assert rec.payload["is_simulated"] is True


# -------------------------------------------------------------------------
# Data quality: records have required canonical fields
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_canonical_fields_present():
    """All maintenance records must have canonical traceability fields."""
    adapters = [
        SimulatedTMSAdapter(), SimulatedSMMSAdapter(),
        SimulatedTDMSAdapter(), SimulatedCOAAdapter(), SimulatedBDMSAdapter(),
    ]
    required_fields = {
        "title", "category", "priority", "source_system",
        "source_record_id", "import_timestamp"
    }
    for adapter in adapters:
        result = await adapter.fetch_maintenance_requests(limit=3)
        for rec in result.records:
            missing = required_fields - set(rec.payload.keys())
            assert not missing, \
                f"{adapter.source_system_name} record missing fields: {missing}"
