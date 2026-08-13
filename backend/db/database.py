"""Database initialization and session management (async SQLAlchemy)."""
import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.config import settings
from backend.models.config import Base as ConfigBase
from backend.models.decision_log import Base as LogBase
from backend.models.digital_twin import Base as TwinBase
from backend.models.user import Base as UserBase

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Create all tables and enable WAL mode for SQLite."""
    for base in [TwinBase, LogBase, ConfigBase, UserBase]:
        async with engine.begin() as conn:
            await conn.run_sync(base.metadata.create_all)

    if "sqlite" in settings.database_url:
        async with engine.connect() as conn:
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            await conn.commit()
            logger.info("SQLite WAL mode enabled.")

    logger.info("Database initialized.")
