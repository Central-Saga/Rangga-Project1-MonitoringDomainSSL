/**
 * Satu-satunya API client aplikasi (audit 4.1).
 *
 * Menyediakan:
 * - request dedupe untuk GET yang bersamaan (4.9)
 * - AbortSignal + timeout default (4.8, 11.9)
 * - penanganan 401 global lewat event, tanpa redirect berulang (4.4)
 * - invalidasi cache lokal setelah mutasi (4.10)
 * - error API berbentuk discriminated union (1.10)
 * - terjemahan pesan error backend (13.8)
 * - validasi runtime semua respons lewat zod di boundary (1.4)
 */

import type { ZodType, ZodTypeAny } from "zod";
import { responseSchemaFor } from "./schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export type ApiErrorKind = "network" | "timeout" | "validation" | "unauthorized" | "csrf" | "http" | "contract";

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;
  readonly kind: ApiErrorKind;

  constructor(status: number, message: string, errors?: Record<string, string[]>, kind?: ApiErrorKind) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.kind = kind ?? classify(status);
  }
}

export interface NetworkApiError extends ApiError {
  readonly kind: "network" | "timeout";
}

export interface ValidationApiError extends ApiError {
  readonly kind: "validation";
  readonly errors: Record<string, string[]>;
}

export interface HttpApiError extends ApiError {
  readonly kind: "http" | "csrf" | "unauthorized";
}

/** Respons 2xx tapi bentuknya menyalahi kontrak API (audit 1.4). */
export interface ContractApiError extends ApiError {
  readonly kind: "contract";
}

/** Discriminated union untuk pemetaan error di UI (audit 1.10). */
export type ApiFailure = NetworkApiError | ValidationApiError | HttpApiError | ContractApiError;

export function isValidationError(error: unknown): error is ValidationApiError {
  return error instanceof ApiError && error.kind === "validation";
}

export function isNetworkError(error: unknown): error is NetworkApiError {
  return error instanceof ApiError && (error.kind === "network" || error.kind === "timeout");
}

export function isContractError(error: unknown): error is ContractApiError {
  return error instanceof ApiError && error.kind === "contract";
}

function classify(status: number): ApiErrorKind {
  if (status === 0) return "network";
  if (status === 422) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 419) return "csrf";
  return "http";
}

const MESSAGE_MAP: Readonly<Record<string, string>> = {
  "Email atau password salah.": "Email atau password salah. Silakan coba lagi.",
  Unauthenticated: "Sesi berakhir, silakan login kembali.",
  "Too Many Attempts.": "Terlalu banyak percobaan. Tunggu satu menit sebelum mencoba lagi.",
  "No query results for model": "Data yang diminta tidak ditemukan.",
};

export function translateApiMessage(message: string): string {
  if (MESSAGE_MAP[message]) return MESSAGE_MAP[message];
  for (const [key, value] of Object.entries(MESSAGE_MAP)) {
    if (message.includes(key)) return value;
  }
  return message;
}

// Token auth disimpan di cookie HttpOnly; JavaScript hanya membaca XSRF-TOKEN.
export function getToken(): string | null {
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function csrfHeaders(method: string): Record<string, string> {
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return {};
  const token = readCookie("XSRF-TOKEN");
  return token ? { "X-XSRF-TOKEN": token } : {};
}

export interface RequestOptions extends Omit<RequestInit, "body" | "signal"> {
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  dedupe?: boolean;
  retries?: number;
  /** Skema zod eksplisit; tanpa ini dipilih otomatis dari method + path. */
  schema?: ZodTypeAny;
}

/** Gabungkan signal eksternal dengan timer internal tanpa AbortSignal.any. */
function combineSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

const inflight = new Map<string, Promise<unknown>>();
let unauthorizedHandled = false;

export const INVALIDATION_EVENT = "api:invalidated";

/** Hapus cache in-flight setelah mutasi (audit 4.10) dan beri tahu subscriber. */
export function invalidateApi(pathPrefix?: string): void {
  if (!pathPrefix) {
    inflight.clear();
  } else {
    for (const key of inflight.keys()) {
      if (key.includes(pathPrefix)) inflight.delete(key);
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INVALIDATION_EVENT, { detail: pathPrefix ?? "" }));
  }
}

