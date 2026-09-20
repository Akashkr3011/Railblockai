"""
RAILBLOCK AI — Trains API Routes

GET /api/v1/trains
GET /api/v1/trains/{train_id}
GET /api/v1/trains/{train_id}/schedules

NOTE: All train data in prototype is [SIMULATED].
"""
from __future__ import annotations
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.train import TrainResponse, TrainScheduleResponse
from app.models.train import Train, TrainSchedule
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("", response_model=List[TrainResponse], summary="List trains [SIMULATED data]")
async def list_trains(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Train).where(Train.is_active == True).offset(skip).limit(limit))
    return list(result.scalars().all())

@router.get("/{train_id}", response_model=TrainResponse, summary="Get train by ID [SIMULATED data]")
async def get_train(
    train_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Train).where(Train.id == train_id))
    train = result.scalar_one_or_none()
    if not train:
        raise HTTPException(status_code=404, detail=f"Train {train_id} not found")
    return train

@router.get("/{train_id}/schedules", response_model=List[TrainScheduleResponse], summary="Get train schedules [SIMULATED_TIMETABLE]")
async def get_train_schedules(
    train_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TrainSchedule).where(TrainSchedule.train_id == train_id)
        .order_by(TrainSchedule.sequence_number)
    )
    return list(result.scalars().all())
