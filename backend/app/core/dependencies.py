"""
RAILBLOCK AI — FastAPI Dependencies

Provides get_current_user and role-enforcement dependencies.
"""
from __future__ import annotations

from typing import Optional
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database import get_db

bear_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bear_scheme),
) -> str:
    """
    Extract and validate JWT from Authorization header.
    Returns the user UUID (string) from the token subject.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise credentials_exception
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return user_id


async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> "User":  # type: ignore[name-defined]
    """
    Load the full User object from the database.
    Raises 401 if user does not exist or is inactive.
    """
    from app.models.user import User
    from sqlalchemy import select

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id), User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )
    return user


def require_roles(*allowed_roles: str):
    """
    Factory that returns a FastAPI dependency enforcing role-based access.

    Usage:
        @router.post("/admin-only")
        async def admin_endpoint(
            current_user = Depends(require_roles("ADMIN"))
        ):
    """
    async def role_checker(
        current_user=Depends(get_current_user),
    ):
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not authorized for this action. Required: {list(allowed_roles)}",
            )
        return current_user

    return role_checker


# Convenience role dependencies
require_admin = require_roles("ADMIN")
require_engineer = require_roles("ADMIN", "ENGINEERING", "ST", "TRD", "PLANNER")
require_planner = require_roles("ADMIN", "PLANNER", "ENGINEERING")
require_manager = require_roles("ADMIN", "MANAGER", "EXECUTIVE")
require_traffic_controller = require_roles("ADMIN", "TRAFFIC_CONTROLLER", "PLANNER")

require_asset_manager = require_roles('ADMIN', 'ENGINEERING', 'ST', 'TRD', 'MANAGER')
require_block_manager = require_roles('ADMIN', 'PLANNER', 'MANAGER', 'TRAFFIC_CONTROLLER')
require_defect_manager = require_roles('ADMIN', 'ENGINEERING', 'ST', 'TRD', 'MANAGER')
require_alert_resolver = require_roles('ADMIN', 'MANAGER', 'PLANNER', 'ENGINEERING', 'ST', 'TRD', 'TRAFFIC_CONTROLLER')
require_optimizer = require_roles('ADMIN', 'PLANNER', 'MANAGER')

