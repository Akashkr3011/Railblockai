"""
RAILBLOCK AI — SMMS Adapter (SIMULATED)

[SIMULATION] System Maintenance Management System adapter.
NOT connected to any real SMMS.
"""
from __future__ import annotations
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from app.adapters.base_adapter import AdapterResult, AdapterRecord

_SMMS_TASKS = [
    ("Annual track inspection", "TRACK"),
    ("Bridge bearing inspection", "BRIDGE"),
    ("Ultrasonic rail testing", "TRACK"),
    ("OHE mast inspection", "TRACTION"),
    ("Relay room maintenance", "SIGNAL"),
    ("Girder bridge painting", "BRIDGE"),
]

class SimulatedSMMSAdapter:
    """[SIMULATED_SMMS] Synthetic System Maintenance Management System Adapter."""
    source_system_name = "SIMULATED_SMMS"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        records = []
        for i in range(min(limit, 8)):
            title, category = random.choice(_SMMS_TASKS)
            rec_id = f"SMMS-{random.randint(1000, 9999)}"
            records.append(AdapterRecord(
                source_system="SIMULATED_SMMS",
                source_record_id=rec_id,
                source_timestamp=now - timedelta(days=random.randint(0, 7)),
                record_type="MaintenanceRequest",
                payload={
                    "title": f"[SIMULATED_SMMS] {title}",
                    "category": category,
                    "priority": random.choice(["LOW", "MEDIUM", "HIGH"]),
                    "estimated_duration_hours": round(random.uniform(4, 24), 1),
                    "requires_block": True,
                    "source_system": "SIMULATED_SMMS",
                    "source_record_id": rec_id,
                    "source_timestamp": (now - timedelta(days=random.randint(0, 7))).isoformat(),
                    "import_timestamp": now.isoformat(),
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_SMMS", records=records, is_simulated=True, fetched_at=now)

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        return AdapterResult(source_system="SIMULATED_SMMS", records=[], is_simulated=True, fetched_at=datetime.now(timezone.utc))

    async def health_check(self) -> dict[str, Any]:
        return {"adapter": "SimulatedSMMSAdapter", "source_system": "SIMULATED_SMMS", "status": "ok", "is_simulated": True}