/** Dipakai tes/user setelah login ulang untuk mengizinkan penanganan 401 berikutnya. */
export function resetUnauthorizedFlag(): void {
  unauthorizedHandled = false;
}

function handleUnauthorized(): void {
  if (unauthorizedHandled || typeof window === "undefined") return;
  unauthorizedHandled = true;
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  if (!window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

async function parseFailure(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}) as Record<string, unknown>);
  const raw = typeof body.message === "string" ? body.message : `Error ${res.status}`;
  const errors = body.errors && typeof body.errors === "object"
    ? (body.errors as Record<string, string[]>)
    : undefined;

  return new ApiError(
    res.status,
    translateApiMessage(raw),
    errors,
    res.status === 422 && errors ? "validation" : classify(res.status)
  );
}

async function fetchOnce(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...csrfHeaders(method),
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: combineSignals([timeout.signal, ...(options.signal ? [options.signal] : [])]),
      credentials: "include",
    });
  } catch (error) {
    if (timeout.signal.aborted && !options.signal?.aborted) {
      throw new ApiError(0, "Permintaan memakan waktu terlalu lama. Silakan coba lagi.", undefined, "timeout");
    }
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", undefined, "network");
  } finally {
    clearTimeout(timer);
  }
}

async function rawRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const method = options.method ?? "GET";
  const key = `${method}:${path}`;
  const shouldDedupe = method === "GET" && options.dedupe !== false;

  if (shouldDedupe) {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<Response>;
  }

  const run = async (): Promise<Response> => {
    const retries = options.retries ?? (method === "GET" ? 1 : 0);
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const res = await fetchOnce(path, options);
        if (res.ok) {
          unauthorizedHandled = false;
          return res;
        }
        if (res.status === 401) handleUnauthorized();
        throw await parseFailure(res);
      } catch (error) {
        lastError = error;
        const retryable = isNetworkError(error) || (error instanceof ApiError && error.status >= 500);
        if (!retryable || attempt === retries) break;
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

    throw lastError;
  };

  const promise = run();
  if (shouldDedupe) {
    inflight.set(key, promise);
    void promise.then(
      () => inflight.delete(key),
      () => inflight.delete(key)
    );
  }
  return promise;
}

function contractError(status: number, detail: string): ApiError {
  return new ApiError(status, `Respons API tidak sesuai kontrak (${detail}).`, undefined, "contract");
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, options);
  if (res.status === 204) return undefined as T;

  // Boundary validasi (audit 1.4): JSON diparsing aman lalu diverifikasi zod
  // sebelum dipercaya sebagai T. Tidak ada cast langsung dari `res.json()`.
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw contractError(res.status, "body bukan JSON");
  }

  const method = options.method ?? "GET";
  // Cast pada skema, bukan pada data respons: `T` tetap dibuktikan oleh safeParse.
  const schema = (options.schema ?? responseSchemaFor(method, path)) as ZodType<T>;
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const location = issue?.path.map(String).join(".") || "body";
    const expected = issue?.message ?? "bentuk tidak dikenal";
    throw contractError(res.status, `${location}: ${expected}`);
  }

  return parsed.data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function firstMessages(errors?: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors ?? {}).map(([field, messages]) => [field, messages[0] ?? ""])
  );
}

export async function downloadPdf(path: string, filename: string, options?: RequestOptions): Promise<void> {
  const res = await rawRequest(path, {
    ...options,
    method: "GET",
    headers: { Accept: "application/pdf, application/json" },
  });

  const blob = await res.blob();
  if (!res.headers.get("content-type")?.toLowerCase().includes("application/pdf") ||
      (await blob.slice(0, 5).text()) !== "%PDF-") {
    throw new ApiError(res.status, "Server tidak mengirim berkas PDF yang valid. Silakan coba lagi.");
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
