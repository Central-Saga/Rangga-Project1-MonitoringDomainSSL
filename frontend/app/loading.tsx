import { Spinner } from "@/components/Spinner";

export default function Loading() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center">
      <Spinner label="Memuat halaman..." />
    </main>
  );
}
