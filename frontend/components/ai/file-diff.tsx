import { FileCode2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type CodeDiffRowType = "context" | "add" | "delete";

export type CodeDiffRow = {
  oldLine?: number | null;
  newLine?: number | null;
  type: CodeDiffRowType;
  text: string;
};

type CodeDiffProps = {
  file: string;
  rows: CodeDiffRow[];
  added?: number;
  removed?: number;
  className?: string;
};

export function CodeDiff({
  file,
  rows,
  added,
  removed,
  className,
}: CodeDiffProps) {
  const addCount = added ?? rows.filter((row) => row.type === "add").length;
  const removeCount =
    removed ?? rows.filter((row) => row.type === "delete").length;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-white text-sm shadow-sm",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/70 bg-white px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 font-medium">
          <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{file}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs">
          <span className="text-[oklch(0.5_0.13_155)]">+{addCount}</span>
          <span className="text-[oklch(0.58_0.16_24)]">-{removeCount}</span>
        </div>
      </div>
      <div className="overflow-x-auto font-mono text-xs leading-5">
        {rows.length ? (
          rows.map((row, index) => (
            <div
              key={`${row.type}-${row.oldLine ?? ""}-${row.newLine ?? ""}-${index}`}
              className={cn(
                "grid min-w-[520px] grid-cols-[3rem_3rem_1.5rem_minmax(0,1fr)] border-b border-border/35 bg-white last:border-b-0",
                row.type === "add" && "bg-[oklch(0.96_0.035_155)]",
                row.type === "delete" && "bg-[oklch(0.965_0.03_24)]",
              )}
            >
              <span className="select-none px-2 py-1.5 text-right text-muted-foreground/70">
                {row.oldLine ?? ""}
              </span>
              <span className="select-none border-r border-border/45 px-2 py-1.5 text-right text-muted-foreground/70">
                {row.newLine ?? ""}
              </span>
              <span
                className={cn(
                  "select-none px-1.5 py-1.5 font-semibold",
                  row.type === "add" && "text-[oklch(0.45_0.13_155)]",
                  row.type === "delete" && "text-[oklch(0.55_0.16_24)]",
                )}
              >
                {row.type === "add" ? "+" : row.type === "delete" ? "-" : ""}
              </span>
              <code className="min-w-0 whitespace-pre px-2 py-1.5 text-foreground">
                {row.text || " "}
              </code>
            </div>
          ))
        ) : (
          <div className="bg-white px-3 py-3 text-muted-foreground">
            No previewable diff rows.
          </div>
        )}
      </div>
    </section>
  );
}

export function rowsFromInlineLines(lines: string[]): CodeDiffRow[] {
  let nextLine = 1;

  return lines.map((line) => {
    const marker: CodeDiffRowType = line.startsWith("+")
      ? "add"
      : line.startsWith("-")
        ? "delete"
        : "context";
    const text = marker === "context" ? line : line.slice(1);

    if (marker === "delete") {
      return {
        oldLine: nextLine++,
        newLine: null,
        type: marker,
        text,
      };
    }

    const row = {
      oldLine: marker === "add" ? null : nextLine,
      newLine: nextLine,
      type: marker,
      text,
    };

    nextLine += 1;
    return row;
  });
}

export function rowsFromUnifiedDiff(
  snippet: string[],
  file: string,
): CodeDiffRow[] {
  const section = extractFileSection(snippet, file);
  const rows: CodeDiffRow[] = [];
  let oldLine = 1;
  let newLine = 1;
  let hasHunk = false;

  for (const rawLine of section) {
    if (rawLine.startsWith("@@")) {
      const match = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(rawLine);

      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }

      hasHunk = true;
      continue;
    }

    if (
      rawLine.startsWith("diff --git") ||
      rawLine.startsWith("index ") ||
      rawLine.startsWith("---") ||
      rawLine.startsWith("+++")
    ) {
      continue;
    }

    if (!hasHunk && !rawLine.startsWith("+") && !rawLine.startsWith("-")) {
      continue;
    }

    if (rawLine.startsWith("+")) {
      rows.push({
        oldLine: null,
        newLine,
        type: "add",
        text: rawLine.slice(1),
      });
      newLine += 1;
      continue;
    }

    if (rawLine.startsWith("-")) {
      rows.push({
        oldLine,
        newLine: null,
        type: "delete",
        text: rawLine.slice(1),
      });
      oldLine += 1;
      continue;
    }

    const text = rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine;
    rows.push({
      oldLine,
      newLine,
      type: "context",
      text,
    });
    oldLine += 1;
    newLine += 1;
  }

  return rows.slice(0, 80);
}

function extractFileSection(snippet: string[], file: string) {
  const fileMarkers = [` b/${file}`, `/${file}`, file];
  const start = snippet.findIndex((line) =>
    line.startsWith("diff --git")
      ? fileMarkers.some((marker) => line.includes(marker))
      : line === `+++ b/${file}` || line.endsWith(file),
  );

  if (start < 0) {
    return snippet.filter(
      (line) =>
        line.includes(file) ||
        line.startsWith("@@") ||
        line.startsWith("+") ||
        line.startsWith("-") ||
        line.startsWith(" "),
    );
  }

  const end = snippet.findIndex(
    (line, index) => index > start && line.startsWith("diff --git"),
  );

  return snippet.slice(start, end < 0 ? undefined : end);
}
