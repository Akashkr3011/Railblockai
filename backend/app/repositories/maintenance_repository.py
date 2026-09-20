"""
RAILBLOCK AI — Maintenance Repository
"""
from __future__ import annotations
import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.maintenance import MaintenanceRequest, MaintenanceStatus, Priority, SourceSystem
from app.repositories.base_repository import BaseRepository

class MaintenanceRepository(BaseRepository[MaintenanceRequest]):
    def __init__(self, db: AsyncSession):
        super().__init__(MaintenanceRequest, db)

    async def get_by_asset(self, asset_id: uuid.UUID) -> List[MaintenanceRequest]:
        result = await self.db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.asset_id == asset_id)
            .order_by(MaintenanceRequest.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_status(self, status: MaintenanceStatus, skip: int = 0, limit: int = 100) -> List[MaintenanceRequest]:
        result = await self.db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.status == status)
            .order_by(MaintenanceRequest.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_priority(self, priority: Priority) -> List[MaintenanceRequest]:
        result = await self.db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.priority == priority)
            .order_by(MaintenanceRequest.deadline.asc().nulls_last())
        )
        return list(result.scalars().all())

    async def get_by_source(self, source_system: SourceSystem) -> List[MaintenanceRequest]:
        result = await self.db.execute(
            select(MaintenanceRequest).where(MaintenanceRequest.source_system == source_system)
        )
        return list(result.scalars().all())

    async def find_duplicate(self, asset_id: uuid.UUID, title: str) -> Optional[MaintenanceRequest]:
        """Find an existing active task for the same asset and title (duplicate check)."""
        result = await self.db.execute(
            select(MaintenanceRequest).where(
                MaintenanceRequest.asset_id == asset_id,
                MaintenanceRequest.title == title,
                MaintenanceRequest.status.notin_([MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED])
            )
        )
        return result.scalar_one_or_none()
