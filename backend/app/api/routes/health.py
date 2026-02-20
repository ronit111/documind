"""Health check endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.database import Document
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Returns system status including document and vector counts."""
    result = await db.execute(
        select(func.count()).where(Document.status == "ready")
    )
    doc_count = result.scalar() or 0

    # Vector count retrieved from ChromaDB — implemented by RAG specialist
    vector_count = 0
    try:
        from app.services.vector_store import vector_store
        vector_count = vector_store.count()
    except Exception:
        pass

    return HealthResponse(
        status="ok",
        documents_count=doc_count,
        vector_count=vector_count,
    )
