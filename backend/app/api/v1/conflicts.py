"""
RAILBLOCK AI — Conflict Engine API
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.rules import ConflictDetectionRequest, ConflictDetectionResponse
from app.services.rules.conflict_engine import ConflictEngine

router = APIRouter()

@router.post("/detect", response_model=ConflictDetectionResponse)
async def detect_conflicts(
    request: ConflictDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Detect operational conflicts across a given set of tasks and time window.
    """
    engine = ConflictEngine(db)
    conflicts = await engine.detect_conflicts(
        task_ids=request.task_ids,
        block_id=request.block_id,
        window_start=request.time_window_start,
        window_end=request.time_window_end
    )
    
    return ConflictDetectionResponse(
        conflicts=conflicts,
        summary=f"Detected {len(conflicts)} conflicts."
    )
