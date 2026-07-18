"use client";

import { ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type AgentTodoStatus = "done" | "active" | "pending";

export type AgentTodoItem = {
  id: string;
  label: string;
  status?: AgentTodoStatus;
};

type AgentTodoListProps = {
  items: AgentTodoItem[];
  title?: string;
  defaultOpen?: boolean;
  className?: string;
};

export function AgentTodoList({
  items,
  title = "To-dos",
  defaultOpen = true,
  className,
}: AgentTodoListProps) {
  const [open, setOpen] = useState(defaultOpen);
  const normalizedItems = useMemo(() => normalizeTodoItems(items), [items]);
  const done = normalizedItems.filter((item) => item.status === "done").length;
  const activeIndex = normalizedItems.findIndex(
    (item) => item.status === "active",
  );
  const allDone = normalizedItems.length > 0 && done === normalizedItems.length;
  const running = activeIndex >= 0 && !allDone;
  const count = `${done}/${normalizedItems.length}`;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-[oklch(0.87_0.004_255)] bg-[oklch(0.985_0.001_255)] px-3 py-2.5 text-sm shadow-sm dark:border-border dark:bg-[oklch(0.22_0.006_255)]",
        className,
      )}
    >
      <button
        type="button"
        className="group flex w-full items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-expanded={open}
        aria-label="Toggle to-dos"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="relative grid size-4 shrink-0 place-items-center text-muted-foreground">
          {allDone ? (
            <FilledCheckIcon />
          ) : running ? (
            <ProgressRing progress={(done / normalizedItems.length) * 100} />
          ) : (
            <DashedIcon className="text-muted-foreground/70" />
          )}
          <ChevronDown
            className={cn(
              "absolute -right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/0 transition-all duration-200 group-hover:text-muted-foreground",
              !open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
          {title}
        </span>
        <RollingCount value={count} />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="mt-3 space-y-2.5">
            {normalizedItems.map((item, index) => (
              <li
                key={item.id}
                className="flex min-w-0 items-start gap-2.5"
                style={{ transitionDelay: `${index * 35}ms` }}
              >
                <span className="relative mt-0.5 grid size-4 shrink-0 place-items-center">
                  <DashedIcon
                    className={cn(
                      "absolute transition-all duration-200",
                      item.status === "pending"
                        ? "scale-100 opacity-100"
                        : "scale-75 opacity-0",
                    )}
                  />
                  <ArrowIcon
                    className={cn(
                      "absolute transition-all duration-200",
                      item.status === "active"
                        ? "scale-100 opacity-100"
                        : "scale-75 opacity-0",
                    )}
                  />
                  <CheckIcon
                    className={cn(
                      "absolute transition-all duration-200",
                      item.status === "done"
                        ? "scale-100 opacity-100"
                        : "scale-75 opacity-0",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm leading-5 transition-colors duration-200",
                    item.status === "active" && "font-medium text-foreground",
                    item.status === "pending" && "text-muted-foreground/65",
                    item.status === "done" && "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function normalizeTodoItems(items: AgentTodoItem[]) {
  const firstActive = items.findIndex((item) => item.status === "active");

  if (firstActive < 0) {
    return items.map((item) => ({
      ...item,
      status: item.status ?? "pending",
    }));
  }

  return items.map((item, index) => ({
    ...item,
    status:
      item.status ??
      (index < firstActive ? "done" : index === firstActive ? "active" : "pending"),
  }));
}

function RollingCount({ value }: { value: string }) {
  return (
    <span
      className="flex shrink-0 overflow-hidden font-mono text-sm leading-5 text-muted-foreground"
      aria-label={value}
    >
      {value.split("").map((char, index) => (
        <span
          key={`${index}-${char}`}
          className="inline-block min-w-[0.62em] animate-[todo-count-in_220ms_ease-out]"
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function DashedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 text-muted-foreground/60", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeDasharray="1.8 3.6"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 text-foreground", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 text-muted-foreground", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FilledCheckIcon() {
  return (
    <svg className="size-4 text-[var(--live)]" viewBox="0 0 24 24" aria-hidden="true">
      <path
        clipRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  return (
    <span
      className="relative grid size-4 place-items-center rounded-full"
      aria-hidden="true"
    >
      <DashedIcon className="absolute text-muted-foreground/60" />
      <span
        className="absolute inset-0 rounded-full bg-[conic-gradient(currentColor_var(--todo-progress),transparent_0)] text-foreground/85 [mask:radial-gradient(circle,transparent_49%,#000_51%)]"
        style={
          {
            "--todo-progress": `${Math.max(0, Math.min(100, progress))}%`,
          } as CSSProperties
        }
      />
    </span>
  );
}
