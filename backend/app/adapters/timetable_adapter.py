"""
RAILBLOCK AI — Train Timetable Adapter (SIMULATED)

[SIMULATION] Synthetic train timetable data generator.
NOT connected to any real IR timetable system.
"""
from __future__ import annotations
import random
from datetime import datetime, timezone, time
from typing import Any
from app.adapters.base_adapter import AdapterResult, AdapterRecord

class SimulatedTimetableAdapter:
    """[SIMULATED_TIMETABLE] Generates synthetic train schedule data."""
    source_system_name = "SIMULATED_TIMETABLE"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        return AdapterResult(source_system="SIMULATED_TIMETABLE", records=[], is_simulated=True, fetched_at=datetime.now(timezone.utc))

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        return AdapterResult(source_system="SIMULATED_TIMETABLE", records=[], is_simulated=True, fetched_at=datetime.now(timezone.utc))

    async def fetch_train_schedules(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        trains = [
            ("12001", "Shatabdi Express", "EXPRESS"),
            ("12051", "Janshatabdi Express", "EXPRESS"),
            ("22101", "Mumbai-Pune AC", "EXPRESS"),
            ("11301", "Local EMU", "EMU"),
            ("51503", "Passenger Train", "PASSENGER"),
        ]
        records = []
        for num, name, ttype in trains[:min(limit, len(trains))]:
            rec_id = f"TT-{num}"
            records.append(AdapterRecord(
                source_system="SIMULATED_TIMETABLE",
                source_record_id=rec_id,
                source_timestamp=now,
                record_type="TrainSchedule",
                payload={
                    "train_number": num,
                    "train_name": f"[SIMULATED_TIMETABLE] {name}",
                    "train_type": ttype,
                    "is_simulated": True,
                    "data_source": "SIMULATED_TIMETABLE",
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_TIMETABLE", records=records, is_simulated=True, fetched_at=now)

    async def health_check(self) -> dict[str, Any]:
        return {"adapter": "SimulatedTimetableAdapter", "source_system": "SIMULATED_TIMETABLE", "status": "ok", "is_simulated": True}
