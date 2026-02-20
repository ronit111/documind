"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SourceChunk } from "@/lib/types";

interface SourceCardProps {
  source: SourceChunk;
}

export function SourceCard({ source }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const score = Math.round(source.relevance_score * 100);
  const preview =
    source.content.length > 200
      ? source.content.slice(0, 200) + "..."
      : source.content;

  return (
    <Card
      className="cursor-pointer gap-0 border-border/60 py-0 transition-colors hover:border-border"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 p-3">
        <FileText className="mt-0.5 size-4 shrink-0 text-indigo-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-medium">
              {source.document_name}
            </p>
            <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
              {score}% match
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {expanded ? source.content : preview}
          </p>
        </div>
        {source.content.length > 200 && (
          <div className="shrink-0 pt-0.5">
            {expanded ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
