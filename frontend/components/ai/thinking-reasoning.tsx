"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_THOUGHTS = [
  "Reading the request and locating the current implementation.",
  "Checking the nearby UI primitives so the update fits the existing system.",
  "Preparing the response stream and diff preview with reusable components.",
];

type ThinkingReasoningProps = {
  thoughts?: string[];
  thinking?: boolean;
  elapsedSeconds?: number;
  className?: string;
};

export function ThinkingReasoning({
  thoughts = DEFAULT_THOUGHTS,
  thinking = true,
  elapsedSeconds,
  className,
}: ThinkingReasoningProps) {
  const lines = useMemo(
    () => thoughts.filter((thought) => thought.trim().length > 0),
    [thoughts],
  );
  const [revealed, setRevealed] = useState(thinking ? 0 : lines.length);
  const [open, setOpen] = useState(thinking);

  useEffect(() => {
    if (!thinking) {
      const id = window.setTimeout(() => {
        setRevealed(lines.length);
        setOpen(false);
      }, 0);

      return () => window.clearTimeout(id);
    }

    const openTimer = window.setTimeout(() => setOpen(true), 0);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const revealTimer = window.setTimeout(() => setRevealed(lines.length), 0);

      return () => {
        window.clearTimeout(openTimer);
        window.clearTimeout(revealTimer);
      };
    }

    const timers = lines.map((_, index) =>
      window.setTimeout(() => setRevealed(index + 1), 360 + index * 520),
    );

    return () => {
      window.clearTimeout(openTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [lines, thinking]);

  const visibleCount = thinking ? Math.max(1, revealed) : lines.length;
  const doneSeconds = elapsedSeconds ?? Math.max(1, lines.length);

  return (
    <div className={cn("w-full text-xs text-muted-foreground", className)}>
      <button
        type="button"
        className={cn(
          "flex min-h-6 max-w-full items-center gap-1.5 rounded-md text-left font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
          thinking ? "cursor-default" : "hover:text-foreground",
        )}
        aria-expanded={open}
        onClick={thinking ? undefined : () => setOpen((value) => !value)}
      >
        <span
          className={cn(
            "truncate",
            thinking &&
              "text-foreground/75 animate-[thinking-shimmer_1.25s_ease-in-out_infinite]",
          )}
        >
          {thinking ? "Thinking..." : `Thought for ${doneSeconds}s`}
        </span>
        {!thinking ? (
          <ChevronUp
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-200",
              !open && "rotate-180",
            )}
            aria-hidden="true"
          />
        ) : null}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1 max-h-44 space-y-1 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,transparent_0,currentColor_10px,currentColor_calc(100%-10px),transparent_100%)]">
            {lines.slice(0, visibleCount).map((line, index) => (
              <p
                key={`${line}-${index}`}
                className="rounded-md bg-muted/45 px-2 py-1.5 leading-5"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
