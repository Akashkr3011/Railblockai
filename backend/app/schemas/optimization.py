from __future__ import annotations
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
import uuid
from enum import Enum
from datetime import datetime

class SolverStatus(str, Enum):
    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    TIME_LIMIT = "TIME_LIMIT"
    ERROR = "ERROR"
    UNKNOWN = "UNKNOWN"

class OptimizationConfig(BaseModel):
    time_limit_seconds: int = Field(default=30)
    worker_count: int = Field(default=8)
    planning_horizon_hours: int = Field(default=24)
    scenario_id: Optional[str] = None
    # Placeholder for Stage 3C.2 weights
    objective_weights: Dict[str, float] = Field(default_factory=dict)

class TaskAssignment(BaseModel):
    task_id: uuid.UUID
    scheduled_start: datetime
    scheduled_end: datetime
    block_id: Optional[uuid.UUID] = None
    is_scheduled: bool = True
    priority_level: str = "MEDIUM"
    details: Optional[str] = None

class OptimizationResult(BaseModel):
    solver_status: SolverStatus
    solve_time_seconds: float
    tasks_scheduled: int
    tasks_unscheduled: int
    assignments: List[TaskAssignment]
    objective_value: float
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)

class ValidationIssue(BaseModel):
    constraint: str
    task_ids: List[uuid.UUID] = Field(default_factory=list)
    reason: str

class ValidationResult(BaseModel):
    valid: bool
    errors: List[ValidationIssue] = Field(default_factory=list)
    warnings: List[ValidationIssue] = Field(default_factory=list)
    violated_constraints: List[str] = Field(default_factory=list)
    affected_tasks: List[uuid.UUID] = Field(default_factory=list)
    affected_blocks: List[uuid.UUID] = Field(default_factory=list)
    affected_assets: List[uuid.UUID] = Field(default_factory=list)
    affected_resources: List[uuid.UUID] = Field(default_factory=list)
    explanation: Optional[str] = None

class ComparisonMetrics(BaseModel):
    tasks_scheduled: int
    critical_tasks_scheduled: int
    overdue_tasks_scheduled: int
    asset_downtime_minutes: int
    active_blocks: int
    block_utilization_percent: float
    unscheduled_tasks: int

class ComparisonResult(BaseModel):
    baseline_metrics: ComparisonMetrics
    optimized_metrics: ComparisonMetrics
    improvement_tasks_scheduled_abs: int
    improvement_tasks_scheduled_pct: Optional[float]
    improvement_downtime_abs: int
    improvement_downtime_pct: Optional[float]
    improvement_block_util_abs: float
    improvement_block_util_pct: Optional[float]

class ExplanationResult(BaseModel):
    decision: str
    primary_reason: str
    supporting_factors: List[str]
    constraints: List[str]
    conflicts: List[str]
    alternatives_considered: List[str]
    operational_impact: str

class ManualChangeRequest(BaseModel):
    task_id: uuid.UUID
    new_block_id: Optional[uuid.UUID] = None
    new_start_time: datetime
    new_end_time: datetime

class ManualChangeValidationResult(BaseModel):
    valid_change: bool
    reasons: List[str]
    validation_result: Optional[ValidationResult] = None
