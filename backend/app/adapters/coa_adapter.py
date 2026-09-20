"""
RAILBLOCK AI — COA Adapter (SIMULATED)

[SIMULATION] Chief Operating Analyst adapter.
NOT connected to any real COA system.
"""
from __future__ import annotations
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from app.adapters.base_adapter import AdapterResult, AdapterRecord

class SimulatedCOAAdapter:
    """[SIMULATED_COA] Synthetic Chief Operating Analyst Adapter."""
    source_system_name = "SIMULATED_COA"
    is_simulated = True

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        now = datetime.now(timezone.utc)
        tasks = [
            "Infrastructure improvement at junction",
            "Capacity augmentation works",
            "Safety audit compliance work",
            "Commissioner inspection preparation",
        ]
        records = []
        for i in range(min(limit, 5)):
            rec_id = f"COA-{random.randint(100, 999)}"
            records.append(AdapterRecord(
                source_system="SIMULATED_COA",
                source_record_id=rec_id,
                source_timestamp=now - timedelta(days=random.randint(0, 14)),
                record_type="MaintenanceRequest",
                payload={
                    "title": f"[SIMULATED_COA] {random.choice(tasks)}",
                    "category": "CIVIL",
                    "priority": "HIGH",
                    "estimated_duration_hours": round(random.uniform(6, 48), 1),
                    "requires_block": True,
                    "source_system": "SIMULATED_COA",
                    "source_record_id": rec_id,
                    "source_timestamp": (now - timedelta(days=random.randint(0, 14))).isoformat(),
                    "import_timestamp": now.isoformat(),
                },
                is_simulated=True,
            ))
        return AdapterResult(source_system="SIMULATED_COA", records=records, is_simulated=True, fetched_at=now)

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        return AdapterResult(source_system="SIMULATED_COA", records=[], is_simulated=True, fetched_at=datetime.now(timezone.utc))

    async def health_check(self) -> dict[str, Any]:
        return {"adapter": "SimulatedCOAAdapter", "source_system": "SIMULATED_COA", "status": "ok", "is_simulated": True}
