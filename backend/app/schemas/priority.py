"""
RAILBLOCK AI — Priority Scoring Schemas
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel, Field, ConfigDict

from app.services.priority_engine import PriorityLevel


class PriorityFactorSchema(BaseModel):
    """A single scoring factor contribution."""
    name: str
    raw_value: float
    contribution: float
    weight: float
    description: str


class PriorityResultSchema(BaseModel):
    """Full priority result — score, level, factors, explanation."""
    priority_score: float = Field(..., ge=0, le=100, description="0–100, higher = more urgent")
    priority_level: PriorityLevel
    factors: list[PriorityFactorSchema]
    reason: str
    prediction_source: str
    model_version: str
    data_timestamp: Optional[datetime]
    confidence: float = Field(..., ge=0, le=1)


class PriorityRequest(BaseModel):
    """
    Request body for computing a priority score.

    All fields are optional — use defaults when the exact value is unknown.
    The engine degrades gracefully when data is missing.
    """
    # Task fields
    priority: str = Field("MEDIUM", description="Stored priority enum: CRITICAL/HIGH/MEDIUM/LOW")
    deadline: Optional[datetime] = None
    estimated_duration_hours: Optional[float] = None

    # Asset fields
    criticality_score: float = Field(5.0, ge=0, le=10)
    asset_condition: Optional[str] = Field(None, description="GOOD/FAIR/POOR/CRITICAL/OUT_OF_SERVICE")
    asset_type: Optional[str] = Field(None, description="TRACK/BRIDGE/SIGNAL/etc.")
    age_years: Optional[float] = Field(None, ge=0)

    # Section fields
    number_of_tracks: Optional[int] = Field(None, ge=1)
    section_type: Optional[str] = Field(None, description="MAIN_LINE/BRANCH_LINE/GOODS_LINE/YARD")


class BulkPriorityRequest(BaseModel):
    """Compute priority scores for multiple tasks in one call."""
    tasks: list[PriorityRequest] = Field(..., min_length=1, max_length=500)


class BulkPriorityResult(BaseModel):
    """Result for one task in a bulk priority request."""
    index: int
    result: PriorityResultSchema


class BulkPriorityResponse(BaseModel):
    """Response for a bulk priority request."""
    results: list[BulkPriorityResult]
    total: int
    prediction_source: str


class PredictionStatusSchema(BaseModel):
    """Model registry status response."""
    registered_models: dict[str, str]
    prediction_source: str
    note: str


class FailureRiskRequest(BaseModel):
    """Request for failure risk prediction."""
    condition: Optional[str] = Field(None, description="GOOD/FAIR/POOR/CRITICAL/OUT_OF_SERVICE")
    age_years: Optional[float] = Field(None, ge=0)
    maintenance_gap_days: Optional[float] = Field(None, ge=0, description="Days since last maintenance")


class FailureRiskResponse(BaseModel):
    """Failure risk prediction response."""
    failure_probability: float = Field(..., ge=0, le=1, description="0=no risk, 1=certain failure")
    confidence: float = Field(..., ge=0, le=1)
    important_factors: list[tuple[str, float]]
    model_version: str
    prediction_source: str
    note: str = "RULE_BASED_BASELINE — Not a trained ML model"


class TrainImpactRequest(BaseModel):
    """Request for train impact prediction."""
    block_duration_hours: float = Field(4.0, gt=0)
    trains_per_day: Optional[int] = Field(None, ge=0)
    number_of_tracks: Optional[int] = Field(None, ge=1)


class TrainImpactResponse(BaseModel):
    """Train impact prediction response."""
    estimated_services_affected: float = Field(..., ge=0)
    confidence: float = Field(..., ge=0, le=1)
    important_factors: list[tuple[str, float]]
    model_version: str
    prediction_source: str
    note: str = "RULE_BASED_BASELINE — Not a trained ML model"
