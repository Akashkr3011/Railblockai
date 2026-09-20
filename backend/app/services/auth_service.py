"""
RAILBLOCK AI — Authentication Service
"""
from __future__ import annotations
from typing import Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, create_access_token, create_refresh_token, hash_password
from app.repositories.user_repository import UserRepository
from app.models.user import User, UserRole
import structlog

logger = structlog.get_logger(__name__)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate(self, email: str, password: str) -> tuple[str, str]:
        """Authenticate user and return (access_token, refresh_token)."""
        user = await self.user_repo.get_by_email(email.lower())
        if not user or not verify_password(password, user.hashed_password):
            logger.warning("auth_failed", email=email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        
        extra = {"role": user.role.value, "name": user.full_name}
        access_token = create_access_token(str(user.id), extra_claims=extra)
        refresh_token = create_refresh_token(str(user.id))
        
        # Update last login
        user.last_login_at = datetime.now(timezone.utc).isoformat()
        await self.db.flush()
        logger.info("auth_success", user_id=str(user.id), role=user.role.value)
        return access_token, refresh_token

    async def create_user(
        self,
        email: str,
        employee_id: str,
        full_name: str,
        password: str,
        role: UserRole = UserRole.PLANNER_CONTROLLER,
        department: Optional[str] = None,
        designation: Optional[str] = None,
    ) -> User:
        """Create a new user."""
        existing = await self.user_repo.get_by_email(email.lower())
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user = User(
            email=email.lower(),
            employee_id=employee_id,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=role,
            department=department,
            designation=designation,
            is_active=True,
            is_verified=True,
        )
        return await self.user_repo.create(user)
