"use client";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  // Simple markdown-like rendering: bold (**text**), inline code (`code`), bullet lists
  const renderContent = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, i) => {
      // Bullet points
      if (line.match(/^\s*[-*]\s+/)) {
        const content = line.replace(/^\s*[-*]\s+/, "");
        return (
          <li key={i} className="ml-4 list-disc">
            {renderInline(content)}
          </li>
        );
      }
      // Numbered list
      if (line.match(/^\s*\d+\.\s+/)) {
        const content = line.replace(/^\s*\d+\.\s+/, "");
        return (
          <li key={i} className="ml-4 list-decimal">
            {renderInline(content)}
          </li>
        );
      }
      // Empty line
      if (line.trim() === "") {
        return <br key={i} />;
      }
      return (
        <p key={i} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderInline = (text: string) => {
    // Bold and inline code
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-accent px-1 py-0.5 text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-1 text-sm">
      {renderContent(text)}
      {isStreaming && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-foreground align-text-bottom" />
      )}
    </div>
  );
}
