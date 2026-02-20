"""Dependency injection for FastAPI routes."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_session


async def get_db() -> AsyncSession:
    async for session in get_session():
        yield session
