"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocument } from "@/lib/api";
import type { UploadProgress } from "@/lib/types";
import { formatFileSize } from "@/lib/helpers";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_SIZE) {
      return `File too large (${formatFileSize(file.size)}). Maximum: 10 MB`;
    }
    return null;
  };

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newUploads: UploadProgress[] = fileArray.map((file) => {
        const error = validateFile(file);
        return {
          file,
          progress: 0,
          status: error ? "error" : "pending",
          error: error ?? undefined,
        };
      });

      setUploads((prev) => [...prev, ...newUploads]);

      newUploads.forEach((upload, idx) => {
        if (upload.status === "error") return;

        const globalIdx =
          uploads.length + idx; // index in the full list at time of call

        setUploads((prev) => {
          const next = [...prev];
          const target = next[globalIdx];
          if (target) {
            next[globalIdx] = { ...target, status: "uploading" };
          }
          return next;
        });

        uploadDocument(upload.file, (pct) => {
          setUploads((prev) => {
            const next = [...prev];
            const target = next[globalIdx];
            if (target) {
              next[globalIdx] = { ...target, progress: pct };
            }
            return next;
          });
        })
          .then((res) => {
            setUploads((prev) => {
              const next = [...prev];
              const target = next[globalIdx];
              if (target) {
                next[globalIdx] = {
                  ...target,
                  status: "done",
                  progress: 100,
                  documentId: res.id,
                };
              }
              return next;
            });
            onUploadComplete();
          })
          .catch((err) => {
            setUploads((prev) => {
              const next = [...prev];
              const target = next[globalIdx];
              if (target) {
                next[globalIdx] = {
                  ...target,
                  status: "error",
                  error: err.message,
                };
              }
              return next;
            });
          });
      });
    },
    [uploads.length, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        <Upload
          className={cn(
            "size-8",
            dragOver ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD up to 10 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <FileUp className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{u.file.name}</p>
                {u.status === "uploading" && (
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
                {u.status === "error" && (
                  <p className="mt-0.5 text-xs text-destructive">{u.error}</p>
                )}
              </div>
              {u.status === "done" && (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              )}
              {u.status === "error" && (
                <AlertCircle className="size-4 shrink-0 text-destructive" />
              )}
              {u.status === "uploading" && (
                <span className="text-xs text-muted-foreground">
                  {u.progress}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
