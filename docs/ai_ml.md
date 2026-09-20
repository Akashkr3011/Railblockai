# RAILBLOCK AI — AI and ML Architecture

**Status:** STAGE 3A (IMPLEMENTED)

This document describes the AI/ML foundation of RAILBLOCK AI, specifically the Priority Engine and the ML abstraction layer.

## Overview

RAILBLOCK AI uses AI and machine learning to prioritize maintenance, estimate durations, and evaluate risk. 
Because this is a prototype and genuine Indian Railways training data is unavailable, the current implementation uses a **validated, rule-based baseline** for all predictions.

The architecture is **MODEL-READY**, meaning that when training data becomes available, the underlying domain logic does not need to change. Future trained models (e.g., XGBoost, Random Forest) can be hot-swapped via the `ModelRegistry`.

---

## 1. Priority Engine [IMPLEMENTED]

The core of Stage 3A is the `PriorityEngine`. It deterministically scores any maintenance task from 0 to 100 based on six domain factors.

**Current Mode:** RULE-BASED BASELINE

### Scoring Factors and Weights

| Factor | Weight | Source | Description |
|:---|:---|:---|:---|
| **Criticality** | 30% | `Asset` | Asset's inherent safety criticality (0-10). |
| **Urgency** | 25% | `MaintenanceRequest` | Proximity to the task's deadline. |
| **Overdue Factor** | 20% | `MaintenanceRequest` | Independent boost if the deadline has already passed. |
| **Failure Risk** | 15% | `Asset` | Derived from asset condition and age. |
| **Asset Impact** | 7% | `Asset` | Asset type multiplier (e.g., TRACK > STATION). |
| **Operational Impact**| 3% | `Section` | Track density and section type (e.g., MAIN_LINE). |

### Output

Every priority calculation yields a `PriorityResult` containing:
- **`priority_score`**: Numeric 0-100 score.
- **`priority_level`**: CRITICAL (≥75), HIGH (≥50), MEDIUM (≥25), or LOW (<25).
- **`factors`**: Detailed breakdown of exactly how many points each factor contributed.
- **`reason`**: A human-readable explanation sentence dynamically generated from the top factors.

---

## 2. ML Abstraction Layer [IMPLEMENTED / MODEL-READY]

The `PredictionService` handles all AI inference requests. API routes never touch model classes directly.

### Standardized Prediction Output
Every prediction returns a standard output containing:
- `prediction`: The actual value (score, probability, hours, etc.)
- `confidence`: 0.0 to 1.0.
- `important_factors`: Feature importance list.
- `prediction_source`: **Always truthful**. Currently `RULE_BASED_BASELINE`. In the future, this will reflect the actual model (e.g., `XGBOOST`, `RANDOM_FOREST`).

### Supported Prediction Tasks

| Task | Output | Current Implementation |
|:---|:---|:---|
| `PRIORITY_CLASSIFICATION` | `PriorityResult` | `PriorityEngine` (Rule-Based) |
| `FAILURE_RISK` | Probability (0-1) | `FailureRiskBaseline` (Rule-Based) |
| `MAINTENANCE_DURATION` | Hours (float) | `MaintenanceDurationBaseline` (Rule-Based) |
| `TRAIN_IMPACT` | Affected Services | `TrainImpactBaseline` (Rule-Based) |

### Model Registry
Models are registered in the `ModelRegistry` (in `ml_models.py`). To upgrade a rule-based baseline to a trained ML model, one simply implements the `BaseMLModel` protocol and registers it for the appropriate `PredictionTask`.

---

## Stage 3B/3C Integration [PLANNED]

This Stage 3A foundation is designed directly for the Stage 3 optimizer:
1. The **Priority Engine** will rank all pending tasks before they are sent to the solver.
2. The **Train Impact predictor** will be used by the `ConflictEngine` to evaluate the cost of disrupting specific track sections.
3. The **Maintenance Duration predictor** acts as a fallback for tasks imported from external systems without explicit duration estimates.

## Stage 3B Rules Architecture
The intelligence layer separates concerns clearly:
1. DataQualityService: Sanitizes records
2. PriorityEngine: Evaluates urgency and assigns score (Rule-Based in Stage 3A)
3. CompatibilityEngine: Checks if tasks theoretically overlap without issues
4. ConflictEngine: Evaluates tasks against actual schedules (e.g. Train schedules)
This ensures the data is strictly validated and prioritized before reaching the optimization engine (Stage 3C).
