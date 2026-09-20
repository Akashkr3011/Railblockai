"""
RAILBLOCK AI — Tests for CompatibilityEngine
"""
import uuid
import pytest
from datetime import datetime, timedelta, timezone

from app.models.maintenance import MaintenanceRequest, MaintenanceCategory
from app.services.rules.compatibility import CompatibilityEngine
from app.schemas.rules import CompatibilityStatus

@pytest.fixture
def engine():
    return CompatibilityEngine()

def _make_task(
    title="Task",
    asset_id=None,
    section_id=None,
    start=None,
    duration=None,
    category=MaintenanceCategory.TRACK
):
    req = MaintenanceRequest()
    req.id = uuid.uuid4()
    req.title = title
    req.asset_id = asset_id or uuid.uuid4()
    req.section_id = section_id or uuid.uuid4()
    req.scheduled_start = start
    req.estimated_duration_hours = duration
    req.category = category
    return req

def test_same_asset_overlap(engine):
    asset_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = _make_task(asset_id=asset_id, start=now, duration=2)
    t2 = _make_task(asset_id=asset_id, start=now + timedelta(hours=1), duration=2)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.INCOMPATIBLE
    assert "SAME_ASSET_OVERLAP" in res.violated_conditions

def test_same_asset_non_overlap(engine):
    asset_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = _make_task(asset_id=asset_id, start=now, duration=2)
    t2 = _make_task(asset_id=asset_id, start=now + timedelta(hours=3), duration=2)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE
    assert "SAME_ASSET_OVERLAP" not in res.violated_conditions

def test_different_assets_same_section_overlap(engine):
    section_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = _make_task(section_id=section_id, start=now, duration=2)
    t2 = _make_task(section_id=section_id, start=now, duration=2)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE
    assert "different assets within the same section" in res.explanation

def test_different_departments(engine):
    section_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = _make_task(section_id=section_id, start=now, duration=2, category=MaintenanceCategory.TRACK)
    t2 = _make_task(section_id=section_id, start=now, duration=2, category=MaintenanceCategory.SIGNAL)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.CONDITIONALLY_COMPATIBLE
    assert any("different departments" in w for w in res.warnings)

def test_different_section_overlap(engine):
    now = datetime.now(timezone.utc)
    t1 = _make_task(start=now, duration=2)
    t2 = _make_task(start=now, duration=2)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.INCOMPATIBLE
    assert "DIFFERENT_SECTION_OVERLAP" in res.violated_conditions

def test_different_section_non_overlap(engine):
    now = datetime.now(timezone.utc)
    t1 = _make_task(start=now, duration=2)
    t2 = _make_task(start=now + timedelta(hours=3), duration=2)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE

def test_unscheduled_tasks(engine):
    t1 = _make_task(start=None)
    t2 = _make_task(start=None)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE

def test_unscheduled_tasks_same_section(engine):
    sec = uuid.uuid4()
    t1 = _make_task(section_id=sec, start=None)
    t2 = _make_task(section_id=sec, start=None)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE

def test_unscheduled_tasks_different_section(engine):
    t1 = _make_task(start=None)
    t2 = _make_task(start=None)
    
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.COMPATIBLE

def test_resource_conflict(engine):
    now = datetime.now(timezone.utc)
    t1 = _make_task(section_id=uuid.uuid4(), start=now, duration=2)
    t2 = _make_task(section_id=uuid.uuid4(), start=now, duration=2)
    # Right now resources aren't fully implemented, so this overlaps in different sections -> INCOMPATIBLE
    res = engine.check_tasks(t1, t2)
    assert res.status == CompatibilityStatus.INCOMPATIBLE

def test_deterministic_output(engine):
    now = datetime.now(timezone.utc)
    sec = uuid.uuid4()
    t1 = _make_task(section_id=sec, start=now, duration=2)
    t2 = _make_task(section_id=sec, start=now, duration=2)
    
    res1 = engine.check_tasks(t1, t2)
    res2 = engine.check_tasks(t1, t2)
    assert res1.status == res2.status
    assert res1.reasons == res2.reasons

def test_explanation_correctness(engine):
    sec = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = _make_task(section_id=sec, start=now, duration=2, category=MaintenanceCategory.TRACK)
    t2 = _make_task(section_id=sec, start=now, duration=2, category=MaintenanceCategory.SIGNAL)
    
    res = engine.check_tasks(t1, t2)
    assert res.explanation != ""
    assert res.status == CompatibilityStatus.CONDITIONALLY_COMPATIBLE
 # no time overlap
