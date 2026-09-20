"""
RAILBLOCK AI — Priority Engine

[RULE-BASED BASELINE]

Computes a deterministic, explainable priority score (0–100) for each
maintenance task. The calculation is based on six factors drawn from the
railway domain:

    1. Criticality       — Asset criticality score (0–10 scale, from DB)
    2. Urgency           — Deadline proximity (how overdue / near deadline)
    3. Failure Risk      — Derived from asset condition and age
    4. Asset Impact      — Type of asset (TRACK > BRIDGE > SIGNAL > ...)
    5. Overdue Factor    — Whether deadline has already passed
    6. Operational Impact — Track type and traffic density proxy

IMPLEMENTATION STATUS:
    RULE-BASED BASELINE — No ML model. All coefficients are configurable.
    MODEL-READY — The interface is designed to accept a future ML model
    that can replace or supplement this calculation without rewriting
    the domain layer.

IMPORTANT:
    All weights are documented and reasoned.
    No arbitrary magic numbers.
    The calculation is fully deterministic given the same inputs.
    Every score comes with a factor-level explanation.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Score Output Types
# ---------------------------------------------------------------------------

class PriorityLevel(str, Enum):
    """Priority classification from computed score."""
    CRITICAL = "CRITICAL"   # Score >= 75
    HIGH     = "HIGH"       # Score >= 50
    MEDIUM   = "MEDIUM"     # Score >= 25
    LOW      = "LOW"        # Score < 25


@dataclass
class PriorityFactor:
    """A single factor that contributed to the priority score."""
    name: str
    raw_value: float          # Input value before weighting
    contribution: float       # Points contributed (0–100 scale)
    weight: float             # Configured weight for this factor
    description: str          # Human-readable explanation


@dataclass
class PriorityResult:
    """
    Full priority calculation result.

    prediction_source is always "RULE_BASED_BASELINE" in Stage 3A.
    When an ML model replaces this engine, it will be "ML_MODEL_vX.Y".
    """
    priority_score: float              # 0–100, higher = more urgent
    priority_level: PriorityLevel      # CRITICAL / HIGH / MEDIUM / LOW
    factors: list[PriorityFactor]      # Breakdown of every contributing factor
    reason: str                        # Human-readable summary sentence
    prediction_source: str = "RULE_BASED_BASELINE"
    model_version: str = "1.0.0"
    data_timestamp: Optional[datetime] = None
    confidence: float = 1.0           # Rule-based = fully deterministic → 1.0


# ---------------------------------------------------------------------------
# Scoring Weights Configuration
# ---------------------------------------------------------------------------

@dataclass
class PriorityWeights:
    """
    Configurable weights for the six scoring factors.

    Sum must equal 1.0 to keep the output in the 0–100 range.

    Rationale (IR domain):
      - Criticality (0.30): The asset's inherent importance to rail safety
        is the dominant factor. A faulty bridge in a CRITICAL state ranks
        higher than a non-critical signal regardless of deadline.
      - Urgency (0.25): Deadline proximity is the second most important
        factor — safety timelines must be met.
      - Overdue Factor (0.20): A task already past its deadline is a
        compliance and safety violation. Separate from "urgency" so that
        both near-deadline and overdue states are captured.
      - Failure Risk (0.15): Condition + age proxy for probability of
        imminent failure, important but secondary to criticality.
      - Asset Impact (0.07): Asset type multiplier (track > bridge > ...).
      - Operational Impact (0.03): Section traffic density proxy.
        Lowest weight because it is a coarse estimate.
    """
    criticality:        float = 0.30
    urgency:            float = 0.25
    overdue_factor:     float = 0.20
    failure_risk:       float = 0.15
    asset_impact:       float = 0.07
    operational_impact: float = 0.03

    def validate(self) -> None:
        total = (self.criticality + self.urgency + self.overdue_factor +
                 self.failure_risk + self.asset_impact + self.operational_impact)
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"PriorityWeights must sum to 1.0, got {total:.6f}")


# Default weights — used unless overridden
DEFAULT_WEIGHTS = PriorityWeights()


# ---------------------------------------------------------------------------
# Sub-score Calculation Helpers
# ---------------------------------------------------------------------------

# Asset type impact multipliers (0–10)
# Track defects directly affect train safety → highest impact.
# Station buildings affect passenger safety but not train movement → lowest.
_ASSET_IMPACT_MAP: dict[str, float] = {
    "TRACK":                10.0,
    "BRIDGE":                9.0,
    "TUNNEL":                9.0,
    "POINT_AND_CROSSING":    8.5,
    "SIGNAL":                8.0,
    "LEVEL_CROSSING":        7.5,
    "OVERHEAD_EQUIPMENT":    7.0,
    "TRACTION_SUBSTATION":   6.5,
    "CULVERT":               5.5,
    "RETAINING_WALL":        5.0,
    "STATION_BUILDING":      3.0,
}

# Asset condition → failure risk score (0–10)
_CONDITION_RISK_MAP: dict[str, float] = {
    "OUT_OF_SERVICE": 10.0,
    "CRITICAL":        9.0,
    "POOR":            7.0,
    "FAIR":            4.0,
    "GOOD":            1.0,
}

# Priority enum → base urgency boost (used only when no deadline is available)
_PRIORITY_URGENCY_MAP: dict[str, float] = {
    "CRITICAL": 10.0,
    "HIGH":      7.0,
    "MEDIUM":    4.0,
    "LOW":       1.0,
}


def _compute_urgency(
    deadline: Optional[datetime],
    stored_priority: str,
    now: datetime,
) -> tuple[float, str]:
    """
    Compute urgency score (0–10) from deadline proximity.

    If no deadline is set, falls back to the stored priority enum.

    Rules:
        - Overdue by > 30 days → 10.0
        - Overdue (any)       → 8.0 + partial boost
        - Due within 1 day    → 9.5
        - Due within 3 days   → 8.0
        - Due within 7 days   → 7.0
        - Due within 14 days  → 5.5
        - Due within 30 days  → 3.5
        - Due within 90 days  → 2.0
        - No deadline         → from stored priority enum
    """
    if deadline is None:
        raw = _PRIORITY_URGENCY_MAP.get(stored_priority, 4.0)
        return raw, f"No deadline set; using stored priority ({stored_priority})"

    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    days_remaining = (deadline - now).total_seconds() / 86400

    if days_remaining < -30:
        return 10.0, f"Overdue by {abs(days_remaining):.0f} days (>30 days past deadline)"
    elif days_remaining < 0:
        partial = min(8.0 + abs(days_remaining) / 30 * 2.0, 10.0)
        return round(partial, 2), f"Overdue by {abs(days_remaining):.1f} days"
    elif days_remaining <= 1:
        return 9.5, "Due within 24 hours"
    elif days_remaining <= 3:
        return 8.0, f"Due within {days_remaining:.0f} days"
    elif days_remaining <= 7:
        return 7.0, f"Due within {days_remaining:.0f} days"
    elif days_remaining <= 14:
        return 5.5, f"Due in {days_remaining:.0f} days (within 2 weeks)"
    elif days_remaining <= 30:
        return 3.5, f"Due in {days_remaining:.0f} days (within 1 month)"
    elif days_remaining <= 90:
        return 2.0, f"Due in {days_remaining:.0f} days (within 3 months)"
    else:
        return 1.0, f"Due in {days_remaining:.0f} days (long-range)"


def _compute_overdue_factor(
    deadline: Optional[datetime],
    now: datetime,
) -> tuple[float, str]:
    """
    Compute overdue factor (0–10).
    Separate from urgency to give an additional boost to tasks already past deadline.
    """
    if deadline is None:
        return 0.0, "No deadline — overdue factor not applicable"

    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    days_overdue = (now - deadline).total_seconds() / 86400
    if days_overdue <= 0:
        return 0.0, "Not yet overdue"
    elif days_overdue <= 7:
        score = min(days_overdue / 7 * 7.0, 7.0)
        return round(score, 2), f"Overdue by {days_overdue:.1f} days"
    elif days_overdue <= 30:
        score = 7.0 + (days_overdue - 7) / 23 * 2.0
        return round(min(score, 9.0), 2), f"Overdue by {days_overdue:.1f} days"
    else:
        return 10.0, f"Severely overdue by {days_overdue:.0f} days"


def _compute_failure_risk(
    condition: Optional[str],
    age_years: Optional[float],
) -> tuple[float, str]:
    """
    Compute failure risk score (0–10) from condition and age.

    Age is used as a secondary modifier: old assets in poor condition are
    higher risk than new assets in the same condition.
    """
    condition_score = _CONDITION_RISK_MAP.get(condition or "GOOD", 1.0)

    # Age modifier: adds up to +2.0 for assets over 20 years
    if age_years is None:
        age_modifier = 0.0
        age_note = "age unknown"
    elif age_years < 5:
        age_modifier = 0.0
        age_note = f"{age_years:.0f}y old (new)"
    elif age_years < 10:
        age_modifier = 0.5
        age_note = f"{age_years:.0f}y old"
    elif age_years < 20:
        age_modifier = 1.0
        age_note = f"{age_years:.0f}y old"
    else:
        age_modifier = 2.0
        age_note = f"{age_years:.0f}y old (aged)"

    risk = min(condition_score + age_modifier, 10.0)
    desc = f"Condition={condition or 'GOOD'}, {age_note} → risk {risk:.1f}/10"
    return round(risk, 2), desc


def _compute_asset_impact(asset_type: Optional[str]) -> tuple[float, str]:
    """Asset type impact score (0–10)."""
    score = _ASSET_IMPACT_MAP.get(asset_type or "TRACK", 5.0)
    return score, f"Asset type={asset_type or 'UNKNOWN'} → impact {score}/10"


def _compute_operational_impact(
    number_of_tracks: Optional[int],
    section_type: Optional[str],
) -> tuple[float, str]:
    """
    Operational impact score (0–10).

    Single-track main line sections have highest operational impact because
    any block completely stops traffic on that section.
    """
    if section_type == "MAIN_LINE":
        base = 8.0 if (number_of_tracks or 2) <= 1 else 5.0
        note = f"MAIN_LINE, {number_of_tracks or '?'} track(s)"
    elif section_type == "BRANCH_LINE":
        base = 4.0
        note = "BRANCH_LINE"
    elif section_type == "GOODS_LINE":
        base = 3.0
        note = "GOODS_LINE"
    else:
        base = 2.0
        note = f"section_type={section_type or 'UNKNOWN'}"

    return round(base, 2), f"{note} → operational impact {base}/10"


# ---------------------------------------------------------------------------
# PriorityEngine
# ---------------------------------------------------------------------------

class PriorityEngine:
    """
    [RULE-BASED BASELINE] Deterministic, explainable maintenance priority scorer.

    Given a set of task and asset attributes, computes a priority_score (0–100),
    classifies it into a PriorityLevel, and returns a full factor breakdown.

    This engine:
        - Never uses random values
        - Produces identical output for identical input
        - Exposes every factor and its contribution
        - Is MODEL-READY: the interface is compatible with future ML models

    Future ML model integration:
        Replace this engine's _score() internals with a model.predict() call
        while keeping the same PriorityResult output structure.
    """

    def __init__(self, weights: Optional[PriorityWeights] = None):
        self.weights = weights or DEFAULT_WEIGHTS
        self.weights.validate()

    def score(
        self,
        *,
        # Task fields
        priority: str = "MEDIUM",
        deadline: Optional[datetime] = None,
        estimated_duration_hours: Optional[float] = None,
        # Asset fields
        criticality_score: float = 5.0,
        asset_condition: Optional[str] = None,
        asset_type: Optional[str] = None,
        age_years: Optional[float] = None,
        # Section fields
        number_of_tracks: Optional[int] = None,
        section_type: Optional[str] = None,
        # Timestamp for calculation
        now: Optional[datetime] = None,
    ) -> PriorityResult:
        """
        Compute a priority score for a maintenance task.

        Args:
            priority:           Stored Priority enum value (CRITICAL/HIGH/MEDIUM/LOW)
            deadline:           Task deadline (timezone-aware datetime or None)
            estimated_duration_hours: Expected work duration (informational)
            criticality_score:  Asset criticality 0–10 (from Asset.criticality_score)
            asset_condition:    AssetCondition enum value string
            asset_type:         AssetType enum value string
            age_years:          Asset age in years (from Asset.age_years)
            number_of_tracks:   Section track count (from Section.number_of_tracks)
            section_type:       SectionType enum value string
            now:                Override "current time" (useful for testing)

        Returns:
            PriorityResult with score, level, factors, and explanation.
        """
        now = now or datetime.now(timezone.utc)
        w = self.weights

        # ── Factor 1: Criticality (already 0–10 in DB) ──────────────────
        crit_raw = max(0.0, min(float(criticality_score), 10.0))
        crit_contribution = crit_raw * 10.0 * w.criticality  # max 30
        crit_factor = PriorityFactor(
            name="Asset Criticality",
            raw_value=crit_raw,
            contribution=round(crit_contribution, 3),
            weight=w.criticality,
            description=f"Asset criticality score={crit_raw:.1f}/10",
        )

        # ── Factor 2: Urgency (deadline proximity) ───────────────────────
        urg_raw, urg_desc = _compute_urgency(deadline, priority, now)
        urg_contribution = urg_raw * 10.0 * w.urgency  # max 25
        urg_factor = PriorityFactor(
            name="Deadline Urgency",
            raw_value=urg_raw,
            contribution=round(urg_contribution, 3),
            weight=w.urgency,
            description=urg_desc,
        )

        # ── Factor 3: Overdue Factor ──────────────────────────────────────
        over_raw, over_desc = _compute_overdue_factor(deadline, now)
        over_contribution = over_raw * 10.0 * w.overdue_factor  # max 20
        over_factor = PriorityFactor(
            name="Overdue Factor",
            raw_value=over_raw,
            contribution=round(over_contribution, 3),
            weight=w.overdue_factor,
            description=over_desc,
        )

        # ── Factor 4: Failure Risk ────────────────────────────────────────
        risk_raw, risk_desc = _compute_failure_risk(asset_condition, age_years)
        risk_contribution = risk_raw * 10.0 * w.failure_risk  # max 15
        risk_factor = PriorityFactor(
            name="Failure Risk",
            raw_value=risk_raw,
            contribution=round(risk_contribution, 3),
            weight=w.failure_risk,
            description=risk_desc,
        )

        # ── Factor 5: Asset Impact ────────────────────────────────────────
        impact_raw, impact_desc = _compute_asset_impact(asset_type)
        impact_contribution = impact_raw * 10.0 * w.asset_impact  # max 7
        impact_factor = PriorityFactor(
            name="Asset Impact",
            raw_value=impact_raw,
            contribution=round(impact_contribution, 3),
            weight=w.asset_impact,
            description=impact_desc,
        )

        # ── Factor 6: Operational Impact ─────────────────────────────────
        ops_raw, ops_desc = _compute_operational_impact(number_of_tracks, section_type)
        ops_contribution = ops_raw * 10.0 * w.operational_impact  # max 3
        ops_factor = PriorityFactor(
            name="Operational Impact",
            raw_value=ops_raw,
            contribution=round(ops_contribution, 3),
            weight=w.operational_impact,
            description=ops_desc,
        )

        # ── Total score ───────────────────────────────────────────────────
        raw_score = (
            crit_contribution + urg_contribution + over_contribution +
            risk_contribution + impact_contribution + ops_contribution
        )
        priority_score = round(min(max(raw_score, 0.0), 100.0), 2)

        # ── Classify level ────────────────────────────────────────────────
        if priority_score >= 75:
            level = PriorityLevel.CRITICAL
        elif priority_score >= 50:
            level = PriorityLevel.HIGH
        elif priority_score >= 25:
            level = PriorityLevel.MEDIUM
        else:
            level = PriorityLevel.LOW

        # ── Generate explanation sentence ─────────────────────────────────
        top_factors = sorted(
            [crit_factor, urg_factor, over_factor, risk_factor, impact_factor, ops_factor],
            key=lambda f: f.contribution,
            reverse=True,
        )[:2]
        top_names = " and ".join(f.name for f in top_factors)
        reason = (
            f"Priority score {priority_score:.1f}/100 ({level.value}). "
            f"Main drivers: {top_names}. "
            f"{top_factors[0].description}."
        )

        all_factors = [crit_factor, urg_factor, over_factor, risk_factor, impact_factor, ops_factor]

        logger.debug(
            "priority_scored",
            score=priority_score,
            level=level.value,
            top_factor=top_factors[0].name,
        )

        return PriorityResult(
            priority_score=priority_score,
            priority_level=level,
            factors=all_factors,
            reason=reason,
            prediction_source="RULE_BASED_BASELINE",
            model_version="1.0.0",
            data_timestamp=now,
            confidence=1.0,
        )

    @staticmethod
    def level_from_score(score: float) -> PriorityLevel:
        """Classify a raw score without recomputing all factors."""
        if score >= 75:
            return PriorityLevel.CRITICAL
        elif score >= 50:
            return PriorityLevel.HIGH
        elif score >= 25:
            return PriorityLevel.MEDIUM
        return PriorityLevel.LOW
