from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_prefix": "DOCUMIND_", "env_file": ".env"}

    # App
    app_name: str = "DocuMind"
    debug: bool = False
    api_prefix: str = "/api"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Storage
    upload_dir: Path = Path("./data/uploads")
    chroma_dir: Path = Path("./data/chroma")
    sqlite_url: str = "sqlite+aiosqlite:///./data/documind.db"

    # Document processing
    max_file_size_mb: int = 10
    chunk_size: int = 500
    chunk_overlap: int = 50
    supported_extensions: list[str] = [".pdf", ".docx", ".txt", ".md"]

    # LLM
    llm_provider: str = "groq"  # "groq" or "openai"
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # RAG
    retrieval_top_k: int = 5
    max_chat_history: int = 5

    # ChromaDB
    chroma_collection: str = "documind_docs"

    # Sample docs
    sample_docs_dir: Path = Path("./sample_docs")
    load_sample_docs: bool = True

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()
