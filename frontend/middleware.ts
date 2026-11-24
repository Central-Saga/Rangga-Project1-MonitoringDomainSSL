import { NextRequest, NextResponse } from "next/server";

/**
 * Saat dijalankan lokal, API berada di origin http loopback yang berbeda
 * (NEXT_PUBLIC_API_URL=http://localhost:8000/api). Izinkan hanya di host
 * lokal agar CSP produksi tetap ketat (audit 8.7).
 */
function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/**
 * Halaman yang hanya boleh dibuka dengan sesi. Guard klien di `(app)/layout.tsx`
 * tetap dipakai untuk UX, tetapi middleware memblokir deep link tanpa cookie
 * lebih awal di server (audit #93).
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/projects",
  "/assets",
  "/notifications",
  "/users",
];

function needsSession(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function contentSecurityPolicy(nonce: string, allowLocalApi: boolean): string {
  const localConnect = allowLocalApi ? " http://localhost:* http://127.0.0.1:*" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https:${localConnect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, isLocalHost(request.nextUrl.hostname));

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname, search } = request.nextUrl;
  if (needsSession(pathname) && !request.cookies.get("token")?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|theme-init.js).*)"],
};
