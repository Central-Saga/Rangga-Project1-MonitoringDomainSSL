import type { FC, ReactNode } from "react";

export interface DataTableProps {
  caption: string;
  headers: readonly string[];
  children: ReactNode;
  className?: string;
}

/**
 * Tabel presentational dengan caption dan scope header (audit 8.12).
 */
export const DataTable: FC<DataTableProps> = ({ caption, headers, children, className = "" }) => (
  <div className={`overflow-x-auto rounded-2xl border border-line bg-card shadow-card ${className}`}>
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="border-b border-line bg-subtle text-xs uppercase tracking-wide text-mute">
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col" className="px-4 py-3 font-medium">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);
