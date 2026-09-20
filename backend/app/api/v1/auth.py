"""
RAILBLOCK AI — Authentication API Routes

POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/register (ADMIN only)
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user, require_admin
from app.config import settings

router = APIRouter()

@router.post("/login", response_model=TokenResponse, summary="Login with email and password")
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_svc = AuthService(db)
    access_token, refresh_token = await auth_svc.authenticate(request.email, request.password)
    from app.repositories.user_repository import UserRepository
    from app.core.security import decode_access_token
    payload = decode_access_token(access_token)
    user_repo = UserRepository(db)
    import uuid
    user = await user_repo.get_by_id(uuid.UUID(payload["sub"]))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user.id),
        role=user.role.value,
        full_name=user.full_name,
    )

@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponse, summary="Register new user (Admin only)")
async def register(
    user_data: UserCreate,
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    auth_svc = AuthService(db)
    user = await auth_svc.create_user(
        email=user_data.email,
        employee_id=user_data.employee_id,
        full_name=user_data.full_name,
        password=user_data.password,
        role=user_data.role,
        department=user_data.department,
        designation=user_data.designation,
    )
    return user
