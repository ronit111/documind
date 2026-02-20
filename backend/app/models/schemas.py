"""
API Contract — Pydantic schemas for all request/response types.
The frontend TypeScript types mirror these definitions exactly.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────

class DocumentStatus(str, Enum):
    uploading = "uploading"
    processing = "processing"
    ready = "ready"
    failed = "failed"


# ── Document Schemas ───────────────────────────────────

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: DocumentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetail(BaseModel):
    id: str
    filename: str
    file_size: int
    status: DocumentStatus
    chunk_count: int
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentDetail]
    total: int


class DocumentDeleteResponse(BaseModel):
    success: bool
    message: str


# ── Chat Schemas ───────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    chat_history: list[ChatMessage] = Field(default_factory=list)


class SourceChunk(BaseModel):
    document_id: str
    document_name: str
    content: str
    page_or_section: str | None = None
    chunk_index: int
    relevance_score: float


class ChatResponse(BaseModel):
    """Non-streaming response (for reference — actual chat uses SSE)."""
    answer: str
    sources: list[SourceChunk]


# ── SSE Event Types ────────────────────────────────────
# These define the Server-Sent Event format:
#   event: token     → data: {"token": "word"}
#   event: sources   → data: {"sources": [...SourceChunk]}
#   event: done      → data: {}
#   event: error     → data: {"detail": "error message"}


class SSETokenEvent(BaseModel):
    token: str


class SSESourcesEvent(BaseModel):
    sources: list[SourceChunk]


class SSEErrorEvent(BaseModel):
    detail: str


# ── Health Schema ──────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    documents_count: int
    vector_count: int


# ── Error Schema ───────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str
    status_code: int = 500
