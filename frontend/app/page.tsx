"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Activity,
  Upload,
  ArrowRight,
  Database,
} from "lucide-react";
import { checkHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your knowledge base
        </p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to connect to the backend: {error}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Make sure the API server is running on port 8000.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <FileText className="size-4" />
                Documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{health!.documents_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Database className="size-4" />
                Knowledge Chunks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{health!.vector_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Activity className="size-4" />
                Status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span
                className={`inline-flex items-center gap-1.5 text-lg font-semibold ${
                  health!.status === "ok"
                    ? "text-emerald-400"
                    : "text-destructive"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    health!.status === "ok"
                      ? "bg-emerald-400"
                      : "bg-destructive"
                  }`}
                />
                {health!.status === "ok" ? "Healthy" : "Error"}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/documents">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="size-4 text-primary" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                Add PDFs, DOCX, TXT, or Markdown files to your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center gap-1 text-sm text-primary">
                Go to Documents <ArrowRight className="size-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/chat">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="size-4 text-primary" />
                Start Chatting
              </CardTitle>
              <CardDescription>
                Ask questions and get answers from your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="inline-flex items-center gap-1 text-sm text-primary">
                Go to Chat <ArrowRight className="size-3.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Getting started guide (show when no documents) */}
      {health && health.documents_count === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              Getting Started
            </CardTitle>
            <CardDescription>
              Set up your knowledge base in three steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium">Upload your documents</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop PDFs, DOCX, TXT, or Markdown files
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium">
                    Wait for processing to complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Documents are chunked and embedded into the vector store
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium">Ask questions</p>
                  <p className="text-xs text-muted-foreground">
                    Chat with your knowledge base and get sourced answers
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
