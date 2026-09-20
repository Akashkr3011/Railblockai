"""
RAILBLOCK AI — Goods Train Forecast Adapter (SIMULATED)

[SIMULATION] This adapter generates synthetic Goods Train Forecast data.
It does NOT connect to any real IR goods forecast or NTES system.
All data produced is labeled SIMULATED_GOODS_FORECAST.

Goods Train Forecast data represents future goods train movements that
engineering planners must account for when requesting maintenance blocks.
Knowing when freight trains are expected prevents schedule conflicts.

When authorized IR system access is available, this class can be replaced
with a real implementation that conforms to the DataSourceAdapter protocol.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, time, timezone
from typing import Any

from app.adapters.base_adapter import AdapterResult, AdapterRecord


_GOODS_TRAINS = [
    ("70001", "BOXN Freight Rake 1"),
    ("70002", "BOXN Freight Rake 2"),
    ("70003", "Container Express"),
    ("70004", "Coal Rake"),
    ("70005", "Food Grain Special"),
    ("70006", "Cement Train"),
    ("70007", "Petroleum Products Rake"),
    ("70008", "Iron Ore Rake"),
]

_SECTIONS = ["CR-CSTM-KYN", "CR-KYN-PUNE", "CR-DR-TNA"]
_DIRECTIONS = ["UP", "DOWN"]


class SimulatedGoodsForecastAdapter:
    """
    [SIMULATED_GOODS_FORECAST] Synthetic Goods Train Forecast Adapter.

    Generates synthetic goods train movement forecasts for the next 7 days.
    Used by maintenance planners to identify traffic-free windows for blocks.
    NOT connected to any real Indian Railways goods forecast system.
    """

    source_system_name = "SIMULATED_GOODS_FORECAST"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        """Goods Forecast adapter does not produce maintenance requests."""
        return AdapterResult(
            source_system="SIMULATED_GOODS_FORECAST",
            records=[],
            is_simulated=True,
            fetched_at=datetime.now(timezone.utc),
        )

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        """Goods Forecast adapter does not produce defect records."""
        return AdapterResult(
            source_system="SIMULATED_GOODS_FORECAST",
            records=[],
            is_simulated=True,
            fetched_at=datetime.now(timezone.utc),
        )

    async def fetch_goods_forecast(self, days_ahead: int = 7, limit: int = 50) -> AdapterResult:
        """
        Fetch synthetic goods train forecast records.

        Returns AdapterRecords of type 'GoodsForecast' representing expected
        freight train movements over the next `days_ahead` days. Planners use
        this data to identify time windows where maintenance blocks can be
        approved without disrupting freight operations.

        [SIMULATION] All records are synthetic.
        """
        now = datetime.now(timezone.utc)
        records = []
        count = min(limit, 20)

        for i in range(count):
            train_num, train_name = random.choice(_GOODS_TRAINS)
            section_code = random.choice(_SECTIONS)
            direction = random.choice(_DIRECTIONS)
            departure_offset_hours = random.uniform(1, days_ahead * 24)
            departure_dt = now + timedelta(hours=departure_offset_hours)
            transit_duration_hours = random.uniform(0.5, 3.0)
            arrival_dt = departure_dt + timedelta(hours=transit_duration_hours)

            rec_id = f"GF-{train_num}-{i:04d}"

            records.append(AdapterRecord(
                source_system="SIMULATED_GOODS_FORECAST",
                source_record_id=rec_id,
                source_timestamp=now,
                record_type="GoodsForecast",
                payload={
                    "train_number": train_num,
                    "train_name": f"[SIMULATED_GOODS_FORECAST] {train_name}",
                    "section_code": section_code,
                    "direction": direction,
                    "expected_departure": departure_dt.isoformat(),
                    "expected_arrival": arrival_dt.isoformat(),
                    "transit_duration_hours": round(transit_duration_hours, 2),
                    "load_type": random.choice(["COAL", "GRAIN", "CONTAINER", "CEMENT", "PETROLEUM", "ORE"]),
                    "priority": random.choice(["NORMAL", "PRIORITY", "HIGH_PRIORITY"]),
                    "is_simulated": True,
                    "source_system": "SIMULATED_GOODS_FORECAST",
                    "source_record_id": rec_id,
                    "import_timestamp": now.isoformat(),
                    "note": "Synthetic forecast — not real IR goods movement data",
                },
                is_simulated=True,
            ))

        return AdapterResult(
            source_system="SIMULATED_GOODS_FORECAST",
            records=records,
            is_simulated=True,
            fetched_at=now,
        )

    async def health_check(self) -> dict[str, Any]:
        return {
            "adapter": "SimulatedGoodsForecastAdapter",
            "source_system": "SIMULATED_GOODS_FORECAST",
            "status": "ok",
            "is_simulated": True,
            "note": "Generates synthetic goods train forecast. Not connected to real IR goods forecast system.",
        }
