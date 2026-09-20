"""
RAILBLOCK AI — Compatibility Engine

Evaluates whether two or more maintenance activities can safely and operationally
share the same block/possession window.
"""
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging

from app.models.maintenance import MaintenanceRequest
from app.models.asset import Asset
from app.models.division import Section
from app.schemas.rules import CompatibilityResult, CompatibilityStatus

logger = logging.getLogger(__name__)

class CompatibilityEngine:
    """
    Deterministic domain rule engine for maintenance block sharing evaluation.
    """
    
    def __init__(self):
        pass

    def check_tasks(
        self,
        task_a: MaintenanceRequest,
        task_b: MaintenanceRequest,
    ) -> CompatibilityResult:
        """
        Evaluate compatibility between two maintenance tasks.
        """
        reasons = []
        warnings = []
        violated_conditions = []
        
        affected_assets = []
        if task_a.asset_id: affected_assets.append(task_a.asset_id)
        if task_b.asset_id and task_b.asset_id not in affected_assets:
            affected_assets.append(task_b.asset_id)
            
        affected_sections = []
        if task_a.section_id: affected_sections.append(task_a.section_id)
        if task_b.section_id and task_b.section_id not in affected_sections:
            affected_sections.append(task_b.section_id)
            
        time_overlap = self._check_time_overlap(task_a, task_b)
        
        # Rule 1: Same Asset Conflict
        if task_a.asset_id == task_b.asset_id and task_a.asset_id is not None:
            if time_overlap:
                return CompatibilityResult(
                    status=CompatibilityStatus.INCOMPATIBLE,
                    reasons=["Both tasks require the same asset during overlapping time windows."],
                    violated_conditions=["SAME_ASSET_OVERLAP"],
                    affected_assets=affected_assets,
                    affected_sections=affected_sections,
                    explanation="Both tasks require the same asset during overlapping time windows."
                )
            else:
                reasons.append("Tasks operate on the same asset but in non-overlapping time windows.")
                
        # Rule 2: Section Compatibility
        if task_a.section_id != task_b.section_id and task_a.section_id is not None and task_b.section_id is not None:
            if time_overlap:
                return CompatibilityResult(
                    status=CompatibilityStatus.INCOMPATIBLE,
                    reasons=["Tasks are in different infrastructure sections and overlap in time."],
                    violated_conditions=["DIFFERENT_SECTION_OVERLAP"],
                    affected_assets=affected_assets,
                    affected_sections=affected_sections,
                    explanation="Cannot group tasks that require different sections at the same time."
                )
            reasons.append("Tasks operate on different infrastructure sections.")
        elif task_a.section_id == task_b.section_id:
            reasons.append("Tasks operate on the same infrastructure section.")

        # Rule 3: Department Coordination
        if task_a.category != task_b.category:
            warnings.append(f"Tasks involve different departments ({task_a.category.value} vs {task_b.category.value}). Cross-department coordination is required.")
        else:
            reasons.append(f"Tasks belong to the same department ({task_a.category.value}).")

        # Compile Result
        if not time_overlap and task_a.asset_id == task_b.asset_id:
            status = CompatibilityStatus.COMPATIBLE
            explanation = "Tasks operate on the same asset but have non-overlapping schedules."
        elif task_a.asset_id != task_b.asset_id and task_a.section_id == task_b.section_id:
            if warnings:
                status = CompatibilityStatus.CONDITIONALLY_COMPATIBLE
                explanation = "Tasks share the section but require different resources; simultaneous execution depends on configured resource availability."
            else:
                status = CompatibilityStatus.COMPATIBLE
                explanation = "Tasks operate on different assets within the same section and require no conflicting resources."
        else:
            if warnings:
                status = CompatibilityStatus.CONDITIONALLY_COMPATIBLE
                explanation = "Tasks have minor operational friction that requires conditions to be met."
            else:
                status = CompatibilityStatus.COMPATIBLE
                explanation = "Tasks are operationally compatible."

        return CompatibilityResult(
            status=status,
            reasons=reasons,
            warnings=warnings,
            violated_conditions=violated_conditions,
            affected_assets=affected_assets,
            affected_sections=affected_sections,
            explanation=explanation
        )

    def _check_time_overlap(self, task_a: MaintenanceRequest, task_b: MaintenanceRequest) -> bool:
        if not (task_a.scheduled_start and task_b.scheduled_start):
            return False
            
        dur_a = task_a.estimated_duration_hours or 0.0
        dur_b = task_b.estimated_duration_hours or 0.0
        
        end_a = task_a.scheduled_start + timedelta(hours=dur_a)
        end_b = task_b.scheduled_start + timedelta(hours=dur_b)
        
        return task_a.scheduled_start < end_b and task_b.scheduled_start < end_a
