"""
RAILBLOCK AI — Alert and Notification Models
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class AlertType(str, enum.Enum):
    SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT"
    OVERDUE_TASK = "OVERDUE_TASK"
    ASSET_DEGRADED = "ASSET_DEGRADED"
    DATA_QUALITY = "DATA_QUALITY"
    OPTIMIZATION_COMPLETE = "OPTIMIZATION_COMPLETE"
    BLOCK_APPROVED = "BLOCK_APPROVED"
    BLOCK_REJECTED = "BLOCK_REJECTED"
    SYSTEM = "SYSTEM"

class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_severity", "severity"),
        Index("ix_alerts_is_resolved", "is_resolved"),
        {"comment": "System-generated alerts"},
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity, name="alert_severity_enum"), nullable=False)
    alert_type: Mapped[AlertType] = mapped_column(SAEnum(AlertType, name="alert_type_enum"), nullable=False)
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notif_user_id", "user_id"),
        Index("ix_notif_is_read", "is_read"),
        {"comment": "User-facing notification queue"},
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alert_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
