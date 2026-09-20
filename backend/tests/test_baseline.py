import pytest
import uuid
import datetime
from datetime import timezone

from app.services.optimization.baseline import BaselineScheduler
from app.schemas.optimization import SolverStatus
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.train import TrainSchedule

def _make_task(duration_hours=2, priority="MEDIUM", deadline=None, asset=None, section=None):
    return MaintenanceRequest(
        id=uuid.uuid4(),
        title="Test Task",
        estimated_duration_hours=duration_hours,
        priority=priority,
        deadline=deadline,
        asset_id=asset,
        section_id=section,
        status=MaintenanceStatus.PENDING
    )

def _make_block(start_offset_hrs=0, end_offset_hrs=4, ref_time=None):
    if not ref_time:
        ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    return BlockRequest(
        id=uuid.uuid4(),
        requested_date=ref_time,
        requested_start_time=ref_time + datetime.timedelta(hours=start_offset_hrs),
        requested_end_time=ref_time + datetime.timedelta(hours=end_offset_hrs),
        status=BlockRequestStatus.APPROVED
    )

def test_baseline_normal_scheduling():
    scheduler = BaselineScheduler()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1 = _make_task(duration_hours=2, priority="CRITICAL")
    t2 = _make_task(duration_hours=2, priority="LOW")
    b1 = _make_block(0, 4, ref_time)
    
    res = scheduler.schedule([t1, t2], [b1], ref_time)
    
    assert res.tasks_scheduled == 2
    assert res.tasks_unscheduled == 0
    
    # Both tasks have no asset or section conflict, so they can run in parallel in the same block!
    t1_assignment = next(a for a in res.assignments if a.task_id == t1.id)
    t2_assignment = next(a for a in res.assignments if a.task_id == t2.id)
    
    assert t1_assignment.scheduled_start == b1.requested_start_time
    assert t2_assignment.scheduled_start == b1.requested_start_time

def test_baseline_conflict_avoidance():
    scheduler = BaselineScheduler()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    asset_id = uuid.uuid4()
    # 2 tasks of 3 hours on SAME asset. Block is 4 hours. Only 1 can fit.
    t1 = _make_task(duration_hours=3, priority="HIGH", asset=asset_id)
    t2 = _make_task(duration_hours=3, priority="MEDIUM", asset=asset_id)
    b1 = _make_block(0, 4, ref_time)
    
    res = scheduler.schedule([t1, t2], [b1], ref_time)
    
    assert res.tasks_scheduled == 1
    assert res.tasks_unscheduled == 1
    
    t1_assignment = next(a for a in res.assignments if a.task_id == t1.id)
    assert t1_assignment.is_scheduled is True
    
    t2_assignment = next(a for a in res.assignments if a.task_id == t2.id)
    assert t2_assignment.is_scheduled is False

def test_baseline_deadline_handling():
    scheduler = BaselineScheduler()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    # Task needs 2 hours, deadline is 1 hour from ref_time
    t1 = _make_task(duration_hours=2, deadline=ref_time + datetime.timedelta(hours=1))
    b1 = _make_block(0, 4, ref_time)
    
    res = scheduler.schedule([t1], [b1], ref_time)
    
    assert res.tasks_scheduled == 0
    assert res.tasks_unscheduled == 1
