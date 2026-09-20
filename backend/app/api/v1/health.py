"""
RAILBLOCK AI â€” Health Check Route Handler

GET /api/v1/health
Returns application status, database status, version, and component readiness.

This endpoint is safe to call frequently â€” it is used by:
- Frontend connectivity indicator
- Load balancer health checks
- Deployment pipelines
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter

from app.config import settings
from app.database import check_db_connection
from app.schemas.health import (
    ComponentStatus,
    DatabaseHealth,
    HealthResponse,
    ServiceHealth,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=HealthResponse,
    summary="System Health Check",
    description=(
        "Returns the health status of the RAILBLOCK AI system, including "
        "database connectivity, optimizer readiness, ML service, and simulation engine."
    ),
)
async def health_check() -> HealthResponse:
    """
    Perform a comprehensive health check.

    - Pings the database and measures latency.
    - Reports status of optional services based on feature flags.
    - Returns HTTP 200 in all cases; consumers should inspect the `status` field.
    """
    logger.debug("health_check_requested")

    # ---- Database ping -------------------------------------------------------
    t0 = time.monotonic()
    db_connected = await check_db_connection()
    db_latency_ms = (time.monotonic() - t0) * 1000

    if db_connected:
        database_health = DatabaseHealth(
            status=ComponentStatus.OK,
            message="Connected to PostgreSQL",
            latency_ms=round(db_latency_ms, 2),
        )
    else:
        database_health = DatabaseHealth(
            status=ComponentStatus.ERROR,
            message=(
                "Cannot reach PostgreSQL. "
                "Ensure DATABASE_URL is set and the database is running."
            ),
            latency_ms=None,
        )

    # ---- Optimizer -----------------------------------------------------------
    optimizer_health = ServiceHealth(
        status=ComponentStatus.DISABLED if not settings.OPTIMIZER_ENABLED else ComponentStatus.OK,
        message=(
            "Optimizer not enabled in this environment"
            if not settings.OPTIMIZER_ENABLED
            else "OR-Tools CP-SAT optimizer ready"
        ),
        enabled=settings.OPTIMIZER_ENABLED,
    )

    # ---- ML Service ----------------------------------------------------------
    ml_health = ServiceHealth(
        status=ComponentStatus.DISABLED if not settings.ML_ENABLED else ComponentStatus.OK,
        message=(
            "ML service not enabled in this environment"
            if not settings.ML_ENABLED
            else "ML inference service ready"
        ),
        enabled=settings.ML_ENABLED,
    )

    # ---- Simulation ----------------------------------------------------------
    simulation_health = ServiceHealth(
        status=ComponentStatus.DISABLED if not settings.SIMULATION_ENABLED else ComponentStatus.OK,
        message=(
            "Simulation engine not enabled in this environment"
            if not settings.SIMULATION_ENABLED
            else "Simulation engine ready"
        ),
        enabled=settings.SIMULATION_ENABLED,
    )

    # ---- Overall status ------------------------------------------------------
    # System is OK if at minimum the application is running.
    # DB error degrades to DEGRADED (not ERROR) so the API is still usable.
    if not db_connected:
        overall_status = ComponentStatus.DEGRADED
    else:
        overall_status = ComponentStatus.OK

    return HealthResponse(
        status=overall_status,
        application=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc),
        database=database_health,
        optimizer=optimizer_health,
        ml_service=ml_health,
        simulation=simulation_health,
    )
