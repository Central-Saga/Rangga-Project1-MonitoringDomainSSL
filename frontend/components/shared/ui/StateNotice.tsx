import type { FC, ReactNode } from "react";
import { Button } from "@/components/shared/ui/Button";

export interface StateNoticeProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
}

/** Placeholder kosong / error dengan tombol retry manual (audit 11.4). */
export const StateNotice: FC<StateNoticeProps> = ({
  title,
  message,
  onRetry,
  retryLabel = "Coba lagi",
  icon,
}) => (
  <div role={onRetry ? "alert" : "status"} className="rounded-2xl border border-line bg-card p-8 text-center shadow-card">
    {icon && <div aria-hidden className="mx-auto mb-3 text-3xl">{icon}</div>}
    <p className="font-semibold text-ink">{title}</p>
    {message && <p className="mx-auto mt-1 max-w-md text-sm text-soft">{message}</p>}
    {onRetry && (
      <Button variant="secondary" onClick={onRetry} className="mx-auto mt-4">
        {retryLabel}
      </Button>
    )}
  </div>
);
