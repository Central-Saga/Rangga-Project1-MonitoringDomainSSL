/**
 * Schema validasi frontend yang mengikuti FormRequest backend (audit 6.2).
 *
 * File ini sengaja murni (tanpa React / fetch) agar bisa diuji unit dan
 * dipakai ulang oleh semua form. Aturan yang sama harus ada di FormRequest
 * backend; perubahan di salah satu wajib memperbarui yang lain.
 */

import type { AssetType, User } from "@/types";

export type FieldErrors = Record<string, string>;
type UserRole = User["role"];

export const ASSET_TYPES: readonly AssetType[] = ["domain", "hosting", "ssl", "vps"];
export const USER_ROLES: readonly UserRole[] = ["admin", "staff", "client"];
export const PROJECT_STATUSES = ["active", "on_hold", "completed"] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function isBlank(value: string | null | undefined): value is null | undefined {
  return value === null || value === undefined || value.trim() === "";
}

function isDate(value: string | null | undefined): boolean {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

export function validateLogin(input: { email?: string; password?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(input.email)) errors.email = "Email dan password wajib diisi.";
  else if (!EMAIL_RE.test(input.email.trim())) errors.email = "Format email tidak valid.";
  if (isBlank(input.password)) errors.password = "Email dan password wajib diisi.";
  return errors;
}

export function validateRegister(input: {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirmation?: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(input.name)) errors.name = "Nama wajib diisi.";
  else if (input.name.trim().length > 255) errors.name = "Nama maksimal 255 karakter.";

  if (isBlank(input.email)) errors.email = "Email wajib diisi.";
  else if (!EMAIL_RE.test(input.email.trim())) errors.email = "Format email tidak valid.";

  if (isBlank(input.password)) errors.password = "Password wajib diisi.";
  else if (input.password.length < MIN_PASSWORD) errors.password = `Password minimal ${MIN_PASSWORD} karakter.`;

  if (input.password !== input.passwordConfirmation) {
    errors.password_confirmation = "Konfirmasi password tidak cocok.";
  }
  return errors;
}

export function validateClient(input: {
  name?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(input.name)) errors.name = "Nama wajib diisi.";
  else if (input.name.trim().length > 255) errors.name = "Nama maksimal 255 karakter.";
  if (input.company && input.company.trim().length > 255) {
    errors.company = "Perusahaan maksimal 255 karakter.";
  }
  if (!isBlank(input.email)) {
    if (!EMAIL_RE.test(String(input.email).trim())) errors.email = "Format email tidak valid.";
    else if (String(input.email).trim().length > 255) errors.email = "Email maksimal 255 karakter.";
  }
  if (input.phone && input.phone.length > 50) errors.phone = "Telepon maksimal 50 karakter.";
  return errors;
}

export function validateProject(input: {
  clientId?: number | string | null;
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.clientId === null || input.clientId === undefined || input.clientId === "") {
    errors.client_id = "Klien wajib dipilih.";
  }
  if (isBlank(input.name)) errors.name = "Nama wajib diisi.";
  else if (input.name.trim().length > 255) errors.name = "Nama maksimal 255 karakter.";
  if (!isDate(input.startDate)) errors.start_date = "Tanggal mulai tidak valid.";
  if (!isDate(input.endDate)) errors.end_date = "Tanggal selesai tidak valid.";
  if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
    errors.end_date = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
  }
  return errors;
}

export function validateAsset(input: {
  projectId?: number | string | null;
  type?: string | null;
  name?: string;
  provider?: string | null;
  renewalCost?: number | string | null;
  billingCycle?: string | null;
  startDate?: string | null;
  expiredDate?: string | null;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.projectId === null || input.projectId === undefined || input.projectId === "") {
    errors.project_id = "Proyek wajib dipilih.";
  }
  if (!input.type || !ASSET_TYPES.includes(input.type as AssetType)) {
    errors.type = "Tipe aset tidak valid.";
  }
  if (isBlank(input.name)) errors.name = "Nama wajib diisi.";
  else if (input.name.trim().length > 255) errors.name = "Nama maksimal 255 karakter.";
  if (input.provider && input.provider.trim().length > 255) {
    errors.provider = "Provider maksimal 255 karakter.";
  }
  if (input.renewalCost !== null && input.renewalCost !== undefined && input.renewalCost !== "") {
    const cost = Number(input.renewalCost);
    if (!Number.isFinite(cost) || cost < 0) errors.renewal_cost = "Biaya harus berupa angka non-negatif.";
  }
  if (input.billingCycle && !["monthly", "yearly"].includes(input.billingCycle)) {
    errors.billing_cycle = "Siklus tagihan tidak valid.";
  }
  if (!isDate(input.startDate)) errors.start_date = "Tanggal mulai tidak valid.";
  if (isBlank(input.expiredDate)) errors.expired_date = "Tanggal kedaluwarsa wajib diisi.";
  else if (!isDate(input.expiredDate)) errors.expired_date = "Tanggal kedaluwarsa tidak valid.";
  if (input.startDate && input.expiredDate &&
      new Date(input.expiredDate) < new Date(input.startDate)) {
    errors.expired_date = "Tanggal kedaluwarsa harus setelah tanggal mulai.";
  }
  return errors;
}

export function validateUser(
  input: {
    name?: string;
    email?: string;
    password?: string;
    role?: string | null;
    clientId?: number | string | null;
  },
  options: { passwordRequired?: boolean } = {}
): FieldErrors {
  const errors: FieldErrors = {};
  const passwordRequired = options.passwordRequired ?? true;
  if (isBlank(input.name)) errors.name = "Nama wajib diisi.";
  else if (input.name.trim().length > 255) errors.name = "Nama maksimal 255 karakter.";
  if (isBlank(input.email)) errors.email = "Email wajib diisi.";
  else if (!EMAIL_RE.test(input.email.trim())) errors.email = "Format email tidak valid.";
  else if (input.email.trim().length > 255) errors.email = "Email maksimal 255 karakter.";
  if (passwordRequired && isBlank(input.password)) errors.password = "Password wajib diisi.";
  else if (!isBlank(input.password) && input.password.length < MIN_PASSWORD) {
    errors.password = `Password minimal ${MIN_PASSWORD} karakter.`;
  }
  if (!input.role || !USER_ROLES.includes(input.role as UserRole)) errors.role = "Peran tidak valid.";
  if (input.role === "client" && (input.clientId === null || input.clientId === undefined || input.clientId === "")) {
    errors.client_id = "Klien wajib dipilih untuk peran client.";
  }
  return errors;
}

/** Gabungkan error klien (cepat) dengan error server 422 (otoritatif). */
export function mergeFieldErrors(server?: Record<string, string[]>, client?: FieldErrors): FieldErrors {
  const fromServer: FieldErrors = Object.fromEntries(
    Object.entries(server ?? {}).map(([field, messages]) => [field, messages[0] ?? ""])
  );
  return { ...(client ?? {}), ...fromServer };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
