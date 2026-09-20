import os

content = """from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user, require_optimizer
from typing import List, Optional
import datetime
from datetime import timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db

from app.schemas.optimization import (
    OptimizationResult, ComparisonResult, ExplanationResult, 
    ManualChangeRequest, ManualChangeValidationResult
)

from app.models.maintenance import MaintenanceRequest, MaintenanceStatus
from app.models.block import BlockRequest, BlockRequestStatus
from app.services.optimization.baseline import BaselineScheduler
from app.services.optimization.comparison import ComparisonService
from app.services.optimization.explanation import ExplanationEngine
from app.services.optimization.manual_validation import ManualValidationService
from app.services.optimization.solver import OptimizationService

router = APIRouter(prefix="/optimization", tags=["optimization"])

async def _fetch_optimization_context(db: AsyncSession):
    # Fetch PENDING or APPROVED maintenance tasks
    tasks_res = await db.execute(
        select(MaintenanceRequest).where(
            MaintenanceRequest.status.in_([MaintenanceStatus.PENDING, MaintenanceStatus.APPROVED])
        ).limit(100) # limit for demo
    )
    tasks = list(tasks_res.scalars().all())
    
    # Fetch available blocks
    blocks_res = await db.execute(
        select(BlockRequest).where(
            BlockRequest.status.in_([BlockRequestStatus.REQUESTED, BlockRequestStatus.APPROVED])
        )
    )
    blocks = list(blocks_res.scalars().all())
    
    return tasks, blocks

@router.post("/baseline", response_model=OptimizationResult)
async def run_baseline_scheduler(current_user=Depends(require_optimizer), db: AsyncSession = Depends(get_db)):
    tasks, blocks = await _fetch_optimization_context(db)
    scheduler = BaselineScheduler()
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    return scheduler.schedule(tasks, blocks, ref_time)

@router.post("/compare", response_model=ComparisonResult)
async def compare_schedulers(current_user=Depends(require_optimizer), db: AsyncSession = Depends(get_db)):
    tasks, blocks = await _fetch_optimization_context(db)
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    baseline_svc = BaselineScheduler()
    base_res = baseline_svc.schedule(tasks, blocks, ref_time)
    
    opt_svc = OptimizationService()
    opt_res = opt_svc.solve(tasks, blocks, ref_time)
    
    comp_svc = ComparisonService()
    return comp_svc.compare(base_res, opt_res)

@router.post("/explain", response_model=ExplanationResult)
async def explain_decision(task_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tasks, blocks = await _fetch_optimization_context(db)
    
    task = next((t for t in tasks if str(t.id) == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found in active optimization context")
        
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    opt_svc = OptimizationService()
    res = opt_svc.solve(tasks, blocks, ref_time)
    
    engine = ExplanationEngine()
    return engine.explain_task_decision(uuid.UUID(task_id), task, res, blocks)

@router.post("/validate-change", response_model=ManualChangeValidationResult)
async def validate_manual_change(change: ManualChangeRequest, current_user=Depends(require_optimizer), db: AsyncSession = Depends(get_db)):
    tasks, blocks = await _fetch_optimization_context(db)
    ref_time = datetime.datetime.now(timezone.utc).replace(microsecond=0)
    
    opt_svc = OptimizationService()
    res = opt_svc.solve(tasks, blocks, ref_time)
    
    svc = ManualValidationService()
    return svc.validate_change(change, res, blocks, tasks)
"""

with open('app/api/v1/optimization.py', 'w') as f:
    f.write(content)
