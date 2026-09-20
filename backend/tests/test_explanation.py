import pytest
import uuid
import datetime
from datetime import timezone

from app.services.optimization.explanation import ExplanationEngine
from app.schemas.optimization import OptimizationResult, TaskAssignment, SolverStatus
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus

def test_explanation_engine():
    engine = ExplanationEngine()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    t1_id = uuid.uuid4()
    t1 = MaintenanceRequest(id=t1_id, title="Scheduled Task", status=MaintenanceStatus.PENDING)
    
    t2_id = uuid.uuid4()
    t2 = MaintenanceRequest(id=t2_id, title="Unscheduled Task", status=MaintenanceStatus.PENDING)
    
    result = OptimizationResult(
        solver_status=SolverStatus.OPTIMAL,
        solve_time_seconds=0.1,
        tasks_scheduled=1,
        tasks_unscheduled=1,
        objective_value=1.0,
        assignments=[
            TaskAssignment(
                task_id=t1_id,
                scheduled_start=ref_time,
                scheduled_end=ref_time + datetime.timedelta(hours=2),
                block_id=uuid.uuid4(),
                is_scheduled=True,
                priority_level="CRITICAL"
            ),
            TaskAssignment(
                task_id=t2_id,
                scheduled_start=ref_time,
                scheduled_end=ref_time,
                is_scheduled=False,
                priority_level="LOW"
            )
        ]
    )
    
    # Explain scheduled
    exp1 = engine.explain_task_decision(t1_id, t1, result, [])
    assert "SCHEDULED" in exp1.decision
    assert "priority CRITICAL" in exp1.primary_reason
    
    # Explain unscheduled
    exp2 = engine.explain_task_decision(t2_id, t2, result, [])
    assert "NOT SCHEDULED" in exp2.decision
    assert "LOW" in exp2.supporting_factors[0]
