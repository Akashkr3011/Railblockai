import pytest
import uuid
import datetime
from datetime import timezone

from app.services.optimization.manual_validation import ManualValidationService
from app.schemas.optimization import OptimizationResult, TaskAssignment, SolverStatus, ManualChangeRequest
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus

def _make_task(duration_hours=2, asset=None):
    return MaintenanceRequest(
        id=uuid.uuid4(),
        title="Test Task",
        estimated_duration_hours=duration_hours,
        asset_id=asset,
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

def test_manual_validation_valid_move():
    svc = ManualValidationService()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4, ref_time)
    
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=0,
        objective_value=1.0,
        assignments=[
            TaskAssignment(
                task_id=t1.id,
                scheduled_start=ref_time,
                scheduled_end=ref_time + datetime.timedelta(hours=2),
                block_id=b1.id,
                is_scheduled=True,
                priority_level="MEDIUM"
            )
        ]
    )
    
    # Move task 1 hour later (still within block)
    req = ManualChangeRequest(
        task_id=t1.id,
        new_block_id=b1.id,
        new_start_time=ref_time + datetime.timedelta(hours=1),
        new_end_time=ref_time + datetime.timedelta(hours=3)
    )
    
    val = svc.validate_change(req, result, [t1], [b1])
    assert val.valid_change is True
    assert len(val.reasons) == 1
    assert "satisfies all constraints" in val.reasons[0]

def test_manual_validation_invalid_move():
    svc = ManualValidationService()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4, ref_time)
    
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=0,
        objective_value=1.0,
        assignments=[
            TaskAssignment(
                task_id=t1.id,
                scheduled_start=ref_time,
                scheduled_end=ref_time + datetime.timedelta(hours=2),
                block_id=b1.id,
                is_scheduled=True,
                priority_level="MEDIUM"
            )
        ]
    )
    
    # Move task outside of block bounds (starts hour 3, ends hour 5)
    req = ManualChangeRequest(
        task_id=t1.id,
        new_block_id=b1.id,
        new_start_time=ref_time + datetime.timedelta(hours=3),
        new_end_time=ref_time + datetime.timedelta(hours=5)
    )
    
    val = svc.validate_change(req, result, [t1], [b1])
    assert val.valid_change is False
    assert any("BLOCK_BOUNDARY_VIOLATION" in r for r in val.reasons)
