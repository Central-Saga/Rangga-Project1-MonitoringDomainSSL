import Link from "next/link";
import { Button } from "@/components/shared/ui/Button";
import { StateNotice } from "@/components/shared/ui/StateNotice";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <div className="w-full space-y-4 text-center">
        <StateNotice
          title="404 — Halaman tidak ditemukan"
          message="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan."
          icon="🔍"
        />
        <Link href="/dashboard" className="inline-flex">
          <Button>Kembali ke dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
