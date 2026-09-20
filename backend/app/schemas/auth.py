"""
RAILBLOCK AI — Auth Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user_id: str
    role: str
    full_name: str

class UserCreate(BaseModel):
    email: str
    employee_id: str
    full_name: str
    password: str
    role: UserRole = UserRole.PLANNER_CONTROLLER
    department: Optional[str] = None
    designation: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    employee_id: str
    full_name: str
    role: UserRole
    department: Optional[str]
    designation: Optional[str]
    is_active: bool
    created_at: datetime
