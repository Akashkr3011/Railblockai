import uuid
from typing import List, Optional

from app.schemas.optimization import OptimizationResult, ExplanationResult
from app.models.maintenance import MaintenanceRequest
from app.models.block import BlockRequest

class ExplanationEngine:
    """
    Answers 'Why this block?', 'Why this task?', etc.
    by correlating priority scores, task assignments, and domain constraints.
    """
    
    def explain_task_decision(
        self,
        task_id: uuid.UUID,
        task: MaintenanceRequest,
        result: OptimizationResult,
        blocks: List[BlockRequest]
    ) -> ExplanationResult:
        
        assignment = next((a for a in result.assignments if a.task_id == task_id), None)
        if not assignment:
            return ExplanationResult(
                decision="Task missing from solver output.",
                primary_reason="Internal solver state error.",
                supporting_factors=[],
                constraints=[],
                conflicts=[],
                alternatives_considered=[],
                operational_impact="Unknown"
            )
            
        if not assignment.is_scheduled:
            return ExplanationResult(
                decision="Task was NOT SCHEDULED.",
                primary_reason=f"Insufficient block capacity or conflicting high-priority constraints.",
                supporting_factors=[
                    f"Task priority was {assignment.priority_level}."
                ],
                constraints=["Block boundaries", "Asset conflicts", "Train occupancy"],
                conflicts=["Did not fit in available block windows without overlapping higher priority tasks or trains."],
                alternatives_considered=["Searched all available blocks in horizon"],
                operational_impact="Maintenance delayed. Risk of asset degradation."
            )
            
        block = next((b for b in blocks if b.id == assignment.block_id), None)
        b_name = "Unknown Block"
        if block:
            b_name = f"Block {block.id}"
            
        return ExplanationResult(
            decision=f"Task SCHEDULED in {b_name} from {assignment.scheduled_start.strftime('%H:%M')} to {assignment.scheduled_end.strftime('%H:%M')}.",
            primary_reason=f"Optimal fit satisfying all hard constraints with priority {assignment.priority_level}.",
            supporting_factors=[
                f"Task fits perfectly within block duration.",
                f"No asset conflicts detected during this interval.",
                f"No train section overlap."
            ],
            constraints=["Block bounds respected", "Asset overlap prevented", "Train overlap prevented"],
            conflicts=[],
            alternatives_considered=["Evaluated alongside all pending maintenance tasks"],
            operational_impact="Maintenance progresses as planned with minimal train disruption."
        )
