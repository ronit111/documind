"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { listDocuments } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentList } from "@/components/documents/document-list";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await listDocuments();
      setDocuments(res.documents);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const isEmpty = !loading && documents.length === 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your knowledge base documents
        </p>
      </div>

      {/* Upload zone - always visible, more prominent when empty */}
      {isEmpty ? (
        <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed border-border p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="size-7 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl">No documents yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload documents to build your knowledge base. Supported formats:
              PDF, DOCX, TXT, Markdown.
            </p>
          </div>
          <div className="w-full max-w-lg">
            <UploadZone onUploadComplete={fetchDocuments} />
          </div>
        </div>
      ) : (
        <>
          <UploadZone onUploadComplete={fetchDocuments} />
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {documents.length} document{documents.length !== 1 && "s"}
            </h2>
            <DocumentList
              documents={documents}
              loading={loading}
              onRefresh={fetchDocuments}
            />
          </div>
        </>
      )}

      {/* Show skeleton list while loading */}
      {loading && (
        <DocumentList documents={[]} loading={true} onRefresh={fetchDocuments} />
      )}
    </div>
  );
}
