"""
RAILBLOCK AI — Common Pydantic Schemas
"""
from __future__ import annotations
import uuid
from typing import Optional, Any, Generic, TypeVar, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int

class MessageResponse(BaseModel):
    message: str
    detail: Optional[Any] = None

class UUIDResponse(BaseModel):
    id: uuid.UUID
