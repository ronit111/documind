"""Chat endpoint with SSE streaming."""

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.exceptions import NoDocumentsError
from app.core.logging import get_logger
from app.models.database import Document
from app.models.schemas import ChatRequest, SourceChunk

logger = get_logger(__name__)

router = APIRouter()


def _sse_event(event: str, data: dict) -> str:
    """Format a single SSE event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/chat", summary="Chat with your documents (SSE stream)")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """RAG-powered chat that streams tokens via Server-Sent Events."""
    # Verify at least one ready document exists
    result = await db.execute(
        select(func.count()).where(Document.status == "ready")
    )
    doc_count = result.scalar() or 0
    if doc_count == 0:
        raise NoDocumentsError()

    from app.services.llm import get_llm_client
    from app.services.rag import query as rag_query

    llm_client = get_llm_client()

    async def event_stream():
        try:
            async for event in rag_query(
                question=request.question,
                chat_history=[msg.model_dump() for msg in request.chat_history],
                llm_client=llm_client,
            ):
                if event["type"] == "token":
                    yield _sse_event("token", {"token": event["token"]})
                elif event["type"] == "sources":
                    sources = [
                        SourceChunk(**s).model_dump() for s in event["sources"]
                    ]
                    yield _sse_event("sources", {"sources": sources})

            yield _sse_event("done", {})

        except Exception as e:
            logger.error("chat_stream_error", error=str(e))
            yield _sse_event("error", {"detail": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
