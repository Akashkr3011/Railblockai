import pytest
import uuid
import datetime
from datetime import timezone
from unittest.mock import patch, MagicMock

from app.services.optimization.solver import OptimizationService
from app.schemas.optimization import OptimizationConfig, OptimizationResult, SolverStatus, TaskAssignment
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.train import TrainSchedule
from ortools.sat.python import cp_model

def _make_task(duration_hours=2, priority="MEDIUM", deadline=None):
    return MaintenanceRequest(
        id=uuid.uuid4(),
        title="Test Task",
        estimated_duration_hours=duration_hours,
        priority=priority,
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

@pytest.fixture
def mock_ortools_solver_for_objectives():
    """Intercepts Solve to avoid C++ Windows/Python3.13 crash, but allows model building."""
    with patch('app.services.optimization.solver.cp_model.CpSolver') as MockSolver:
        instance = MockSolver.return_value
        instance.Solve.return_value = cp_model.OPTIMAL
        instance.ObjectiveValue.return_value = 1000.0
        instance.WallTime.return_value = 0.1
        
        # Fake solver.Value(var) to return reasonable mock data
        def fake_value(var):
            if hasattr(var, 'Name') and 'is_scheduled' in var.Name():
                return 1 # all scheduled
            if hasattr(var, 'Name') and 'start' in var.Name():
                return 0
            if hasattr(var, 'Name') and 'end' in var.Name():
                return 120
            if hasattr(var, 'Name') and 'used' in var.Name():
                return 1
            return 1 # default for block assignments
            
        instance.Value.side_effect = fake_value
        yield instance

def test_objective_construction_with_priority(mock_ortools_solver_for_objectives):
    """Verifies that OptimizationService builds the objective function incorporating priority without crashing."""
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    t1 = _make_task(priority="CRITICAL")
    t2 = _make_task(priority="LOW")
    b1 = _make_block(0, 8, ref_time)
    
    with patch('app.services.priority_engine.PriorityEngine.score') as mock_score:
        mock_score.side_effect = lambda priority, **kwargs: MagicMock(priority_score=85.0 if priority == "CRITICAL" else 15.0)
        res = svc.solve(tasks=[t1, t2], blocks=[b1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 2
    
    # Check that priority levels were mapped back correctly
    critical_task = next(a for a in res.assignments if a.task_id == t1.id)
    low_task = next(a for a in res.assignments if a.task_id == t2.id)
    assert critical_task.priority_level == "CRITICAL"
    assert low_task.priority_level == "LOW"

def test_objective_construction_with_overdue(mock_ortools_solver_for_objectives):
    """Verifies overdue logic construction."""
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    svc = OptimizationService()
    
    past_deadline = ref_time - datetime.timedelta(days=1)
    t1 = _make_task(deadline=past_deadline)
    b1 = _make_block(0, 8, ref_time)
    
    res = svc.solve(tasks=[t1], blocks=[b1], reference_time=ref_time)
    
    assert res.solver_status == SolverStatus.OPTIMAL
    assert res.tasks_scheduled == 1

def test_objective_configurable_weights(mock_ortools_solver_for_objectives):
    """Verifies we can supply custom weights to OptimizationConfig."""
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    config = OptimizationConfig(
        objective_weights={
            "priority": 500,
            "unused_block_penalty": -10,
            "downtime_penalty": 0,
            "overdue_bonus": 2000
        }
    )
    svc = OptimizationService(config=config)
    
    t1 = _make_task()
    b1 = _make_block(0, 8, ref_time)
    
    res = svc.solve(tasks=[t1], blocks=[b1], reference_time=ref_time)
    assert res.solver_status == SolverStatus.OPTIMAL
