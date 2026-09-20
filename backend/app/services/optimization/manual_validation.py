import copy
from typing import List

from app.schemas.optimization import OptimizationResult, ManualChangeRequest, ManualChangeValidationResult, TaskAssignment
from app.models.maintenance import MaintenanceRequest
from app.models.block import BlockRequest
from app.models.train import TrainSchedule
from app.services.optimization.validator import SolutionValidator

class ManualValidationService:
    """
    Validates a manual planner change by mutating the optimization result
    and running it through the independent SolutionValidator.
    """
    
    def __init__(self):
        self.validator = SolutionValidator()
        
    def validate_change(
        self,
        change: ManualChangeRequest,
        result: OptimizationResult,
        tasks: List[MaintenanceRequest],
        blocks: List[BlockRequest],
        train_schedules: List[TrainSchedule] = []
    ) -> ManualChangeValidationResult:
        
        # Deep copy result to not mutate the original
        tentative_result = copy.deepcopy(result)
        
        # Apply change
        assignment = next((a for a in tentative_result.assignments if a.task_id == change.task_id), None)
        
        if not assignment:
            # If task was unscheduled, create assignment
            assignment = TaskAssignment(
                task_id=change.task_id,
                scheduled_start=change.new_start_time,
                scheduled_end=change.new_end_time,
                block_id=change.new_block_id,
                is_scheduled=True,
                priority_level="UNKNOWN" # We don't change priority here
            )
            tentative_result.assignments.append(assignment)
        else:
            assignment.is_scheduled = True
            assignment.scheduled_start = change.new_start_time
            assignment.scheduled_end = change.new_end_time
            assignment.block_id = change.new_block_id
            
        # Run through strict validator
        val_result = self.validator.validate_plan(
            result=tentative_result,
            tasks=tasks,
            blocks=blocks,
            train_schedules=train_schedules
        )
        
        reasons = []
        for e in val_result.errors:
            if change.task_id in e.task_ids:
                reasons.append(f"{e.constraint}: {e.reason}")
                
        return ManualChangeValidationResult(
            valid_change=val_result.valid,
            reasons=reasons if not val_result.valid else ["Change successfully satisfies all constraints."],
            validation_result=val_result
        )
