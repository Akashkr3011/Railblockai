"""
RAILBLOCK AI — Block Planning API Routes

GET  /api/v1/blocks
GET  /api/v1/blocks/{block_id}
POST /api/v1/blocks
PATCH /api/v1/blocks/{block_id}/status
"""
from __future__ import annotations
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.block import BlockRequestCreate, BlockRequestUpdate, BlockRequestResponse
from app.repositories.block_repository import BlockRequestRepository
from app.models.block import BlockRequest, BlockRequestStatus
from app.core.dependencies import get_current_user, require_engineer, require_traffic_controller

router = APIRouter()

@router.get("", response_model=List[BlockRequestResponse], summary="List block requests")
async def list_blocks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[BlockRequestStatus] = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BlockRequestRepository(db)
    if status:
        return await repo.get_by_status(status)
    return await repo.get_all(skip=skip, limit=limit)

@router.get("/{block_id}", response_model=BlockRequestResponse, summary="Get block request by ID")
async def get_block(
    block_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = BlockRequestRepository(db)
    block = await repo.get_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail=f"Block request {block_id} not found")
    return block

@router.post("", response_model=BlockRequestResponse, status_code=201, summary="Create block request")
async def create_block(
    data: BlockRequestCreate,
    current_user=Depends(require_engineer),
    db: AsyncSession = Depends(get_db),
):
    repo = BlockRequestRepository(db)
    block_data = data.model_dump()
    block_data["requested_by_id"] = current_user.id
    block_data["status"] = BlockRequestStatus.SUBMITTED
    block = BlockRequest(**block_data)
    return await repo.create(block)

@router.patch("/{block_id}/status", response_model=BlockRequestResponse, summary="Update block request status")
async def update_block_status(
    block_id: uuid.UUID,
    data: BlockRequestUpdate,
    current_user=Depends(require_traffic_controller),
    db: AsyncSession = Depends(get_db),
):
    repo = BlockRequestRepository(db)
    block = await repo.get_by_id(block_id)
    if not block:
        raise HTTPException(status_code=404, detail=f"Block request {block_id} not found")
    update_data = data.model_dump(exclude_none=True)
    update_data["reviewed_by_id"] = current_user.id
    return await repo.update(block, **update_data)
