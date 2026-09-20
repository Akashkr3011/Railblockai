# RAILBLOCK AI — System Architecture

**SIH 2026 — Problem Statement #27**
**Version:** 0.1.0 (Stage 1)
**Last Updated:** 2026-09-11

---

## System Classification

RAILBLOCK AI is a **decision-support and planning system**.

It is **NOT**:
- Train control
- Signaling control
- Interlocking control
- Autonomous safety system

All operational approvals remain with authorized Indian Railways personnel.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAILBLOCK AI SYSTEM                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND LAYER                        │   │
│  │  React 18 + TypeScript + Vite + Tailwind CSS             │   │
│  │  shadcn/ui · TanStack Query · React Router               │   │
│  │  Recharts (analytics) · Leaflet (railway map)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↕ REST + WebSocket (future)            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     API LAYER                            │   │
│  │  FastAPI (Python 3.11) · Pydantic v2                     │   │
│  │  JWT Authentication (Stage 3)                            │   │
│  │  Versioned REST: /api/v1/...                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↕                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               APPLICATION SERVICES                       │   │
│  │  MaintenanceService · BlockService · SchedulingService   │   │
│  │  AlertService · AuditService · NotificationService       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↕                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                DOMAIN SERVICES                           │   │
│  │  PriorityEngine · ConflictDetector · RuleEngine          │   │
│  │  BlockWindowValidator · MaintenanceScheduler             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↕                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   REPOSITORIES                           │   │
│  │  UserRepo · AssetRepo · MaintenanceRepo · BlockRepo      │   │
│  │  TrainRepo · OptimizationRepo · AuditRepo                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↕                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL 15+                         │   │
│  │  SQLAlchemy 2.0 (async) · Alembic migrations             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Supporting Layers:                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────┐ │
│  │   AI/ML     │ │  OPTIMIZER  │ │  SIMULATION  │ │ EVENTS │ │
│  │  Priority   │ │  CP-SAT     │ │  Mock TMS    │ │ Redis  │ │
│  │  Prediction │ │  OR-Tools   │ │  Replay      │ │ WS     │ │
│  │ (Stage 7)   │ │  (Stage 6)  │ │  (Stage 9)   │ │ (St.8) │ │
│  └─────────────┘ └─────────────┘ └──────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Domain Model

### Core Entities

| Entity | Description |
|--------|-------------|
| `User` | System users with role-based access |
| `Role` | `system_admin`, `divisional_engineer`, `section_engineer`, `maintenance_supervisor`, `track_supervisor`, `dispatcher`, `viewer` |
| `Division` | Indian Railways administrative division (e.g., Mumbai, Chennai) |
| `Route` | Railway route (e.g., CST–Pune) |
| `Station` | Railway station on a route |
| `Section` | Track section between two stations |
| `Asset` | Infrastructure asset (track, bridge, signal, OHE, etc.) |
| `Defect` | Reported defect on an asset |
| `MaintenanceTask` | Work order for maintenance activity |
| `MaintenanceHistory` | Completed maintenance record |
| `Resource` | Human/equipment resource (gang, machine, crew) |
| `Train` | Train entity with train number |
| `TrainSchedule` | Scheduled train timings on sections |
| `TrainPosition` | Simulated real-time position |
| `BlockRequest` | Request for a maintenance block window |
| `BlockWindow` | Approved time window for a block |
| `BlockPlan` | Optimized assignment of tasks to windows |
| `OptimizationRun` | Record of a CP-SAT solver execution |
| `Scenario` | Named simulation scenario |
| `Alert` | System-generated alert or notification |
| `AuditLog` | Complete audit trail of all actions |
| `DataSource` | Integration data source metadata |

---

## Layer Responsibilities

### Frontend Layer
- **Technology:** React 18 + TypeScript + Vite
- **Responsibility:** User interface, interactive planning, visualization
- **Communicates with:** API Layer via REST (Axios + TanStack Query)
- **Patterns:** Component-based, TanStack Query for server state, React Hook Form + Zod for forms

### API Layer
- **Technology:** FastAPI + Pydantic v2
- **Responsibility:** HTTP routing, request validation, response serialization, auth enforcement
- **Pattern:** Versioned REST (`/api/v1/...`); OpenAPI spec auto-generated
- **Auth:** JWT Bearer tokens (Stage 3)

### Application Services
- **Responsibility:** Orchestrate domain operations, coordinate multiple domain services
- **Pattern:** Service classes injected via FastAPI `Depends()`
- **Examples:** `MaintenanceService.create_task()`, `BlockService.submit_request()`

