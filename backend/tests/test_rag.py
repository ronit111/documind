"""Tests for RAG pipeline components."""

import pytest

from app.services.rag import _format_context, _build_messages, SYSTEM_PROMPT
from app.config import settings


class TestFormatContext:
    """Test context formatting for LLM prompts."""

    def test_empty_sources(self):
        result = _format_context([])
        assert "No relevant documents" in result

    def test_single_source(self):
        sources = [{
            "document_name": "handbook.md",
            "page_or_section": "Benefits",
            "content": "We offer health insurance.",
            "document_id": "abc",
            "chunk_index": 0,
            "relevance_score": 0.85,
        }]
        result = _format_context(sources)
        assert "handbook.md" in result
        assert "Benefits" in result
        assert "health insurance" in result
        assert "[1]" in result

    def test_multiple_sources_numbered(self):
        sources = [
            {
                "document_name": "doc1.md",
                "page_or_section": None,
                "content": "Content one.",
                "document_id": "a",
                "chunk_index": 0,
                "relevance_score": 0.9,
            },
            {
                "document_name": "doc2.md",
                "page_or_section": "Intro",
                "content": "Content two.",
                "document_id": "b",
                "chunk_index": 1,
                "relevance_score": 0.8,
            },
        ]
        result = _format_context(sources)
        assert "[1]" in result
        assert "[2]" in result
        assert "doc1.md" in result
        assert "doc2.md" in result

    def test_section_omitted_when_none(self):
        sources = [{
            "document_name": "test.md",
            "page_or_section": None,
            "content": "Some content.",
            "document_id": "x",
            "chunk_index": 0,
            "relevance_score": 0.7,
        }]
        result = _format_context(sources)
        assert "Section" not in result


class TestBuildMessages:
    """Test message list construction for LLM."""

    def test_question_only(self):
        messages = _build_messages("Some context", [], "What is PTO?")
        assert len(messages) == 1
        assert messages[0]["role"] == "user"
        assert "What is PTO?" in messages[0]["content"]
        assert "Some context" in messages[0]["content"]

    def test_with_chat_history(self):
        history = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"},
        ]
        messages = _build_messages("Context", history, "Follow up?")
        assert len(messages) == 3
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "Hi"
        assert messages[1]["role"] == "assistant"
        assert messages[-1]["role"] == "user"
        assert "Follow up?" in messages[-1]["content"]

    def test_history_limit_respected(self):
        # Create history longer than max_chat_history * 2
        history = []
        for i in range(20):
            history.append({"role": "user", "content": f"Message {i}"})
            history.append({"role": "assistant", "content": f"Reply {i}"})

        messages = _build_messages("Context", history, "Final question?")
        # Should have at most max_chat_history*2 history messages + 1 current
        max_history_messages = settings.max_chat_history * 2
        assert len(messages) <= max_history_messages + 1

    def test_context_in_final_message(self):
        messages = _build_messages("Important context here", [], "Question?")
        final = messages[-1]["content"]
        assert "Important context here" in final
        assert "Question?" in final


class TestSystemPrompt:
    """Verify system prompt quality."""

    def test_system_prompt_has_grounding_instruction(self):
        assert "ONLY" in SYSTEM_PROMPT or "only" in SYSTEM_PROMPT.lower()

    def test_system_prompt_has_citation_instruction(self):
        assert "document" in SYSTEM_PROMPT.lower()

    def test_system_prompt_has_fallback_instruction(self):
        assert "don't have enough" in SYSTEM_PROMPT.lower() or "not enough" in SYSTEM_PROMPT.lower()
