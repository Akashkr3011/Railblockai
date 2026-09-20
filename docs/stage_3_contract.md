# RAILBLOCK AI — Stage 3 API Contract

**Document Type:** Pre-Stage-3 Input Contract  
**Created:** 2026-09-14 (Stage 2.5 Recovery)  
**Purpose:** Define every data input the Stage 3 optimizer requires, how to retrieve it, and what schema it returns. Stage 3 must NOT redesign any of these.

> [!IMPORTANT]
> This document is a CONTRACT, not a design. Stage 3 must use these endpoints and models as-is. Do NOT change the database schema or API contracts defined here without updating this document.

---

## Architecture Principle

```
External Data Sources (Simulated in Prototype)
          ↓
    Integration Adapters (7 adapters)
          ↓
    Canonical Data Model (PostgreSQL via SQLAlchemy)
          ↓
    REST API Layer (FastAPI)
          ↓
    [Stage 3] Optimizer Inputs ← THIS DOCUMENT DEFINES
          ↓
    [Stage 3] CP-SAT / Priority Engine
          ↓
    Block Plans + Priority Scores
```

---

## Input 1 — Maintenance Tasks

**Source:** `MaintenanceRequest` model via `/api/v1/maintenance`  
**Adapter Source:** TMS, SMMS, TDMS, COA, BDMS (all simulated in prototype)

### API Endpoint
```
GET /api/v1/maintenance?status=PENDING&priority=CRITICAL&limit=200
```

### Key Fields for Optimizer
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Task identity |
| `title` | str | Human label |
| `priority` | CRITICAL/HIGH/MEDIUM/LOW | Optimizer weight |
| `priority_score` | float? | ML-computed score (Stage 3 writes this) |
| `status` | MaintenanceStatus | Filter: PENDING/SCHEDULED/etc. |
| `asset_id` | UUID | Links to asset → section → route |
| `section_id` | UUID | Direct section link for block assignment |
| `estimated_duration_hours` | float | Block time requirement |
| `deadline` | datetime | Hard constraint for optimizer |
| `requires_block` | bool | Whether traffic block is needed |
| `required_gang_size` | int | Resource constraint |
| `category` | MaintenanceCategory | Department routing (TRACK→ENGG, SIGNAL→S&T, etc.) |
| `source_system` | SourceSystem | Data provenance |

### Notes
- Filter to `requires_block=true` for block-dependent tasks
- Filter to `status IN (PENDING, UNDER_REVIEW, SCHEDULED)` for optimizer input
- `priority_score` will be written back by Stage 3 after computation

---

## Input 2 — Assets

**Source:** `Asset` model via `/api/v1/assets`

### API Endpoint
```
GET /api/v1/assets?section_id=<UUID>&limit=200
```

### Key Fields for Optimizer
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Links to maintenance tasks |
| `section_id` | UUID | Physical location |
| `asset_type` | AssetType | Track, Bridge, Signal, etc. |
| `condition` | GOOD/FAIR/POOR/CRITICAL | Influences priority |
| `criticality_score` | float 0–10 | Pre-computed criticality |
| `next_due_date` | datetime | Maintenance deadline hint |
| `age_years` | float | Age factor for degradation |

### Traversal Path
```
MaintenanceRequest.asset_id → Asset.id → Asset.section_id → Section.id
```

---

## Input 3 — Sections

**Source:** `Section` model (accessed via asset relationship or `/api/v1/blocks`)

### Query Pattern (SQLAlchemy for Stage 3 service)
```python
from app.models.division import Section
section = await db.get(Section, section_id)
```

### Key Fields for Optimizer
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Identity |
| `code` | str | Human label (e.g. CR-CSTM-KYN) |
| `route_id` | UUID | Parent route |
| `length_km` | float | Physical extent |
| `number_of_tracks` | int | 1 = single line (higher conflict risk) |
| `is_electrified` | bool | Power block vs. engineering block |
| `section_type` | MAIN_LINE/BRANCH_LINE/etc. | Traffic density proxy |

---

## Input 4 — Train Schedules

**Source:** `TrainSchedule` model via `/api/v1/train-schedules`  
**Data Label:** `SIMULATED_TIMETABLE` (not real IR data)

### API Endpoint
```
GET /api/v1/train-schedules/by-section/{section_id}
GET /api/v1/train-schedules?train_id=<UUID>
```

### Key Fields for Optimizer (block conflict detection)
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Identity |
| `train_id` | UUID | Link to train |
| `section_id` | UUID | Which section this schedule applies to |
| `scheduled_arrival` | time | Arrival time (section-level) |
| `scheduled_departure` | time | Departure time (section-level) |
| `days_of_week` | str | "1234567" = runs every day |
| `data_source` | str | SIMULATED_TIMETABLE |
| `is_simulated` | bool | Always True in prototype |

### Optimizer Logic (Stage 3 Responsibility)
The optimizer must NOT schedule a block window on section S at times [T1, T2] if a train schedule exists for section S with a crossing time within [T1, T2].

---

## Input 5 — Goods Train Forecast

**Source:** `SimulatedGoodsForecastAdapter` via `/api/v1/data-sources/SIMULATED_GOODS_FORECAST/health`  
**Data Label:** `SIMULATED_GOODS_FORECAST` (not real IR goods movement data)

### Adapter Method
```python
from app.adapters.goods_forecast_adapter import SimulatedGoodsForecastAdapter
adapter = SimulatedGoodsForecastAdapter()
result = await adapter.fetch_goods_forecast(days_ahead=7)
```

