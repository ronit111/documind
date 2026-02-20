"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "@/lib/types";
import { SourceCard } from "./source-card";
import { StreamingText } from "./streaming-text";

interface ChatMessageProps {
  message: ChatUIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-accent"
        )}
      >
        {isUser ? (
          <User className="size-4 text-primary-foreground" />
        ) : (
          <Bot className="size-4 text-foreground" />
        )}
      </div>

      {/* Message body */}
      <div
        className={cn(
          "max-w-[80%] space-y-3",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <StreamingText
              text={message.content}
              isStreaming={!!message.isStreaming}
            />
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Sources ({message.sources.length})
            </p>
            {message.sources.map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
