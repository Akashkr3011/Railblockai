# RAILBLOCK AI

> **Decision-support and maintenance block planning system for Indian Railways**
> SIH 2026 — Problem Statement #27

---

## ⚠️ System Classification

RAILBLOCK AI is a **decision-support and planning system only**.

It is NOT a train control, signaling, interlocking, or autonomous safety system.

All operational approvals remain with authorized railway personnel.

---

## Overview

RAILBLOCK AI assists Indian Railways maintenance engineers and divisional officers in:

- **Maintenance block planning** — scheduling maintenance windows (blocks) optimally
- **Priority-based work order management** — AI-ranked maintenance tasks
- **Constraint-aware scheduling** — CP-SAT optimization engine
- **Conflict detection** — preventing scheduling conflicts with train operations
- **Asset lifecycle tracking** — track/structure/equipment defect management
- **Simulation** — what-if scenarios before issuing actual blocks

---

## Architecture

```
Frontend (React + TypeScript)
        ↓
API Layer (FastAPI / REST)
        ↓
Application Services
        ↓
Domain Services + Rule Engine
        ↓
Repositories
        ↓
PostgreSQL 15+

Supporting Layers:
├── AI/ML Engine (priority prediction, anomaly detection)
├── Optimization Engine (OR-Tools CP-SAT)
├── Simulation Engine (scenario replay)
├── Real-time Event Layer (WebSocket / Redis)
└── Integration Adapters (TMS, COA — simulation only in prototype)
```

---

## Quick Start

### Prerequisites

- Node.js >= 20.x
- Python >= 3.11
- PostgreSQL >= 15
- Git

### 1. Clone and configure

```bash
git clone <repo-url> railblock-ai
cd railblock-ai
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # Linux/macOS
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit VITE_API_BASE_URL if needed
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## Project Structure

```
RailBlock AI/
├── frontend/          React + TypeScript + Vite + Tailwind + shadcn/ui
├── backend/           FastAPI application
│   ├── app/
│   │   ├── api/       REST API route handlers (versioned)
│   │   ├── models/    SQLAlchemy ORM models
│   │   ├── schemas/   Pydantic v2 schemas
│   │   ├── services/  Business logic layer
│   │   └── repositories/ Data access layer
│   └── alembic/       Database migrations
├── ml/                ML/AI models and training scripts
├── optimizer/         OR-Tools CP-SAT optimization engine
├── simulation/        Simulation engine and replay
├── docs/              Architecture and API documentation
├── data/              Seed data, fixtures, reference data
├── tests/             Integration and E2E tests
├── deployment/        Docker, CI/CD configurations
├── implemented.txt    Feature implementation tracking
└── modifications.txt  Change tracking for existing components
```

---

## Data Notice

All train schedules, block data, and operational metrics used in this prototype
are **SIMULATED** for demonstration purposes only.

They do **not** represent actual Indian Railways live data.

The architecture is designed for future integration with authorized railway
data sources (TMS, COA) when access is granted.

---

## Stage Status

| Stage | Description | Status |
|-------|-------------|--------|
| 1 | Foundation & Architecture | ✅ Complete |
| 2 | Domain Models & Database | 🔲 Planned |
| 3 | Authentication & Authorization | 🔲 Planned |
| 4 | Maintenance Task Management | 🔲 Planned |
| 5 | Block Planning Engine | 🔲 Planned |
| 6 | CP-SAT Optimization | 🔲 Planned |
| 7 | AI/ML Priority Engine | 🔲 Planned |
| 8 | Real-time Event System | 🔲 Planned |
| 9 | Simulation Engine | 🔲 Planned |
| 10 | Reporting & Dashboards | 🔲 Planned |

---

## License

Developed for Smart India Hackathon 2026.


## STAGE 7A - SIH 2026 FINAL DEMO READINESS
The system has been hardened for the Smart India Hackathon. All synthetic data is clearly labeled. The AI engines (Priority, Optimization, Compatibility, Conflict) are fully integrated end-to-end with the backend database and the frontend UI.


### System Honesty & Capabilities
- **Real**: The mathematical solver (CP-SAT), RBAC, Caching, Endpoints, and Database logic.
- **Rule-Based**: PriorityEngine, CompatibilityEngine, and Validator.
- **Model-Ready**: PredictionService (ready for an external PyTorch/TensorFlow integration).
- **Simulated**: The Railway Data (assets, users, networks) is completely synthetic.
- **Replayed**: Scenario events are stepped deterministically through the SimulationEngine.
- **Mocked**: Nothing in the final pipeline. The Optimization endpoint uses live DB data.
- **Runtime Constraint**: The native OR-Tools solver requires Python <=3.12 or a non-Windows OS due to a known C++ Python 3.13 binding crash.
- **Future Work**: Live IoT streaming ingestion (Kafka) and integration with actual TMS APIs.
