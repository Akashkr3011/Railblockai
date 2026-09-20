"""
RAILBLOCK AI — Compatibility API

Endpoints for checking block sharing compatibility between tasks.
"""
from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.maintenance import MaintenanceRequest
from app.schemas.rules import CompatibilityCheckRequest, CompatibilityResult
from app.services.rules.compatibility import CompatibilityEngine

router = APIRouter()

@router.post("/check", response_model=CompatibilityResult)
def check_compatibility(
    request: CompatibilityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Check if two maintenance tasks are compatible to share a block.
    """
    task_a = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request.task_a_id).first()
    if not task_a:
        raise HTTPException(status_code=404, detail=f"Task {request.task_a_id} not found")
        
    task_b = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request.task_b_id).first()
    if not task_b:
        raise HTTPException(status_code=404, detail=f"Task {request.task_b_id} not found")
        
    engine = CompatibilityEngine()
    result = engine.check_tasks(task_a, task_b)
    
    return result
