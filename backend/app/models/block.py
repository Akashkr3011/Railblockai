"""
RAILBLOCK AI — Block Request, Window, Plan, Plan Task Models
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class BlockRequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class BlockType(str, enum.Enum):
    LINE_BLOCK = "LINE_BLOCK"           # Full line block
    TRAFFIC_BLOCK = "TRAFFIC_BLOCK"     # Traffic block
    ENGINEERING_BLOCK = "ENGINEERING_BLOCK"  # Engineering block
    POWER_BLOCK = "POWER_BLOCK"         # OHE power block
    COMBINED = "COMBINED"               # Combined block

class BlockRequest(Base):
    __tablename__ = "block_requests"
    __table_args__ = (
        Index("ix_br_section_id", "section_id"),
        Index("ix_br_status", "status"),
        Index("ix_br_requested_date", "requested_date"),
        {"comment": "Requests for maintenance block windows"},
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    block_type: Mapped[BlockType] = mapped_column(SAEnum(BlockType, name="block_type_enum"), nullable=False, default=BlockType.ENGINEERING_BLOCK)
    status: Mapped[BlockRequestStatus] = mapped_column(SAEnum(BlockRequestStatus, name="block_request_status_enum"), nullable=False, default=BlockRequestStatus.DRAFT)
    requested_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    requested_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    requested_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    requested_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approval_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    has_conflicts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    conflict_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    section: Mapped["Section"] = relationship("Section", back_populates="block_requests", lazy="select")
    block_windows: Mapped[List["BlockWindow"]] = relationship("BlockWindow", back_populates="block_request", lazy="noload")

class BlockWindow(Base):
    __tablename__ = "block_windows"
    __table_args__ = (
        Index("ix_bw_section_id", "section_id"),
        Index("ix_bw_start_time", "start_time"),
        {"comment": "Approved block windows"},
    )
    block_request_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("block_requests.id", ondelete="SET NULL"), nullable=True)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    block_type: Mapped[BlockType] = mapped_column(SAEnum(BlockType, name="block_type_enum"), nullable=False)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    confirmed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    block_request: Mapped[Optional["BlockRequest"]] = relationship("BlockRequest", back_populates="block_windows", lazy="select")
    block_plan_tasks: Mapped[List["BlockPlanTask"]] = relationship("BlockPlanTask", back_populates="block_window", lazy="noload")

class BlockPlan(Base):
    __tablename__ = "block_plans"
    __table_args__ = ({"comment": "Optimized block plan header"},)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    plan_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="DRAFT", comment="DRAFT, APPROVED, ACTIVE, COMPLETED")
    optimization_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("optimization_runs.id", ondelete="SET NULL"), nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    tasks: Mapped[List["BlockPlanTask"]] = relationship("BlockPlanTask", back_populates="block_plan", lazy="noload")

class BlockPlanTask(Base):
    __tablename__ = "block_plan_tasks"
    __table_args__ = (
        Index("ix_bpt_plan_id", "block_plan_id"),
        {"comment": "Task assignments within a block plan"},
    )
    block_plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("block_plans.id", ondelete="CASCADE"), nullable=False)
    block_window_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("block_windows.id", ondelete="CASCADE"), nullable=False)
    maintenance_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False)
    sequence_in_window: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    allocated_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    allocated_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    block_plan: Mapped["BlockPlan"] = relationship("BlockPlan", back_populates="tasks", lazy="select")
    block_window: Mapped["BlockWindow"] = relationship("BlockWindow", back_populates="block_plan_tasks", lazy="select")
    maintenance_request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="block_plan_tasks", lazy="select")
