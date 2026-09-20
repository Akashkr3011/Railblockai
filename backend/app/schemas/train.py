"""
RAILBLOCK AI — Train Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime, time
from pydantic import BaseModel, ConfigDict
from app.models.train import TrainType

class TrainResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    train_number: str
    name: str
    train_type: TrainType
    rake_type: Optional[str]
    is_simulated: bool
    is_active: bool
    created_at: datetime

class TrainScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    train_id: uuid.UUID
    section_id: uuid.UUID
    sequence_number: int
    scheduled_arrival: Optional[time]
    scheduled_departure: Optional[time]
    days_of_week: str
    is_simulated: bool
    data_source: str
