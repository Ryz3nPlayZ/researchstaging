"""
Database connection and session management.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

_raw_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://research_user:research_pass@localhost:5432/research_pilot")

# Railway (and many PaaS providers) supply postgres:// or postgresql:// URLs.
# SQLAlchemy asyncpg requires the postgresql+asyncpg:// scheme.
def _normalize_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

DATABASE_URL = _normalize_db_url(_raw_url)

# Validate URL is parseable before creating engine — bad URLs on import crash everything.
# If invalid, we use a dummy URL so imports succeed; the server will fail at runtime
# connection attempts which gives a much clearer error message.
_DUMMY_URL = "postgresql+asyncpg://localhost/placeholder"
try:
    from sqlalchemy.engine.url import make_url as _make_url
    _make_url(DATABASE_URL)
    _engine_url = DATABASE_URL
except Exception:
    import sys
    print(f"WARNING: DATABASE_URL could not be parsed: {DATABASE_URL!r}. "
          "Using placeholder — DB connections will fail until a valid URL is set.",
          file=sys.stderr)
    _engine_url = _DUMMY_URL

# Create async engine
engine = create_async_engine(
    _engine_url,
    echo=False,  # Set to True for SQL debugging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@asynccontextmanager
async def get_db_session():
    """Provide a transactional scope around a series of operations."""
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db():
    """Dependency for FastAPI routes."""
    async with get_db_session() as session:
        yield session


async def init_db():
    """Initialize database tables.

    In development: create all tables via SQLAlchemy metadata (fast iteration).
    In production:  rely on `alembic upgrade head` (run before server start).
    """
    environment = os.environ.get("ENVIRONMENT", "development")
    if environment == "development":
        from database.models import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Backward-compatible schema patching for existing dev deployments.
            await conn.execute(
                text("ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS content_latex TEXT")
            )
    # production: Alembic migrations handle schema (railway.toml: alembic upgrade head)


async def close_db():
    """Close database connections."""
    await engine.dispose()
