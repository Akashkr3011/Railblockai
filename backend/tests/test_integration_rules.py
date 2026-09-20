"""
RAILBLOCK AI — Stage 3B.3 Integration Tests
Verifies the end-to-end flow of Operational Intelligence rules.
Maintenance Data -> Data Quality -> PriorityEngine -> CompatibilityEngine -> ConflictEngine
"""
import uuid
import pytest
from datetime import datetime, timedelta, timezone, time
from unittest.mock import MagicMock, AsyncMock, patch

from app.models.maintenance import MaintenanceRequest, MaintenanceCategory, MaintenanceStatus
from app.models.asset import Asset, AssetCondition
from app.models.train import Train, TrainSchedule, TrainType

from app.services.data_quality_service import DataQualityService, ValidationResult, QualityIssue
from app.services.priority_engine import PriorityEngine
from app.services.rules.compatibility import CompatibilityEngine
from app.services.rules.conflict_engine import ConflictEngine
from app.schemas.rules import CompatibilityStatus, ConflictType, ConflictSeverity

@pytest.fixture
def mock_db():
    return AsyncMock()

def _make_task(title="Integration Task", category=MaintenanceCategory.TRACK, condition=AssetCondition.GOOD, deadline_offset_days=5, duration=2, section_id=None):
    asset_id = uuid.uuid4()
    if section_id is None:
        section_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(days=deadline_offset_days) if deadline_offset_days is not None else None
    
    asset = Asset(id=asset_id, name="Test Asset", condition=condition)
    
    task = MaintenanceRequest(
        id=uuid.uuid4(),
        title=title,
        category=category,
        status=MaintenanceStatus.PENDING,
        asset_id=asset_id,
        section_id=section_id,
        deadline=deadline,
        estimated_duration_hours=duration,
        scheduled_start=now,
        asset=asset
    )
    return task

@pytest.mark.asyncio
async def test_normal_task_flow(mock_db):
    """Test normal task without major conflicts or high priority."""
    task = _make_task(deadline_offset_days=30, condition=AssetCondition.GOOD)
    
    # 1. Data Quality
    dq = DataQualityService(mock_db)
    dq.db.execute.return_value.scalar_one_or_none = MagicMock(return_value=Asset())
    dq_result = await dq.validate_maintenance_record(task.__dict__)
    
    # 2. Priority Engine
    pe = PriorityEngine()
    priority = pe.score(
        priority="MEDIUM",
        deadline=task.deadline,
        estimated_duration_hours=task.estimated_duration_hours,
        asset_condition=AssetCondition.GOOD.value,
        asset_type="TRACK",
        section_type="MAIN_LINE"
    )
    assert priority.priority_level in ["LOW", "MEDIUM"]
    
    # 3. Compatibility Engine
    ce = CompatibilityEngine()
    task2 = _make_task(section_id=uuid.uuid4()) # Different section
    compat = ce.check_tasks(task, task2)
    assert compat.status == CompatibilityStatus.INCOMPATIBLE
    
    # 4. Conflict Engine
    def sync_mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [task]
        return m
    
    mock_sync_db = MagicMock()
    mock_sync_db.query.side_effect = sync_mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        conflict_engine = ConflictEngine(mock_sync_db)
        conflicts = await conflict_engine.detect_conflicts([task.id])
        assert len(conflicts) == 0

@pytest.mark.asyncio
async def test_high_priority_task_flow(mock_db):
    """Test high priority (critical condition, overdue) task flow."""
    task = _make_task(deadline_offset_days=-5, condition=AssetCondition.POOR)
    
    pe = PriorityEngine()
    priority = pe.score(
        priority="HIGH",
        deadline=task.deadline,
        estimated_duration_hours=task.estimated_duration_hours,
        asset_condition=AssetCondition.POOR.value,
        asset_type="TRACK",
        section_type="MAIN_LINE",
        criticality_score=9.0
    )
    assert priority.priority_level == "CRITICAL"
    
    mock_sync_db = MagicMock()
    def sync_mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [task]
        return m
    mock_sync_db.query.side_effect = sync_mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        conflict_engine = ConflictEngine(mock_sync_db)
        conflicts = await conflict_engine.detect_conflicts([task.id])
        assert any(c.conflict_type == ConflictType.DEADLINE_CONFLICT for c in conflicts)

@pytest.mark.asyncio
async def test_multi_department_compatibility():
    """Test two tasks in same section but different departments."""
    sec = uuid.uuid4()
    t1 = _make_task(title="Track Maintenance", category=MaintenanceCategory.TRACK)
    t1.section_id = sec
    
    t2 = _make_task(title="Signal Maintenance", category=MaintenanceCategory.SIGNAL)
    t2.section_id = sec
    
    ce = CompatibilityEngine()
    compat = ce.check_tasks(t1, t2)
    
    assert compat.status == CompatibilityStatus.CONDITIONALLY_COMPATIBLE
    assert any("different departments" in w for w in compat.warnings)

@pytest.mark.asyncio
async def test_train_conflict_integration():
    """Test train conflict through ConflictEngine."""
    task = _make_task()
    sec = task.section_id
    
    ts = TrainSchedule(
        id=uuid.uuid4(),
        train_id=uuid.uuid4(),
        section_id=sec,
        scheduled_arrival=time(10, 0),
        scheduled_departure=time(10, 15)
    )
    
    mock_sync_db = MagicMock()
    def sync_mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [task]
        elif model == TrainSchedule:
            m.filter.return_value.all.return_value = [ts]
        return m
    mock_sync_db.query.side_effect = sync_mock_query
    
    now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    w_start = now + timedelta(hours=9, minutes=30)
    w_end = now + timedelta(hours=11, minutes=30)
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        conflict_engine = ConflictEngine(mock_sync_db)
        conflicts = await conflict_engine.detect_conflicts([task.id], window_start=w_start, window_end=w_end)
        assert any(c.conflict_type == ConflictType.TRAIN_CONFLICT for c in conflicts)

@pytest.mark.asyncio
async def test_invalid_data_flow():
    """Test invalid data flagging."""
    task = _make_task(duration=-5) # Invalid duration
    
    mock_sync_db = MagicMock()
    def sync_mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [task]
        return m
    mock_sync_db.query.side_effect = sync_mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        mock_dq_instance.validate_maintenance_record = AsyncMock(
            return_value=ValidationResult(is_valid=False, issues=[QualityIssue(severity="ERROR", issue_code="ERR", field_name="duration", description="Invalid duration")])
        )
        
        conflict_engine = ConflictEngine(mock_sync_db)
        conflicts = await conflict_engine.detect_conflicts([task.id])
        assert any(c.conflict_type == ConflictType.DATA_CONFLICT for c in conflicts)
