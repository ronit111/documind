"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare, Upload, Sparkles } from "lucide-react";
import { streamChat, checkHealth } from "@/lib/api";
import type { ChatUIMessage, SourceChunk } from "@/lib/types";
import { generateId } from "@/lib/helpers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "What is the PTO policy at Nexus Labs?",
  "How do I set up my development environment?",
  "What are the different NexusFlow pricing tiers?",
  "Describe the incident response process",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatUIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasDocuments, setHasDocuments] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if there are documents
  useEffect(() => {
    checkHealth()
      .then((h) => setHasDocuments(h.documents_count > 0))
      .catch(() => setHasDocuments(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    (question: string) => {
      if (isStreaming) return;

      const userMessage: ChatUIMessage = {
        id: generateId(),
        role: "user",
        content: question,
      };

      const assistantMessage: ChatUIMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      // Build chat history (exclude the current exchange)
      const chatHistory = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));

      streamChat(
        { question, chat_history: chatHistory },
        {
          onToken: (token: string) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: last.content + token,
                };
              }
              return next;
            });
          },
          onSources: (sources: SourceChunk[]) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = { ...last, sources };
              }
              return next;
            });
          },
          onDone: () => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = { ...last, isStreaming: false };
              }
              return next;
            });
            setIsStreaming(false);
          },
          onError: (error: string) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: `Error: ${error}`,
                  isStreaming: false,
                };
              }
              return next;
            });
            setIsStreaming(false);
          },
        }
      );
    },
    [isStreaming, messages]
  );

  // Empty state: no documents
  if (hasDocuments === false) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col items-center justify-center gap-4 text-center md:h-[calc(100vh-3rem)]">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="size-7 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-xl">
            Upload documents to get started
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add documents to your knowledge base, then come back to chat.
          </p>
        </div>
        <Link href="/documents">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Go to Documents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col md:h-[calc(100vh-3rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="space-y-6 pb-4 pt-2">
            {messages.length === 0 ? (
              /* Empty state: has docs, no messages */
              <div className="flex h-full flex-col items-center justify-center gap-6 pt-24 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="size-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl">
                    Ask anything about your documents
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get answers grounded in your knowledge base
                  </p>
                </div>
                <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary/30 hover:bg-accent"
                    >
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input bar */}
      <div className="shrink-0 pt-4">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
