"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/ui/Button";
import { StateNotice } from "@/components/shared/ui/StateNotice";

/** Error boundary khusus grup route terautentikasi (audit 3.3). */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/(app)/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
      <div className="w-full space-y-4">
        <StateNotice
          title="Data tidak dapat dimuat"
          message="Komponen halaman mengalami kesalahan. Silakan coba lagi tanpa kehilangan sesi login."
          icon="⚠"
        />
        <Button onClick={reset} className="mx-auto">Coba lagi</Button>
      </div>
    </main>
  );
}
