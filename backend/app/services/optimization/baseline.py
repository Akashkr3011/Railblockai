import uuid
import datetime
import time
from typing import List, Optional

from app.schemas.optimization import OptimizationResult, TaskAssignment, SolverStatus
from app.models.maintenance import MaintenanceRequest
from app.models.block import BlockRequest
from app.models.train import TrainSchedule
from app.models.resource import Resource
from app.services.priority_engine import PriorityEngine

class BaselineScheduler:
    """
    A deterministic baseline scheduler that strictly schedules by priority score.
    Finds the earliest valid block slot that satisfies all hard constraints.
    """
    
    def __init__(self):
        self.priority_engine = PriorityEngine()
        
    def schedule(
        self,
        tasks: List[MaintenanceRequest],
        blocks: List[BlockRequest],
        reference_time: datetime.datetime,
        train_schedules: List[TrainSchedule] = [],
        resources: List[Resource] = []
    ) -> OptimizationResult:
        
        start_time = time.time()
        
        # 1. Rank tasks by priority
        scored_tasks = []
        for t in tasks:
            p_score = 50.0
            p_level = "MEDIUM"
            if getattr(t, 'priority', None):
                try:
                    res = self.priority_engine.score(priority=t.priority, deadline=t.deadline, now=reference_time)
                    p_score = res.priority_score
                    p_level = res.priority_level.value
                except Exception:
                    pass
            scored_tasks.append((p_score, p_level, t))
            
        # Sort by priority score DESC
        scored_tasks.sort(key=lambda x: x[0], reverse=True)
        
        # Chronologically sort blocks
        sorted_blocks = sorted(blocks, key=lambda b: b.requested_start_time)
        
        assignments: List[TaskAssignment] = []
        scheduled_tasks_count = 0
        unscheduled_tasks_count = 0
        
        # Data structures to track occupied intervals for constraints
        asset_occupancy = {} # dict of asset_id -> list of (start, end)
        section_trains = {} # dict of section_id -> list of (start, end)
        
        for ts in train_schedules:
            if ts.section_id and ts.scheduled_arrival and ts.scheduled_departure:
                day = reference_time.date()
                tz = reference_time.tzinfo
                arr = datetime.datetime.combine(day, ts.scheduled_arrival).replace(tzinfo=tz)
                dep = datetime.datetime.combine(day, ts.scheduled_departure).replace(tzinfo=tz)
                if dep < arr:
                    dep += datetime.timedelta(days=1)
                
                if ts.section_id not in section_trains:
                    section_trains[ts.section_id] = []
                section_trains[ts.section_id].append((arr, dep))
                
        # 2. Assign tasks
        for score, level, task in scored_tasks:
            duration_hrs = task.estimated_duration_hours or 1.0
            duration = datetime.timedelta(hours=duration_hrs)
            
            assigned = False
            for block in sorted_blocks:
                if assigned:
                    break
                    
                # Scan block for earliest fit
                current_time = max(block.requested_start_time, reference_time)
                block_end = block.requested_end_time
                
                while current_time + duration <= block_end:
                    proposed_start = current_time
                    proposed_end = current_time + duration
                    
                    # Check deadline
                    if task.deadline and proposed_end > task.deadline:
                        break # Cannot fit before deadline in this block (or future blocks)
                        
                    # Check asset conflict
                    asset_conflict = False
                    if task.asset_id and task.asset_id in asset_occupancy:
                        for occ_start, occ_end in asset_occupancy[task.asset_id]:
                            if max(proposed_start, occ_start) < min(proposed_end, occ_end):
                                asset_conflict = True
                                break
                    if asset_conflict:
                        # Move current time past the conflict
                        current_time += datetime.timedelta(minutes=30)
                        continue
                        
                    # Check train conflict
                    train_conflict = False
                    if task.section_id and task.section_id in section_trains:
                        for tr_start, tr_end in section_trains[task.section_id]:
                            if max(proposed_start, tr_start) < min(proposed_end, tr_end):
                                train_conflict = True
                                break
                    if train_conflict:
                        current_time += datetime.timedelta(minutes=30)
                        continue
                        
                    # Valid slot found
                    assignments.append(TaskAssignment(
                        task_id=task.id,
                        scheduled_start=proposed_start,
                        scheduled_end=proposed_end,
                        block_id=block.id,
                        is_scheduled=True,
                        priority_level=level
                    ))
                    
                    if task.asset_id:
                        if task.asset_id not in asset_occupancy:
                            asset_occupancy[task.asset_id] = []
                        asset_occupancy[task.asset_id].append((proposed_start, proposed_end))
                        
                    assigned = True
                    scheduled_tasks_count += 1
                    break
                    
            if not assigned:
                assignments.append(TaskAssignment(
                    task_id=task.id,
                    scheduled_start=reference_time,
                    scheduled_end=reference_time,
                    is_scheduled=False,
                    priority_level=level
                ))
                unscheduled_tasks_count += 1
                
        solve_time = time.time() - start_time
        
        return OptimizationResult(
            solver_status=SolverStatus.FEASIBLE if scheduled_tasks_count > 0 else SolverStatus.OPTIMAL,
            solve_time_seconds=solve_time,
            tasks_scheduled=scheduled_tasks_count,
            tasks_unscheduled=unscheduled_tasks_count,
            assignments=assignments,
            objective_value=float(scheduled_tasks_count) # baseline objective is just count
        )