### Key Fields per GoodsForecast Record (in `payload`)
| Field | Type | Purpose |
|:---|:---|:---|
| `train_number` | str | Goods train identifier |
| `section_code` | str | Section being traversed |
| `direction` | UP/DOWN | Movement direction |
| `expected_departure` | ISO datetime | When goods train enters section |
| `expected_arrival` | ISO datetime | When goods train exits section |
| `transit_duration_hours` | float | Time the section is occupied |
| `priority` | NORMAL/PRIORITY/HIGH_PRIORITY | Freight priority |
| `is_simulated` | bool | Always True |

### Notes
- Stage 3 uses this to identify occupied time windows per section
- Combined with `TrainSchedule` data to produce a complete section occupation map

---

## Input 6 — Block Windows

**Source:** `BlockWindow` model via `/api/v1/blocks`

### API Endpoint
```
GET /api/v1/blocks?section_id=<UUID>
```

### Key Fields for Optimizer
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Identity |
| `section_id` | UUID | Which section is blocked |
| `start_time` | datetime | Window start |
| `end_time` | datetime | Window end |
| `duration_hours` | float | Available work time |
| `block_type` | BlockType | Engineering vs. Power vs. Line block |
| `is_confirmed` | bool | Only confirmed windows are optimizable |

### Optimizer Logic
- Only assign tasks to confirmed block windows
- Task `estimated_duration_hours` must fit within window `duration_hours`
- Window section must match task `section_id`

---

## Input 7 — Resources

**Source:** `Resource` + `ResourceAvailability` models via `/api/v1/resources`

### API Endpoints
```
GET /api/v1/resources?is_available=true&specialization=Track
GET /api/v1/resources/{resource_id}/availability
```

### Key Fields for Optimizer
| Field | Type | Purpose |
|:---|:---|:---|
| `id` | UUID | Identity |
| `resource_type` | GANG/MACHINE/VEHICLE/SPECIALIST | Type filter |
| `size` | int | Gang size for capacity matching |
| `specialization` | str | Track/Bridge/Signal/Traction |
| `is_available` | bool | Current availability flag |

### ResourceAvailability Key Fields
| Field | Type | Purpose |
|:---|:---|:---|
| `resource_id` | UUID | Parent resource |
| `available_from` | datetime | Window start |
| `available_to` | datetime | Window end |

### Optimizer Logic
- Match task `required_gang_size` ≤ resource `size`
- Match task `category` → resource `specialization`
- Verify resource is available during assigned block window

---

## Input 8 — Deadlines

Derived from `MaintenanceRequest.deadline`.

### Query Pattern
```python
# Tasks with deadlines within N days
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_
now = datetime.now(timezone.utc)
cutoff = now + timedelta(days=14)
tasks_due_soon = select(MaintenanceRequest).where(
    and_(
        MaintenanceRequest.deadline <= cutoff,
        MaintenanceRequest.status == MaintenanceStatus.PENDING,
    )
)
```

### Optimizer Constraint
Tasks past or near their deadline must be treated as HARD constraints (must schedule). Tasks with deadlines far in the future are SOFT constraints.

---

## Input 9 — Departments

Derived from `MaintenanceRequest.category` → department mapping:

| Category | Department | Role |
|:---|:---|:---|
| TRACK | ENGG | Engineering department |
| BRIDGE | ENGG / CIVIL | Civil engineering |
| SIGNAL | S&T | Signals & Telecom |
| TRACTION | TRD | Traction / Electrical |
| TELECOM | S&T | Signals & Telecom |
| CIVIL | CIVIL | Civil engineering |
| ELECTRICAL | TRD / ELECTRICAL | Electrical |
| MECHANICAL | MECHANICAL | Mechanical |

The optimizer must assign tasks to block windows owned by the appropriate department and resource specialization.

---

## Input 10 — Operational Impact

Derived from section and train schedule data:

| Factor | Source | Optimizer Use |
|:---|:---|:---|
| Trains per hour on section | `TrainSchedule.section_id` count | Higher traffic = higher conflict cost |
| Goods train frequency | `GoodsForecastAdapter` | Freight disruption cost |
| Section type | `Section.section_type` | MAIN_LINE > BRANCH_LINE impact |
| Number of tracks | `Section.number_of_tracks` | Single track = full block required |
| Peak hours | Derived from schedule times | Cost multiplier for peak slots |

---

## Stage 3 Output Targets (for reference — Stage 3 implements)

Stage 3 will write results to:

| Model | Purpose |
|:---|:---|
| `OptimizationRun` | Records each solver execution |
| `BlockPlan` | Optimized plan header |
| `BlockPlanTask` | Individual task-to-window assignments |
| `MaintenanceRequest.priority_score` | Written back after priority computation |
| `MaintenanceRequest.status` → SCHEDULED | After optimizer assigns a task |
| `Alert` | Created for conflicts, overrides, completions |
| `AuditLog` | Every optimization action logged |

---

## Readiness Verification

To verify all inputs are accessible without implementing Stage 3:

```powershell
# Start backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Verify endpoints exist
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
Invoke-RestMethod http://127.0.0.1:8000/openapi.json | ConvertTo-Json -Depth 5

# After DB is available:
Invoke-RestMethod http://127.0.0.1:8000/api/v1/maintenance
Invoke-RestMethod http://127.0.0.1:8000/api/v1/resources
Invoke-RestMethod http://127.0.0.1:8000/api/v1/train-schedules
Invoke-RestMethod http://127.0.0.1:8000/api/v1/defects
Invoke-RestMethod http://127.0.0.1:8000/api/v1/blocks
```

---

## Prerequisites for Stage 3

Before Stage 3 begins, the following must be true:

- [ ] PostgreSQL running with `railblock_db` database
- [ ] `alembic upgrade head` applied successfully  
- [ ] `python -m data.seed` run successfully
- [ ] All 27 API routes confirmed working with real data
- [ ] Backend test suite: 58/58 passing
- [ ] Frontend build: success
