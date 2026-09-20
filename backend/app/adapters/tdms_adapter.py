"""
RAILBLOCK AI — TDMS Adapter (SIMULATED)

[SIMULATION] Track Defect Management System adapter.
NOT connected to any real TDMS.
"""
from __future__ import annotations
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from app.adapters.base_adapter import AdapterResult, AdapterRecord

_DEFECT_TYPES = [
    ("Rail wear beyond limit", "MAJOR"),
    ("Crack detected in rail head", "SAFETY_CRITICAL"),
    ("Sleeper deterioration", "MODERATE"),
    ("Gauge widening at km 67.2", "MAJOR"),
    ("Cross-level deviation", "MINOR"),
    ("Alignment defect at curve", "MODERATE"),
]

class SimulatedTDMSAdapter:
    """[SIMULATED_TDMS] Synthetic Track Defect Management System Adapter."""
    source_system_name = "SIMULATED_TDMS"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        records = []
        for i in range(min(limit, 12)):
            desc, severity = random.choice(_DEFECT_TYPES)
            rec_id = f"TDMS-{random.randint(5000, 9999)}"
            priority = "CRITICAL" if severity == "SAFETY_CRITICAL" else ("HIGH" if severity == "MAJOR" else "MEDIUM")
            records.append(AdapterRecord(
                source_system="SIMULATED_TDMS",
                source_record_id=rec_id,
                source_timestamp=now - timedelta(hours=random.randint(1, 120)),
                record_type="MaintenanceRequest",
                payload={
                    "title": f"[SIMULATED_TDMS] Attend to: {desc}",
                    "description": f"Track defect: {desc} — detected by SIMULATED TDMS (not real IR data)",
                    "category": "TRACK",
                    "priority": priority,
                    "estimated_duration_hours": round(random.uniform(3, 18), 1),
                    "requires_block": True,
                    "source_system": "SIMULATED_TDMS",
                    "source_record_id": rec_id,
                    "source_timestamp": (now - timedelta(hours=random.randint(1, 120))).isoformat(),
                    "import_timestamp": now.isoformat(),
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_TDMS", records=records, is_simulated=True, fetched_at=now)

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        records = []
        for i in range(min(limit, 12)):
            desc, severity = random.choice(_DEFECT_TYPES)
            rec_id = f"TDMS-DEF-{random.randint(1000, 9999)}"
            records.append(AdapterRecord(
                source_system="SIMULATED_TDMS",
                source_record_id=rec_id,
                source_timestamp=now - timedelta(hours=random.randint(1, 120)),
                record_type="Defect",
                payload={
                    "description": f"[SIMULATED_TDMS] {desc}",
                    "severity": severity,
                    "source_system": "SIMULATED_TDMS",
                    "source_record_id": rec_id,
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_TDMS", records=records, is_simulated=True, fetched_at=now)

    async def health_check(self) -> dict[str, Any]:
        return {"adapter": "SimulatedTDMSAdapter", "source_system": "SIMULATED_TDMS", "status": "ok", "is_simulated": True}
