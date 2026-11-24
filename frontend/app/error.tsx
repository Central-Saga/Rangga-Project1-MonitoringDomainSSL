"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/ui/Button";
import { StateNotice } from "@/components/shared/ui/StateNotice";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(12.1): kirim ke error tracking saat DSN tersedia.
    console.error("[app/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <div className="w-full space-y-4">
        <StateNotice
          title="Terjadi kesalahan pada halaman"
          message="Coba lagi. Jika masalah berlanjut, muat ulang halaman atau hubungi administrator."
          icon="⚠"
        />
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Coba lagi</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Muat ulang
          </Button>
        </div>
      </div>
    </main>
  );
}
