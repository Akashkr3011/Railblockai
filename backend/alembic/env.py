"""
Alembic Migration Environment

Configures Alembic to use the RAILBLOCK AI SQLAlchemy models and
the sync database URL from application settings.
"""
from __future__ import annotations

import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add the backend directory to the Python path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load application config and models
from app.config import settings  # noqa: E402
from app.models import Base  # noqa: E402 — imports all models for autodiscovery

# Alembic Config object from alembic.ini
config = context.config

# Configure logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQLAlchemy metadata for autogenerate support
target_metadata = Base.metadata


def get_url() -> str:
    """Use DATABASE_SYNC_URL from application settings."""
    return settings.DATABASE_SYNC_URL


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode (no live DB connection needed).
    Generates SQL scripts that can be reviewed and applied manually.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode (live DB connection).
    Used during normal `alembic upgrade head` runs.
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
