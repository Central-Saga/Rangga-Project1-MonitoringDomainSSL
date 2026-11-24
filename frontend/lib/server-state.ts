"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, INVALIDATION_EVENT } from "@/lib/api";

/**
 * Server state terpisah dari client state (audit 5.1).
 *
 * - Data API hanya disimpan di hook ini, bukan di store global.
 * - Request terakhir yang menang (race condition aman, audit 4.8).
 * - Abort otomatis saat unmount / path berubah.
 * - Refetch otomatis setelah `invalidateApi()` dipanggil (audit 4.10).
 */
export interface ServerState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
  setData: (next: T | ((current: T | null) => T | null)) => void;
  isFetching: boolean;
}

export function useServerState<T>(path: string | null): ServerState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [isFetching, setIsFetching] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);

  const run = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }

    const sequence = ++sequenceRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setIsFetching(true);
    setError(null);

    try {
      const result = await api.get<T>(path, { signal: controller.signal });
      if (sequence === sequenceRef.current) setData(result);
    } catch (cause) {
      if (controller.signal.aborted || sequence !== sequenceRef.current) return;
      setError(cause instanceof Error ? cause.message : "Gagal memuat data.");
    } finally {
      if (sequence === sequenceRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [path]);

  useEffect(() => {
    void run();
    return () => controllerRef.current?.abort();
  }, [run]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onInvalidate = (event: Event) => {
      const prefix = (event as CustomEvent<string>).detail;
      if (!prefix || !path || path.includes(prefix)) void run();
    };
    window.addEventListener(INVALIDATION_EVENT, onInvalidate);
    return () => window.removeEventListener(INVALIDATION_EVENT, onInvalidate);
  }, [path, run]);

  const setDataSafe = useCallback((next: T | ((current: T | null) => T | null)) => {
    setData((current) => (typeof next === "function"
      ? (next as (value: T | null) => T | null)(current)
      : next));
  }, []);

  return { data, error, loading, refetch: run, setData: setDataSafe, isFetching };
}

/** Mutasi lalu invalidasi semua server state yang relevan. */
export async function mutateWithInvalidation<T>(
  action: () => Promise<T>,
  invalidate: (helper: { invalidateApi: typeof import("@/lib/api").invalidateApi }) => void
): Promise<T> {
  const { invalidateApi } = await import("@/lib/api");
  const result = await action();
  invalidate({ invalidateApi });
  return result;
}
