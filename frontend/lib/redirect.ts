/**
 * Validasi tujuan redirect setelah login (`?next=`).
 *
 * Hanya path relatif ke root aplikasi yang diterima. URL absolut, protocol
 * relative (`//evil.com`), backslash trick (`/\evil.com`), dan scheme lain
 * (`javascript:`, `data:`) selalu jatuh ke fallback supaya tidak ada open
 * redirect.
 */
export const DEFAULT_NEXT_PATH = "/dashboard";

export function safeNextPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT_PATH
): string {
  if (typeof raw !== "string") return fallback;

  const value = raw.trim();
  if (value === "") return fallback;

  // Harus path absolut dari root ("/aset"), bukan "aset" atau "https://...".
  if (!value.startsWith("/")) return fallback;

  // "//host" dan "/\host" diperlakukan browser sebagai host lain.
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;

  // Tolak karakter kontrol (termasuk newline/tab yang bisa menyamarkan host).
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  const base = "https://app.invalid";

  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return fallback;
  }

  // Setiap perubahan origin berarti keluar dari aplikasi.
  if (url.origin !== base) return fallback;
  if (url.username !== "" || url.password !== "") return fallback;

  const path = `${url.pathname}${url.search}${url.hash}`;
  return path === "" ? fallback : path;
}
