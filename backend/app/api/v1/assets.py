"""
RAILBLOCK AI — Assets API Routes

GET  /api/v1/assets
GET  /api/v1/assets/{asset_id}
POST /api/v1/assets
PATCH /api/v1/assets/{asset_id}
"""
from __future__ import annotations
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.asset import AssetResponse, AssetCreate, AssetUpdate
from app.repositories.asset_repository import AssetRepository
from app.models.asset import Asset
from app.core.dependencies import get_current_user, require_engineer

router = APIRouter()

@router.get("", response_model=List[AssetResponse], summary="List all assets")
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    return await repo.get_all(skip=skip, limit=limit)

@router.get("/{asset_id}", response_model=AssetResponse, summary="Get asset by ID")
async def get_asset(
    asset_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    return asset

@router.post("", response_model=AssetResponse, status_code=201, summary="Create asset")
async def create_asset(
    data: AssetCreate,
    current_user=Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    # Check for duplicate asset number
    existing = await repo.get_by_asset_number(data.asset_number)
    if existing:
        raise HTTPException(status_code=409, detail=f"Asset number {data.asset_number} already exists")
    asset = Asset(**data.model_dump())
    return await repo.create(asset)

@router.patch("/{asset_id}", response_model=AssetResponse, summary="Update asset")
async def update_asset(
    asset_id: uuid.UUID,
    data: AssetUpdate,
    current_user=Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    repo = AssetRepository(db)
    asset = await repo.get_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    update_data = data.model_dump(exclude_none=True)
    return await repo.update(asset, **update_data)
