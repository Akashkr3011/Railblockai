"""
RAILBLOCK AI — Optimization Run and Scenario Models
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class OptimizationStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"
    __table_args__ = ({"comment": "CP-SAT solver execution records"},)
    run_name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[OptimizationStatus] = mapped_column(SAEnum(OptimizationStatus, name="optimization_status_enum"), nullable=False, default=OptimizationStatus.PENDING)
    solver: Mapped[str] = mapped_column(String(50), nullable=False, default="CP-SAT", comment="OR-Tools CP-SAT")
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    solve_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    objective_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tasks_scheduled: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tasks_total: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    coverage_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    input_params: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    result_summary: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    triggered_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class Scenario(Base):
    __tablename__ = "scenarios"
    __table_args__ = ({"comment": "Named simulation scenarios"},)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    scenario_params: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    result_summary: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="Always True in prototype")
