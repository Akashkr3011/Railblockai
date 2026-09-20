"""
RAILBLOCK AI — Alerts API Routes

GET   /api/v1/alerts
PATCH /api/v1/alerts/{alert_id}/resolve
"""
from __future__ import annotations
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.alert import Alert, AlertSeverity
from pydantic import BaseModel, ConfigDict
from app.core.dependencies import get_current_user

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    message: str
    severity: AlertSeverity
    alert_type: str
    is_resolved: bool
    resolved_at: Optional[datetime]
    created_at: datetime

router = APIRouter()

@router.get("", response_model=List[AlertResponse], summary="List system alerts")
async def list_alerts(
    unresolved_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Alert)
    if unresolved_only:
        q = q.where(Alert.is_resolved == False)
    q = q.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())

@router.patch("/{alert_id}/resolve", response_model=AlertResponse, summary="Resolve alert")
async def resolve_alert(
    alert_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by_id = current_user.id
    await db.flush()
    return alert
