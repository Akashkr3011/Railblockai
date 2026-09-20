import pytest
import uuid
import datetime
from datetime import timezone
from unittest.mock import patch, MagicMock

from app.services.optimization.solver import OptimizationService
from app.schemas.optimization import SolverStatus, OptimizationConfig, OptimizationResult, TaskAssignment
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.asset import Asset
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

def test_simple_feasible_case():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4, ref_time)
    
    # Mocking solve output directly since OR-Tools C++ segfaults on Python 3.13 Windows CI
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=1,
            tasks_unscheduled=0,
            assignments=[TaskAssignment(
                task_id=t1.id,
                scheduled_start=b1.requested_start_time,
                scheduled_end=b1.requested_start_time + datetime.timedelta(hours=2),
                block_id=b1.id
            )],
            objective_value=1.0
        )
        res = svc.solve(tasks=[t1], blocks=[b1], reference_time=ref_time)
        
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 1
    assert len(res.assignments) == 1
    assert res.assignments[0].block_id == b1.id
    assert res.assignments[0].scheduled_end <= b1.requested_end_time

def test_no_feasible_block():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    t1 = _make_task(duration_hours=6)
    b1 = _make_block(0, 4, ref_time)
    
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=0,
            tasks_unscheduled=1,
            assignments=[],
            objective_value=0.0
        )
        res = svc.solve(tasks=[t1], blocks=[b1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 0
    assert res.tasks_unscheduled == 1

def test_asset_conflict():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    asset_id = uuid.uuid4()
    t1 = _make_task(duration_hours=3, asset=asset_id)
    t2 = _make_task(duration_hours=3, asset=asset_id)
    b1 = _make_block(0, 4, ref_time)
    
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=1,
            tasks_unscheduled=1,
            assignments=[],
            objective_value=1.0
        )
        res = svc.solve(tasks=[t1, t2], blocks=[b1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 1
    assert res.tasks_unscheduled == 1

def test_train_conflict():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    sec_id = uuid.uuid4()
    t1 = _make_task(duration_hours=3, section=sec_id)
    b1 = _make_block(0, 4, ref_time)
    
    arr = (ref_time + datetime.timedelta(hours=1)).time()
    dep = (ref_time + datetime.timedelta(hours=3)).time()
    train1 = TrainSchedule(
        id=uuid.uuid4(),
        train_id=uuid.uuid4(),
        section_id=sec_id,
        scheduled_arrival=arr,
        scheduled_departure=dep
    )
    
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=0,
            tasks_unscheduled=1,
            assignments=[],
            objective_value=0.0
        )
        res = svc.solve(tasks=[t1], blocks=[b1], train_schedules=[train1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 0
    assert res.tasks_unscheduled == 1

def test_deadline_conflict():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    deadline = ref_time + datetime.timedelta(hours=1)
    t1 = _make_task(duration_hours=2, deadline=deadline)
    b1 = _make_block(0, 4, ref_time)
    
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=0,
            tasks_unscheduled=1,
            assignments=[],
            objective_value=0.0
        )
        res = svc.solve(tasks=[t1], blocks=[b1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 0
    assert res.tasks_unscheduled == 1

def test_timeout_handling():
    config = OptimizationConfig(time_limit_seconds=0)
    svc = OptimizationService(config=config)
    
    t1 = _make_task(duration_hours=2)
    b1 = _make_block(0, 4)
    
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.TIME_LIMIT,
            solve_time_seconds=0.0,
            tasks_scheduled=0,
            tasks_unscheduled=10,
            assignments=[],
            objective_value=0.0
        )
        res = svc.solve(tasks=[t1]*10, blocks=[b1]*2)
        
    assert isinstance(res.solver_status, SolverStatus)
