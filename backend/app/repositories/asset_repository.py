"""
RAILBLOCK AI — Asset Repository
"""
from __future__ import annotations
import uuid
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.asset import Asset, AssetType, AssetCondition
from app.repositories.base_repository import BaseRepository

class AssetRepository(BaseRepository[Asset]):
    def __init__(self, db: AsyncSession):
        super().__init__(Asset, db)

    async def get_by_asset_number(self, asset_number: str) -> Optional[Asset]:
        result = await self.db.execute(select(Asset).where(Asset.asset_number == asset_number))
        return result.scalar_one_or_none()

    async def get_by_section(self, section_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Asset]:
        result = await self.db.execute(
            select(Asset).where(Asset.section_id == section_id, Asset.is_active == True).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_condition(self, condition: AssetCondition) -> List[Asset]:
        result = await self.db.execute(select(Asset).where(Asset.condition == condition, Asset.is_active == True))
        return list(result.scalars().all())
