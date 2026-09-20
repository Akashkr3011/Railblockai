"""
RAILBLOCK AI — Prediction Service

Service boundary between domain code (API routes, optimization engine)
and ML models / rule-based baselines.

IMPORTANT:
    ML logic MUST NOT be placed in API routes.
    All prediction calls go through this service.
    Stage 3B and 3C consume this service, not the model classes directly.

IMPLEMENTATION STATUS:
    RULE_BASED_BASELINE — All predictions use validated rule-based logic.
    MODEL-READY — Interface supports future ML model swap-in via ModelRegistry.
    No ML training data required for this stage.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import structlog

from app.services.ml_models import (
    ModelRegistry,
    PredictionInput,
    PredictionOutput,
    PredictionTask,
    PredictionSource,
    get_default_registry,
)
from app.services.priority_engine import (
    PriorityEngine,
    PriorityResult,
    PriorityWeights,
)

logger = structlog.get_logger(__name__)


class PredictionService:
    """
    Service boundary for all AI/ML predictions in RAILBLOCK AI.

    Consumers (API routes, optimization services, tests) interact with
    this service — never with model classes directly.

    Provides:
        - predict_failure_risk()      → probability 0–1
        - predict_maintenance_duration() → hours
        - predict_train_impact()      → estimated services affected
        - compute_priority()          → full PriorityResult from PriorityEngine

    All predictions carry truthful `prediction_source` labels.
    """

    def __init__(
        self,
        registry: Optional[ModelRegistry] = None,
        priority_engine: Optional[PriorityEngine] = None,
    ):
        self._registry = registry or get_default_registry()
        self._priority = priority_engine or PriorityEngine()

    # ─────────────────────────────────────────────────────────────────────
    # Priority Scoring
    # ─────────────────────────────────────────────────────────────────────

    def compute_priority(
        self,
        *,
        priority: str = "MEDIUM",
        deadline: Optional[datetime] = None,
        estimated_duration_hours: Optional[float] = None,
        criticality_score: float = 5.0,
        asset_condition: Optional[str] = None,
        asset_type: Optional[str] = None,
        age_years: Optional[float] = None,
        number_of_tracks: Optional[int] = None,
        section_type: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> PriorityResult:
        """
        Compute a priority score for a maintenance task.

        [RULE_BASED_BASELINE] — Deterministic, explainable, no ML model.
        Returns a full PriorityResult with score, level, and factor breakdown.

        This method is the primary entry point for Stage 3's optimizer
        to rank maintenance tasks before scheduling.
        """
        result = self._priority.score(
            priority=priority,
            deadline=deadline,
            estimated_duration_hours=estimated_duration_hours,
            criticality_score=criticality_score,
            asset_condition=asset_condition,
            asset_type=asset_type,
            age_years=age_years,
            number_of_tracks=number_of_tracks,
            section_type=section_type,
            now=now,
        )
        logger.info(
            "priority_computed",
            score=result.priority_score,
            level=result.priority_level.value,
            source=result.prediction_source,
        )
        return result

    # ─────────────────────────────────────────────────────────────────────
    # Failure Risk Prediction
    # ─────────────────────────────────────────────────────────────────────

    def predict_failure_risk(
        self,
        *,
        condition: Optional[str] = None,
        age_years: Optional[float] = None,
        maintenance_gap_days: Optional[float] = None,
        now: Optional[datetime] = None,
    ) -> PredictionOutput:
        """
        Predict probability of asset failure (0.0–1.0).

        [RULE_BASED_BASELINE] in Stage 3A.
        MODEL-READY: When an XGBoost or RF model is registered in ModelRegistry
        for FAILURE_RISK, this method will automatically use it instead.
        """
        now = now or datetime.now(timezone.utc)

        # Map condition string → numeric score
        _condition_map = {
            "OUT_OF_SERVICE": 10.0, "CRITICAL": 7.5,
            "POOR": 5.0, "FAIR": 2.5, "GOOD": 1.0,
        }
        condition_score = _condition_map.get(condition or "GOOD", 1.0)

        input_data = PredictionInput(
            task_type=PredictionTask.FAILURE_RISK,
            features={
                "condition_score": condition_score,
                "age_years": age_years,
                "maintenance_gap_days": maintenance_gap_days,
            },
            context={"condition": condition},
            data_timestamp=now,
        )

        model = self._registry.get_model(PredictionTask.FAILURE_RISK)
        if model is None:
            logger.warning("no_failure_risk_model", fallback="zero_prediction")
            return PredictionOutput(
                prediction=0.0,
                confidence=0.0,
                important_factors=[],
                data_timestamp=now,
                model_version="none",
                prediction_source=PredictionSource.RULE_BASED_BASELINE,
                metadata={"note": "No model registered for FAILURE_RISK"},
            )

        return model.predict(input_data)

    # ─────────────────────────────────────────────────────────────────────
    # Maintenance Duration Prediction
    # ─────────────────────────────────────────────────────────────────────

    def predict_maintenance_duration(
        self,
        *,
        asset_type: Optional[str] = None,
        condition: Optional[str] = None,
        gang_size: Optional[int] = None,
        requires_block: bool = True,
        now: Optional[datetime] = None,
    ) -> PredictionOutput:
        """
        Predict estimated maintenance duration in hours.

        [RULE_BASED_BASELINE] in Stage 3A.
        Used as a fallback when no task-specific estimate is stored.
        """
        now = now or datetime.now(timezone.utc)

        _condition_map = {
            "OUT_OF_SERVICE": 10.0, "CRITICAL": 7.5,
            "POOR": 5.0, "FAIR": 2.5, "GOOD": 1.0,
        }

        input_data = PredictionInput(
            task_type=PredictionTask.MAINTENANCE_DURATION,
            features={
                "condition_score": _condition_map.get(condition or "GOOD", 1.0),
                "gang_size": float(gang_size) if gang_size else 4.0,
                "requires_block": 1.0 if requires_block else 0.0,
            },
            context={"asset_type": asset_type or "TRACK"},
            data_timestamp=now,
        )

        model = self._registry.get_model(PredictionTask.MAINTENANCE_DURATION)
        if model is None:
            logger.warning("no_duration_model")
            return PredictionOutput(
                prediction=4.0, confidence=0.0, important_factors=[],
                data_timestamp=now, model_version="none",
                prediction_source=PredictionSource.RULE_BASED_BASELINE,
                metadata={"note": "No model registered; returning default 4h"},
            )

        return model.predict(input_data)

    # ─────────────────────────────────────────────────────────────────────
    # Train Impact Prediction
    # ─────────────────────────────────────────────────────────────────────

    def predict_train_impact(
        self,
        *,
        block_duration_hours: float = 4.0,
        trains_per_day: Optional[int] = None,
        number_of_tracks: Optional[int] = None,
        now: Optional[datetime] = None,
    ) -> PredictionOutput:
        """
        Predict how many train services a block window will affect.

        [RULE_BASED_BASELINE] in Stage 3A.
        Stage 3C (ConflictEngine) will use this when checking schedule feasibility.
        """
        now = now or datetime.now(timezone.utc)

        input_data = PredictionInput(
            task_type=PredictionTask.TRAIN_IMPACT,
            features={
                "block_duration_hours": block_duration_hours,
                "trains_per_day": float(trains_per_day) if trains_per_day else 20.0,
                "number_of_tracks": float(number_of_tracks) if number_of_tracks else 1.0,
            },
            context={},
            data_timestamp=now,
        )

        model = self._registry.get_model(PredictionTask.TRAIN_IMPACT)
        if model is None:
            logger.warning("no_train_impact_model")
            return PredictionOutput(
                prediction=0.0, confidence=0.0, important_factors=[],
                data_timestamp=now, model_version="none",
                prediction_source=PredictionSource.RULE_BASED_BASELINE,
                metadata={"note": "No model registered for TRAIN_IMPACT"},
            )

        return model.predict(input_data)

    # ─────────────────────────────────────────────────────────────────────
    # Registry Status
    # ─────────────────────────────────────────────────────────────────────

    def get_model_status(self) -> dict:
        """
        Return the status of all registered models.
        Used by /api/v1/health or a dedicated /ai/models endpoint.
        """
        return {
            "registered_models": self._registry.list_models(),
            "prediction_source": PredictionSource.RULE_BASED_BASELINE.value,
            "note": (
                "[RULE_BASED_BASELINE] No trained ML models loaded. "
                "All predictions use validated rule-based logic. "
                "This is expected for Stage 3A."
            ),
        }


# Module-level singleton for use across the application
_DEFAULT_PREDICTION_SERVICE: Optional[PredictionService] = None


def get_prediction_service() -> PredictionService:
    """Get or create the module-level default PredictionService."""
    global _DEFAULT_PREDICTION_SERVICE
    if _DEFAULT_PREDICTION_SERVICE is None:
        _DEFAULT_PREDICTION_SERVICE = PredictionService()
    return _DEFAULT_PREDICTION_SERVICE
