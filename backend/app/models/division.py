"""
RAILBLOCK AI — Division, Route, Station, Section Models
"""
from __future__ import annotations
import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Float, Boolean, Integer, ForeignKey, Text, Enum as SAEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Division(Base):
    __tablename__ = "divisions"
    __table_args__ = ({"comment": "Indian Railways administrative divisions"},)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, comment="e.g. CR, WR, NR")
    zone: Mapped[str] = mapped_column(String(50), nullable=False, comment="Railway zone")
    headquarters: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    users: Mapped[List["User"]] = relationship("User", back_populates="division", lazy="noload")
    routes: Mapped[List["Route"]] = relationship("Route", back_populates="division", lazy="noload")

class Route(Base):
    __tablename__ = "routes"
    __table_args__ = ({"comment": "Railway routes within a division"},)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    division_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("divisions.id", ondelete="CASCADE"), nullable=False)
    from_station: Mapped[str] = mapped_column(String(100), nullable=False)
    to_station: Mapped[str] = mapped_column(String(100), nullable=False)
    total_length_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_electrified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_double_line: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    division: Mapped["Division"] = relationship("Division", back_populates="routes", lazy="select")
    stations: Mapped[List["Station"]] = relationship("Station", back_populates="route", lazy="noload")
    sections: Mapped[List["Section"]] = relationship("Section", back_populates="route", lazy="noload")

class Station(Base):
    __tablename__ = "stations"
    __table_args__ = (
        Index("ix_stations_code", "code", unique=True),
        {"comment": "Railway stations"},
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(10), nullable=False, comment="Station code e.g. CSTM")
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    chainage_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True, comment="Distance from route origin in km")
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_junction: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    zone_category: Mapped[Optional[str]] = mapped_column(String(5), nullable=True, comment="A1, A, B, C, D, E, F")
    route: Mapped["Route"] = relationship("Route", back_populates="stations", lazy="select")

class SectionType(str, enum.Enum):
    MAIN_LINE = "MAIN_LINE"
    BRANCH_LINE = "BRANCH_LINE"
    GOODS_LINE = "GOODS_LINE"
    YARD = "YARD"

class Section(Base):
    __tablename__ = "sections"
    __table_args__ = ({"comment": "Track sections between stations"},)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    from_station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stations.id"), nullable=False)
    to_station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stations.id"), nullable=False)
    length_km: Mapped[float] = mapped_column(Float, nullable=False)
    section_type: Mapped[SectionType] = mapped_column(SAEnum(SectionType, name="section_type_enum"), nullable=False, default=SectionType.MAIN_LINE)
    speed_restriction_kmph: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_electrified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    number_of_tracks: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    route: Mapped["Route"] = relationship("Route", back_populates="sections", lazy="select")
    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="section", lazy="noload")
    block_requests: Mapped[List["BlockRequest"]] = relationship("BlockRequest", back_populates="section", lazy="noload")
    train_schedules: Mapped[List["TrainSchedule"]] = relationship("TrainSchedule", back_populates="section", lazy="noload")
