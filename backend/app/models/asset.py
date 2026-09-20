"""
RAILBLOCK AI — Asset Models
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

class AssetType(str, enum.Enum):
    TRACK = "TRACK"
    BRIDGE = "BRIDGE"
    TUNNEL = "TUNNEL"
    SIGNAL = "SIGNAL"
    LEVEL_CROSSING = "LEVEL_CROSSING"
    TRACTION_SUBSTATION = "TRACTION_SUBSTATION"
    OVERHEAD_EQUIPMENT = "OVERHEAD_EQUIPMENT"
    STATION_BUILDING = "STATION_BUILDING"
    POINT_AND_CROSSING = "POINT_AND_CROSSING"
    CULVERT = "CULVERT"
    RETAINING_WALL = "RETAINING_WALL"

class AssetCondition(str, enum.Enum):
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    CRITICAL = "CRITICAL"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"

class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = (
        Index("ix_assets_asset_number", "asset_number", unique=True),
        Index("ix_assets_section_id", "section_id"),
        {"comment": "Infrastructure assets on railway sections"},
    )
    asset_number: Mapped[str] = mapped_column(String(50), nullable=False, comment="Unique asset identifier e.g. TRACK-CSTM-KYN-001")
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_type: Mapped[AssetType] = mapped_column(SAEnum(AssetType, name="asset_type_enum"), nullable=False)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    chainage_start_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    chainage_end_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    condition: Mapped[AssetCondition] = mapped_column(SAEnum(AssetCondition, name="asset_condition_enum"), nullable=False, default=AssetCondition.GOOD)
    criticality_score: Mapped[float] = mapped_column(Float, nullable=False, default=5.0, comment="0-10 scale, 10=most critical")
    age_years: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    last_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    installation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, comment="Flexible metadata field for asset-type-specific attributes")
    section: Mapped["Section"] = relationship("Section", back_populates="assets", lazy="select")
    status_history: Mapped[List["AssetStatusHistory"]] = relationship("AssetStatusHistory", back_populates="asset", lazy="noload")
    defects: Mapped[List["Defect"]] = relationship("Defect", back_populates="asset", lazy="noload")
    maintenance_requests: Mapped[List["MaintenanceRequest"]] = relationship("MaintenanceRequest", back_populates="asset", lazy="noload")

class AssetStatusHistory(Base):
    __tablename__ = "asset_status_history"
    __table_args__ = (
        Index("ix_ash_asset_id", "asset_id"),
        {"comment": "Asset condition change log"},
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    previous_condition: Mapped[Optional[AssetCondition]] = mapped_column(SAEnum(AssetCondition, name="asset_condition_enum"), nullable=True)
    new_condition: Mapped[AssetCondition] = mapped_column(SAEnum(AssetCondition, name="asset_condition_enum"), nullable=False)
    changed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_system: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    asset: Mapped["Asset"] = relationship("Asset", back_populates="status_history", lazy="select")
