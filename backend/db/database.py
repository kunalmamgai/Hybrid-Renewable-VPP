"""Database initialization and session management (async SQLAlchemy)."""
import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.config import settings
from backend.models.base import Base

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


async def _tables_exist() -> bool:
    """Check whether any application tables are present in the database."""
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1")
        )
        return result.scalar() is not None


async def init_db():
    """Prepare the database.

    - PostgreSQL/production: schema is owned by Alembic migrations.
      Run `alembic upgrade head` before starting the server. This only
      verifies connectivity and that tables exist.
    - SQLite/dev: creates tables automatically for zero-config development.
    """
    if _is_sqlite(settings.database_url):
        # Import every model module so its tables register on the shared Base.metadata
        from backend.models import (  # noqa: F401
            config,
            decision_log,
            digital_twin,
            user,
        )

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with engine.connect() as conn:
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            await conn.commit()
            logger.info("SQLite WAL mode enabled.")

        logger.info("Database initialized (dev auto-create).")
        return

    # Production path (PostgreSQL): never create_all — migrations own the schema.
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    if settings.is_production and not await _tables_exist():
        raise RuntimeError(
            "Database has no tables. Run `alembic upgrade head` before starting "
            "the server in production."
        )
    logger.info("Database connectivity verified (schema managed by Alembic).")