### Domain Services
- **Responsibility:** Core business logic — scheduling rules, conflict detection, priority calculation
- **Pattern:** Pure functions where possible; rule engine for compliance validation
- **Key Services:**
  - `PriorityEngine` — AI-assisted priority scoring
  - `ConflictDetector` — identifies scheduling conflicts with train operations
  - `RuleEngine` — validates blocks against IR operational rules
  - `BlockWindowValidator` — checks constraint satisfaction

### Repositories
- **Responsibility:** All database access — queries, inserts, updates, deletes
- **Pattern:** Repository pattern with generic base; SQLAlchemy 2.0 async sessions
- **Injected:** Via `Depends(get_db)` through service layer

### Database
- **Technology:** PostgreSQL 15+ with SQLAlchemy 2.0 + Alembic
- **Schema:** UUID primary keys, timezone-aware timestamps, soft deletes
- **Migrations:** Alembic with auto-generated migrations from model changes

---

## Supporting Layers

### AI/ML Engine (Stage 7)
- **Purpose:** Predict maintenance priority scores
- **Input:** Asset criticality, defect severity, overdue status, operational impact
- **Output:** Priority score 0–100 per maintenance task
- **Technology:** Python + scikit-learn / XGBoost; served via internal endpoint

### Optimization Engine (Stage 6)
- **Purpose:** Schedule maintenance tasks into block windows optimally
- **Technology:** Google OR-Tools CP-SAT
- **Constraints:** Train schedules, resource availability, regulatory requirements
- **Output:** Optimized `BlockPlan` with task-window assignments

### Simulation Engine (Stage 9)
- **Purpose:** What-if analysis without affecting production data
- **Data:** SIMULATED train schedules, SIMULATED blocks — clearly labeled
- **Output:** Scenario comparison reports

### Real-time Event Layer (Stage 8)
- **Technology:** WebSocket (FastAPI) + Redis pub/sub
- **Purpose:** Live updates for block status changes, train conflicts, alerts
- **Pattern:** Server-sent events to frontend subscribers

### Integration Adapters (Future)
- **TMS Adapter:** Train Management System integration (authorized IR API)
- **COA Adapter:** Chief Operating Analyst report integration
- **Status in prototype:** SIMULATED — synthetic data generators

---

## Data Flow

### Maintenance Block Request Flow

```
Engineer submits block request
         ↓
  API: POST /api/v1/blocks/requests
         ↓
  BlockService.submit_request()
         ↓
  ConflictDetector.check(request)     ← TrainScheduleRepository
         ↓
  RuleEngine.validate(request)        ← regulatory rules
         ↓
  BlockRepository.save(request)       → PostgreSQL
         ↓
  Alert generated → Notification sent
         ↓
  [Optional] OptimizationService.run() → CP-SAT solver
         ↓
  BlockPlan created → returned to frontend
```

### Priority Scoring Flow

```
Defect reported / Maintenance task created
         ↓
  PriorityEngine.score(task)
         ↓
  [ML score] + [Rule-based adjustments]
         ↓
  Priority: CRITICAL / HIGH / MEDIUM / LOW
         ↓
  Task sorted in maintenance queue
```

---

## Security Architecture

- **Authentication:** JWT Bearer tokens (HS256)
- **Authorization:** Role-Based Access Control (RBAC)
- **Transport:** HTTPS in production
- **Secrets:** Environment variables only — never in source code
- **Audit:** Complete audit log of all state-changing operations

---

## API Design Principles

- **Versioning:** `/api/v1/` prefix for all endpoints
- **Pagination:** Cursor-based for large lists
- **Error format:** RFC 9457 Problem Details JSON
- **Datetime:** ISO 8601, UTC timezone
- **IDs:** UUID v4

---

## Deployment (Target)

```
nginx (TLS termination)
    ↓
Docker Compose / Kubernetes
    ├── frontend (React build → nginx)
    ├── backend (uvicorn workers)
    ├── postgres (PostgreSQL 15)
    └── redis (future — real-time events)
```

---

## Data Simulation Policy

**All simulation data is clearly labeled.** Labels used:

| Label | Meaning |
|-------|---------|
| `[SIMULATED]` | Data generated by simulation engine |
| `[SIMULATED TMS]` | Synthetic train management data |
| `[SIMULATED COA]` | Synthetic operating analyst data |
| `[MOCK]` | Test/demo data for UI prototyping |
| `[REPLAY]` | Historical scenario being replayed |

Real Indian Railways live data will only be integrated through
officially authorized APIs when access is granted.

## Stage 3B Data Flow
Maintenance Data -> Data Quality -> PriorityEngine -> CompatibilityEngine -> ConflictEngine -> Stage 3C Optimizer
