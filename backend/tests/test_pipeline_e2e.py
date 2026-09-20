import pytest
import uuid
import datetime
from datetime import timezone
from unittest.mock import patch, MagicMock

# Schemas and Models
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus, Priority, MaintenanceCategory
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.asset import Asset, AssetType, AssetCondition
from app.models.train import TrainSchedule
from app.models.resource import Resource, ResourceType, ResourceAvailability
from app.schemas.optimization import OptimizationResult, SolverStatus, TaskAssignment

# Engines and Services
from app.services.data_quality_service import DataQualityService
from app.services.priority_engine import PriorityEngine
from app.services.prediction_service import PredictionService
from app.services.rules.compatibility import CompatibilityEngine
from app.services.rules.conflict_engine import ConflictEngine
from app.services.optimization.baseline import BaselineScheduler
from app.services.optimization.solver import OptimizationService
from app.services.optimization.validator import SolutionValidator
from app.services.optimization.comparison import ComparisonService
from app.services.optimization.explanation import ExplanationEngine
from app.services.optimization.manual_validation import ManualValidationService

def _make_task(duration_hours=2, section=None, asset=None, deadline=None, priority=Priority.MEDIUM):
    return MaintenanceRequest(
        id=uuid.uuid4(),
        title="Test Task",
        estimated_duration_hours=duration_hours,
        section_id=section,
        asset_id=asset,
        deadline=deadline,
        status=MaintenanceStatus.PENDING,
        priority=priority,
        category=MaintenanceCategory.TRACK
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

@pytest.mark.asyncio
async def test_full_pipeline_normal_case():
    """
    Test 1: Normal case 
    Flow: DataQuality -> Priority -> Compat -> Conflict -> Baseline -> Optimize -> Validation -> Comparison -> Explanation
    """
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    db_mock = MagicMock()
    
    task = _make_task(duration_hours=2)
    block = _make_block(0, 4, ref_time)
    
    # 1. Data Quality
    dq_service = DataQualityService(db=db_mock)
    task_dict = {"id": str(task.id), "title": task.title, "estimated_duration_hours": task.estimated_duration_hours}
    dq_result = await dq_service.validate_maintenance_record(task_dict)
    assert dq_result is not None

    # 2. Priority Engine
    priority_engine = PriorityEngine()
    score_result = priority_engine.score(
        priority=task.priority,
        deadline=task.deadline,
        estimated_duration_hours=task.estimated_duration_hours,
        asset_condition=AssetCondition.GOOD,
        asset_type="TRACK"
    )
    assert score_result.priority_score >= 0.0

    # 3. Prediction Service
    prediction_service = PredictionService()
    pred_res = prediction_service.predict_maintenance_duration(
        asset_type="TRACK",
        condition=AssetCondition.GOOD,
        requires_block=True
    )
    assert pred_res.prediction >= 0

    # 4. Compatibility Engine
    compat_engine = CompatibilityEngine()
    task_b = _make_task(duration_hours=1)
    compat_res = compat_engine.check_tasks(task, task_b)
    assert compat_res.status is not None
    
    # 5. Conflict Engine
    conflict_engine = ConflictEngine(db=db_mock)
    conflicts = await conflict_engine.detect_conflicts(
        task_ids=[task.id], 
        window_start=block.requested_start_time, 
        window_end=block.requested_end_time
    )
    assert isinstance(conflicts, list)

    # 6. Baseline Scheduler
    baseline = BaselineScheduler()
    baseline_result = baseline.schedule(tasks=[task], blocks=[block], reference_time=ref_time)
    assert baseline_result.solver_status in [SolverStatus.OPTIMAL, SolverStatus.FEASIBLE, SolverStatus.INFEASIBLE]

    # 7. CP-SAT Optimization (Mocked)
    optimizer = OptimizationService()
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=0.1,
            tasks_scheduled=1,
            tasks_unscheduled=0,
            assignments=[TaskAssignment(
                task_id=task.id,
                scheduled_start=block.requested_start_time,
                scheduled_end=block.requested_start_time + datetime.timedelta(hours=2),
                block_id=block.id
            )],
            objective_value=1.0
        )
        optimized_result = optimizer.solve(tasks=[task], blocks=[block], reference_time=ref_time)
        
    assert optimized_result.solver_status == SolverStatus.OPTIMAL

    # 8. Solution Validator
    validator = SolutionValidator()
    validation_res = validator.validate_plan(optimized_result, tasks=[task], blocks=[block])
    assert validation_res.valid is True

    # 9. Comparison Engine
    comparison = ComparisonService()
    comp_result = comparison.compare(baseline_result, optimized_result)
    assert comp_result is not None

    # 10. Explanation Engine
    explanation = ExplanationEngine()
    explain_res = explanation.explain_task_decision(task.id, task, optimized_result, [block])
    assert explain_res is not None

    # 11. Manual Validation
    from app.schemas.optimization import ManualChangeRequest
    manual_validator = ManualValidationService()
    change_req = ManualChangeRequest(
        task_id=task.id,
        new_block_id=block.id,
        new_start_time=block.requested_start_time,
        new_end_time=block.requested_start_time + datetime.timedelta(hours=2)
    )
    manual_res = manual_validator.validate_change(
        change=change_req,
        result=optimized_result,
        tasks=[task],
        blocks=[block]
    )
    assert manual_res.valid_change is True

@pytest.mark.asyncio
async def test_full_pipeline_conflict_heavy():
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    db_mock = MagicMock()
    
    t1 = _make_task(duration_hours=3, priority=Priority.CRITICAL)
    t2 = _make_task(duration_hours=3, priority=Priority.HIGH)
    b1 = _make_block(0, 4, ref_time)
    
    conflict_engine = ConflictEngine(db=db_mock)
    conflicts = await conflict_engine.detect_conflicts(
        task_ids=[t1.id, t2.id], 
        window_start=b1.requested_start_time, 
        window_end=b1.requested_end_time
    )
    
    baseline = BaselineScheduler()
    baseline_result = baseline.schedule(tasks=[t1, t2], blocks=[b1], reference_time=ref_time)
    
    optimizer = OptimizationService()
    with patch.object(OptimizationService, 'solve') as mock_solve:
        mock_solve.return_value = OptimizationResult(
            solver_status=SolverStatus.FEASIBLE,
            solve_time_seconds=0.2,
            tasks_scheduled=1,
            tasks_unscheduled=1,
            assignments=[TaskAssignment(
                task_id=t1.id,
                scheduled_start=b1.requested_start_time,
                scheduled_end=b1.requested_start_time + datetime.timedelta(hours=3),
                block_id=b1.id
            )],
            objective_value=10.0
        )
        opt_result = optimizer.solve(tasks=[t1, t2], blocks=[b1], reference_time=ref_time)
        
    assert opt_result.tasks_scheduled == 1
    assert opt_result.tasks_unscheduled == 1
    
    comparison = ComparisonService()
    comp_result = comparison.compare(baseline_result, opt_result)
    assert comp_result is not None
