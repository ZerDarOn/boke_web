"""
Database connection and session management
"""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import asynccontextmanager

from app.core.config import settings

logger = logging.getLogger("ai-service.db")

# 延迟初始化：引擎在首次使用时创建，避免导入时因 URL 占位/缺少驱动直接崩溃
_engine: Optional[AsyncEngine] = None
_AsyncSessionLocal: Optional[sessionmaker] = None
Base = declarative_base()


def _get_engine() -> AsyncEngine:
    global _engine, _AsyncSessionLocal
    if _engine is not None:
        return _engine

    url = (settings.DATABASE_URL or "").strip()
    if not url or "username:password" in url:
        raise RuntimeError(
            "DATABASE_URL 未配置或仍为占位值，数据库功能不可用。"
            "请在 ai-service/.env 中设置有效的 DATABASE_URL。"
        )

    # 自动补 async 驱动前缀
    if "asyncpg" not in url and "+" not in url.split("://")[0]:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    logger.info("Connecting to database...")
    _engine = create_async_engine(
        url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
    _AsyncSessionLocal = sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    return _engine


@asynccontextmanager
async def get_db():
    """异步数据库上下文，首次调用时自动创建引擎"""
    engine = _get_engine()
    if _AsyncSessionLocal is None:
        raise RuntimeError("Session factory not initialized")
    async with _AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """初始化数据库表（首次调用 _get_engine 时自动创建引擎）"""
    engine = _get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
