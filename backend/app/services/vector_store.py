"""ChromaDB vector store — singleton service for document chunk storage and retrieval."""

import chromadb

from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class VectorStoreService:
    """Manages a single ChromaDB collection for document chunks."""

    def __init__(self):
        self._client = chromadb.PersistentClient(path=str(settings.chroma_dir))
        self._collection = self._client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "vector_store_initialized",
            collection=settings.chroma_collection,
            count=self._collection.count(),
        )

    def add_chunks(self, document_id: str, filename: str, chunks: list[dict]) -> int:
        """Add document chunks to the collection.

        Each chunk dict must have: text, chunk_index, page_or_section.
        Returns the number of chunks added.
        """
        if not chunks:
            return 0

        ids = [f"{document_id}_chunk_{c['chunk_index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "filename": filename,
                "chunk_index": c["chunk_index"],
                "page_or_section": c.get("page_or_section") or "",
            }
            for c in chunks
        ]

        self._collection.add(ids=ids, documents=documents, metadatas=metadatas)
        logger.info(
            "chunks_added",
            document_id=document_id,
            filename=filename,
            count=len(chunks),
        )
        return len(chunks)

    def search(self, query: str, top_k: int | None = None) -> list[dict]:
        """Search for chunks relevant to the query.

        Returns a list of dicts matching SourceChunk fields:
        document_id, document_name, content, page_or_section, chunk_index, relevance_score.
        """
        k = top_k or settings.retrieval_top_k

        # If collection is empty, return nothing
        if self._collection.count() == 0:
            return []

        # Don't request more results than exist
        k = min(k, self._collection.count())

        results = self._collection.query(query_texts=[query], n_results=k)

        sources = []
        for i in range(len(results["ids"][0])):
            distance = results["distances"][0][i]
            # Cosine distance → relevance score (ChromaDB returns distance, not similarity)
            relevance = 1.0 - distance

            meta = results["metadatas"][0][i]
            sources.append(
                {
                    "document_id": meta["document_id"],
                    "document_name": meta["filename"],
                    "content": results["documents"][0][i],
                    "page_or_section": meta.get("page_or_section") or None,
                    "chunk_index": meta["chunk_index"],
                    "relevance_score": round(relevance, 4),
                }
            )

        return sources

    def delete_by_document(self, document_id: str):
        """Delete all chunks belonging to a document."""
        self._collection.delete(where={"document_id": document_id})
        logger.info("chunks_deleted", document_id=document_id)

    def count(self) -> int:
        """Return total number of chunks in the collection."""
        return self._collection.count()


# Module-level singleton
vector_store = VectorStoreService()
