"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type StreamingTextProps = {
  text: string;
  streaming?: boolean;
  className?: string;
};

export function StreamingText({
  text,
  streaming = false,
  className,
}: StreamingTextProps) {
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!streaming) {
      const id = window.setTimeout(() => setShown(text), 0);
      return () => window.clearTimeout(id);
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => setShown(text), 0);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setShown((current) => {
        if (text.startsWith(current)) {
          return current;
        }

        return "";
      });
    }, 0);

    return () => window.clearTimeout(id);
  }, [streaming, text]);

  useEffect(() => {
    if (!streaming || shown.length >= text.length) {
      return;
    }

    const id = window.setInterval(() => {
      setShown((current) => {
        if (current.length >= text.length) {
          window.clearInterval(id);
          return current;
        }

        return text.slice(0, current.length + 2);
      });
    }, 10);

    return () => window.clearInterval(id);
  }, [shown.length, streaming, text]);

  const activelyStreaming = streaming && shown.length < text.length;

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {shown}
      <span
        aria-hidden="true"
        className={cn(
          "ml-0.5 inline-block h-4 w-[1.5px] translate-y-0.5 rounded-full bg-current opacity-65",
          activelyStreaming && "animate-pulse",
          !streaming && "opacity-0",
        )}
      />
    </span>
  );
}
