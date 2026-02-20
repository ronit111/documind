"""DocuMind — AI Knowledge Base Assistant API."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.logging import get_logger, setup_logging
from app.models.database import init_db
from app.models.schemas import ErrorResponse

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    await init_db()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    # Load sample documents if configured
    if settings.load_sample_docs and settings.sample_docs_dir.exists():
        try:
            from app.services.document_processor import load_sample_documents

            await load_sample_documents()
            logger.info("sample_docs_loaded")
        except Exception as e:
            logger.warning("sample_docs_load_failed", error=str(e))

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


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    body = ErrorResponse(detail="An unexpected error occurred", status_code=500)
    return JSONResponse(status_code=500, content=body.model_dump())


# Import and include routers
from app.api.routes import chat, documents, health  # noqa: E402

app.include_router(health.router, prefix=settings.api_prefix, tags=["Health"])
app.include_router(documents.router, prefix=settings.api_prefix, tags=["Documents"])
app.include_router(chat.router, prefix=settings.api_prefix, tags=["Chat"])
