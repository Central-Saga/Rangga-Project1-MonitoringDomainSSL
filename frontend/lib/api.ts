const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...csrfHeaders(method),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  }).catch(() => {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.");
  });

  await checkResponse(res);

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

async function checkResponse(res: Response): Promise<void> {
  if (res.status === 419) {
    throw new ApiError(419, "Sesi keamanan berakhir. Silakan muat ulang halaman.");
  }

  if (res.status === 401) {
    if (!window.location.pathname.startsWith("/login")) {
      window.location.replace("/login");
    }
    throw new ApiError(401, "Sesi berakhir, silakan login kembali.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, typeof body.message === "string" ? body.message : `Error ${res.status}`, body.errors);
  }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function firstMessages(errors?: Record<string, string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors ?? {}).map(([field, messages]) => [field, messages[0] ?? ""])
  );
}

export async function downloadPdf(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/pdf, application/json",
    },
    credentials: "include",
  }).catch(() => {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.");
  });
  await checkResponse(res);

  const blob = await res.blob();
  if (!res.headers.get("content-type")?.toLowerCase().includes("application/pdf") ||
      await blob.slice(0, 5).text() !== "%PDF-") {
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
