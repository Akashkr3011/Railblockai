"""
RAILBLOCK AI — BDMS Adapter (SIMULATED)

[SIMULATION] Bridge Defect Management System adapter.
NOT connected to any real BDMS.
"""
from __future__ import annotations
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from app.adapters.base_adapter import AdapterResult, AdapterRecord

_BRIDGE_DEFECTS = [
    ("Girder corrosion at pier 3", "MAJOR"),
    ("Bearing plate displacement", "MODERATE"),
    ("Expansion joint failure", "SAFETY_CRITICAL"),
    ("Abutment crack detected", "MAJOR"),
    ("Scour protection erosion", "MODERATE"),
]

class SimulatedBDMSAdapter:
    """[SIMULATED_BDMS] Synthetic Bridge Defect Management System Adapter."""
    source_system_name = "SIMULATED_BDMS"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        records = []
        for i in range(min(limit, 6)):
            desc, severity = random.choice(_BRIDGE_DEFECTS)
            rec_id = f"BDMS-{random.randint(100, 999)}"
            priority = "CRITICAL" if severity == "SAFETY_CRITICAL" else "HIGH"
            records.append(AdapterRecord(
                source_system="SIMULATED_BDMS",
                source_record_id=rec_id,
                source_timestamp=now - timedelta(days=random.randint(0, 30)),
                record_type="MaintenanceRequest",
                payload={
                    "title": f"[SIMULATED_BDMS] Bridge repair: {desc}",
                    "description": f"Bridge defect: {desc} — from SIMULATED BDMS (not real IR data)",
                    "category": "BRIDGE",
                    "priority": priority,
                    "estimated_duration_hours": round(random.uniform(8, 72), 1),
                    "requires_block": True,
                    "source_system": "SIMULATED_BDMS",
                    "source_record_id": rec_id,
                    "source_timestamp": (now - timedelta(days=random.randint(0, 30))).isoformat(),
                    "import_timestamp": now.isoformat(),
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_BDMS", records=records, is_simulated=True, fetched_at=now)

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        return AdapterResult(source_system="SIMULATED_BDMS", records=[], is_simulated=True, fetched_at=datetime.now(timezone.utc))

    async def health_check(self) -> dict[str, Any]:
        return {"adapter": "SimulatedBDMSAdapter", "source_system": "SIMULATED_BDMS", "status": "ok", "is_simulated": True}
