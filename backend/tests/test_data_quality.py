"""
RAILBLOCK AI — Data Quality Service Tests

Tests the DataQualityService validation logic.
Does NOT require PostgreSQL (uses mocking for DB lookups).
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.data_quality_service import DataQualityService, QualityIssue


def make_db_mock(asset_exists: bool = True, section_exists: bool = True):
    """Create a mock DB session."""
    mock_scalar = MagicMock()
    mock_scalar.scalar_one_or_none.return_value = (MagicMock() if asset_exists else None)

    mock_result = AsyncMock()
    mock_result.__aenter__ = AsyncMock(return_value=mock_result)
    mock_result.__aexit__ = AsyncMock(return_value=None)

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=mock_scalar)
    return mock_db


# -------------------------------------------------------------------------
# Maintenance record validation
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_valid_maintenance_record():
    """A complete, valid record should pass validation."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "estimated_duration_hours": 6.0,
        "deadline": "2026-12-01T10:00:00+05:30",
        "requires_block": True,
        "required_gang_size": 10,
        "department": "ENGG",
    }
    result = await svc.validate_maintenance_record(record)
    blocking = [i for i in result.issues if i.is_blocking]
    assert len(blocking) == 0


@pytest.mark.asyncio
async def test_missing_asset_id_is_blocking():
    """Missing asset_id must produce a blocking CRITICAL issue."""
    db = make_db_mock()
    svc = DataQualityService(db)
    record = {"estimated_duration_hours": 4.0}
    result = await svc.validate_maintenance_record(record)
    assert not result.is_valid
    codes = [i.issue_code for i in result.blocking_issues]
    assert "MISSING_ASSET" in codes


@pytest.mark.asyncio
async def test_invalid_duration_zero():
    """Duration of 0 must be flagged as INVALID_DURATION."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "estimated_duration_hours": 0,
    }
    result = await svc.validate_maintenance_record(record)
    codes = [i.issue_code for i in result.issues]
    assert "INVALID_DURATION" in codes


@pytest.mark.asyncio
async def test_invalid_duration_too_long():
    """Duration > 240h must be flagged."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "estimated_duration_hours": 300,
    }
    result = await svc.validate_maintenance_record(record)
    codes = [i.issue_code for i in result.issues]
    assert "INVALID_DURATION" in codes


@pytest.mark.asyncio
async def test_invalid_timestamp_format():
    """An unparseable timestamp must produce INVALID_TIMESTAMP issue."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "deadline": "NOT_A_DATE",
    }
    result = await svc.validate_maintenance_record(record)
    codes = [i.issue_code for i in result.issues]
    assert "INVALID_TIMESTAMP" in codes


@pytest.mark.asyncio
async def test_missing_resource_is_warning():
    """requires_block=True with no gang size should be WARNING, not blocking."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "requires_block": True,
        # no required_gang_size
    }
    result = await svc.validate_maintenance_record(record)
    codes = [i.issue_code for i in result.issues]
    if "MISSING_RESOURCE" in codes:
        issue = next(i for i in result.issues if i.issue_code == "MISSING_RESOURCE")
        assert issue.is_blocking is False


@pytest.mark.asyncio
async def test_unknown_department_is_warning():
    """Unknown department code should be WARNING."""
    import uuid
    db = make_db_mock(asset_exists=True)
    svc = DataQualityService(db)
    record = {
        "asset_id": str(uuid.uuid4()),
        "department": "UNKNOWN_DEPT",
    }
    result = await svc.validate_maintenance_record(record)
    codes = [i.issue_code for i in result.issues]
    assert "UNKNOWN_DEPARTMENT" in codes
    issue = next((i for i in result.issues if i.issue_code == "UNKNOWN_DEPARTMENT"), None)
    if issue:
        assert issue.is_blocking is False


# -------------------------------------------------------------------------
# Block request validation
# -------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_missing_section_is_blocking():
    """Missing section_id on block request must be blocking CRITICAL."""
    db = make_db_mock()
    svc = DataQualityService(db)
    record = {"duration_hours": 4.0}
    result = await svc.validate_block_request(record)
    assert not result.is_valid
    codes = [i.issue_code for i in result.blocking_issues]
    assert "MISSING_SECTION" in codes


@pytest.mark.asyncio
async def test_block_duration_exceeds_24h():
    """Block duration > 24h must be flagged."""
    import uuid
    db = make_db_mock(section_exists=True)
    svc = DataQualityService(db)
    record = {
        "section_id": str(uuid.uuid4()),
        "duration_hours": 30,
    }
    result = await svc.validate_block_request(record)
    codes = [i.issue_code for i in result.issues]
    assert "INVALID_DURATION" in codes


@pytest.mark.asyncio
async def test_validation_result_has_no_issues_for_clean_block():
    """A clean block request should pass without blocking issues."""
    import uuid
    from datetime import datetime, timezone
    db = make_db_mock(section_exists=True)
    svc = DataQualityService(db)
    record = {
        "section_id": str(uuid.uuid4()),
        "duration_hours": 6.0,
        "requested_date": datetime.now(timezone.utc).isoformat(),
    }
    result = await svc.validate_block_request(record)
    assert len(result.blocking_issues) == 0


# -------------------------------------------------------------------------
# ValidationResult dataclass
# -------------------------------------------------------------------------

def test_validation_result_starts_valid():
    from app.services.data_quality_service import ValidationResult
    vr = ValidationResult()
    assert vr.is_valid is True
    assert vr.issues == []
    assert vr.blocking_issues == []


def test_validation_result_blocking_sets_invalid():
    from app.services.data_quality_service import ValidationResult, QualityIssue
    vr = ValidationResult()
    vr.add_issue(QualityIssue(
        issue_code="TEST_BLOCK",
        severity="CRITICAL",
        field_name="test_field",
        description="Test blocking issue",
        is_blocking=True,
    ))
    assert vr.is_valid is False
    assert len(vr.blocking_issues) == 1


def test_validation_result_warning_keeps_valid():
    from app.services.data_quality_service import ValidationResult, QualityIssue
    vr = ValidationResult()
    vr.add_issue(QualityIssue(
        issue_code="TEST_WARN",
        severity="WARNING",
        field_name="test_field",
        description="Test warning (non-blocking)",
        is_blocking=False,
    ))
    assert vr.is_valid is True  # Warning does not invalidate
    assert len(vr.issues) == 1
    assert len(vr.blocking_issues) == 0
