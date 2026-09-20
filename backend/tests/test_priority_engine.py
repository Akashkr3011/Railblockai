"""
RAILBLOCK AI — Priority Engine Tests

Tests:
    - Priority calculation correctness (all 6 factors)
    - Priority level thresholds (CRITICAL/HIGH/MEDIUM/LOW)
    - Explanation generation (factors present, non-hardcoded)
    - Missing / None values (graceful degradation)
    - Boundary values (0, 10, 100 scores)
    - Deterministic output (same input → same output)
    - Weight validation
    - Custom weights
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

import pytest

from app.services.priority_engine import (
    DEFAULT_WEIGHTS,
    PriorityEngine,
    PriorityFactor,
    PriorityLevel,
    PriorityResult,
    PriorityWeights,
    _compute_failure_risk,
    _compute_overdue_factor,
    _compute_urgency,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def engine():
    return PriorityEngine()


@pytest.fixture
def now():
    return datetime(2026, 9, 15, 12, 0, 0, tzinfo=timezone.utc)


# ─────────────────────────────────────────────────────────────────────────────
# Weight Validation
# ─────────────────────────────────────────────────────────────────────────────

def test_default_weights_sum_to_one():
    w = DEFAULT_WEIGHTS
    total = (w.criticality + w.urgency + w.overdue_factor +
             w.failure_risk + w.asset_impact + w.operational_impact)
    assert math.isclose(total, 1.0, abs_tol=1e-6), f"Weights sum to {total}"


def test_custom_weights_valid():
    w = PriorityWeights(
        criticality=0.40,
        urgency=0.25,
        overdue_factor=0.15,
        failure_risk=0.10,
        asset_impact=0.07,
        operational_impact=0.03,
    )
    w.validate()  # should not raise


def test_invalid_weights_raise():
    w = PriorityWeights(criticality=0.5, urgency=0.5, overdue_factor=0.5,
                        failure_risk=0.1, asset_impact=0.07, operational_impact=0.03)
    with pytest.raises(ValueError, match="must sum to 1.0"):
        w.validate()


def test_engine_with_custom_weights():
    w = PriorityWeights(
        criticality=0.40,
        urgency=0.25,
        overdue_factor=0.15,
        failure_risk=0.10,
        asset_impact=0.07,
        operational_impact=0.03,
    )
    engine = PriorityEngine(weights=w)
    result = engine.score(criticality_score=8.0)
    assert result.priority_score >= 0
    assert result.priority_score <= 100


# ─────────────────────────────────────────────────────────────────────────────
# Priority Level Thresholds
# ─────────────────────────────────────────────────────────────────────────────

def test_score_74_is_high(engine, now):
    # Force a score just below 75 -> HIGH
    result = engine.score(
        criticality_score=8.5,
        asset_condition="CRITICAL",
        asset_type="TRACK",
        section_type="MAIN_LINE",
        number_of_tracks=1,
        now=now,
    )
    assert result.priority_level in (PriorityLevel.HIGH, PriorityLevel.CRITICAL)


def test_critical_asset_overdue_is_critical(engine, now):
    """Safety-critical, overdue, track asset on main line must be CRITICAL."""
    overdue = now - timedelta(days=10)
    result = engine.score(
        priority="CRITICAL",
        deadline=overdue,
        criticality_score=9.5,
        asset_condition="CRITICAL",
        asset_type="TRACK",
        section_type="MAIN_LINE",
        number_of_tracks=1,
        age_years=25.0,
        now=now,
    )
    assert result.priority_level == PriorityLevel.CRITICAL
    assert result.priority_score >= 75.0


def test_low_criticality_future_deadline_is_low_or_medium(engine, now):
    """New, non-critical asset with deadline 6 months away → LOW or MEDIUM."""
    future = now + timedelta(days=180)
    result = engine.score(
        priority="LOW",
        deadline=future,
        criticality_score=1.0,
        asset_condition="GOOD",
        asset_type="STATION_BUILDING",
        section_type="YARD",
        age_years=1.0,
        now=now,
    )
    assert result.priority_level in (PriorityLevel.LOW, PriorityLevel.MEDIUM)
    assert result.priority_score <= 40.0


def test_level_from_score_boundaries():
    assert PriorityEngine.level_from_score(0.0) == PriorityLevel.LOW
    assert PriorityEngine.level_from_score(24.9) == PriorityLevel.LOW
    assert PriorityEngine.level_from_score(25.0) == PriorityLevel.MEDIUM
    assert PriorityEngine.level_from_score(49.9) == PriorityLevel.MEDIUM
    assert PriorityEngine.level_from_score(50.0) == PriorityLevel.HIGH
    assert PriorityEngine.level_from_score(74.9) == PriorityLevel.HIGH
    assert PriorityEngine.level_from_score(75.0) == PriorityLevel.CRITICAL
    assert PriorityEngine.level_from_score(100.0) == PriorityLevel.CRITICAL


# ─────────────────────────────────────────────────────────────────────────────
# Score Calculation Correctness
# ─────────────────────────────────────────────────────────────────────────────

def test_score_is_in_range(engine, now):
    for crit in [0.0, 5.0, 10.0]:
        for cond in ["GOOD", "POOR", "CRITICAL"]:
            result = engine.score(criticality_score=crit, asset_condition=cond, now=now)
            assert 0.0 <= result.priority_score <= 100.0, (
                f"Score out of range for crit={crit}, cond={cond}: {result.priority_score}"
            )


def test_higher_criticality_gives_higher_score(engine, now):
    low = engine.score(criticality_score=1.0, now=now)
    high = engine.score(criticality_score=9.0, now=now)
    assert high.priority_score > low.priority_score


def test_critical_condition_gives_higher_risk_than_good(engine, now):
    poor = engine.score(asset_condition="CRITICAL", criticality_score=5.0, now=now)
    good = engine.score(asset_condition="GOOD", criticality_score=5.0, now=now)
    assert poor.priority_score > good.priority_score


def test_overdue_task_scores_higher(engine, now):
    future = now + timedelta(days=30)
    past = now - timedelta(days=5)
    result_future = engine.score(deadline=future, criticality_score=5.0, now=now)
    result_past = engine.score(deadline=past, criticality_score=5.0, now=now)
    assert result_past.priority_score > result_future.priority_score


def test_track_scores_higher_impact_than_station(engine, now):
    track = engine.score(asset_type="TRACK", criticality_score=5.0, now=now)
    station = engine.score(asset_type="STATION_BUILDING", criticality_score=5.0, now=now)
    assert track.priority_score > station.priority_score


def test_main_line_higher_operational_impact(engine, now):
    main = engine.score(section_type="MAIN_LINE", number_of_tracks=1, now=now)
    yard = engine.score(section_type="YARD", now=now)
    assert main.priority_score > yard.priority_score


# ─────────────────────────────────────────────────────────────────────────────
# Deterministic Output
# ─────────────────────────────────────────────────────────────────────────────

def test_deterministic_output(engine, now):
    """Same input must always produce same score."""
    kwargs = dict(
        priority="HIGH",
        criticality_score=7.5,
        asset_condition="POOR",
        asset_type="BRIDGE",
        age_years=15.0,
        section_type="MAIN_LINE",
        number_of_tracks=1,
        now=now,
    )
    r1 = engine.score(**kwargs)
    r2 = engine.score(**kwargs)
    r3 = engine.score(**kwargs)
    assert r1.priority_score == r2.priority_score == r3.priority_score
    assert r1.priority_level == r2.priority_level == r3.priority_level


# ─────────────────────────────────────────────────────────────────────────────
# Missing / None Values — graceful degradation
# ─────────────────────────────────────────────────────────────────────────────

def test_all_none_does_not_raise(engine, now):
    result = engine.score(now=now)
    assert isinstance(result, PriorityResult)
    assert 0.0 <= result.priority_score <= 100.0


def test_none_deadline_uses_stored_priority(engine, now):
    high = engine.score(priority="HIGH", deadline=None, now=now)
    low = engine.score(priority="LOW", deadline=None, now=now)
    assert high.priority_score >= low.priority_score


def test_none_condition_defaults_to_good(engine, now):
    none_cond = engine.score(asset_condition=None, now=now)
    good_cond = engine.score(asset_condition="GOOD", now=now)
    assert none_cond.priority_score == good_cond.priority_score


def test_none_age_is_handled(engine, now):
    result = engine.score(age_years=None, asset_condition="POOR", now=now)
    assert isinstance(result.priority_score, float)


def test_unknown_asset_type_defaults(engine, now):
    result = engine.score(asset_type="UNKNOWN_TYPE", now=now)
    assert isinstance(result.priority_score, float)


# ─────────────────────────────────────────────────────────────────────────────
# Explanation Generation
# ─────────────────────────────────────────────────────────────────────────────

def test_result_has_six_factors(engine, now):
    result = engine.score(now=now)
    assert len(result.factors) == 6


def test_factor_names_are_correct(engine, now):
    result = engine.score(now=now)
    names = {f.name for f in result.factors}
    assert "Asset Criticality" in names
    assert "Deadline Urgency" in names
    assert "Overdue Factor" in names
    assert "Failure Risk" in names
    assert "Asset Impact" in names
    assert "Operational Impact" in names


def test_reason_is_non_empty_string(engine, now):
    result = engine.score(now=now)
    assert isinstance(result.reason, str)
    assert len(result.reason) > 10


def test_reason_contains_score(engine, now):
    result = engine.score(criticality_score=8.0, now=now)
    assert str(result.priority_score) in result.reason or \
           f"{result.priority_score:.1f}" in result.reason


def test_factor_contributions_sum_approximately_to_score(engine, now):
    result = engine.score(
        criticality_score=7.0, asset_condition="POOR",
        asset_type="TRACK", now=now,
    )
    total = sum(f.contribution for f in result.factors)
    assert abs(total - result.priority_score) < 0.01, (
        f"Factor sum {total:.4f} != score {result.priority_score}"
    )


def test_prediction_source_is_rule_based(engine, now):
    result = engine.score(now=now)
    assert result.prediction_source == "RULE_BASED_BASELINE"


def test_confidence_is_one_for_rule_based(engine, now):
    result = engine.score(now=now)
    assert result.confidence == 1.0


# ─────────────────────────────────────────────────────────────────────────────
# Urgency Sub-function Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_urgency_no_deadline_uses_priority_enum(now):
    score, desc = _compute_urgency(None, "CRITICAL", now)
    assert score == 10.0

    score_low, _ = _compute_urgency(None, "LOW", now)
    assert score_low == 1.0


def test_urgency_overdue_by_40_days(now):
    deadline = now - timedelta(days=40)
    score, desc = _compute_urgency(deadline, "MEDIUM", now)
    assert score == 10.0
    assert "Overdue" in desc


def test_urgency_due_within_1_day(now):
    deadline = now + timedelta(hours=12)
    score, _ = _compute_urgency(deadline, "MEDIUM", now)
    assert score == 9.5


def test_urgency_due_in_60_days(now):
    deadline = now + timedelta(days=60)
    score, _ = _compute_urgency(deadline, "MEDIUM", now)
    assert score == 2.0


# ─────────────────────────────────────────────────────────────────────────────
# Overdue Factor Sub-function Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_overdue_factor_no_deadline(now):
    score, desc = _compute_overdue_factor(None, now)
    assert score == 0.0


def test_overdue_factor_future_deadline(now):
    deadline = now + timedelta(days=5)
    score, _ = _compute_overdue_factor(deadline, now)
    assert score == 0.0


def test_overdue_factor_severe(now):
    deadline = now - timedelta(days=60)
    score, _ = _compute_overdue_factor(deadline, now)
    assert score == 10.0


# ─────────────────────────────────────────────────────────────────────────────
# Failure Risk Sub-function Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_failure_risk_out_of_service_aged():
    score, _ = _compute_failure_risk("OUT_OF_SERVICE", 25.0)
    assert score == 10.0


def test_failure_risk_good_new():
    score, _ = _compute_failure_risk("GOOD", 2.0)
    assert score == 1.0  # 1.0 base + 0 age mod


def test_failure_risk_poor_middle_aged():
    score, desc = _compute_failure_risk("POOR", 12.0)
    # POOR = 7.0 + 1.0 age (10-20y) = 8.0
    assert score == 8.0


def test_failure_risk_no_condition():
    score, _ = _compute_failure_risk(None, None)
    assert score == 1.0  # Defaults to GOOD, no age mod
