"""DocuMind — AI Knowledge Base Assistant API."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.logging import setup_logging
from app.models.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_db()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    # Routes are imported and included below — services initialize lazily
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered knowledge base assistant. Upload documents, ask questions, get cited answers.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.routes import chat, documents, health  # noqa: E402

app.include_router(health.router, prefix=settings.api_prefix, tags=["Health"])
app.include_router(documents.router, prefix=settings.api_prefix, tags=["Documents"])
app.include_router(chat.router, prefix=settings.api_prefix, tags=["Chat"])
