"""
RAILBLOCK AI — User Repository
"""
from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_employee_id(self, employee_id: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.employee_id == employee_id))
        return result.scalar_one_or_none()
