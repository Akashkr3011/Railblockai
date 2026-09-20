"""
RAILBLOCK AI — Resource Schemas
"""
from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.resource import ResourceType


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    resource_type: ResourceType
    division_id: Optional[uuid.UUID]
    size: Optional[int]
    specialization: Optional[str]
    is_available: bool
    created_at: datetime
    updated_at: datetime


class ResourceAvailabilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    resource_id: uuid.UUID
    available_from: datetime
    available_to: datetime
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
