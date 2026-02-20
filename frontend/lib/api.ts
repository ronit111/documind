/**
 * Typed API client for DocuMind backend.
 * Handles REST calls, file uploads, and SSE streaming.
 */

import type {
  ChatRequest,
  DocumentDeleteResponse,
  DocumentDetail,
  DocumentListResponse,
  DocumentUploadResponse,
  HealthResponse,
  SourceChunk,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || "Request failed");
  }
  return res.json();
}

// ── Documents ──────────────────────────────────────────

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<DocumentUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/documents/upload`);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const body = JSON.parse(xhr.responseText);
        reject(new ApiError(xhr.status, body.detail || "Upload failed"));
      }
    });

    xhr.addEventListener("error", () => reject(new ApiError(0, "Network error")));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return fetchJson("/documents");
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  return fetchJson(`/documents/${id}`);
}

export async function deleteDocument(id: string): Promise<DocumentDeleteResponse> {
  return fetchJson(`/documents/${id}`, { method: "DELETE" });
}

// ── Chat (SSE Streaming) ──────────────────────────────

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources: (sources: SourceChunk[]) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamChat(
  request: ChatRequest,
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    callbacks.onError(body.detail || "Chat request failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          switch (eventType) {
            case "token":
              callbacks.onToken(parsed.token);
              break;
            case "sources":
              callbacks.onSources(parsed.sources);
              break;
            case "done":
              callbacks.onDone();
              break;
            case "error":
              callbacks.onError(parsed.detail);
              break;
          }
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}

// ── Health ─────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  return fetchJson("/health");
}

export { ApiError };
