"""
RAILBLOCK AI — Defects API Routes
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.maintenance import Defect, DefectSeverity, SourceSystem
from app.schemas.defect import DefectCreate, DefectResponse
from app.core.dependencies import get_current_user, require_engineer

router = APIRouter()


@router.get("", response_model=list[DefectResponse])
async def list_defects(
    asset_id: Optional[uuid.UUID] = Query(None, description="Filter by asset"),
    severity: Optional[DefectSeverity] = Query(None, description="Filter by severity"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolved state"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List defects. Filterable by asset, severity, and resolved state."""
    q = select(Defect)
    if asset_id:
        q = q.where(Defect.asset_id == asset_id)
    if severity:
        q = q.where(Defect.severity == severity)
    if is_resolved is not None:
        q = q.where(Defect.is_resolved == is_resolved)
    q = q.order_by(Defect.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{defect_id}", response_model=DefectResponse)
async def get_defect(defect_id: uuid.UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a specific defect by ID."""
    result = await db.execute(select(Defect).where(Defect.id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    return defect


@router.post("", response_model=DefectResponse, status_code=201)
async def create_defect(
    payload: DefectCreate,
    current_user = Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    """Create a new defect record."""
    defect = Defect(**payload.model_dump())
    db.add(defect)
    await db.commit()
    await db.refresh(defect)
    return defect


@router.patch("/{defect_id}/resolve", response_model=DefectResponse)
async def resolve_defect(defect_id: uuid.UUID, current_user = Depends(require_engineer), db: AsyncSession = Depends(get_db)):
    """Mark a defect as resolved."""
    from datetime import datetime, timezone
    result = await db.execute(select(Defect).where(Defect.id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    defect.is_resolved = True
    defect.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(defect)
    return defect
