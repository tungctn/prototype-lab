import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type TextResponseProps = {
  children?: ReactNode;
  className?: string;
};

export function TextResponse({ children, className }: TextResponseProps) {
  return (
    <div
      className={cn(
        "max-w-[70ch] text-sm leading-6 text-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        className,
      )}
    >
      {children}
    </div>
  );
}
