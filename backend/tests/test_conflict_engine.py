"""
RAILBLOCK AI — Tests for ConflictEngine
"""
import uuid
import pytest
from datetime import datetime, timedelta, timezone, time

from sqlalchemy.orm import Session
from app.models.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.maintenance import MaintenanceRequest, MaintenanceCategory, MaintenanceStatus
from app.models.train import Train, TrainSchedule, TrainType
from app.models.block import BlockRequest, BlockRequestStatus
from app.services.rules.conflict_engine import ConflictEngine
from app.schemas.rules import ConflictType, ConflictSeverity

from unittest.mock import MagicMock, AsyncMock, patch

@pytest.fixture
def db():
    mock_db = MagicMock()
    return mock_db

def _make_task(title="Test Task", section_id=None, deadline=None, duration=None, start=None):
    t = MaintenanceRequest(
        id=uuid.uuid4(),
        title=title,
        category=MaintenanceCategory.TRACK,
        status=MaintenanceStatus.PENDING,
        asset_id=uuid.uuid4(),
        section_id=section_id or uuid.uuid4(),
        deadline=deadline,
        estimated_duration_hours=duration,
        scheduled_start=start
    )
    return t

@pytest.mark.asyncio
async def test_train_conflict(db: MagicMock):
    sec = uuid.uuid4()
    tr = Train(id=uuid.uuid4(), train_number="12001", name="Shatabdi", train_type=TrainType.EXPRESS)
    ts = TrainSchedule(
        id=uuid.uuid4(),
        train_id=tr.id,
        section_id=sec,
        sequence_number=1,
        scheduled_arrival=time(10, 0),
        scheduled_departure=time(10, 15)
    )
    
    t = _make_task(section_id=sec)
    
    now = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    w_start = now + timedelta(hours=9, minutes=30)
    w_end = now + timedelta(hours=11, minutes=30)
    
    def mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [t]
        elif model == TrainSchedule:
            m.filter.return_value.all.return_value = [ts]
        return m
    db.query.side_effect = mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        from app.services.data_quality_service import ValidationResult
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        ce = ConflictEngine(db)
        conflicts = await ce.detect_conflicts([t.id], window_start=w_start, window_end=w_end)
    
    assert any(c.conflict_type == ConflictType.TRAIN_CONFLICT for c in conflicts)

@pytest.mark.asyncio
async def test_task_overlap_conflict(db: MagicMock):
    asset = uuid.uuid4()
    now = datetime.now(timezone.utc)
    t1 = MaintenanceRequest(
        id=uuid.uuid4(),
        title="T1",
        category=MaintenanceCategory.TRACK,
        asset_id=asset,
        estimated_duration_hours=2,
        scheduled_start=now
    )
    t2 = MaintenanceRequest(
        id=uuid.uuid4(),
        title="T2",
        category=MaintenanceCategory.TRACK,
        asset_id=asset,
        estimated_duration_hours=2,
        scheduled_start=now
    )
    
    def mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [t1, t2]
        return m
    db.query.side_effect = mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        from app.services.data_quality_service import ValidationResult
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        ce = ConflictEngine(db)
        conflicts = await ce.detect_conflicts([t1.id, t2.id])
    assert any(c.conflict_type == ConflictType.TASK_OVERLAP for c in conflicts)

@pytest.mark.asyncio
async def test_deadline_conflict(db: MagicMock):
    now = datetime.now(timezone.utc)
    t1 = _make_task(deadline=now + timedelta(hours=1))
    
    def mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [t1]
        return m
    db.query.side_effect = mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        from app.services.data_quality_service import ValidationResult
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=True, issues=[]))
        
        ce = ConflictEngine(db)
        conflicts = await ce.detect_conflicts([t1.id], window_start=now + timedelta(hours=2), window_end=now + timedelta(hours=4))
        assert any(c.conflict_type == ConflictType.DEADLINE_CONFLICT and c.severity == ConflictSeverity.CRITICAL for c in conflicts)

        t2 = _make_task(deadline=now - timedelta(hours=1))
        def mock_query2(model):
            m = MagicMock()
            if model == MaintenanceRequest:
                m.filter.return_value.all.return_value = [t2]
            return m
        db.query.side_effect = mock_query2
        
        c2 = await ce.detect_conflicts([t2.id])
    assert any(c.conflict_type == ConflictType.DEADLINE_CONFLICT and c.severity == ConflictSeverity.HIGH for c in c2)

@pytest.mark.asyncio
async def test_block_conflict(db: MagicMock):
    b = BlockRequest(
        id=uuid.uuid4(),
        title="B1",
        status=BlockRequestStatus.REJECTED
    )
    
    def mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = []
        elif model == BlockRequest:
            m.filter.return_value.first.return_value = b
        return m
    db.query.side_effect = mock_query
    
    ce = ConflictEngine(db)
    conflicts = await ce.detect_conflicts([], block_id=b.id)
    assert any(c.conflict_type == ConflictType.BLOCK_CONFLICT for c in conflicts)

@pytest.mark.asyncio
async def test_data_conflict(db: MagicMock):
    t1 = _make_task(duration=-5)
    
    def mock_query(model):
        m = MagicMock()
        if model == MaintenanceRequest:
            m.filter.return_value.all.return_value = [t1]
        return m
    db.query.side_effect = mock_query
    
    with patch('app.services.rules.conflict_engine.DataQualityService') as MockDQ:
        mock_dq_instance = MockDQ.return_value
        from app.services.data_quality_service import ValidationResult, QualityIssue
        mock_dq_instance.validate_maintenance_record = AsyncMock(return_value=ValidationResult(is_valid=False, issues=[QualityIssue(issue_code="ERR", severity="ERROR", field_name="task", description="Invalid")]))
        
        ce = ConflictEngine(db)
        conflicts = await ce.detect_conflicts([t1.id])
    assert any(c.conflict_type == ConflictType.DATA_CONFLICT for c in conflicts)

