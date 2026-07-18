import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AiTableColumn = {
  key: string;
  header: ReactNode;
  className?: string;
};

export type AiTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
};

type AiDataTableProps = {
  columns: AiTableColumn[];
  rows: AiTableRow[];
  emptyLabel?: string;
  className?: string;
};

export function AiDataTable({
  columns,
  rows,
  emptyLabel = "No rows yet.",
  className,
}: AiDataTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-white text-sm shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border/70 bg-white text-left text-xs font-semibold text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn("px-3 py-2", column.className)}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/55">
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="bg-white">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-3 py-2 align-top", column.className)}
                    >
                      {row.cells[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="bg-white px-3 py-6 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
