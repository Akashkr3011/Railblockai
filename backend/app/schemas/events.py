"""
RAILBLOCK AI — Realtime Event Schemas
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Any, Dict
from datetime import datetime, timezone
import uuid
import enum

class SimulationState(str, enum.Enum):
    LIVE = "LIVE"
    SIMULATED = "SIMULATED"
    REPLAY = "REPLAY"

class EventType(str, enum.Enum):
    MAINTENANCE_UPDATED = "MAINTENANCE_UPDATED"
    DEFECT_UPDATED = "DEFECT_UPDATED"
    ASSET_STATUS_CHANGED = "ASSET_STATUS_CHANGED"
    BLOCK_AVAILABILITY_CHANGED = "BLOCK_AVAILABILITY_CHANGED"
    TRAIN_SCHEDULE_UPDATED = "TRAIN_SCHEDULE_UPDATED"
    TRAIN_POSITION_UPDATED = "TRAIN_POSITION_UPDATED"
    RESOURCE_AVAILABILITY_CHANGED = "RESOURCE_AVAILABILITY_CHANGED"
    CONFLICT_DETECTED = "CONFLICT_DETECTED"
    DATA_QUALITY_DEGRADATION = "DATA_QUALITY_DEGRADATION"
    OPTIMIZATION_RESULT = "OPTIMIZATION_RESULT"
    ALERT_GENERATED = "ALERT_GENERATED"

class RailBlockEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    event_type: EventType
    source: str = Field(..., description="Subsystem that generated the event")
    source_record_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data_timestamp: datetime
    received_timestamp: Optional[datetime] = None
    payload: Dict[str, Any]
    data_quality: float = Field(ge=0.0, le=1.0, default=1.0)
    simulation_state: SimulationState = SimulationState.SIMULATED
