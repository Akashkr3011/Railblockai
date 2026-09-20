"""
RAILBLOCK AI — Data Quality Service

Validates incoming data before it enters the canonical model.
Critical errors prevent unsafe optimization inputs.
"""
from __future__ import annotations
import uuid
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class QualityIssue:
    issue_code: str
    severity: str  # WARNING, ERROR, CRITICAL
    field_name: str
    description: str
    raw_value: str = ""
    is_blocking: bool = False

@dataclass
class ValidationResult:
    is_valid: bool = True
    issues: list[QualityIssue] = field(default_factory=list)
    blocking_issues: list[QualityIssue] = field(default_factory=list)

    def add_issue(self, issue: QualityIssue) -> None:
        self.issues.append(issue)
        if issue.is_blocking:
            self.blocking_issues.append(issue)
            self.is_valid = False

class DataQualityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def validate_maintenance_record(self, record: dict[str, Any]) -> ValidationResult:
        """Validate a maintenance record before canonical insertion."""
        result = ValidationResult()

        # MISSING_ASSET
        asset_id = record.get("asset_id")
        if not asset_id:
            result.add_issue(QualityIssue(
                issue_code="MISSING_ASSET",
                severity="CRITICAL",
                field_name="asset_id",
                description="asset_id is required for maintenance records",
                is_blocking=True,
            ))
        else:
            from app.models.asset import Asset
            try:
                asset_uuid = uuid.UUID(str(asset_id))
                q = await self.db.execute(select(Asset).where(Asset.id == asset_uuid))
                if q.scalar_one_or_none() is None:
                    result.add_issue(QualityIssue(
                        issue_code="INVALID_ASSET",
                        severity="CRITICAL",
                        field_name="asset_id",
                        description=f"Asset {asset_id} does not exist",
                        raw_value=str(asset_id),
                        is_blocking=True,
                    ))
            except (ValueError, AttributeError):
                result.add_issue(QualityIssue(
                    issue_code="INVALID_ASSET_ID_FORMAT",
                    severity="ERROR",
                    field_name="asset_id",
                    description="asset_id must be a valid UUID",
                    raw_value=str(asset_id),
                    is_blocking=True,
                ))

        # INVALID_DURATION
        duration = record.get("estimated_duration_hours")
        if duration is not None:
            try:
                dur_float = float(duration)
                if dur_float <= 0 or dur_float > 240:
                    result.add_issue(QualityIssue(
                        issue_code="INVALID_DURATION",
                        severity="ERROR",
                        field_name="estimated_duration_hours",
                        description="Duration must be between 0 and 240 hours",
                        raw_value=str(duration),
                        is_blocking=False,
                    ))
            except (ValueError, TypeError):
                result.add_issue(QualityIssue(
                    issue_code="INVALID_DURATION",
                    severity="ERROR",
                    field_name="estimated_duration_hours",
                    description="Duration must be a number",
                    raw_value=str(duration),
                    is_blocking=False,
                ))

        # INVALID_TIMESTAMP
        deadline = record.get("deadline")
        if deadline:
            try:
                if isinstance(deadline, str):
                    dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                elif isinstance(deadline, datetime):
                    dt = deadline
                else:
                    raise ValueError("Not a datetime")
                if dt.tzinfo is None:
                    result.add_issue(QualityIssue(
                        issue_code="INVALID_TIMESTAMP",
                        severity="WARNING",
                        field_name="deadline",
                        description="Deadline should be timezone-aware",
                        raw_value=str(deadline),
                    ))
            except (ValueError, AttributeError):
                result.add_issue(QualityIssue(
                    issue_code="INVALID_TIMESTAMP",
                    severity="ERROR",
                    field_name="deadline",
                    description="deadline must be a valid ISO 8601 datetime string",
                    raw_value=str(deadline),
                    is_blocking=False,
                ))

        # MISSING_RESOURCE (warning only — not blocking)
        if record.get("requires_block") and not record.get("required_gang_size"):
            result.add_issue(QualityIssue(
                issue_code="MISSING_RESOURCE",
                severity="WARNING",
                field_name="required_gang_size",
                description="Task requires a block but no gang size specified",
            ))

        # UNKNOWN_DEPARTMENT (warning)
        dept = record.get("department")
        if dept and dept.upper() not in {"ENGG", "TRD", "S&T", "OPERATING", "CIVIL", "ELECTRICAL", "MECHANICAL", ""}:
            result.add_issue(QualityIssue(
                issue_code="UNKNOWN_DEPARTMENT",
                severity="WARNING",
                field_name="department",
                description=f"Unrecognized department code: {dept}",
                raw_value=str(dept),
            ))

        return result

    async def validate_block_request(self, record: dict[str, Any]) -> ValidationResult:
        """Validate a block request before insertion."""
        result = ValidationResult()

        # INVALID_SECTION
        section_id = record.get("section_id")
        if not section_id:
            result.add_issue(QualityIssue(
                issue_code="MISSING_SECTION",
                severity="CRITICAL",
                field_name="section_id",
                description="section_id is required for block requests",
                is_blocking=True,
            ))
        else:
            from app.models.division import Section
            try:
                sec_uuid = uuid.UUID(str(section_id))
                q = await self.db.execute(select(Section).where(Section.id == sec_uuid))
                if q.scalar_one_or_none() is None:
                    result.add_issue(QualityIssue(
                        issue_code="INVALID_SECTION",
                        severity="CRITICAL",
                        field_name="section_id",
                        description=f"Section {section_id} does not exist",
                        raw_value=str(section_id),
                        is_blocking=True,
                    ))
            except ValueError:
                result.add_issue(QualityIssue(
                    issue_code="INVALID_SECTION_ID_FORMAT",
                    severity="CRITICAL",
                    field_name="section_id",
                    description="section_id must be a valid UUID",
                    is_blocking=True,
                ))

        # INVALID_DURATION
        duration = record.get("duration_hours")
        if duration is not None:
            try:
                d = float(duration)
                if d <= 0 or d > 24:
                    result.add_issue(QualityIssue(
                        issue_code="INVALID_DURATION",
                        severity="ERROR",
                        field_name="duration_hours",
                        description="Block duration must be between 0 and 24 hours",
                        raw_value=str(duration),
                        is_blocking=False,
                    ))
            except (ValueError, TypeError):
                result.add_issue(QualityIssue(
                    issue_code="INVALID_DURATION",
                    severity="ERROR",
                    field_name="duration_hours",
                    description="duration_hours must be a number",
                    is_blocking=False,
                ))

        # STALE_DATA
        req_date = record.get("requested_date")
        if req_date:
            try:
                if isinstance(req_date, str):
                    dt = datetime.fromisoformat(req_date.replace("Z", "+00:00"))
                else:
                    dt = req_date
                now = datetime.now(timezone.utc)
                if dt.tzinfo and (now - dt).days > 30:
                    result.add_issue(QualityIssue(
                        issue_code="STALE_DATA",
                        severity="WARNING",
                        field_name="requested_date",
                        description="Block request date is more than 30 days old",
                        raw_value=str(req_date),
                    ))
            except (ValueError, TypeError):
                pass

        return result
