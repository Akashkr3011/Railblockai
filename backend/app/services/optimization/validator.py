import uuid
import datetime
from typing import List, Dict, Optional, Any

from app.schemas.optimization import OptimizationResult, ValidationResult, ValidationIssue
from app.models.maintenance import MaintenanceRequest
from app.models.block import BlockRequest
from app.models.train import TrainSchedule
from app.models.resource import Resource

class SolutionValidator:
    """
    Independently validates a proposed optimization result against hard constraints.
    The validator DOES NOT simply trust solver_status == OPTIMAL.
    """
    
    def validate_plan(
        self,
        result: OptimizationResult,
        tasks: List[MaintenanceRequest],
        blocks: List[BlockRequest],
        train_schedules: List[TrainSchedule] = [],
        resources: List[Resource] = []
    ) -> ValidationResult:
        
        errors = []
        warnings = []
        violated_constraints = set()
        affected_tasks = set()
        affected_blocks = set()
        affected_assets = set()
        
        task_map = {t.id: t for t in tasks}
        block_map = {b.id: b for b in blocks}
        
        # Filter to only scheduled tasks
        scheduled_assignments = [a for a in result.assignments if a.is_scheduled]
        
        for assignment in scheduled_assignments:
            task = task_map.get(assignment.task_id)
            if not task:
                errors.append(ValidationIssue(
                    constraint="INVALID_ASSIGNMENT",
                    task_ids=[assignment.task_id],
                    reason=f"Task {assignment.task_id} not found in input tasks."
                ))
                violated_constraints.add("INVALID_ASSIGNMENT")
                continue
                
            block = block_map.get(assignment.block_id)
            if not block:
                errors.append(ValidationIssue(
                    constraint="INVALID_ASSIGNMENT",
                    task_ids=[task.id],
                    reason=f"Assigned block {assignment.block_id} not found."
                ))
                violated_constraints.add("INVALID_ASSIGNMENT")
                continue
                
            # 1. Block Boundary Validation
            if assignment.scheduled_start < block.requested_start_time or assignment.scheduled_end > block.requested_end_time:
                errors.append(ValidationIssue(
                    constraint="BLOCK_BOUNDARY_VIOLATION",
                    task_ids=[task.id],
                    reason="Task scheduled outside of assigned block boundaries."
                ))
                violated_constraints.add("BLOCK_BOUNDARY_VIOLATION")
                affected_tasks.add(task.id)
                affected_blocks.add(block.id)
                
            # 2. Duration Validation
            duration_hrs = (assignment.scheduled_end - assignment.scheduled_start).total_seconds() / 3600.0
            expected_hrs = task.estimated_duration_hours or 1.0
            if duration_hrs < expected_hrs - 0.01: # allow slight float precision variance
                errors.append(ValidationIssue(
                    constraint="DURATION_VIOLATION",
                    task_ids=[task.id],
                    reason="Scheduled duration is less than task estimated duration."
                ))
                violated_constraints.add("DURATION_VIOLATION")
                affected_tasks.add(task.id)
                
            # 3. Deadline Validation
            if task.deadline and assignment.scheduled_end > task.deadline:
                errors.append(ValidationIssue(
                    constraint="DEADLINE_VIOLATION",
                    task_ids=[task.id],
                    reason="Task completion exceeds deadline."
                ))
                violated_constraints.add("DEADLINE_VIOLATION")
                affected_tasks.add(task.id)
                
        # 4. Asset Overlap Validation (No two tasks on same asset overlapping)
        asset_intervals = {}
        for a in scheduled_assignments:
            t = task_map.get(a.task_id)
            if t and t.asset_id:
                if t.asset_id not in asset_intervals:
                    asset_intervals[t.asset_id] = []
                asset_intervals[t.asset_id].append(a)
                
        for asset_id, assignments in asset_intervals.items():
            for i in range(len(assignments)):
                for j in range(i + 1, len(assignments)):
                    a1, a2 = assignments[i], assignments[j]
                    if max(a1.scheduled_start, a2.scheduled_start) < min(a1.scheduled_end, a2.scheduled_end):
                        errors.append(ValidationIssue(
                            constraint="ASSET_CONFLICT",
                            task_ids=[a1.task_id, a2.task_id],
                            reason=f"Overlapping tasks on the same asset {asset_id}."
                        ))
                        violated_constraints.add("ASSET_CONFLICT")
                        affected_tasks.update([a1.task_id, a2.task_id])
                        affected_assets.add(asset_id)
                        
        # 5. Train Conflict Validation (No overlap with train in same section)
        for ts in train_schedules:
            if not ts.section_id or not ts.scheduled_arrival or not ts.scheduled_departure:
                continue
                
            # Naive translation to datetime for comparison. In production, exact dates apply.
            # Using the assignments dates to map train times to the same day.
            for a in scheduled_assignments:
                t = task_map.get(a.task_id)
                if t and t.section_id == ts.section_id:
                    # Construct train datetime on the day of the assignment
                    day = a.scheduled_start.date()
                    tz = a.scheduled_start.tzinfo
                    
                    train_arr = datetime.datetime.combine(day, ts.scheduled_arrival).replace(tzinfo=tz)
                    train_dep = datetime.datetime.combine(day, ts.scheduled_departure).replace(tzinfo=tz)
                    if train_dep < train_arr:
                        train_dep += datetime.timedelta(days=1)
                        
                    if max(a.scheduled_start, train_arr) < min(a.scheduled_end, train_dep):
                        errors.append(ValidationIssue(
                            constraint="TRAIN_CONFLICT",
                            task_ids=[a.task_id],
                            reason="Task overlaps with scheduled train on the same section."
                        ))
                        violated_constraints.add("TRAIN_CONFLICT")
                        affected_tasks.add(a.task_id)

        valid = len(errors) == 0
        
        return ValidationResult(
            valid=valid,
            errors=errors,
            warnings=warnings,
            violated_constraints=list(violated_constraints),
            affected_tasks=list(affected_tasks),
            affected_blocks=list(affected_blocks),
            affected_assets=list(affected_assets),
            affected_resources=[],
            explanation="Plan is valid." if valid else "Plan contains hard constraint violations."
        )
