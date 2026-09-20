"""
RAILBLOCK AI — CP-SAT Optimization Service (Stage 3C.1)
"""
import uuid
import datetime
import math
from typing import List, Dict, Optional, Any
from ortools.sat.python import cp_model

from app.schemas.optimization import (
    OptimizationConfig,
    OptimizationResult,
    SolverStatus,
    TaskAssignment
)
from app.models.maintenance import MaintenanceRequest
from app.models.block import BlockRequest
from app.models.train import TrainSchedule
from app.models.resource import Resource, ResourceAvailability

class OptimizationService:
    """
    Core solver bridging domain entities with OR-Tools CP-SAT.
    Granularity: 1 minute intervals.
    """
    def __init__(self, config: Optional[OptimizationConfig] = None):
        self.config = config or OptimizationConfig()
        # Ensure we anchor the time to something if not explicitly passed, 
        # but normally we use relative minutes from a reference point.
        self.horizon_minutes = self.config.planning_horizon_hours * 60
        
    def solve(
        self,
        tasks: List[MaintenanceRequest],
        blocks: List[BlockRequest],
        train_schedules: List[TrainSchedule] = [],
        resources: List[Resource] = [],
        reference_time: Optional[datetime.datetime] = None
    ) -> OptimizationResult:
        """
        Build and solve the CP-SAT model for assigning tasks to block windows.
        """
        model = cp_model.CpModel()
        
        # If no tasks or no blocks, trivial solution
        if not tasks:
            return self._build_empty_result(0.0)

        ref_time = reference_time or datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0)
        
        # We will represent time as minutes offset from ref_time
        def dt_to_min(dt: datetime.datetime) -> int:
            return int((dt - ref_time).total_seconds() / 60)
            
        def min_to_dt(m: int) -> datetime.datetime:
            return ref_time + datetime.timedelta(minutes=m)

        # ---------------------------------------------------------------------------
        # DECISION VARIABLES
        # ---------------------------------------------------------------------------
        
        # For each task, we need:
        # - start time (0 to horizon)
        # - end time (0 to horizon)
        # - interval (start, duration, end)
        # - is_scheduled (boolean)
        # - assignment to a specific block (boolean per block)
        
        task_vars = {}
        for t in tasks:
            # Durations are provided in hours by the model
            duration_mins = int(math.ceil(t.estimated_duration_hours * 60)) if t.estimated_duration_hours else 60
            
            is_scheduled = model.NewBoolVar(f't_{t.id}_is_scheduled')
            start_var = model.NewIntVar(0, self.horizon_minutes, f't_{t.id}_start')
            end_var = model.NewIntVar(0, self.horizon_minutes, f't_{t.id}_end')
            dur_var = model.NewConstant(duration_mins)
            
            # Optional interval (only active if is_scheduled is true)
            interval_var = model.NewOptionalIntervalVar(
                start_var, dur_var, end_var, is_scheduled, f't_{t.id}_interval'
            )
            
            block_assignments = {}
            for b in blocks:
                # Can we schedule task t in block b?
                b_var = model.NewBoolVar(f't_{t.id}_b_{b.id}')
                block_assignments[b.id] = b_var
                
            task_vars[t.id] = {
                'task': t,
                'is_scheduled': is_scheduled,
                'start': start_var,
                'end': end_var,
                'interval': interval_var,
                'block_assignments': block_assignments,
                'duration': duration_mins
            }

        # ---------------------------------------------------------------------------
        # HARD CONSTRAINTS
        # ---------------------------------------------------------------------------

        # 1. Block Window Boundaries
        for t_id, tv in task_vars.items():
            is_sched = tv['is_scheduled']
            
            # A scheduled task must be assigned to exactly one block (if there are blocks)
            if blocks:
                block_vars = list(tv['block_assignments'].values())
                model.Add(sum(block_vars) == 1).OnlyEnforceIf(is_sched)
                model.Add(sum(block_vars) == 0).OnlyEnforceIf(is_sched.Not())
            
            # Task must fit within its assigned block
            for b in blocks:
                if not b.requested_start_time or not b.requested_end_time:
                    continue
                b_start = max(0, dt_to_min(b.requested_start_time))
                b_end = min(self.horizon_minutes, dt_to_min(b.requested_end_time))
                
                b_var = tv['block_assignments'][b.id]
                
                # If assigned to this block, start >= b_start and end <= b_end
                model.Add(tv['start'] >= b_start).OnlyEnforceIf(b_var)
                model.Add(tv['end'] <= b_end).OnlyEnforceIf(b_var)

        # 2. Asset Conflict Prevention
        # No two tasks on the SAME asset can overlap
        asset_to_intervals = {}
        for t_id, tv in task_vars.items():
            asset = tv['task'].asset_id
            if asset:
                if asset not in asset_to_intervals:
                    asset_to_intervals[asset] = []
                asset_to_intervals[asset].append(tv['interval'])
                
        for asset, intervals in asset_to_intervals.items():
            if len(intervals) > 1:
                model.AddNoOverlap(intervals)
                
        # 3. Basic Dependency Constraints (e.g. deadline)
        for t_id, tv in task_vars.items():
            t_obj = tv['task']
            if t_obj.deadline:
                deadline_min = dt_to_min(t_obj.deadline)
                if deadline_min < self.horizon_minutes:
                    # Must finish before deadline if scheduled
                    model.Add(tv['end'] <= deadline_min).OnlyEnforceIf(tv['is_scheduled'])

        # 4. Train Constraints / Occupancy Constraints
        # (This is simplified for Stage 3C.1 foundation. If a block overlaps a train, we could prevent tasks in that segment)
        # OR we just enforce NO OVERLAP between Train intervals and Task intervals in the same Section.
        
        section_to_train_intervals = {}
        # Create fixed intervals for trains
        for ts in train_schedules:
            sec = ts.section_id
            if not sec:
                continue
            if ts.scheduled_arrival and ts.scheduled_departure:
                # Convert time to today's datetime roughly for demo
                # Real implementation would match exact dates
                arr = datetime.datetime.combine(ref_time.date(), ts.scheduled_arrival).replace(tzinfo=datetime.timezone.utc)
                dep = datetime.datetime.combine(ref_time.date(), ts.scheduled_departure).replace(tzinfo=datetime.timezone.utc)
                
                # If the train departs tomorrow
                if dep < arr:
                    dep += datetime.timedelta(days=1)
                    
                arr_min = dt_to_min(arr)
                dep_min = dt_to_min(dep)
                
                if arr_min < self.horizon_minutes and dep_min > 0:
                    arr_min = max(0, arr_min)
                    dep_min = min(self.horizon_minutes, dep_min)
                    
                    if dep_min > arr_min:
                        if sec not in section_to_train_intervals:
                            section_to_train_intervals[sec] = []
                        
                        # Create a fixed interval for the train
                        t_arr_var = model.NewConstant(arr_min)
                        t_dur_var = model.NewConstant(dep_min - arr_min)
                        t_dep_var = model.NewConstant(dep_min)
                        train_interval = model.NewIntervalVar(t_arr_var, t_dur_var, t_dep_var, f'train_{ts.id}_sec_{sec}')
                        section_to_train_intervals[sec].append(train_interval)
                    
        # Add NoOverlap per section (Tasks + Trains)
        section_to_task_intervals = {}
        for t_id, tv in task_vars.items():
            sec = tv['task'].section_id
            if sec:
                if sec not in section_to_task_intervals:
                    section_to_task_intervals[sec] = []
                section_to_task_intervals[sec].append(tv['interval'])
                
        for sec, t_intervals in section_to_task_intervals.items():
            all_intervals = list(t_intervals)
            if sec in section_to_train_intervals:
                all_intervals.extend(section_to_train_intervals[sec])
            if len(all_intervals) > 1:
                # Ensuring single-track safety constraint (only 1 activity per section at a time)
                model.AddNoOverlap(all_intervals)

        # ---------------------------------------------------------------------------
        # OBJECTIVE (STAGE 3C.2)
        # ---------------------------------------------------------------------------
        objective_terms = []
        
        # Default Weights
        w_priority = self.config.objective_weights.get("priority", 1000)
        w_unused_block = self.config.objective_weights.get("unused_block_penalty", -5)
        w_downtime = self.config.objective_weights.get("downtime_penalty", -1)
        w_overdue = self.config.objective_weights.get("overdue_bonus", 5000)
        w_train_disruption = self.config.objective_weights.get("train_disruption", -2000)
        
        from app.services.priority_engine import PriorityEngine
        priority_engine = PriorityEngine()
        
        for t_id, tv in task_vars.items():
            t_obj = tv['task']
            
            # 1. Priority Integration
            p_score = 50.0
            if getattr(t_obj, 'priority', None):
                try:
                    res = priority_engine.score(priority=t_obj.priority, deadline=t_obj.deadline, now=ref_time)
                    p_score = res.priority_score
                except Exception:
                    pass
            tv['priority_score'] = p_score
            
            is_overdue = False
            if getattr(t_obj, 'deadline', None) and t_obj.deadline < ref_time:
                is_overdue = True
                
            task_weight = int(p_score * w_priority)
            if is_overdue:
                task_weight += w_overdue
                
            objective_terms.append(tv['is_scheduled'] * task_weight)
            
            # 2. Asset Downtime Penalty
            duration_mins = int((t_obj.estimated_duration_hours or 1.0) * 60)
            objective_terms.append(tv['is_scheduled'] * (duration_mins * w_downtime))
            
        # 3. Block Utilization (Penalize opening blocks, encouraging packing)
        block_used_vars = {}
        for b in blocks:
            b_used = model.NewBoolVar(f'block_{b.id}_used')
            block_used_vars[b.id] = b_used
            
            tasks_in_block = [tv['block_assignments'][b.id] for tv in task_vars.values()]
            if tasks_in_block:
                model.AddMaxEquality(b_used, tasks_in_block)
            else:
                model.Add(b_used == 0)
                
            block_capacity_mins = int((b.requested_end_time - b.requested_start_time).total_seconds() / 60)
            objective_terms.append(b_used * (block_capacity_mins * w_unused_block))
            
        model.Maximize(sum(objective_terms))

        # ---------------------------------------------------------------------------
        # SOLVER EXECUTION
        # ---------------------------------------------------------------------------
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.config.time_limit_seconds
        solver.parameters.num_search_workers = self.config.worker_count
        
        status = solver.Solve(model)
        
        # ---------------------------------------------------------------------------
        # RESULT EXTRACTION
        # ---------------------------------------------------------------------------
        status_map = {
            cp_model.OPTIMAL: SolverStatus.OPTIMAL,
            cp_model.FEASIBLE: SolverStatus.FEASIBLE,
            cp_model.INFEASIBLE: SolverStatus.INFEASIBLE,
            cp_model.UNKNOWN: SolverStatus.TIME_LIMIT, # Unknown often means timeout before finding a feasible sol
            cp_model.MODEL_INVALID: SolverStatus.ERROR
        }
        
        mapped_status = status_map.get(status, SolverStatus.ERROR)
        
        result = OptimizationResult(
            solver_status=mapped_status,
            solve_time_seconds=solver.WallTime(),
            tasks_scheduled=0,
            tasks_unscheduled=0,
            assignments=[],
            objective_value=solver.ObjectiveValue() if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0
        )
        
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for t_id, tv in task_vars.items():
                if solver.Value(tv['is_scheduled']):
                    result.tasks_scheduled += 1
                    
                    start_val = solver.Value(tv['start'])
                    end_val = solver.Value(tv['end'])
                    
                    assigned_block = None
                    for b_id, b_var in tv['block_assignments'].items():
                        if solver.Value(b_var):
                            assigned_block = b_id
                            break
                            
                    p_score = tv.get('priority_score', 50.0)
                    if p_score >= 75:
                        p_level = "CRITICAL"
                    elif p_score >= 50:
                        p_level = "HIGH"
                    elif p_score >= 25:
                        p_level = "MEDIUM"
                    else:
                        p_level = "LOW"
                        
                    result.assignments.append(TaskAssignment(
                        task_id=t_id,
                        scheduled_start=min_to_dt(start_val),
                        scheduled_end=min_to_dt(end_val),
                        block_id=assigned_block,
                        is_scheduled=True,
                        priority_level=p_level
                    ))
                else:
                    result.tasks_unscheduled += 1
                    
                    p_score = tv.get('priority_score', 50.0)
                    if p_score >= 75:
                        p_level = "CRITICAL"
                    elif p_score >= 50:
                        p_level = "HIGH"
                    elif p_score >= 25:
                        p_level = "MEDIUM"
                    else:
                        p_level = "LOW"
                        
                    result.assignments.append(TaskAssignment(
                        task_id=t_id,
                        scheduled_start=ref_time,
                        scheduled_end=ref_time,
                        is_scheduled=False,
                        priority_level=p_level
                    ))
        
        return result

    def _build_empty_result(self, time_sec: float) -> OptimizationResult:
        return OptimizationResult(
            solver_status=SolverStatus.OPTIMAL,
            solve_time_seconds=time_sec,
            tasks_scheduled=0,
            tasks_unscheduled=0,
            assignments=[],
            objective_value=0.0
        )
