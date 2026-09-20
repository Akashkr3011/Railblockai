"""
RAILBLOCK AI — Base Adapter Protocol

Defines the interface all data source adapters must implement.
Real IR system adapters (authorized APIs) will implement the same Protocol.
"""
from __future__ import annotations
from typing import Protocol, runtime_checkable, Any
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class AdapterRecord:
    """A single record returned from an adapter."""
    source_system: str          # e.g. SIMULATED_TMS
    source_record_id: str       # ID in source system
    source_timestamp: datetime  # Timestamp in source system
    record_type: str            # MaintenanceRequest, Defect, etc.
    payload: dict[str, Any]     # Canonical-mapped fields
    raw_payload: dict[str, Any] = field(default_factory=dict)  # Original source record
    is_simulated: bool = True   # Always True in prototype

@dataclass
class AdapterResult:
    """Result of one adapter fetch cycle."""
    source_system: str
    records: list[AdapterRecord] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    fetched_at: datetime = field(default_factory=lambda: datetime.utcnow())
    is_simulated: bool = True

@runtime_checkable
class DataSourceAdapter(Protocol):
    """Protocol (interface) for all data source adapters."""

    @property
    def source_system_name(self) -> str:
        """Returns the source system label (e.g. SIMULATED_TMS)."""
        ...

    @property
    def is_simulated(self) -> bool:
        """Returns True if this adapter generates synthetic data."""
        ...

    async def fetch_maintenance_requests(self, limit: int = 50) -> AdapterResult:
        """Fetch maintenance task records from the source system."""
        ...

    async def fetch_defects(self, limit: int = 50) -> AdapterResult:
        """Fetch defect records from the source system."""
        ...

    async def health_check(self) -> dict[str, Any]:
        """Check if the adapter/source system is reachable."""
        ...
