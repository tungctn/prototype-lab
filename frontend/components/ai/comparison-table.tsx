import type { ReactNode } from "react";

import { AiDataTable, type AiTableColumn, type AiTableRow } from "@/components/ai/data-table";
import { cn } from "@/lib/utils";

type ComparisonTableProps = {
  labelColumn: string;
  options: Array<{ key: string; label: ReactNode }>;
  rows: Array<{
    id: string;
    label: ReactNode;
    values: Record<string, ReactNode>;
  }>;
  className?: string;
};

export function ComparisonTable({
  labelColumn,
  options,
  rows,
  className,
}: ComparisonTableProps) {
  const columns: AiTableColumn[] = [
    {
      key: "label",
      header: labelColumn,
      className: "font-medium",
    },
    ...options.map((option) => ({
      key: option.key,
      header: option.label,
      className: "text-center",
    })),
  ];

  const tableRows: AiTableRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      label: row.label,
      ...row.values,
    },
  }));

  return (
    <AiDataTable
      className={cn("text-sm", className)}
      columns={columns}
      rows={tableRows}
      emptyLabel="No comparison rows yet."
    />
  );
}
