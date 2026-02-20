"""Retrieval-Augmented Generation — query pipeline."""

from collections.abc import AsyncGenerator

from app.config import settings
from app.core.logging import get_logger
from app.models.schemas import SourceChunk
from app.services.vector_store import vector_store

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are DocuMind, a knowledgeable AI assistant for answering questions about company documents.

Rules:
- Answer questions based ONLY on the provided context documents
- If the context doesn't contain enough information to answer, say "I don't have enough information in the uploaded documents to answer this question."
- Always reference which document(s) your answer comes from
- Be concise and direct
- If multiple documents are relevant, synthesize information from all of them"""


async def query(
    question: str,
    chat_history: list[dict],
    llm_client,
) -> AsyncGenerator[dict, None]:
    """RAG query pipeline. Yields dicts:
    - {"type": "token", "token": str}    for each streamed token
    - {"type": "sources", "sources": list[dict]}  at the end
    """
    logger.info("rag_query_started", question=question[:100])

    # 1. Retrieve relevant chunks from vector store
    raw_sources = vector_store.search(question)
    logger.info("retrieval_complete", source_count=len(raw_sources))

    # 2. Build context and messages
    context = _format_context(raw_sources)
    messages = _build_messages(context, chat_history, question)

    # 3. Stream LLM response
    async for token in llm_client.stream_chat(messages, SYSTEM_PROMPT):
        yield {"type": "token", "token": token}

    # 4. Yield sources at the end
    source_chunks = [
        SourceChunk(**s).model_dump() for s in raw_sources
    ]
    yield {"type": "sources", "sources": source_chunks}

    logger.info("rag_query_complete")


def _format_context(sources: list[dict]) -> str:
    """Format retrieved chunks as numbered context sections."""
    if not sources:
        return "No relevant documents found."

    parts = []
    for i, src in enumerate(sources, start=1):
        header = f"[{i}] Document: {src['document_name']}"
        if src.get("page_or_section"):
            header += f" | Section: {src['page_or_section']}"
        parts.append(f"{header}\n{src['content']}")

    return "\n\n---\n\n".join(parts)


def _build_messages(
    context: str,
    chat_history: list[dict],
    question: str,
) -> list[dict]:
    """Build the message list for the LLM, including context and chat history."""
    messages = []

    # Include recent chat history (within the configured limit)
    history_limit = settings.max_chat_history * 2  # each exchange is 2 messages
    recent_history = chat_history[-history_limit:] if chat_history else []
    for msg in recent_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Current question with context
    user_message = (
        f"Context documents:\n\n{context}\n\n---\n\n"
        f"Question: {question}"
    )
    messages.append({"role": "user", "content": user_message})

    return messages
