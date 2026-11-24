import { Spinner } from "@/components/Spinner";

export default function AppLoading() {
  return (
    <main id="main-content" className="flex min-h-[60vh] items-center justify-center">
      <Spinner label="Memuat data..." />
    </main>
  );
}
