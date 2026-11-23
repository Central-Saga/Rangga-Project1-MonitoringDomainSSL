import type { FC, ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Header halaman presentational (audit 2.4 shared/ui). */
export const PageHeader: FC<PageHeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-sm text-soft">{description}</p>}
    </div>
    {actions}
  </div>
);
