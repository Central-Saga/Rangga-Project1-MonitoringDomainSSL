"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UNAUTHORIZED_EVENT } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/**
 * Menangani 401 secara global: hapus sesi lokal sekali lalu arahkan ke /login.
 * Redirect juga dilakukan api.ts; komponen ini memastikan UI ikut bersih.
 */
export function SessionGuard(): null {
  const { clearSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      if (window.location.pathname !== "/login") router.replace("/login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession, router]);

  return null;
}
