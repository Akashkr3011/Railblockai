"""
RAILBLOCK AI — Priority and Prediction API Routes

These endpoints expose the PriorityEngine and PredictionService to the
frontend and optimizer. ML logic is NEVER placed here — it always goes
through the service layer.

[RULE_BASED_BASELINE] All predictions use validated rule-based logic.
No trained ML models are used in Stage 3A.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from app.core.dependencies import get_current_user

from app.schemas.priority import (
    BulkPriorityRequest,
    BulkPriorityResponse,
    BulkPriorityResult,
    FailureRiskRequest,
    FailureRiskResponse,
    PredictionStatusSchema,
    PriorityRequest,
    PriorityResultSchema,
    PriorityFactorSchema,
    TrainImpactRequest,
    TrainImpactResponse,
)
from app.services.prediction_service import get_prediction_service

router = APIRouter()


def _to_schema(result) -> PriorityResultSchema:
    """Convert PriorityResult dataclass → Pydantic schema."""
    return PriorityResultSchema(
        priority_score=result.priority_score,
        priority_level=result.priority_level,
        factors=[
            PriorityFactorSchema(
                name=f.name,
                raw_value=f.raw_value,
                contribution=f.contribution,
                weight=f.weight,
                description=f.description,
            )
            for f in result.factors
        ],
        reason=result.reason,
        prediction_source=result.prediction_source,
        model_version=result.model_version,
        data_timestamp=result.data_timestamp,
        confidence=result.confidence,
    )


@router.post("/priority", response_model=PriorityResultSchema, summary="Compute priority score")
def compute_priority(payload: PriorityRequest, current_user=Depends(get_current_user)):
    """
    Compute a priority score for a single maintenance task.

    Returns a score (0–100), priority level, per-factor breakdown,
    and a human-readable explanation.

    [RULE_BASED_BASELINE] Deterministic — same input always produces same output.
    """
    svc = get_prediction_service()
    result = svc.compute_priority(
        priority=payload.priority,
        deadline=payload.deadline,
        estimated_duration_hours=payload.estimated_duration_hours,
        criticality_score=payload.criticality_score,
        asset_condition=payload.asset_condition,
        asset_type=payload.asset_type,
        age_years=payload.age_years,
        number_of_tracks=payload.number_of_tracks,
        section_type=payload.section_type,
    )
    return _to_schema(result)


@router.post("/priority/bulk", response_model=BulkPriorityResponse, summary="Bulk priority scoring")
def compute_priority_bulk(payload: BulkPriorityRequest, current_user=Depends(get_current_user)):
    """
    Compute priority scores for multiple tasks in a single request.

    Designed for the Stage 3B optimizer to rank all pending tasks
    before scheduling. Up to 500 tasks per request.

    [RULE_BASED_BASELINE]
    """
    svc = get_prediction_service()
    results = []
    for i, task in enumerate(payload.tasks):
        result = svc.compute_priority(
            priority=task.priority,
            deadline=task.deadline,
            estimated_duration_hours=task.estimated_duration_hours,
            criticality_score=task.criticality_score,
            asset_condition=task.asset_condition,
            asset_type=task.asset_type,
            age_years=task.age_years,
            number_of_tracks=task.number_of_tracks,
            section_type=task.section_type,
        )
        results.append(BulkPriorityResult(index=i, result=_to_schema(result)))

    return BulkPriorityResponse(
        results=results,
        total=len(results),
        prediction_source="RULE_BASED_BASELINE",
    )


@router.post("/failure-risk", response_model=FailureRiskResponse, summary="Predict failure risk")
def predict_failure_risk(payload: FailureRiskRequest, current_user=Depends(get_current_user)):
    """
    Predict the probability of asset failure (0.0–1.0).

    Used by maintenance planners to prioritize inspection of high-risk assets.

    [RULE_BASED_BASELINE] Based on condition + age heuristics.
    Not a trained ML model.
    """
    svc = get_prediction_service()
    output = svc.predict_failure_risk(
        condition=payload.condition,
        age_years=payload.age_years,
        maintenance_gap_days=payload.maintenance_gap_days,
    )
    return FailureRiskResponse(
        failure_probability=output.prediction,
        confidence=output.confidence,
        important_factors=output.important_factors,
        model_version=output.model_version,
        prediction_source=output.prediction_source.value,
    )


@router.post("/train-impact", response_model=TrainImpactResponse, summary="Predict train impact")
def predict_train_impact(payload: TrainImpactRequest, current_user=Depends(get_current_user)):
    """
    Predict how many train services a block window will affect.

    Stage 3C (ConflictEngine) uses this to evaluate the operational cost
    of each candidate block window before scheduling.

    [RULE_BASED_BASELINE]
    """
    svc = get_prediction_service()
    output = svc.predict_train_impact(
        block_duration_hours=payload.block_duration_hours,
        trains_per_day=payload.trains_per_day,
        number_of_tracks=payload.number_of_tracks,
    )
    return TrainImpactResponse(
        estimated_services_affected=output.prediction,
        confidence=output.confidence,
        important_factors=output.important_factors,
        model_version=output.model_version,
        prediction_source=output.prediction_source.value,
    )


@router.get("/models/status", response_model=PredictionStatusSchema, summary="ML model registry status")
def get_model_status(current_user=Depends(get_current_user)):
    """
    Return the status of all registered prediction models.

    In Stage 3A, all models are RULE_BASED_BASELINE.
    Future stages may register trained ML models here.
    """
    svc = get_prediction_service()
    status = svc.get_model_status()
    return PredictionStatusSchema(**status)
