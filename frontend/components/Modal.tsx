"use client";

import { FC, useCallback, useEffect, useRef } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** Teks tombol konfirmasi; saat diisi, fokus awal ada pada tombol ini. */
  confirmLabel?: string;
  onConfirm?: () => void;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Modal dengan focus trap + Escape + aria-modal (audit 8.7 / 8.8).
 * Fokus dikembalikan ke elemen pemicu setelah dialog ditutup.
 */
export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  className,
  confirmLabel,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const focusables = useCallback((): HTMLElement[] => {
    const root = dialogRef.current;
    return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
  }, []);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    const items = focusables();
    (confirmLabel ? items.find((item) => item.textContent?.includes(confirmLabel)) ?? items[0] : items[0]
      ?? dialogRef.current)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const current = focusables();
      if (current.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = current[0];
      const last = current[current.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open, onClose, focusables, confirmLabel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Tutup dialog"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-overlay backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`animate-fade-up relative z-10 my-8 w-full max-w-lg rounded-2xl border border-line bg-card shadow-pop outline-none ${className ?? ""}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 py-1 text-mute transition hover:bg-subtle hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {confirmLabel && (
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink hover:bg-subtle"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm ?? onClose}
              className="min-h-11 rounded-xl bg-danger px-4 text-sm font-semibold text-white hover:brightness-95"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
