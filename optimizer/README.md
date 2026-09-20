# RAILBLOCK AI — Optimization Engine

This directory contains the CP-SAT optimization engine built on Google OR-Tools.

## Planned Components (future stages)

### Block Scheduling Optimizer
- Solver: Google OR-Tools CP-SAT
- Variables: block windows, maintenance tasks, resource assignments
- Constraints:
  - Train schedule compatibility
  - Resource availability
  - Dependency ordering
  - Regulatory minimum maintenance intervals
  - Working hours and crew constraints
- Objective: maximize maintenance coverage while minimizing disruption

### Conflict Detector
- Pre-solve conflict identification
- Returns human-readable conflict explanations

## Status
PLANNED — Not implemented in Stage 1.
OPTIMIZER_ENABLED=false in settings.
