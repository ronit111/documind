"use client";

import { useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }, [onSend, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 4 * 24; // ~4 lines
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Ask a question about your documents..."
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        style={{ maxHeight: `${4 * 24}px` }}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled}
        aria-label="Send message"
        className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
