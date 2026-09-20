"""
RAILBLOCK AI — Maintenance Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.maintenance import (
    Priority, MaintenanceStatus, MaintenanceCategory, SourceSystem
)

class MaintenanceRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: MaintenanceCategory
    priority: Priority = Priority.MEDIUM
    asset_id: uuid.UUID
    section_id: Optional[uuid.UUID] = None
    estimated_duration_hours: Optional[float] = None
    deadline: Optional[datetime] = None
    requires_block: bool = True
    required_gang_size: Optional[int] = None
    source_system: SourceSystem = SourceSystem.MANUAL
    source_record_id: Optional[str] = None

class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[MaintenanceStatus] = None
    assigned_to_id: Optional[uuid.UUID] = None
    estimated_duration_hours: Optional[float] = None
    deadline: Optional[datetime] = None
    scheduled_start: Optional[datetime] = None

class MaintenanceRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: Optional[str]
    category: MaintenanceCategory
    priority: Priority
    status: MaintenanceStatus
    asset_id: uuid.UUID
    section_id: Optional[uuid.UUID]
    assigned_to_id: Optional[uuid.UUID]
    estimated_duration_hours: Optional[float]
    deadline: Optional[datetime]
    scheduled_start: Optional[datetime]
    completed_at: Optional[datetime]
    requires_block: bool
    required_gang_size: Optional[int]
    priority_score: Optional[float]
    source_system: SourceSystem
    source_record_id: Optional[str]
    source_timestamp: Optional[datetime]
    import_timestamp: Optional[datetime]
    created_at: datetime
    updated_at: datetime
