"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/lib/types";
import { getDocument } from "@/lib/api";

interface ProcessingStatusProps {
  status: DocumentStatus;
  documentId: string;
  onStatusChange: (newStatus: DocumentStatus) => void;
}

const statusConfig: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  uploading: {
    label: "Uploading",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  ready: {
    label: "Ready",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

export function ProcessingStatus({
  status,
  documentId,
  onStatusChange,
}: ProcessingStatusProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (status !== "processing" && status !== "uploading") return;

    intervalRef.current = setInterval(async () => {
      try {
        const doc = await getDocument(documentId);
        if (doc.status !== status) {
          onStatusChange(doc.status);
        }
      } catch {
        // Silently retry on next interval
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, documentId, onStatusChange]);

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {(status === "processing" || status === "uploading") && (
        <Loader2 className="size-3 animate-spin" />
      )}
      {config.label}
    </Badge>
  );
}
