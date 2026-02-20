/**
 * TypeScript types matching backend Pydantic schemas.
 * This is the shared API contract between frontend and backend.
 */

// ── Enums ──────────────────────────────────────────────

export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

// ── Document Types ─────────────────────────────────────

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: DocumentStatus;
  created_at: string;
}

export interface DocumentDetail {
  id: string;
  filename: string;
  file_size: number;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentDetail[];
  total: number;
}

export interface DocumentDeleteResponse {
  success: boolean;
  message: string;
}

// ── Chat Types ─────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  chat_history: ChatMessage[];
}

export interface SourceChunk {
  document_id: string;
  document_name: string;
  content: string;
  page_or_section: string | null;
  chunk_index: number;
  relevance_score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
}

// ── SSE Event Types ────────────────────────────────────

export interface SSETokenEvent {
  token: string;
}

export interface SSESourcesEvent {
  sources: SourceChunk[];
}

export interface SSEErrorEvent {
  detail: string;
}

// ── Health Types ───────────────────────────────────────

export interface HealthResponse {
  status: string;
  documents_count: number;
  vector_count: number;
}

// ── Error Types ────────────────────────────────────────

export interface ErrorResponse {
  detail: string;
  status_code: number;
}

// ── UI State Types ─────────────────────────────────────

export interface ChatUIMessage extends ChatMessage {
  id: string;
  sources?: SourceChunk[];
  isStreaming?: boolean;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  documentId?: string;
}
