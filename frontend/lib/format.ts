import type { AssetStatus, AssetType } from "@/types";

/**
 * Format angka/tanggal terpusat memakai Intl (audit 13.3) dengan timezone
 * konsisten Asia/Makassar (audit 13.4). Semua nilai status memakai union
 * literal, bukan string bebas (audit 1.7).
 */
export const LOCALE = "id-ID";
export const TIME_ZONE = "Asia/Makassar";

export type ProjectStatus = "active" | "on_hold" | "completed";
export type RenewalStatus = "paid" | "pending";
export type Status = AssetStatus | ProjectStatus | RenewalStatus;

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

export function formatRupiah(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? currencyFormatter.format(num) : "Rp 0";
}

export function formatNumber(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? numberFormatter.format(num) : "0";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date);
}

export function expiryText(days: number): string {
  if (days < 0) return `Lewat ${formatNumber(Math.abs(days))} hari`;
  if (days === 0) return "Hari ini";
  return `${formatNumber(days)} hari lagi`;
}

export function expiryColor(days: number, status: Status): string {
  if (status === "expired" || days < 0) return "bg-danger-soft text-danger";
  if (days <= 7) return "bg-danger-soft text-danger";
  if (days <= 30) return "bg-warn-soft text-warn";
  return "bg-ok-soft text-ok";
}

export const assetTypeColor: Record<AssetType, string> = {
  domain: "bg-info-soft text-info",
  hosting: "bg-accent-soft text-accent",
  ssl: "bg-ok-soft text-ok",
  vps: "bg-warn-soft text-warn",
};

export const statusColor: Record<Status, string> = {
  active: "bg-ok-soft text-ok",
  expired: "bg-danger-soft text-danger",
  suspended: "bg-subtle text-soft",
  on_hold: "bg-warn-soft text-warn",
  completed: "bg-info-soft text-info",
  paid: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
};
