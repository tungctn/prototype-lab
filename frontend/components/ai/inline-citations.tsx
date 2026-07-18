import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type InlineCitationSource = {
  id: string;
  title: string;
  url: string;
};

type InlineCitationsProps = {
  children: ReactNode;
  sources: InlineCitationSource[];
  className?: string;
};

export function InlineCitations({
  children,
  sources,
  className,
}: InlineCitationsProps) {
  return (
    <div className={cn("space-y-2 text-sm leading-6", className)}>
      <p>{children}</p>
      <footer className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-xs text-muted-foreground">
        {sources.map((source, index) => (
          <a
            key={source.id}
            className="min-w-0 truncate transition-colors hover:text-foreground"
            href={source.url}
            rel="noreferrer"
            target="_blank"
          >
            <sup className="mr-1 font-mono text-[0.65rem]">{index + 1}</sup>
            {source.title}
          </a>
        ))}
      </footer>
    </div>
  );
}

export function CitationMarker({ index }: { index: number }) {
  return (
    <sup className="ml-0.5 rounded-sm bg-muted px-1 align-super font-mono text-[0.62rem] leading-none text-muted-foreground">
      {index}
    </sup>
  );
}
