"use client";

import { Check, Globe2, ImageIcon, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type WebSearchSource = {
  title: string;
  url: string;
  status?: "searching" | "done";
};

export function WebSearchState({
  query,
  sources,
  className,
}: {
  query: string;
  sources: WebSearchSource[];
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/80 bg-background p-3 text-sm",
        className,
      )}
    >
      <div className="font-medium text-foreground/80 animate-[thinking-shimmer_1.25s_ease-in-out_infinite]">
        Searching &quot;{query}&quot;
      </div>
      <div className="mt-2 space-y-1.5">
        {sources.map((source) => (
          <div key={source.url} className="flex min-w-0 items-start gap-2">
            {source.status === "done" ? (
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--live)]" />
            ) : (
              <Globe2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">{source.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {source.url}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ImageGenerationState({
  prompt,
  resolution = "1024 x 1024",
  className,
}: {
  prompt: string;
  resolution?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/80 bg-background p-3 text-sm",
        className,
      )}
    >
      <div className="relative grid aspect-square max-h-64 place-items-center overflow-hidden rounded-md border border-border/70 bg-muted/45">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_45%_38%,color-mix(in_oklch,var(--codex-purple),transparent_70%),transparent_35%)]" />
        <ImageIcon className="relative size-8 text-muted-foreground" />
        <span className="absolute right-2 top-2 rounded bg-background/90 px-1.5 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
          {resolution}
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--codex-blue)]" />
        <div>
          <div className="font-medium">Generating image</div>
          <div className="text-muted-foreground">&quot;{prompt}&quot;</div>
        </div>
      </div>
    </section>
  );
}
