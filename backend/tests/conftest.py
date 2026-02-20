"""Shared test fixtures — isolated in-memory DB, no sample doc loading."""

import os

# Disable sample doc loading and use in-memory SQLite before any app imports
os.environ["DOCUMIND_LOAD_SAMPLE_DOCS"] = "false"
os.environ["DOCUMIND_SQLITE_URL"] = "sqlite+aiosqlite://"  # in-memory

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path):
    """TestClient with an isolated in-memory DB and temp upload dir."""
    # Ensure upload dir exists for tests that upload files
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    os.environ["DOCUMIND_UPLOAD_DIR"] = str(upload_dir)

    with TestClient(app) as c:
        yield c
