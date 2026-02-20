"""Tests for document processing pipeline."""

import pytest

from app.services.document_processor import chunk_text, parse_document
from pathlib import Path


class TestChunkText:
    """Test the recursive text chunking algorithm."""

    def test_short_text_single_chunk(self):
        text = "This is a short paragraph."
        chunks = chunk_text(text, chunk_size=100, overlap=10)
        assert len(chunks) == 1
        assert chunks[0]["text"] == text
        assert chunks[0]["chunk_index"] == 0

    def test_multiple_paragraphs_split(self):
        text = "First paragraph with enough content to matter.\n\nSecond paragraph also with content.\n\nThird paragraph here."
        chunks = chunk_text(text, chunk_size=20, overlap=5)
        assert len(chunks) > 1
        # Each chunk should have sequential indices
        for i, chunk in enumerate(chunks):
            assert chunk["chunk_index"] == i

    def test_heading_detection(self):
        text = "# Introduction\n\nThis is the intro content.\n\n## Methods\n\nThis is the methods section."
        chunks = chunk_text(text, chunk_size=200, overlap=10)
        # Should detect markdown headings as sections
        found_sections = [c["page_or_section"] for c in chunks if c["page_or_section"]]
        assert any("Introduction" in s or "Methods" in s for s in found_sections)

    def test_page_marker_detection(self):
        text = "[Page 1]\nContent on page one.\n\n[Page 2]\nContent on page two."
        chunks = chunk_text(text, chunk_size=200, overlap=10)
        sections = [c["page_or_section"] for c in chunks if c["page_or_section"]]
        assert any("Page" in s for s in sections)

    def test_empty_text(self):
        chunks = chunk_text("", chunk_size=100, overlap=10)
        assert chunks == []

    def test_whitespace_only(self):
        chunks = chunk_text("   \n\n   ", chunk_size=100, overlap=10)
        assert chunks == []

    def test_chunk_overlap_present(self):
        # Create text that will definitely split into multiple chunks
        paragraphs = [f"Paragraph {i} with some meaningful content that takes space." for i in range(20)]
        text = "\n\n".join(paragraphs)
        chunks = chunk_text(text, chunk_size=30, overlap=10)
        assert len(chunks) > 1
        # Verify chunks have content (overlap means some text may repeat)
        for chunk in chunks:
            assert len(chunk["text"]) > 0

    def test_long_single_paragraph_splits(self):
        # A single paragraph that's very long should still get split
        text = "word " * 1000  # ~5000 chars, way over a 50-token limit
        chunks = chunk_text(text, chunk_size=50, overlap=10)
        assert len(chunks) > 1

    def test_chunk_dict_structure(self):
        text = "Some content here.\n\n## Section\n\nMore content."
        chunks = chunk_text(text, chunk_size=200, overlap=10)
        for chunk in chunks:
            assert "text" in chunk
            assert "chunk_index" in chunk
            assert "page_or_section" in chunk
            assert isinstance(chunk["text"], str)
            assert isinstance(chunk["chunk_index"], int)


class TestParseDocument:
    """Test document parsing for different file types."""

    def test_parse_markdown(self, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_text("# Hello\n\nThis is markdown content.")
        result = parse_document(md_file)
        assert "Hello" in result
        assert "markdown content" in result

    def test_parse_txt(self, tmp_path):
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("Plain text content here.")
        result = parse_document(txt_file)
        assert result == "Plain text content here."

    def test_unsupported_extension(self, tmp_path):
        bad_file = tmp_path / "test.xyz"
        bad_file.write_text("content")
        with pytest.raises(ValueError, match="Unsupported"):
            parse_document(bad_file)

    def test_parse_sample_docs(self):
        """Verify all sample docs can be parsed."""
        sample_dir = Path(__file__).parent.parent / "sample_docs"
        if not sample_dir.exists():
            pytest.skip("Sample docs not found")

        for doc_path in sample_dir.glob("*"):
            if doc_path.suffix in (".md", ".txt"):
                text = parse_document(doc_path)
                assert len(text) > 100, f"{doc_path.name} parsed to less than 100 chars"

    def test_sample_docs_chunk_well(self):
        """Verify sample docs produce reasonable chunk counts."""
        sample_dir = Path(__file__).parent.parent / "sample_docs"
        if not sample_dir.exists():
            pytest.skip("Sample docs not found")

        for doc_path in sample_dir.glob("*.md"):
            text = parse_document(doc_path)
            chunks = chunk_text(text, chunk_size=500, overlap=50)
            assert len(chunks) >= 2, f"{doc_path.name} produced too few chunks: {len(chunks)}"
            assert len(chunks) <= 100, f"{doc_path.name} produced too many chunks: {len(chunks)}"
