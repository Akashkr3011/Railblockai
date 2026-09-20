"""
RAILBLOCK AI — Asset Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.asset import AssetType, AssetCondition

class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    asset_number: str
    name: str
    asset_type: AssetType
    section_id: uuid.UUID
    condition: AssetCondition
    criticality_score: float
    age_years: Optional[float]
    last_maintenance_date: Optional[datetime]
    next_due_date: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class AssetCreate(BaseModel):
    asset_number: str
    name: str
    asset_type: AssetType
    section_id: uuid.UUID
    chainage_start_km: Optional[float] = None
    chainage_end_km: Optional[float] = None
    criticality_score: float = 5.0
    age_years: Optional[float] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None

class AssetUpdate(BaseModel):
    condition: Optional[AssetCondition] = None
    criticality_score: Optional[float] = None
    last_maintenance_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    is_active: Optional[bool] = None
