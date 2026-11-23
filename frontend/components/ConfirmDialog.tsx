"use client";

import { Modal } from "@/components/Modal";

export interface ConfirmTarget {
  id: number;
  label: string;
  detail?: string;
}

export interface ConfirmDialogProps {
  target: ConfirmTarget | null;
  title: string;
  onCancel: () => void;
  onConfirm: (target: ConfirmTarget) => Promise<void> | void;
  error?: string | null;
  confirmLabel?: string;
}

/**
 * Konfirmasi hapus berbasis Modal (menggantikan confirm() native).
 * Fokus awal ada pada tombol konfirmasi; Escape/Batal menutup dialog.
 */
export function ConfirmDialog({
  target,
  title,
  onCancel,
  onConfirm,
  error,
  confirmLabel = "Hapus",
}: ConfirmDialogProps) {
  return (
    <Modal
      open={target !== null}
      title={title}
      onClose={onCancel}
      confirmLabel={confirmLabel}
      onConfirm={() => {
        if (target) void onConfirm(target);
      }}
    >
      <p className="text-sm text-ink">
        Hapus <strong>{target?.label ?? ""}</strong>? Tindakan ini tidak dapat dibatalkan.
      </p>
      {target?.detail && <p className="mt-2 text-sm text-soft">{target.detail}</p>}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
