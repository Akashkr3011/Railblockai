"""
RAILBLOCK AI — Maintenance Request, Defect, History Models

These implement the canonical model that represents data from
TMS, SMMS, TDMS and other sources through a common interface.
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, utcnow

class SourceSystem(str, enum.Enum):
    """Identifies where the maintenance request originated."""
    TMS = "TMS"           # Train Management System
    SMMS = "SMMS"         # System Maintenance Management System
    TDMS = "TDMS"         # Track Defect Management System
    COA = "COA"           # Chief Operating Analyst
    BDMS = "BDMS"         # Bridge Defect Management System
    MANUAL = "MANUAL"     # Manually entered by user
    INSPECTION = "INSPECTION"  # From physical inspection
    SIMULATED_TMS = "SIMULATED_TMS"    # [SIMULATION] Synthetic TMS data
    SIMULATED_SMMS = "SIMULATED_SMMS"  # [SIMULATION] Synthetic SMMS data
    SIMULATED_TDMS = "SIMULATED_TDMS"  # [SIMULATION] Synthetic TDMS data
    SIMULATED_COA = "SIMULATED_COA"    # [SIMULATION] Synthetic COA data
    SIMULATED_BDMS = "SIMULATED_BDMS"  # [SIMULATION] Synthetic BDMS data
    SIMULATED_GOODS_FORECAST = "SIMULATED_GOODS_FORECAST"  # [SIMULATION] Synthetic goods forecast

class Priority(str, enum.Enum):
    CRITICAL = "CRITICAL"   # Safety-critical, must be done immediately
    HIGH = "HIGH"           # Must be done within 7 days
    MEDIUM = "MEDIUM"       # Within 30 days
    LOW = "LOW"             # Routine, within 90 days

class MaintenanceCategory(str, enum.Enum):
    TRACK = "TRACK"
    BRIDGE = "BRIDGE"
    SIGNAL = "SIGNAL"
    TRACTION = "TRACTION"
    TELECOM = "TELECOM"
    CIVIL = "CIVIL"
    ELECTRICAL = "ELECTRICAL"
    MECHANICAL = "MECHANICAL"

class MaintenanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DEFERRED = "DEFERRED"
    CANCELLED = "CANCELLED"

class MaintenanceRequest(Base):
    """
    Canonical maintenance task model.
    
    Regardless of source system (TMS/SMMS/TDMS/COA/BDMS/manual),
    all maintenance tasks are stored here with source traceability.
    """
    __tablename__ = "maintenance_requests"
    __table_args__ = (
        Index("ix_mr_asset_id", "asset_id"),
        Index("ix_mr_status", "status"),
        Index("ix_mr_section_id", "section_id"),
        Index("ix_mr_deadline", "deadline"),
        Index("ix_mr_priority", "priority"),
        Index("ix_mr_source_system", "source_system"),
        Index("ix_mr_source_record_id", "source_record_id"),
        {"comment": "Canonical maintenance work orders from any source system"},
    )
    # Core fields
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[MaintenanceCategory] = mapped_column(SAEnum(MaintenanceCategory, name="maintenance_category_enum"), nullable=False)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority, name="priority_enum"), nullable=False, default=Priority.MEDIUM)
    status: Mapped[MaintenanceStatus] = mapped_column(SAEnum(MaintenanceStatus, name="maintenance_status_enum"), nullable=False, default=MaintenanceStatus.PENDING)
    
    # Asset linkage
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    
    # Assignment
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timing
    estimated_duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scheduled_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Resource requirements
    required_gang_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_block: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="Whether a traffic block is needed")
    
    # AI scoring
    priority_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="ML-computed priority 0-100")
    
    # Source traceability — the core of the canonical model
    source_system: Mapped[SourceSystem] = mapped_column(SAEnum(SourceSystem, name="source_system_enum"), nullable=False, default=SourceSystem.MANUAL)
    source_record_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="ID in the originating system")
    source_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="Timestamp in source system")
    import_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, comment="When imported into RAILBLOCK AI")
    source_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, comment="Raw source system payload")
    
    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="maintenance_requests", lazy="select")
    history: Mapped[List["MaintenanceHistory"]] = relationship("MaintenanceHistory", back_populates="request", lazy="noload")
    block_plan_tasks: Mapped[List["BlockPlanTask"]] = relationship("BlockPlanTask", back_populates="maintenance_request", lazy="noload")

class DefectSeverity(str, enum.Enum):
    MINOR = "MINOR"
    MODERATE = "MODERATE"
    MAJOR = "MAJOR"
    SAFETY_CRITICAL = "SAFETY_CRITICAL"

class Defect(Base):
    __tablename__ = "defects"
    __table_args__ = (
        Index("ix_defects_asset_id", "asset_id"),
        Index("ix_defects_severity", "severity"),
        {"comment": "Defects reported on assets"},
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    defect_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="Standardized defect code")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[DefectSeverity] = mapped_column(SAEnum(DefectSeverity, name="defect_severity_enum"), nullable=False)
    reported_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    source_system: Mapped[SourceSystem] = mapped_column(SAEnum(SourceSystem, name="source_system_enum"), nullable=False, default=SourceSystem.MANUAL)
    source_record_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    linked_maintenance_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("maintenance_requests.id", ondelete="SET NULL"), nullable=True)
    asset: Mapped["Asset"] = relationship("Asset", back_populates="defects", lazy="select")

class MaintenanceHistory(Base):
    __tablename__ = "maintenance_history"
    __table_args__ = (
        Index("ix_mh_request_id", "request_id"),
        {"comment": "Completed maintenance records"},
    )
    request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False)
    performed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    work_done: Mapped[str] = mapped_column(Text, nullable=False)
    materials_used: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    gang_size_actual: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    outcome_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="history", lazy="select")
