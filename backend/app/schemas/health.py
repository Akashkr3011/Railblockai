"""
RAILBLOCK AI â€” Health Check Schemas

Pydantic v2 response models for the /api/v1/health endpoint.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ComponentStatus(str, Enum):
    """Status of an individual system component."""
    OK = "ok"
    DEGRADED = "degraded"
    ERROR = "error"
    DISABLED = "disabled"


class DatabaseHealth(BaseModel):
    """Database connectivity status."""
    status: ComponentStatus
    message: str
    latency_ms: Optional[float] = None


class ServiceHealth(BaseModel):
    """Status of an optional supporting service."""
    status: ComponentStatus
    message: str
    enabled: bool


class HealthResponse(BaseModel):
    """
    Full health check response.

    Returned by GET /api/v1/health
    """
    status: ComponentStatus = Field(description="Overall system status")
    application: str = Field(description="Application name")
    version: str = Field(description="Application version")
    environment: str = Field(description="Deployment environment")
    timestamp: datetime = Field(description="UTC timestamp of the health check")

    database: DatabaseHealth = Field(description="PostgreSQL connectivity")
    optimizer: ServiceHealth = Field(description="OR-Tools CP-SAT optimizer")
    ml_service: ServiceHealth = Field(description="ML inference service")
    simulation: ServiceHealth = Field(description="Simulation engine")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "ok",
                "application": "RAILBLOCK AI",
                "version": "0.1.0",
                "environment": "development",
                "timestamp": "2026-09-11T17:40:00Z",
                "database": {
                    "status": "ok",
                    "message": "Connected to PostgreSQL",
                    "latency_ms": 1.2,
                },
                "optimizer": {
                    "status": "disabled",
                    "message": "Optimizer not enabled in this environment",
                    "enabled": False,
                },
                "ml_service": {
                    "status": "disabled",
                    "message": "ML service not enabled in this environment",
                    "enabled": False,
                },
                "simulation": {
                    "status": "disabled",
                    "message": "Simulation engine not enabled in this environment",
                    "enabled": False,
                },
            }
        }
    }
