"""API integration tests using FastAPI TestClient."""

import pytest
from pathlib import Path

from app.config import settings


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "documents_count" in data
        assert "vector_count" in data


class TestDocumentEndpoints:
    def test_list_documents_empty(self, client):
        response = client.get("/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
        assert "total" in data

    def test_upload_unsupported_file(self, client):
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.exe", b"fake content", "application/octet-stream")},
        )
        assert response.status_code == 400
        assert "Unsupported" in response.json()["detail"]

    def test_upload_oversized_file(self, client):
        # Create content larger than max file size
        huge_content = b"x" * (settings.max_file_size_bytes + 1)
        response = client.post(
            "/api/documents/upload",
            files={"file": ("big.txt", huge_content, "text/plain")},
        )
        assert response.status_code == 413
        assert "exceeds" in response.json()["detail"]

    def test_upload_valid_txt(self, client):
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", b"Hello world content for testing.", "text/plain")},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["filename"] == "test.txt"
        assert data["status"] == "processing"
        assert "id" in data

    def test_upload_valid_md(self, client):
        content = b"# Test Document\n\nThis is test content."
        response = client.post(
            "/api/documents/upload",
            files={"file": ("test.md", content, "text/markdown")},
        )
        assert response.status_code == 201
        assert response.json()["filename"] == "test.md"

    def test_get_nonexistent_document(self, client):
        response = client.get("/api/documents/nonexistent-id-123")
        assert response.status_code == 404

    def test_delete_nonexistent_document(self, client):
        response = client.delete("/api/documents/nonexistent-id-456")
        assert response.status_code == 404


class TestChatEndpoint:
    def test_chat_returns_sse_stream(self, client):
        """Chat endpoint returns SSE stream (may error on LLM call without API key)."""
        response = client.post(
            "/api/chat",
            json={"question": "What is the PTO policy?"},
        )
        # Returns 200 with SSE stream (even if LLM errors, SSE sends the error as an event)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

    def test_chat_empty_question_rejected(self, client):
        response = client.post(
            "/api/chat",
            json={"question": ""},
        )
        assert response.status_code == 422  # Validation error

    def test_chat_question_too_long(self, client):
        response = client.post(
            "/api/chat",
            json={"question": "x" * 2001},
        )
        assert response.status_code == 422

    def test_chat_with_invalid_history_role(self, client):
        response = client.post(
            "/api/chat",
            json={
                "question": "Test?",
                "chat_history": [{"role": "invalid", "content": "test"}],
            },
        )
        assert response.status_code == 422


class TestSchemaValidation:
    def test_upload_requires_file(self, client):
        response = client.post("/api/documents/upload")
        assert response.status_code == 422

    def test_chat_requires_question(self, client):
        response = client.post("/api/chat", json={})
        assert response.status_code == 422
