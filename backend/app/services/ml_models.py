"""
RAILBLOCK AI — ML Model Abstraction Layer

[MODEL-READY ARCHITECTURE]

Defines the clean interface between domain services and ML models.
No actual ML models are trained or loaded in Stage 3A.
This file provides:

    1. PredictionInput      — Standard input dataclass for any ML model
    2. PredictionOutput     — Standard output dataclass for any ML model
    3. BaseMLModel          — Abstract Protocol that all future models must implement
    4. RuleBasedBaseline    — Reference implementation (deterministic, no ML)
    5. ModelRegistry        — Central registry for model lookup and hot-swap

IMPLEMENTATION STATUS:
    MODEL-READY — Interfaces are fully defined and tested.
    RULE_BASED_BASELINE — The concrete implementation uses rule-based logic only.
    NO ML MODEL — No XGBoost, RF, or neural network is loaded.
    FUTURE: Any of these models can be registered without changing domain code:
        - XGBoost regressor for failure risk
        - Random Forest for maintenance duration
        - Gradient Boosting for train impact prediction
        - Logistic Regression for priority classification

IMPORTANT:
    Do not pretend that RuleBasedBaseline is a trained ML model.
    prediction_source always reflects the actual computation method.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional, Protocol, runtime_checkable

import structlog

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Prediction Source Labels — always truthful
# ---------------------------------------------------------------------------

class PredictionSource(str, Enum):
    """
    Identifies how a prediction was computed.
    This must always reflect the actual computation method.
    """
    RULE_BASED_BASELINE  = "RULE_BASED_BASELINE"   # Deterministic rule-based logic
    XGBOOST              = "XGBOOST"                # Future: XGBoost model
    RANDOM_FOREST        = "RANDOM_FOREST"          # Future: Random Forest
    GRADIENT_BOOSTING    = "GRADIENT_BOOSTING"      # Future: Gradient Boosting
    LOGISTIC_REGRESSION  = "LOGISTIC_REGRESSION"    # Future: Logistic Regression
    SIMULATED            = "SIMULATED"              # Synthetic test prediction


# ---------------------------------------------------------------------------
# Prediction Task Types
# ---------------------------------------------------------------------------

class PredictionTask(str, Enum):
    """
    The category of prediction being made.
    Each task type has its own input schema conventions.
    """
    FAILURE_RISK              = "FAILURE_RISK"
    MAINTENANCE_DURATION      = "MAINTENANCE_DURATION"
    TRAIN_IMPACT              = "TRAIN_IMPACT"
    GOODS_TRAFFIC_FORECAST    = "GOODS_TRAFFIC_FORECAST"
    PRIORITY_CLASSIFICATION   = "PRIORITY_CLASSIFICATION"


# ---------------------------------------------------------------------------
# Standard Input / Output Contracts
# ---------------------------------------------------------------------------

@dataclass
class PredictionInput:
    """
    Standard input for any ML model or rule-based prediction.

    All fields are optional because different task types use different subsets.
    The `task_type` field tells the model what it is being asked to predict.
    The `features` dict carries any task-specific numeric features.
    """
    task_type: PredictionTask

    # Raw feature values (keyed by feature name, value must be numeric or None)
    features: dict[str, Optional[float]] = field(default_factory=dict)

    # Context (non-numeric, for logging/tracing — not used in computation)
    context: dict[str, Any] = field(default_factory=dict)

    # Timestamp of the source data used to build this input
    data_timestamp: Optional[datetime] = None


@dataclass
class PredictionOutput:
    """
    Standard output for any ML model or rule-based prediction.

    prediction:         The primary prediction value (numeric).
    confidence:         0.0–1.0. For rule-based: always 1.0 (deterministic).
                        For ML: model confidence or probability score.
    important_factors:  Ordered list of (feature_name, contribution) tuples.
    data_timestamp:     When the source data was collected.
    model_version:      Identifies the model or rule version.
    prediction_source:  ALWAYS truthful — reflects actual computation method.
    metadata:           Any additional model-specific information.
    """
    prediction: float
    confidence: float
    important_factors: list[tuple[str, float]]
    data_timestamp: Optional[datetime]
    model_version: str
    prediction_source: PredictionSource
    metadata: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# BaseMLModel Protocol
# ---------------------------------------------------------------------------

@runtime_checkable
class BaseMLModel(Protocol):
    """
    Protocol (interface) that all ML models and baselines must implement.

    Structural typing: a class satisfies this Protocol if it has these
    attributes and methods — no explicit inheritance needed.

    Future models must implement:
        predict(input) → PredictionOutput
        can_handle(task_type) → bool
        model_version → str
        prediction_source → PredictionSource
    """

    @property
    def model_version(self) -> str:
        """Version string, e.g. '1.0.0' or 'xgb-v2.3.1'."""
        ...

    @property
    def prediction_source(self) -> PredictionSource:
        """Always reflects the actual computation method."""
        ...

    def can_handle(self, task_type: PredictionTask) -> bool:
        """Returns True if this model can handle the given task type."""
        ...

    def predict(self, input_data: PredictionInput) -> PredictionOutput:
        """
        Run prediction on the given input.
        Must be synchronous (async wrappers live in the service layer).
        """
        ...


# ---------------------------------------------------------------------------
# Rule-Based Baseline Models
# ---------------------------------------------------------------------------

class FailureRiskBaseline:
    """
    [RULE_BASED_BASELINE] Failure risk predictor.

    Combines asset condition and age into a 0–1 failure probability estimate.
    This is not a trained model — it is a validated domain heuristic.

    Inputs expected in features dict:
        condition_score  — numeric condition (0=GOOD, 2.5=FAIR, 5=POOR, 7.5=CRITICAL, 10=OUT_OF_SERVICE)
        age_years        — asset age in years
        maintenance_gap_days — days since last maintenance (optional)
    """
    model_version: str = "rule-1.0.0"
    prediction_source: PredictionSource = PredictionSource.RULE_BASED_BASELINE

    def can_handle(self, task_type: PredictionTask) -> bool:
        return task_type == PredictionTask.FAILURE_RISK

    def predict(self, input_data: PredictionInput) -> PredictionOutput:
        f = input_data.features
        condition_score = f.get("condition_score") or 1.0
        age_years = f.get("age_years") or 0.0
        gap_days = f.get("maintenance_gap_days") or 0.0

        # Condition is the dominant factor (0–10 → 0–0.7)
        condition_prob = min(condition_score / 10.0 * 0.70, 0.70)

        # Age modifier: adds up to 0.15 for 20+ year old assets
        age_prob = min(age_years / 20.0 * 0.15, 0.15)

        # Maintenance gap modifier: adds up to 0.15 for >365 days without maintenance
        gap_prob = min(gap_days / 365.0 * 0.15, 0.15)

        failure_prob = round(min(condition_prob + age_prob + gap_prob, 1.0), 4)

        factors = [
            ("condition", round(condition_prob, 4)),
            ("age",       round(age_prob, 4)),
            ("gap",       round(gap_prob, 4)),
        ]

        return PredictionOutput(
            prediction=failure_prob,
            confidence=1.0,
            important_factors=factors,
            data_timestamp=input_data.data_timestamp,
            model_version=self.model_version,
            prediction_source=self.prediction_source,
            metadata={
                "interpretation": f"Estimated failure probability: {failure_prob:.1%}",
                "note": "[RULE_BASED_BASELINE] Not a trained ML model.",
            },
        )


class MaintenanceDurationBaseline:
    """
    [RULE_BASED_BASELINE] Maintenance duration estimator.

    Estimates work duration in hours from asset type, condition, and gang size.
    Used as a fallback when no task-specific estimate is recorded.

    Inputs expected in features dict:
        asset_type_score  — numeric (see _DURATION_BASE_MAP)
        condition_score   — numeric (0–10)
        gang_size         — number of workers
        requires_block    — 1.0 if block required, 0.0 otherwise
    """
    model_version: str = "rule-1.0.0"
    prediction_source: PredictionSource = PredictionSource.RULE_BASED_BASELINE

    # Base duration hours by asset type complexity
    _BASE_DURATION: dict[str, float] = {
        "TRACK": 4.0, "BRIDGE": 8.0, "TUNNEL": 6.0,
        "SIGNAL": 3.0, "POINT_AND_CROSSING": 5.0,
        "OVERHEAD_EQUIPMENT": 4.0, "TRACTION_SUBSTATION": 6.0,
        "LEVEL_CROSSING": 3.0, "CULVERT": 4.0,
        "RETAINING_WALL": 5.0, "STATION_BUILDING": 2.0,
    }

    def can_handle(self, task_type: PredictionTask) -> bool:
        return task_type == PredictionTask.MAINTENANCE_DURATION

    def predict(self, input_data: PredictionInput) -> PredictionOutput:
        f = input_data.features
        asset_type = input_data.context.get("asset_type", "TRACK")
        condition_score = f.get("condition_score") or 1.0
        gang_size = max(f.get("gang_size") or 4.0, 1.0)
        requires_block = f.get("requires_block") or 0.0

        base = self._BASE_DURATION.get(asset_type, 4.0)

        # Worse condition → more work time (up to 2x for CRITICAL)
        condition_factor = 1.0 + (condition_score / 10.0)

        # Block overhead: 0.5h setup + teardown
        block_overhead = 0.5 if requires_block else 0.0

        # Gang efficiency: diminishing returns above 6 workers
        gang_factor = max(1.0, math.log2(gang_size + 1))

        estimated = base * condition_factor / math.log(gang_factor + math.e) + block_overhead
        estimated = round(max(0.5, estimated), 2)

        factors = [
            ("asset_type_base", round(base, 2)),
            ("condition_multiplier", round(condition_factor, 4)),
            ("block_overhead", block_overhead),
        ]

        return PredictionOutput(
            prediction=estimated,
            confidence=0.70,  # Rule-based duration estimates have moderate confidence
            important_factors=factors,
            data_timestamp=input_data.data_timestamp,
            model_version=self.model_version,
            prediction_source=self.prediction_source,
            metadata={
                "interpretation": f"Estimated duration: {estimated:.1f} hours",
                "note": "[RULE_BASED_BASELINE] Not a trained ML model.",
            },
        )


class TrainImpactBaseline:
    """
    [RULE_BASED_BASELINE] Train impact estimator.

    Estimates how many train services a block window would affect.
    Uses section type, number of tracks, and estimated block duration.

    Inputs in features dict:
        block_duration_hours  — duration of the maintenance block
        trains_per_day        — scheduled trains on this section per day
        number_of_tracks      — number of parallel tracks
    """
    model_version: str = "rule-1.0.0"
    prediction_source: PredictionSource = PredictionSource.RULE_BASED_BASELINE

    def can_handle(self, task_type: PredictionTask) -> bool:
        return task_type == PredictionTask.TRAIN_IMPACT

    def predict(self, input_data: PredictionInput) -> PredictionOutput:
        f = input_data.features
        duration = f.get("block_duration_hours") or 4.0
        trains_per_day = f.get("trains_per_day") or 20.0
        num_tracks = max(f.get("number_of_tracks") or 1.0, 1.0)

        # Trains affected per hour, reduced by track count (partial diversion possible)
        trains_per_hour = trains_per_day / 24.0
        diversion_factor = 1.0 / num_tracks  # multi-track = partial impact
        affected = round(trains_per_hour * duration * diversion_factor, 1)

        factors = [
            ("trains_per_hour", round(trains_per_hour, 2)),
            ("block_duration_hours", duration),
            ("diversion_factor", round(diversion_factor, 2)),
        ]

        return PredictionOutput(
            prediction=affected,
            confidence=0.65,
            important_factors=factors,
            data_timestamp=input_data.data_timestamp,
            model_version=self.model_version,
            prediction_source=self.prediction_source,
            metadata={
                "interpretation": f"Estimated {affected:.0f} train services affected",
                "note": "[RULE_BASED_BASELINE] Not a trained ML model.",
            },
        )


# ---------------------------------------------------------------------------
# Model Registry
# ---------------------------------------------------------------------------

class ModelRegistry:
    """
    Central registry for ML models and rule-based baselines.

    Supports:
        - Registering models by task type
        - Retrieving the best available model for a task
        - Falling back to the rule-based baseline when no ML model exists

    Usage:
        registry = ModelRegistry.default()
        model = registry.get_model(PredictionTask.FAILURE_RISK)
        output = model.predict(input_data)
    """

    def __init__(self):
        self._models: dict[PredictionTask, list[BaseMLModel]] = {}

    def register(self, model: BaseMLModel, task_type: PredictionTask) -> None:
        """Register a model for a given task type. Later registrations take priority."""
        if task_type not in self._models:
            self._models[task_type] = []
        self._models[task_type].append(model)
        logger.info(
            "model_registered",
            task=task_type.value,
            model=model.model_version,
            source=model.prediction_source.value,
        )

    def get_model(self, task_type: PredictionTask) -> Optional[BaseMLModel]:
        """
        Get the most recently registered model for a task type.
        Returns None if no model is registered.
        """
        models = self._models.get(task_type, [])
        return models[-1] if models else None

    def list_models(self) -> dict[str, str]:
        """List all registered models keyed by task type."""
        return {
            task.value: model[-1].model_version
            for task, model in self._models.items()
            if model
        }

    @classmethod
    def default(cls) -> "ModelRegistry":
        """
        Create a registry pre-populated with all rule-based baselines.

        [RULE_BASED_BASELINE] — No trained ML models.
        When real training data and model files are available, register
        the trained models here to replace the baselines automatically.
        """
        registry = cls()
        registry.register(FailureRiskBaseline(), PredictionTask.FAILURE_RISK)
        registry.register(MaintenanceDurationBaseline(), PredictionTask.MAINTENANCE_DURATION)
        registry.register(TrainImpactBaseline(), PredictionTask.TRAIN_IMPACT)
        return registry


# Module-level singleton — use this unless you need a custom registry
_DEFAULT_REGISTRY: Optional[ModelRegistry] = None


def get_default_registry() -> ModelRegistry:
    """Get or create the module-level default model registry."""
    global _DEFAULT_REGISTRY
    if _DEFAULT_REGISTRY is None:
        _DEFAULT_REGISTRY = ModelRegistry.default()
    return _DEFAULT_REGISTRY
