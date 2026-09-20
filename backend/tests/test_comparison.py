import pytest
import uuid
import datetime
from datetime import timezone

from app.services.optimization.comparison import ComparisonService
from app.schemas.optimization import OptimizationResult, TaskAssignment, SolverStatus

def test_comparison_service():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    b_id = uuid.uuid4()
    
    # Baseline result: 1 task scheduled, 120 mins downtime
    base_res = OptimizationResult(
        solver_status=SolverStatus.FEASIBLE,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=1,
        objective_value=1.0,
        assignments=[
            TaskAssignment(
                task_id=uuid.uuid4(),
                scheduled_start=ref_time,
                scheduled_end=ref_time + datetime.timedelta(hours=2),
                block_id=b_id,
                is_scheduled=True,
                priority_level="CRITICAL"
            )
        ]
    )
    
    # Opt result: 2 tasks scheduled, 240 mins downtime
    opt_res = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=2,
        tasks_unscheduled=0,
        objective_value=2.0,
        assignments=[
            TaskAssignment(
                task_id=uuid.uuid4(),
                scheduled_start=ref_time,
                scheduled_end=ref_time + datetime.timedelta(hours=2),
                block_id=b_id,
                is_scheduled=True,
                priority_level="CRITICAL"
            ),
            TaskAssignment(
                task_id=uuid.uuid4(),
                scheduled_start=ref_time + datetime.timedelta(hours=2),
                scheduled_end=ref_time + datetime.timedelta(hours=4),
                block_id=b_id,
                is_scheduled=True,
                priority_level="MEDIUM"
            )
        ]
    )
    
    svc = ComparisonService()
    comp = svc.compare(base_res, opt_res)
    
    assert comp.baseline_metrics.tasks_scheduled == 1
    assert comp.optimized_metrics.tasks_scheduled == 2
    assert comp.improvement_tasks_scheduled_abs == 1
    assert comp.improvement_tasks_scheduled_pct == 100.0
    
    assert comp.baseline_metrics.asset_downtime_minutes == 120
    assert comp.optimized_metrics.asset_downtime_minutes == 240
    # lower is better for downtime, so jumping from 120 to 240 is -100% improvement
    assert comp.improvement_downtime_pct == -100.0

def test_comparison_zero_denominator():
    svc = ComparisonService()
    
    empty_res = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=0,
        tasks_unscheduled=0,
        objective_value=0.0,
        assignments=[]
    )
    
    comp = svc.compare(empty_res, empty_res)
    assert comp.improvement_tasks_scheduled_pct is None
    assert comp.improvement_downtime_pct is None
