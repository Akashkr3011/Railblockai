"""
RAILBLOCK AI — Rule Engine Schemas
"""
from __future__ import annotations
import enum
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class CompatibilityStatus(str, enum.Enum):
    COMPATIBLE = "COMPATIBLE"
    CONDITIONALLY_COMPATIBLE = "CONDITIONALLY_COMPATIBLE"
    INCOMPATIBLE = "INCOMPATIBLE"

class CompatibilityResult(BaseModel):
    """
    Result of a compatibility check between maintenance tasks/blocks.
    """
    status: CompatibilityStatus = Field(description="The final compatibility determination")
    reasons: List[str] = Field(default_factory=list, description="Primary reasons for the decision")
    warnings: List[str] = Field(default_factory=list, description="Warnings or conditions if conditionally compatible")
    violated_conditions: List[str] = Field(default_factory=list, description="Specific operational rules violated")
    affected_assets: List[UUID] = Field(default_factory=list, description="Asset IDs involved in the conflict/check")
    affected_sections: List[UUID] = Field(default_factory=list, description="Section IDs involved in the conflict/check")
    affected_resources: List[UUID] = Field(default_factory=list, description="Resource IDs involved in the conflict/check")
    relevant_time_window: Optional[str] = Field(default=None, description="The time window checked (e.g. ISO 8601 overlap interval)")
    explanation: str = Field(description="Human-readable explanation of the compatibility result")

class CompatibilityCheckRequest(BaseModel):
    """
    Request payload to check compatibility between two tasks.
    We pass UUIDs and expect the engine to look them up.
    """
    task_a_id: UUID
    task_b_id: UUID

class ConflictType(str, enum.Enum):
    TRAIN_CONFLICT = "TRAIN_CONFLICT"
    TASK_OVERLAP = "TASK_OVERLAP"
    ASSET_CONFLICT = "ASSET_CONFLICT"
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    DEADLINE_CONFLICT = "DEADLINE_CONFLICT"
    DEPENDENCY_CONFLICT = "DEPENDENCY_CONFLICT"
    BLOCK_CONFLICT = "BLOCK_CONFLICT"
    DATA_CONFLICT = "DATA_CONFLICT"

class ConflictSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ResolutionSuggestion(str, enum.Enum):
    MOVE_TASK = "MOVE_TASK"
    MOVE_BLOCK = "MOVE_BLOCK"
    COMBINE_TASKS = "COMBINE_TASKS"
    SPLIT_TASKS = "SPLIT_TASKS"
    USE_ALTERNATE_RESOURCE = "USE_ALTERNATE_RESOURCE"
    WAIT_FOR_WINDOW = "WAIT_FOR_WINDOW"
    REOPTIMIZE = "REOPTIMIZE"
    REVIEW_DATA = "REVIEW_DATA"

class ConflictDetail(BaseModel):
    """
    Structured operational planning conflict using domain data.
    """
    conflict_id: str = Field(description="Unique identifier for this specific conflict instance")
    conflict_type: ConflictType = Field(description="The category of the conflict")
    severity: ConflictSeverity = Field(description="Deterministic severity rating")
    affected_objects: List[str] = Field(default_factory=list, description="General string identifiers of affected objects (e.g. 'Train 12001')")
    affected_tasks: List[UUID] = Field(default_factory=list, description="IDs of affected maintenance tasks")
    affected_assets: List[UUID] = Field(default_factory=list, description="IDs of affected physical assets")
    affected_section: Optional[UUID] = Field(default=None, description="ID of affected railway section")
    time_window: Optional[str] = Field(default=None, description="ISO 8601 string or generic description of the conflicting time window")
    reason: str = Field(description="Human-readable explanation of why this conflict occurred")
    suggested_resolution: ResolutionSuggestion = Field(description="Actionable suggestion to resolve the conflict")
    source_context: str = Field(default="Engine", description="Source/data context indicating where the conflict was identified")

class ConflictDetectionRequest(BaseModel):
    """
    Request payload for checking conflicts on a list of tasks or blocks.
    """
    task_ids: List[UUID] = Field(default_factory=list)
    block_id: Optional[UUID] = None
    time_window_start: Optional[datetime] = None
    time_window_end: Optional[datetime] = None

class ConflictDetectionResponse(BaseModel):
    conflicts: List[ConflictDetail]
    summary: str

