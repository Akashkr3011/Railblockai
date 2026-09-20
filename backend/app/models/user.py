"""
RAILBLOCK AI — User & Role Models
"""
from __future__ import annotations
import enum
import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum as SAEnum, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class UserRole(str, enum.Enum):
    # Primary Canonical Roles (Master Prompt)
    ADMIN = "ADMIN"
    PLANNER_CONTROLLER = "PLANNER_CONTROLLER"
    WORKER_FIELD_STAFF = "WORKER_FIELD_STAFF"
    VIEWER = "VIEWER"

    # Domain Specialization & Backward Compatibility Roles
    PLANNER = "PLANNER"
    ENGINEERING = "ENGINEERING"
    TRD = "TRD"
    ST = "ST"
    TRAFFIC_CONTROLLER = "TRAFFIC_CONTROLLER"
    MANAGER = "MANAGER"
    EXECUTIVE = "EXECUTIVE"
    AUDITOR = "AUDITOR"
    WORKER = "WORKER"

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_employee_id", "employee_id", unique=True),
        {"comment": "System users with role-based access"},
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, comment="User email (login)")
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False, comment="IR employee ID")
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role_enum"), nullable=False, default=UserRole.PLANNER_CONTROLLER)
    division_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Department: Engg, TRD, S&T, Operating")
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    last_login_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    division: Mapped[Optional["Division"]] = relationship("Division", back_populates="users", lazy="select")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user", lazy="noload")
