"""
RAILBLOCK AI — Train Schedules API Routes

[SIMULATION] All train schedule data is synthetic (SIMULATED_TIMETABLE).
Not connected to any real Indian Railways timetable system.
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_user
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.train import TrainSchedule
from app.schemas.train import TrainScheduleResponse

router = APIRouter()


@router.get("", response_model=list[TrainScheduleResponse])
async def list_train_schedules(
    train_id: Optional[uuid.UUID] = Query(None, description="Filter by train"),
    section_id: Optional[uuid.UUID] = Query(None, description="Filter by section"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List train schedules. Filter by train or section.

    [SIMULATION] All schedules are SIMULATED_TIMETABLE data.
    Not real Indian Railways timetable data.
    """
    q = select(TrainSchedule)
    if train_id:
        q = q.where(TrainSchedule.train_id == train_id)
    if section_id:
        q = q.where(TrainSchedule.section_id == section_id)
    q = q.order_by(TrainSchedule.scheduled_departure).limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{schedule_id}", response_model=TrainScheduleResponse)
async def get_train_schedule(
    schedule_id: uuid.UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific train schedule entry by ID."""
    result = await db.execute(
        select(TrainSchedule).where(TrainSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Train schedule not found")
    return schedule


@router.get("/by-section/{section_id}", response_model=list[TrainScheduleResponse])
async def get_schedules_by_section(
    section_id: uuid.UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all train schedules for a given section.

    Stage 3 uses this to find train traffic windows for a section
    before approving maintenance block requests.

    [SIMULATION] Data is synthetic.
    """
    result = await db.execute(
        select(TrainSchedule)
        .where(TrainSchedule.section_id == section_id)
        .order_by(TrainSchedule.scheduled_departure)
    )
    return result.scalars().all()
