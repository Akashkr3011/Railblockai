"""
RAILBLOCK AI — Block Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.block import BlockRequestStatus, BlockType

class BlockRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    section_id: uuid.UUID
    block_type: BlockType = BlockType.ENGINEERING_BLOCK
    requested_date: datetime
    requested_start_time: datetime
    requested_end_time: datetime
    duration_hours: float

class BlockRequestUpdate(BaseModel):
    status: Optional[BlockRequestStatus] = None
    approval_notes: Optional[str] = None

class BlockRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: Optional[str]
    section_id: uuid.UUID
    block_type: BlockType
    status: BlockRequestStatus
    requested_date: datetime
    requested_start_time: datetime
    requested_end_time: datetime
    duration_hours: float
    requested_by_id: Optional[uuid.UUID]
    reviewed_by_id: Optional[uuid.UUID]
    approval_notes: Optional[str]
    has_conflicts: bool
    created_at: datetime
    updated_at: datetime
