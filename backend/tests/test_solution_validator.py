import pytest
import uuid
import datetime
from datetime import timezone

from app.services.optimization.validator import SolutionValidator
from app.schemas.optimization import OptimizationResult, TaskAssignment, SolverStatus
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.train import TrainSchedule

def _make_task(duration_hours=2, section=None, asset=None, deadline=None):
    return MaintenanceRequest(
        id=uuid.uuid4(),
        title="Test Task",
        estimated_duration_hours=duration_hours,
        section_id=section,
        asset_id=asset,
        deadline=deadline,
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

def test_valid_solution():
    validator = SolutionValidator()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4, ref_time)
    
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=0,
        assignments=[TaskAssignment(
            task_id=t1.id,
            scheduled_start=b1.requested_start_time,
            scheduled_end=b1.requested_start_time + datetime.timedelta(hours=2),
            block_id=b1.id,
            is_scheduled=True
        )],
        objective_value=1.0
    )
    
    val = validator.validate_plan(result, tasks=[t1], blocks=[b1])
    assert val.valid is True
    assert len(val.errors) == 0

def test_block_boundary_violation():
    validator = SolutionValidator()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4, ref_time)
    
    # Task scheduled 1 hour before block starts
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=0,
        assignments=[TaskAssignment(
            task_id=t1.id,
            scheduled_start=b1.requested_start_time - datetime.timedelta(hours=1),
            scheduled_end=b1.requested_start_time + datetime.timedelta(hours=1),
            block_id=b1.id,
            is_scheduled=True
        )],
        objective_value=1.0
    )
    
    val = validator.validate_plan(result, tasks=[t1], blocks=[b1])
    assert val.valid is False
    assert "BLOCK_BOUNDARY_VIOLATION" in val.violated_constraints

def test_asset_overlap_violation():
    validator = SolutionValidator()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    asset_id = uuid.uuid4()
    t1 = _make_task(duration_hours=2, asset=asset_id)
    t2 = _make_task(duration_hours=2, asset=asset_id)
    b1 = _make_block(0, 4, ref_time)
    
    # Both tasks scheduled at the exact same time on same asset
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=2,
        tasks_unscheduled=0,
        assignments=[
            TaskAssignment(
                task_id=t1.id,
                scheduled_start=b1.requested_start_time,
                scheduled_end=b1.requested_start_time + datetime.timedelta(hours=2),
                block_id=b1.id,
                is_scheduled=True
            ),
            TaskAssignment(
                task_id=t2.id,
                scheduled_start=b1.requested_start_time,
                scheduled_end=b1.requested_start_time + datetime.timedelta(hours=2),
                block_id=b1.id,
                is_scheduled=True
            )
        ],
        objective_value=1.0
    )
    
    val = validator.validate_plan(result, tasks=[t1, t2], blocks=[b1])
    assert val.valid is False
    assert "ASSET_CONFLICT" in val.violated_constraints

def test_deadline_violation():
    validator = SolutionValidator()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    # Deadline is 1 hour from ref_time
    deadline = ref_time + datetime.timedelta(hours=1)
    t1 = _make_task(duration_hours=2, deadline=deadline)
    b1 = _make_block(0, 4, ref_time)
    
    # Task finishes after deadline
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=0,
        assignments=[TaskAssignment(
            task_id=t1.id,
            scheduled_start=b1.requested_start_time,
            scheduled_end=b1.requested_start_time + datetime.timedelta(hours=2),
            block_id=b1.id,
            is_scheduled=True
        )],
        objective_value=1.0
    )
    
    val = validator.validate_plan(result, tasks=[t1], blocks=[b1])
    assert val.valid is False
    assert "DEADLINE_VIOLATION" in val.violated_constraints
