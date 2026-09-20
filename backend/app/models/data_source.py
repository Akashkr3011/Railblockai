"""
RAILBLOCK AI — Data Source, Import Run, Data Quality Issue Models
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

class DataSourceType(str, enum.Enum):
    TMS = "TMS"
    SMMS = "SMMS"
    TDMS = "TDMS"
    COA = "COA"
    BDMS = "BDMS"
    TIMETABLE = "TIMETABLE"
    GOODS_FORECAST = "GOODS_FORECAST"
    SIMULATED_TMS = "SIMULATED_TMS"
    SIMULATED_SMMS = "SIMULATED_SMMS"
    SIMULATED_TDMS = "SIMULATED_TDMS"
    SIMULATED_COA = "SIMULATED_COA"
    SIMULATED_BDMS = "SIMULATED_BDMS"
    SIMULATED_TIMETABLE = "SIMULATED_TIMETABLE"
    SIMULATED_GOODS = "SIMULATED_GOODS"

class DataSource(Base):
    __tablename__ = "data_sources"
    __table_args__ = ({"comment": "External data source metadata"},)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    source_type: Mapped[DataSourceType] = mapped_column(SAEnum(DataSourceType, name="data_source_type_enum"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="True for all prototype adapters")
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    adapter_class: Mapped[str] = mapped_column(String(100), nullable=False, comment="Python adapter class name")
    connection_params: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, comment="Encrypted in production")
    last_successful_import: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    import_runs: Mapped[list["DataImportRun"]] = relationship("DataImportRun", back_populates="data_source", lazy="noload")

class ImportRunStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

class DataImportRun(Base):
    __tablename__ = "data_import_runs"
    __table_args__ = (
        Index("ix_dir_data_source_id", "data_source_id"),
        Index("ix_dir_status", "status"),
        {"comment": "Data import batch records"},
    )
    data_source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[ImportRunStatus] = mapped_column(SAEnum(ImportRunStatus, name="import_run_status_enum"), nullable=False, default=ImportRunStatus.RUNNING)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    records_fetched: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_imported: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="import_runs", lazy="select")
    quality_issues: Mapped[list["DataQualityIssue"]] = relationship("DataQualityIssue", back_populates="import_run", lazy="noload")

class IssueSeverity(str, enum.Enum):
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"
    __table_args__ = (
        Index("ix_dqi_import_run_id", "import_run_id"),
        {"comment": "Data validation failures per import run"},
    )
    import_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_import_runs.id", ondelete="CASCADE"), nullable=False)
    issue_code: Mapped[str] = mapped_column(String(50), nullable=False, comment="e.g. MISSING_ASSET, INVALID_DURATION")
    severity: Mapped[IssueSeverity] = mapped_column(SAEnum(IssueSeverity, name="issue_severity_enum"), nullable=False)
    field_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    record_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Source system record ID")
    description: Mapped[str] = mapped_column(Text, nullable=False)
    raw_value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_blocking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="True = prevents optimization input")
    import_run: Mapped["DataImportRun"] = relationship("DataImportRun", back_populates="quality_issues", lazy="select")
