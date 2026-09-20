# RAILBLOCK AI — Optimization Documentation

## Stage 3B.1: Compatibility Engine
Implemented a deterministic domain rule engine to evaluate whether maintenance tasks can share the same block window.
It returns COMPATIBLE, CONDITIONALLY_COMPATIBLE, or INCOMPATIBLE based on time, asset, section, department, and resource overlaps.

## Stage 3B.2: Conflict Engine
Implemented a deterministic domain rule engine to evaluate operational conflicts.
Supports TRAIN_CONFLICT, TASK_OVERLAP, ASSET_CONFLICT, RESOURCE_CONFLICT, DEADLINE_CONFLICT, BLOCK_CONFLICT, and DATA_CONFLICT.

## Integration (Stage 3B.3)
Services are independently callable but designed to be chained in the optimizer pre-processing step. The Optimizer logic is strictly reserved for Stage 3C, keeping domain rules in Stage 3A/3B isolated.

## Stage 3C.1: Optimization Foundation
The OptimizationService utilizes Google OR-Tools CP-SAT to schedule maintenance tasks into block windows.
### Input Model
Tasks, Blocks, Trains, and Deadlines are passed directly into the solver instance.
### Decision Variables
- 	_{id}_is_scheduled: Boolean representing if the task is placed.
- 	_{id}_start, 	_{id}_end: Integer offsets in minutes.
- 	_{id}_b_{id}: Boolean assignment tracking block assignment.
### Hard Constraints
1. Task must fit entirely inside its assigned Block.
2. No two tasks on the SAME Asset can overlap in time.
3. Task completion must strictly obey deadlines.
4. Task cannot overlap with a Train occupying the same Section.
### Solver Statuses
Returned as OPTIMAL, FEASIBLE, INFEASIBLE, TIME_LIMIT, or ERROR.

## Stage 3C.2: Optimization Objectives & Solution Validation

### Configurable Weights & Objective Terms
The CP-SAT model's objective function has been expanded to support a configurable, weighted summation. Currently supported factors:
1. **Priority Score (priority)**: Task selection is weighted by its dynamic PriorityEngine score.
2. **Overdue Penalty (overdue_bonus)**: Heavy bonus applied for successfully scheduling tasks that are past their deadline.
3. **Asset Downtime (downtime_penalty)**: Penalizes total scheduled duration to incentivize minimal block times on assets.
4. **Block Utilization (unused_block_penalty)**: Penalizes the opening of blocks based on their capacity, encouraging the solver to pack compatible tasks tightly into fewer active blocks.
*Weights are strictly configurable via OptimizationConfig.*

### PriorityEngine Integration
The OptimizationService natively polls PriorityEngine for each incoming task. The objective respects the returned 0-100 score, dynamically biasing CP-SAT to select CRITICAL and HIGH tasks over LOW ones. Hard constraints are strictly maintained—priority never permits constraint violation.

### Solver Status Semantics
- **OPTIMAL**: Full state space searched; the absolute best configuration given the weights was found.
- **FEASIBLE**: A valid plan was found, but TIME_LIMIT was reached before optimality could be proven. (Reported via TIME_LIMIT).
- **TIME_LIMIT**: Search aborted early. If solutions exist, they are yielded.
- **INFEASIBLE**: Mathematical impossibility given the hard constraints.
- **ERROR**: Internal solver configuration or mapping fault.

### Independent Solution Validator
An independent SolutionValidator intercepts the final solver results. It performs a rigid, deterministic sweep of the proposed plan to detect:
- BLOCK_BOUNDARY_VIOLATION
- DURATION_VIOLATION
- DEADLINE_VIOLATION
- ASSET_CONFLICT
- TRAIN_CONFLICT
- INVALID_ASSIGNMENT

### Validated Plan vs Invalid Plan
The application rigorously distinguishes between a **SOLVER SOLUTION** (raw CP-SAT output) and a **VALIDATED PLAN**. A plan is ONLY marked valid if the independent SolutionValidator returns alid=True. If SolutionValidator rejects the plan, it is an **INVALID PLAN** regardless of whether OR-Tools claimed it was OPTIMAL.

### ENVIRONMENT-LIMITED: OR-Tools on Python 3.13 Windows
*Known Limitation*: Google OR-Tools 9.15's SWIG C++ wrapper contains a known access-violation defect when Solve() is executed under Python 3.13 on Windows. 
To preserve pipeline health, automated tests intercept the Solve() execution in this specific environment, substituting verified deterministic responses while still proving full model, objective, constraint, and validator construction logic at the Python level.

## Stage 3C.3: Baseline, Comparison, Explanation & Manual Validation

### Baseline Scheduler
The BaselineScheduler acts as the control variable against the CP-SAT engine.
It leverages the deterministic PriorityEngine to rank tasks and iteratively schedules them in the earliest feasible gap within a block. It enforces all hard constraints (durations, deadlines, block bounds, asset conflict, train conflict) matching the optimizer.

### Comparison Metrics
The ComparisonService contrasts OptimizationResult outputs from Baseline and CP-SAT engines.
**Measured Metrics**:
- Total tasks scheduled
- Critical tasks scheduled
- Asset downtime (duration of tasks)
- Number of active blocks

*Note: Multi-department coordination and re-scheduling are currently implicitly optimized via block packing metrics and the Compatibility Engine filtering layer. They are NOT EXPLICITLY OPTIMIZED or measured standalone yet.*

### Explanation Engine
Generates deterministic reasoning for why a task was or wasn't scheduled.
It correlates PriorityEngine scores, task constraints, block boundaries, and final solver output into structured components:
- Decision
- Primary Reason
- Supporting Factors
- Constraints
- Conflicts

### Manual Validation
Manual planner overrides route through the ManualValidationService, substituting the assignment into the optimization result and submitting it to the strict SolutionValidator. Invalid moves (e.g. dragging a task outside of a block) are rejected with exact constraint violation reasons.
