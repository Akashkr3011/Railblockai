"""
RAILBLOCK AI — Resources API Routes
"""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_user
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource, ResourceType, ResourceAvailability
from app.schemas.resource import ResourceResponse, ResourceAvailabilityResponse

router = APIRouter()


@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    resource_type: Optional[ResourceType] = Query(None, description="Filter by type"),
    is_available: Optional[bool] = Query(None, description="Filter by availability flag"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all resources (gangs, machines, vehicles, specialists)."""
    q = select(Resource)
    if resource_type:
        q = q.where(Resource.resource_type == resource_type)
    if is_available is not None:
        q = q.where(Resource.is_available == is_available)
    if specialization:
        q = q.where(Resource.specialization.ilike(f"%{specialization}%"))
    q = q.order_by(Resource.name).limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: uuid.UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a specific resource by ID."""
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.get("/{resource_id}/availability", response_model=list[ResourceAvailabilityResponse])
async def get_resource_availability(
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get availability windows for a specific resource."""
    result = await db.execute(
        select(ResourceAvailability)
        .where(ResourceAvailability.resource_id == resource_id)
        .order_by(ResourceAvailability.available_from)
    )
    return result.scalars().all()
