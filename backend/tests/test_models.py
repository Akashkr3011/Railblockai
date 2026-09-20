"""
RAILBLOCK AI — Model Import and Enum Tests

Tests model imports, enum values, and in-memory object creation.
Does NOT require PostgreSQL.
"""
from __future__ import annotations

import pytest
from app.models.user import User, UserRole
from app.models.division import Division, Route, Station, Section, SectionType
from app.models.asset import Asset, AssetType, AssetCondition
from app.models.maintenance import (
    MaintenanceRequest, MaintenanceStatus, Priority,
    MaintenanceCategory, SourceSystem
)
from app.models.resource import Resource, ResourceType
from app.models.train import Train, TrainType
from app.models.block import BlockRequest, BlockRequestStatus, BlockType
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.audit import AuditLog
from app.models.data_source import DataSource, DataSourceType


# -------------------------------------------------------------------------
# Role enum tests
# -------------------------------------------------------------------------

def test_user_roles_all_defined():
    """All required canonical and domain roles must be present in UserRole enum."""
    canonical = {"ADMIN", "PLANNER_CONTROLLER", "WORKER_FIELD_STAFF", "VIEWER"}
    legacy = {"ADMIN", "ENGINEERING", "ST", "TRD", "PLANNER",
              "TRAFFIC_CONTROLLER", "MANAGER", "EXECUTIVE", "AUDITOR"}
    actual = {r.value for r in UserRole}
    assert canonical.issubset(actual)
    assert legacy.issubset(actual)


def test_user_role_values_are_strings():
    for role in UserRole:
        assert isinstance(role.value, str)


# -------------------------------------------------------------------------
# Source system enum tests
# -------------------------------------------------------------------------

def test_source_system_has_simulated_labels():
    """Simulated source systems must be explicitly labeled."""
    simulated = {s.value for s in SourceSystem if "SIMULATED" in s.value}
    assert "SIMULATED_TMS" in simulated
    assert "SIMULATED_SMMS" in simulated
    assert "SIMULATED_TDMS" in simulated
    assert "SIMULATED_COA" in simulated
    assert "SIMULATED_BDMS" in simulated


def test_source_system_has_real_labels():
    """Real source systems (for future authorized API use) must exist."""
    real = {s.value for s in SourceSystem if "SIMULATED" not in s.value}
    assert "TMS" in real
    assert "SMMS" in real
    assert "TDMS" in real
    assert "MANUAL" in real


# -------------------------------------------------------------------------
# Priority enum tests
# -------------------------------------------------------------------------

def test_priority_enum():
    expected = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
    actual = {p.value for p in Priority}
    assert actual == expected


# -------------------------------------------------------------------------
# Asset type enum tests
# -------------------------------------------------------------------------

def test_asset_type_enum():
    expected_subset = {"TRACK", "BRIDGE", "TUNNEL", "SIGNAL", "LEVEL_CROSSING"}
    actual = {a.value for a in AssetType}
    assert expected_subset.issubset(actual)


def test_asset_condition_enum():
    expected = {"GOOD", "FAIR", "POOR", "CRITICAL", "OUT_OF_SERVICE"}
    actual = {c.value for c in AssetCondition}
    assert actual == expected


# -------------------------------------------------------------------------
# Block enum tests
# -------------------------------------------------------------------------

def test_block_request_status_enum():
    expected = {"DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED",
                "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"}
    actual = {s.value for s in BlockRequestStatus}
    assert actual == expected


def test_block_type_enum():
    expected_subset = {"LINE_BLOCK", "TRAFFIC_BLOCK", "ENGINEERING_BLOCK"}
    actual = {b.value for b in BlockType}
    assert expected_subset.issubset(actual)


# -------------------------------------------------------------------------
# Alert enum tests
# -------------------------------------------------------------------------

def test_alert_severity_enum():
    expected = {"INFO", "WARNING", "ERROR", "CRITICAL"}
    actual = {s.value for s in AlertSeverity}
    assert actual == expected


def test_alert_type_enum():
    expected_subset = {"SCHEDULE_CONFLICT", "OVERDUE_TASK", "ASSET_DEGRADED",
                       "DATA_QUALITY", "SYSTEM"}
    actual = {t.value for t in AlertType}
    assert expected_subset.issubset(actual)


# -------------------------------------------------------------------------
# Data source type enum tests
# -------------------------------------------------------------------------

def test_data_source_types():
    expected_subset = {"TMS", "SMMS", "TDMS", "COA", "BDMS",
                       "SIMULATED_TMS", "SIMULATED_SMMS", "SIMULATED_TIMETABLE"}
    actual = {t.value for t in DataSourceType}
    assert expected_subset.issubset(actual)


# -------------------------------------------------------------------------
# Model table name tests
# -------------------------------------------------------------------------

def test_table_names():
    """All models must have the expected __tablename__."""
    assert User.__tablename__ == "users"
    assert Division.__tablename__ == "divisions"
    assert Route.__tablename__ == "routes"
    assert Station.__tablename__ == "stations"
    assert Section.__tablename__ == "sections"
    assert Asset.__tablename__ == "assets"
    assert MaintenanceRequest.__tablename__ == "maintenance_requests"
    assert Resource.__tablename__ == "resources"
    assert Train.__tablename__ == "trains"
    assert BlockRequest.__tablename__ == "block_requests"
    assert Alert.__tablename__ == "alerts"
    assert AuditLog.__tablename__ == "audit_logs"
    assert DataSource.__tablename__ == "data_sources"


# -------------------------------------------------------------------------
# SectionType enum
# -------------------------------------------------------------------------

def test_section_type_enum():
    expected = {"MAIN_LINE", "BRANCH_LINE", "GOODS_LINE", "YARD"}
    actual = {s.value for s in SectionType}
    assert actual == expected


# -------------------------------------------------------------------------
# TrainType enum
# -------------------------------------------------------------------------

def test_train_type_enum():
    expected_subset = {"EXPRESS", "PASSENGER", "GOODS", "EMU", "FREIGHT"}
    actual = {t.value for t in TrainType}
    assert expected_subset.issubset(actual)
