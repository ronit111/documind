"use client";

import { useState } from "react";
import { Trash2, FileText } from "lucide-react";
import { deleteDocument } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { formatFileSize, formatRelativeTime } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ProcessingStatus } from "./processing-status";

interface DocumentListProps {
  documents: DocumentDetail[];
  loading: boolean;
  onRefresh: () => void;
}

export function DocumentList({
  documents,
  loading,
  onRefresh,
}: DocumentListProps) {
  const [deleteTarget, setDeleteTarget] = useState<DocumentDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.id);
      onRefresh();
    } catch {
      // Error handling could be extended here
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 py-4">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <FileText className="size-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{doc.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(doc.file_size)}
                  {doc.chunk_count > 0 && (
                    <> &middot; {doc.chunk_count} chunks</>
                  )}
                  {" "}&middot; {formatRelativeTime(doc.created_at)}
                </p>
              </div>
              <ProcessingStatus
                status={doc.status}
                documentId={doc.id}
                onStatusChange={() => onRefresh()}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(doc)}
                aria-label={`Delete ${doc.filename}`}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.filename}
              </span>
              ? This will remove it and all associated chunks from the knowledge
              base. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
