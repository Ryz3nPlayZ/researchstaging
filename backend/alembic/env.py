"""
Alembic environment for async SQLAlchemy.

Supports both 'offline' mode (SQL script generation) and 'online' mode
(direct async DB execution) using asyncpg.
"""
import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Make sure the backend package root is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import all models so Alembic can detect schema changes
from database.models import Base  # noqa: E402
import database.credit_models  # noqa: E402,F401 — registers User, CreditTransaction, CreditPackage
import database.file_models     # noqa: E402,F401 — registers Folder, File

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Override the URL from the environment (always preferred over alembic.ini placeholder)
def _normalize_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

_db_url = _normalize_db_url(os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://research_user:research_pass@localhost:5432/research_pilot",
))
config.set_main_option("sqlalchemy.url", _db_url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode, generating a SQL script."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with asyncpg."""
    cfg = config.get_section(config.config_ini_section, {})

    connectable = async_engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
