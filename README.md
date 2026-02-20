# DocuMind

**AI-powered knowledge base assistant.** Upload documents, ask questions, get cited answers.

> Built as a portfolio demo — a production-grade full-stack application showing end-to-end AI product development.

## What It Does

- **Upload documents** (PDF, DOCX, TXT, Markdown) via drag-and-drop
- **Ask questions** in natural language and get streaming answers grounded in your documents
- **See source citations** with relevance scores and expandable content previews
- **Manage your knowledge base** — view processing status, delete documents, monitor system health

## Architecture

```
┌─────────────────────────────┐
│     Next.js Frontend        │
│  (TypeScript + Tailwind +   │
│   shadcn/ui, dark theme)    │
│                             │
│  /            Dashboard     │
│  /chat        Chat UI       │
│  /documents   Doc Manager   │
└──────────┬──────────────────┘
           │ REST + SSE
┌──────────▼──────────────────┐
│     FastAPI Backend         │
│                             │
│  /api/documents  CRUD       │
│  /api/chat       RAG + SSE  │
│  /api/health     Status     │
│                             │
│  Processing Pipeline:       │
│  upload → parse → chunk →   │
│  embed → index              │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│  ChromaDB    │  SQLite      │
│  (vectors)   │  (metadata)  │
└─────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14 + TypeScript + Tailwind + shadcn/ui | Production React with polished component library |
| **Backend** | FastAPI (Python 3.12) | Async, type-safe, auto-generated API docs |
| **Vector DB** | ChromaDB | Zero-infra persistent vector search with built-in embeddings |
| **Metadata DB** | SQLite (async via SQLAlchemy) | Lightweight, zero-config document tracking |
| **LLM** | Groq (Llama 3.3 70B) / OpenAI | Groq: free + fast. OpenAI: optional higher quality |
| **Embeddings** | all-MiniLM-L6-v2 (ONNX) | Runs locally via ChromaDB, no API key needed |
| **Streaming** | Server-Sent Events | Industry standard for LLM output streaming |

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env and add your Groq API key (free at console.groq.com)
docker-compose up
```

Open http://localhost:3000

### Local Development

**Backend:**
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env  # Add your Groq API key
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — API docs at http://localhost:8000/docs

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/documents/upload` | Upload a document (multipart/form-data) |
| `GET` | `/api/documents` | List all documents with status |
| `GET` | `/api/documents/{id}` | Get document details |
| `DELETE` | `/api/documents/{id}` | Delete document and vectors |
| `POST` | `/api/chat` | Chat with SSE streaming response |
| `GET` | `/api/health` | System health check |

Interactive Swagger docs available at `/docs` when the backend is running.

## Project Structure

```
documind/
├── frontend/                    # Next.js application
│   ├── app/                     # Pages (dashboard, chat, documents)
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui base components
│   │   ├── chat/                # Chat UI (messages, input, sources, streaming)
│   │   ├── documents/           # Document management (upload, list, status)
│   │   └── layout/              # Sidebar navigation
│   └── lib/                     # API client, types, utilities
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── api/routes/          # REST endpoints
│   │   ├── models/              # Database + Pydantic schemas
│   │   ├── services/            # Business logic
│   │   │   ├── document_processor.py  # Parse → chunk → embed pipeline
│   │   │   ├── vector_store.py        # ChromaDB operations
│   │   │   ├── rag.py                 # Retrieval + generation
│   │   │   └── llm.py                 # Multi-provider LLM factory
│   │   └── core/                # Exceptions, logging
│   ├── sample_docs/             # Pre-loaded demo documents
│   └── tests/
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── Makefile
```

## Design Decisions

**Separate frontend/backend** — Demonstrates real service architecture vs a Streamlit wrapper. The API contract (Pydantic schemas mirrored as TypeScript types) enables independent development and testing.

**ChromaDB with built-in embeddings** — Zero external dependencies for vector search. The ONNX runtime runs all-MiniLM-L6-v2 locally, keeping the project free to run with no API keys for embeddings.

**SSE over WebSockets** — For unidirectional LLM streaming, SSE is simpler and has native browser support via `fetch()` + `ReadableStream`. WebSockets would be overkill here.

**LLM provider factory** — Abstracts Groq/OpenAI behind a common interface. Adding a new provider means implementing one class with `stream_chat()`. The factory reads from config at runtime.

**Background document processing** — Uploads return immediately with status "processing". The parse → chunk → embed pipeline runs as a FastAPI background task, with status polling on the frontend.

## Sample Documents

Ships with 4 fictional "Nexus Labs" company documents for immediate demo:
- Employee Handbook (HR policies, benefits, PTO)
- Product Guide (NexusFlow features, pricing, API)
- Engineering Onboarding (dev setup, code review, deployment)
- Security Policy (data classification, access control, incident response)

## Built By

**Ronit Chidara** — AI Implementation & Workflow Automation
