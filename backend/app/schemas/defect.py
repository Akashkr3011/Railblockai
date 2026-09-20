"""
RAILBLOCK AI — Defect Schemas
"""
from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.maintenance import DefectSeverity, SourceSystem


class DefectCreate(BaseModel):
    asset_id: uuid.UUID
    description: str
    severity: DefectSeverity
    defect_code: Optional[str] = None
    source_system: SourceSystem = SourceSystem.MANUAL
    source_record_id: Optional[str] = None
    linked_maintenance_id: Optional[uuid.UUID] = None


class DefectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    defect_code: Optional[str]
    description: str
    severity: DefectSeverity
    reported_by_id: Optional[uuid.UUID]
    is_resolved: bool
    resolved_at: Optional[datetime]
    source_system: SourceSystem
    source_record_id: Optional[str]
    linked_maintenance_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
