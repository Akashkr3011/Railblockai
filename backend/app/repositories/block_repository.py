"""
RAILBLOCK AI — Block Repository
"""
from __future__ import annotations
import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.block import BlockRequest, BlockWindow, BlockRequestStatus
from app.repositories.base_repository import BaseRepository

class BlockRequestRepository(BaseRepository[BlockRequest]):
    def __init__(self, db: AsyncSession):
        super().__init__(BlockRequest, db)

    async def get_by_section(self, section_id: uuid.UUID) -> List[BlockRequest]:
        result = await self.db.execute(
            select(BlockRequest).where(BlockRequest.section_id == section_id)
            .order_by(BlockRequest.requested_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_status(self, status: BlockRequestStatus) -> List[BlockRequest]:
        result = await self.db.execute(
            select(BlockRequest).where(BlockRequest.status == status)
        )
        return list(result.scalars().all())

class BlockWindowRepository(BaseRepository[BlockWindow]):
    def __init__(self, db: AsyncSession):
        super().__init__(BlockWindow, db)

    async def find_overlapping(self, section_id: uuid.UUID, start: datetime, end: datetime) -> List[BlockWindow]:
        """Find confirmed block windows that overlap the given time range on the section."""
        result = await self.db.execute(
            select(BlockWindow).where(
                and_(
                    BlockWindow.section_id == section_id,
                    BlockWindow.is_confirmed == True,
                    BlockWindow.start_time < end,
                    BlockWindow.end_time > start,
                )
            )
        )
        return list(result.scalars().all())
