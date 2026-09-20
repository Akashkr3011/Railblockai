"""
RAILBLOCK AI — Application Configuration

Pydantic v2 Settings management.
All configuration is loaded from environment variables (or .env file).
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration object.

    Values are read from environment variables first,
    then from the .env file in the project root.
    """

    model_config = SettingsConfigDict(
        env_file="../.env",          # root-level .env (one level above backend/)
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Application ---------------------------------------------------------
    APP_NAME: str = "RAILBLOCK AI"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ---- Backend Server ------------------------------------------------------
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_RELOAD: bool = True

    @field_validator("BACKEND_RELOAD", "DEBUG", mode="before")
    @classmethod
    def clean_bool(cls, v: object) -> bool:
        if isinstance(v, str):
            clean_v = v.split("#")[0].strip().lower()
            return clean_v in ("true", "1", "yes", "t", "y")
        return bool(v)

    # ---- API -----------------------------------------------------------------
    API_V1_STR: str = "/api/v1"

    # ---- Database ------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://railblock:changeme@localhost:5432/railblock_db",
        description="Async DSN for SQLAlchemy",
    )
    DATABASE_SYNC_URL: str = Field(
        default="postgresql+psycopg2://railblock:changeme@localhost:5432/railblock_db",
        description="Sync DSN for Alembic",
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # ---- Security ------------------------------------------------------------
    JWT_SECRET: str = "CHANGE_THIS_TO_A_RANDOM_SECRET"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ---- CORS ----------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ---- Feature Flags -------------------------------------------------------
    ML_ENABLED: bool = False
    OPTIMIZER_ENABLED: bool = False
    SIMULATION_ENABLED: bool = False
    REDIS_ENABLED: bool = False

    # ---- External URLs -------------------------------------------------------
    ML_SERVICE_URL: str = "http://localhost:8001"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ---- Logging -------------------------------------------------------------
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance (singleton)."""
    return Settings()


# Module-level singleton for import convenience
settings: Settings = get_settings()
