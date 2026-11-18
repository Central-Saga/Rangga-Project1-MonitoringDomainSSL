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

// getToken() sekarang mengembalikan null karena token disimpan di HttpOnly Cookie
export function getToken(): string | null {
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. HAPUS penggunaan token di Header Authorization
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  // 2. TAMBAHKAN credentials: "include" agar cookie ikut terkirim
  const res = await fetch(`${API_URL}${path}`, { 
    ...options, 
    headers,
    credentials: "include" 
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
  if (res.status === 401) {
    // HAPUS localStorage.removeItem karena kita tidak pakai localStorage lagi
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
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
  // 3. TAMBAHKAN credentials: "include" di downloadPdf juga
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