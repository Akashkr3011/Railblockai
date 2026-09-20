"""
RAILBLOCK AI — Backend Application Entry Point

FastAPI application factory.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, check_db_connection
from app.api.v1 import router as api_v1_router

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Handle application startup and graceful shutdown."""
    logger.info(
        "railblock_ai_starting",
        version=settings.APP_VERSION,
        env=settings.APP_ENV,
    )

    # Verify database connectivity on startup
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("database_connected")
    else:
        logger.warning(
            "database_unavailable",
            hint="Set DATABASE_URL in .env and ensure PostgreSQL is running",
        )

    yield  # Application runs here

    # Cleanup on shutdown
    await engine.dispose()
    logger.info("railblock_ai_stopped")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.APP_NAME,
        description=(
            "RAILBLOCK AI — Decision-support and maintenance block planning "
            "system for Indian Railways. SIH 2026, Problem Statement #27."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ---- CORS ---------------------------------------------------------------
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers -------------------------------------------------------------
    application.include_router(api_v1_router, prefix=settings.API_V1_STR)

    # ---- Root redirect -------------------------------------------------------
    @application.get("/", include_in_schema=False)
    async def root() -> JSONResponse:
        return JSONResponse(
            {
                "message": "RAILBLOCK AI Backend",
                "version": settings.APP_VERSION,
                "docs": "/docs",
                "health": f"{settings.API_V1_STR}/health",
            }
        )

    return application


# ---------------------------------------------------------------------------
# Application instance (used by uvicorn)
# ---------------------------------------------------------------------------

app = create_application()


# ---------------------------------------------------------------------------
# Development entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.BACKEND_RELOAD,
        log_config=None,  # structlog handles logging
    )
