"""
RAILBLOCK AI — Maintenance API Routes

GET  /api/v1/maintenance
GET  /api/v1/maintenance/{task_id}
POST /api/v1/maintenance
PATCH /api/v1/maintenance/{task_id}
"""
from __future__ import annotations
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.maintenance import MaintenanceRequestCreate, MaintenanceRequestUpdate, MaintenanceRequestResponse
from app.repositories.maintenance_repository import MaintenanceRepository
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.core.dependencies import get_current_user, require_engineer
from datetime import datetime, timezone

router = APIRouter()

@router.get("", response_model=List[MaintenanceRequestResponse], summary="List maintenance tasks")
async def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[MaintenanceStatus] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = MaintenanceRepository(db)
    if status:
        return await repo.get_by_status(status, skip=skip, limit=limit)
    return await repo.get_all(skip=skip, limit=limit)

@router.get("/{task_id}", response_model=MaintenanceRequestResponse, summary="Get maintenance task by ID")
async def get_task(
    task_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = MaintenanceRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Maintenance task {task_id} not found")
    return task

@router.post("", response_model=MaintenanceRequestResponse, status_code=201, summary="Create maintenance task")
async def create_task(
    data: MaintenanceRequestCreate,
    current_user=Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    repo = MaintenanceRepository(db)
    # Duplicate check
    dup = await repo.find_duplicate(data.asset_id, data.title)
    if dup:
        raise HTTPException(status_code=409, detail=f"A task with this title already exists for this asset (ID: {dup.id})")
    task_data = data.model_dump()
    task_data["created_by_id"] = current_user.id
    task_data["import_timestamp"] = datetime.now(timezone.utc)
    task = MaintenanceRequest(**task_data)
    return await repo.create(task)

@router.patch("/{task_id}", response_model=MaintenanceRequestResponse, summary="Update maintenance task")
async def update_task(
    task_id: uuid.UUID,
    data: MaintenanceRequestUpdate,
    current_user=Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    repo = MaintenanceRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Maintenance task {task_id} not found")
    update_data = data.model_dump(exclude_none=True)
    return await repo.update(task, **update_data)
