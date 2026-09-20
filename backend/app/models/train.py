"""
RAILBLOCK AI — Train, TrainSchedule, TrainPosition Models

NOTE: All train position data is SIMULATED.
It does not represent actual Indian Railways live operations.
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional, List
from datetime import datetime, time
from sqlalchemy import String, Float, Integer, Boolean, ForeignKey, Text, Enum as SAEnum, DateTime, Time, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class TrainType(str, enum.Enum):
    EXPRESS = "EXPRESS"
    PASSENGER = "PASSENGER"
    GOODS = "GOODS"
    EMU = "EMU"
    MEMU = "MEMU"
    DEMU = "DEMU"
    SPECIAL = "SPECIAL"
    FREIGHT = "FREIGHT"

class Train(Base):
    __tablename__ = "trains"
    __table_args__ = (
        Index("ix_trains_number", "train_number", unique=True),
        {"comment": "Train master records [SIMULATION — not live IR data]"},
    )
    train_number: Mapped[str] = mapped_column(String(10), nullable=False, comment="e.g. 12001")
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    train_type: Mapped[TrainType] = mapped_column(SAEnum(TrainType, name="train_type_enum"), nullable=False)
    rake_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="LHB, ICF, WAP-7")
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="Always True in prototype")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    schedules: Mapped[List["TrainSchedule"]] = relationship("TrainSchedule", back_populates="train", lazy="noload")
    positions: Mapped[List["TrainPosition"]] = relationship("TrainPosition", back_populates="train", lazy="noload")

class TrainSchedule(Base):
    __tablename__ = "train_schedules"
    __table_args__ = (
        Index("ix_ts_train_id", "train_id"),
        Index("ix_ts_section_id", "section_id"),
        {"comment": "Train section-level timing [SIMULATED_TIMETABLE]"},
    )
    train_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False, comment="Order of section in train path")
    scheduled_arrival: Mapped[Optional[time]] = mapped_column(Time(timezone=False), nullable=True)
    scheduled_departure: Mapped[Optional[time]] = mapped_column(Time(timezone=False), nullable=True)
    days_of_week: Mapped[str] = mapped_column(String(20), nullable=False, default="1234567", comment="1=Mon..7=Sun")
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    data_source: Mapped[str] = mapped_column(String(50), nullable=False, default="SIMULATED_TIMETABLE", comment="Source label")
    train: Mapped["Train"] = relationship("Train", back_populates="schedules", lazy="select")
    section: Mapped["Section"] = relationship("Section", back_populates="train_schedules", lazy="select")

class TrainPosition(Base):
    __tablename__ = "train_positions"
    __table_args__ = (
        Index("ix_tp_train_id", "train_id"),
        {"comment": "Simulated real-time train positions [SIMULATION]"},
    )
    train_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    position_chainage_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    speed_kmph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, comment="UP / DOWN")
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    train: Mapped["Train"] = relationship("Train", back_populates="positions", lazy="select")
