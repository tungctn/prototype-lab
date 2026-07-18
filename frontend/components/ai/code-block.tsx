"use client";

import { Check, Code2, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  lang?: string;
  className?: string;
};

export function CodeBlock({ code, lang = "text", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  useEffect(() => {
    if (!copied) {
      return;
    }

    const id = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-[var(--code-bg)] text-[var(--code-fg)] shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
          <Code2 className="size-4 shrink-0 opacity-75" />
          <span className="truncate">{lang}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-[var(--code-fg)] hover:bg-white/10 hover:text-[var(--code-fg)]"
          aria-label={copied ? "Copied code" : "Copy code"}
          onClick={copyCode}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="overflow-x-auto py-2 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className="grid min-w-max grid-cols-[3rem_minmax(0,1fr)] px-3"
          >
            <span className="select-none pr-3 text-right text-white/35">
              {index + 1}
            </span>
            <code className="whitespace-pre">{line || " "}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
