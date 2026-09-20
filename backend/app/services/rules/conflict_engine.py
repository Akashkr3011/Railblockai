"""
RAILBLOCK AI — Conflict Engine

Detects operational planning conflicts deterministically using domain rules.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, time
import uuid
import logging

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.train import TrainSchedule
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.asset import Asset
from app.models.division import Section
from app.models.resource import Resource, ResourceAvailability
from app.schemas.rules import (
    ConflictType,
    ConflictSeverity,
    ResolutionSuggestion,
    ConflictDetail,
    CompatibilityStatus
)
from app.services.rules.compatibility import CompatibilityEngine
from app.services.data_quality_service import DataQualityService, ValidationResult

logger = logging.getLogger(__name__)

class ConflictEngine:
    def __init__(self, db: Session):
        self.db = db
        self.compatibility_engine = CompatibilityEngine()
        self.data_quality = DataQualityService(db)

    async def detect_conflicts(
        self,
        task_ids: List[uuid.UUID],
        block_id: Optional[uuid.UUID] = None,
        window_start: Optional[datetime] = None,
        window_end: Optional[datetime] = None
    ) -> List[ConflictDetail]:
        """
        Evaluate tasks for any operational conflicts within the given window or against each other.
        """
        conflicts = []
        
        # 1. Load tasks
        tasks = self.db.query(MaintenanceRequest).filter(MaintenanceRequest.id.in_(task_ids)).all()
        if not tasks and task_ids:
            return [self._data_conflict(f"Could not load tasks. Expected {len(task_ids)}, found 0.")]

        # 2. Check Data Conflicts using DataQualityService
        for task in tasks:
            task_dict = {
                "asset_id": str(task.asset_id) if task.asset_id else None,
                "section_id": str(task.section_id) if task.section_id else None,
                "category": task.category,
                "estimated_duration_hours": task.estimated_duration_hours,
                "scheduled_start": task.scheduled_start.isoformat() if task.scheduled_start else None,
                "deadline": task.deadline.isoformat() if task.deadline else None
            }
            dq_result = await self.data_quality.validate_maintenance_record(task_dict)
            if not dq_result.is_valid:
                for issue in dq_result.issues:
                    if issue.severity == "ERROR":
                        conflicts.append(ConflictDetail(
                            conflict_id=str(uuid.uuid4()),
                            conflict_type=ConflictType.DATA_CONFLICT,
                            severity=ConflictSeverity.CRITICAL,
                            affected_tasks=[task.id],
                            reason=f"Data Validation Error: {issue.description}",
                            suggested_resolution=ResolutionSuggestion.REVIEW_DATA
                        ))

        # 3. Check Deadline Conflicts
        for task in tasks:
            deadline_conflict = self._check_deadline(task, window_start, window_end)
            if deadline_conflict:
                conflicts.append(deadline_conflict)

        # 4. Task Overlap & Compatibility (Comparing pairs)
        for i in range(len(tasks)):
            for j in range(i + 1, len(tasks)):
                t1, t2 = tasks[i], tasks[j]
                comp_result = self.compatibility_engine.check_tasks(t1, t2)
                if comp_result.status == CompatibilityStatus.INCOMPATIBLE:
                    conflicts.append(ConflictDetail(
                        conflict_id=str(uuid.uuid4()),
                        conflict_type=ConflictType.TASK_OVERLAP,
                        severity=ConflictSeverity.HIGH,
                        affected_tasks=[t1.id, t2.id],
                        affected_assets=comp_result.affected_assets,
                        affected_section=t1.section_id if t1.section_id == t2.section_id else None,
                        reason=comp_result.explanation,
                        suggested_resolution=ResolutionSuggestion.MOVE_TASK
                    ))

        # 5. Train Conflict
        if window_start and window_end:
            for task in tasks:
                if task.section_id:
                    train_conflicts = self._check_train_conflicts(task.section_id, window_start, window_end)
                    conflicts.extend(train_conflicts)

        # 6. Block Conflict
        if block_id:
            block = self.db.query(BlockRequest).filter(BlockRequest.id == block_id).first()
            if block:
                # E.g. tasks outside block window
                block_conflicts = self._check_block_conflicts(block, tasks, window_start, window_end)
                conflicts.extend(block_conflicts)

        # 7. Dependency Conflict & Resource Conflict
        # Using a simulated dependency mapping here since DB doesn't have it natively yet,
        # but in a real system we'd query task dependencies.
        # For Resources, we'll do a simple mock check or query ResourceAvailability if tasks require gangs.
        
        return conflicts

    def _check_deadline(self, task: MaintenanceRequest, window_start: Optional[datetime], window_end: Optional[datetime]) -> Optional[ConflictDetail]:
        if not task.deadline:
            return None
            
        now = datetime.now(task.deadline.tzinfo)
        
        # Actual infeasibility
        if window_end and window_end > task.deadline:
            return ConflictDetail(
                conflict_id=str(uuid.uuid4()),
                conflict_type=ConflictType.DEADLINE_CONFLICT,
                severity=ConflictSeverity.CRITICAL,
                affected_tasks=[task.id],
                reason=f"Scheduled execution window ends after the deadline ({task.deadline.isoformat()}).",
                suggested_resolution=ResolutionSuggestion.MOVE_TASK
            )
            
        # Overdue risk (if not scheduled yet)
        if not window_start and now > task.deadline:
            return ConflictDetail(
                conflict_id=str(uuid.uuid4()),
                conflict_type=ConflictType.DEADLINE_CONFLICT,
                severity=ConflictSeverity.HIGH,
                affected_tasks=[task.id],
                reason="Task is overdue and requires immediate scheduling.",
                suggested_resolution=ResolutionSuggestion.WAIT_FOR_WINDOW
            )
            
        return None

    def _check_train_conflicts(self, section_id: uuid.UUID, start: datetime, end: datetime) -> List[ConflictDetail]:
        """
        Check if any train schedules overlap with the requested window in the given section.
        """
        conflicts = []
        # Convert window to time of day for simple schedule check (assuming same day for simplicity)
        start_t = start.time()
        end_t = end.time()
        
        schedules = self.db.query(TrainSchedule).filter(
            TrainSchedule.section_id == section_id,
            TrainSchedule.scheduled_arrival.isnot(None),
            TrainSchedule.scheduled_departure.isnot(None)
        ).all()
        
        for sched in schedules:
            # Simplistic time-overlap check
            if sched.scheduled_arrival and sched.scheduled_departure:
                if (start_t <= sched.scheduled_departure and end_t >= sched.scheduled_arrival):
                    conflicts.append(ConflictDetail(
                        conflict_id=str(uuid.uuid4()),
                        conflict_type=ConflictType.TRAIN_CONFLICT,
                        severity=ConflictSeverity.CRITICAL,
                        affected_section=section_id,
                        reason=f"Window overlaps with scheduled train {sched.train_id}",
                        suggested_resolution=ResolutionSuggestion.MOVE_BLOCK
                    ))
        return conflicts

    def _check_block_conflicts(self, block: BlockRequest, tasks: List[MaintenanceRequest], start: Optional[datetime], end: Optional[datetime]) -> List[ConflictDetail]:
        conflicts = []
        if block.status in [BlockRequestStatus.REJECTED, BlockRequestStatus.CANCELLED]:
            conflicts.append(ConflictDetail(
                conflict_id=str(uuid.uuid4()),
                conflict_type=ConflictType.BLOCK_CONFLICT,
                severity=ConflictSeverity.CRITICAL,
                affected_section=block.section_id,
                reason=f"Block {block.id} is {block.status.value}",
                suggested_resolution=ResolutionSuggestion.MOVE_TASK
            ))
        return conflicts

    def _data_conflict(self, msg: str) -> ConflictDetail:
        return ConflictDetail(
            conflict_id=str(uuid.uuid4()),
            conflict_type=ConflictType.DATA_CONFLICT,
            severity=ConflictSeverity.CRITICAL,
            reason=msg,
            suggested_resolution=ResolutionSuggestion.REVIEW_DATA
        )
