"""
RAILBLOCK AI — Resource Models
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class ResourceType(str, enum.Enum):
    GANG = "GANG"           # Maintenance gang (human team)
    MACHINE = "MACHINE"     # Equipment/machine
    VEHICLE = "VEHICLE"     # Road or rail vehicle
    SPECIALIST = "SPECIALIST"  # Specialist crew

class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (
        Index("ix_resources_type", "resource_type"),
        Index("ix_resources_is_available", "is_available"),
        {"comment": "Human gangs, machines, vehicles and specialist crews"}
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    resource_type: Mapped[ResourceType] = mapped_column(SAEnum(ResourceType, name="resource_type_enum"), nullable=False)
    division_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True)
    size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, comment="Gang size or machine capacity")
    specialization: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Track, Bridge, Signal, etc.")
    is_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    availability: Mapped[List["ResourceAvailability"]] = relationship("ResourceAvailability", back_populates="resource", lazy="noload")

class ResourceAvailability(Base):
    __tablename__ = "resource_availability"
    __table_args__ = (
        Index("ix_ra_resource_id", "resource_id"),
        Index("ix_ra_window", "available_from", "available_to"),
        {"comment": "Resource availability windows"},
    )
    resource_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    available_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    available_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    resource: Mapped["Resource"] = relationship("Resource", back_populates="availability", lazy="select")
