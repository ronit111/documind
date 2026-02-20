"""Document CRUD endpoints."""

import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.config import settings
from app.core.exceptions import DocumentNotFoundError, FileTooLargeError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.models.database import Document, async_session
from app.models.schemas import (
    DocumentDeleteResponse,
    DocumentDetail,
    DocumentListResponse,
    DocumentUploadResponse,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/documents")


async def _run_processing(document_id: str, file_path: str):
    """Background task: process a document with its own DB session."""
    async with async_session() as db:
        try:
            from app.services.document_processor import process_document

            await process_document(document_id, file_path, db)
        except Exception as e:
            logger.error("background_processing_failed", document_id=document_id, error=str(e))
            result = await db.execute(select(Document).where(Document.id == document_id))
            doc = result.scalar_one_or_none()
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)
                await db.commit()


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=201,
    summary="Upload a document",
)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Upload a file for processing into the knowledge base."""
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()

    if ext not in settings.supported_extensions:
        raise UnsupportedFileTypeError(filename, settings.supported_extensions)

    # Read file content and check size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise FileTooLargeError(settings.max_file_size_mb)

    document_id = str(uuid.uuid4())
    save_filename = f"{document_id}_{filename}"
    file_path = settings.upload_dir / save_filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)

    doc = Document(
        id=document_id,
        filename=filename,
        file_size=len(content),
        status="processing",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    logger.info("document_uploaded", document_id=document_id, filename=filename, size=len(content))

    background_tasks.add_task(_run_processing, document_id, str(file_path))

    return DocumentUploadResponse.model_validate(doc)


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all documents",
)
async def list_documents(db: AsyncSession = Depends(get_db)):
    """Return all documents ordered by creation date descending."""
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    documents = result.scalars().all()
    return DocumentListResponse(
        documents=[DocumentDetail.model_validate(d) for d in documents],
        total=len(documents),
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetail,
    summary="Get document details",
)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single document by ID."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise DocumentNotFoundError(document_id)
    return DocumentDetail.model_validate(doc)


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document",
)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a document, its vectors, and its file from disk."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise DocumentNotFoundError(document_id)

    # Delete vectors from ChromaDB
    try:
        from app.services.vector_store import vector_store

        vector_store.delete_by_document(document_id)
    except Exception as e:
        logger.warning("vector_delete_failed", document_id=document_id, error=str(e))

    # Delete file from disk
    for file_path in settings.upload_dir.glob(f"{document_id}_*"):
        try:
            file_path.unlink()
        except OSError as e:
            logger.warning("file_delete_failed", path=str(file_path), error=str(e))

    await db.delete(doc)
    await db.commit()

    logger.info("document_deleted", document_id=document_id)
    return DocumentDeleteResponse(success=True, message=f"Document '{doc.filename}' deleted")
