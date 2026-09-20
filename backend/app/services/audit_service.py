"""
RAILBLOCK AI — Audit Service

All significant operations create audit records.
"""
from __future__ import annotations
import uuid
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
import structlog

logger = structlog.get_logger(__name__)

class AuditService:
    AUDITED_ACTIONS = {
        "login", "logout",
        "create_task", "update_task", "delete_task",
        "create_block", "update_block", "approve_block", "reject_block",
        "optimization_run", "manual_override",
        "create_user", "update_user",
        "import_data",
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        action: str,
        user_id: Optional[uuid.UUID] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None,
        before_state: Optional[dict[str, Any]] = None,
        after_state: Optional[dict[str, Any]] = None,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before_state,
            after_state=after_state,
            notes=notes,
            ip_address=ip_address,
        )
        self.db.add(entry)
        await self.db.flush()
        logger.info("audit_logged", action=action, entity_type=entity_type, entity_id=str(entity_id) if entity_id else None)
        return entry
