import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk | Monitoring Infra",
  description: "Masuk ke sistem monitoring domain, hosting, dan SSL.",
};

export default function LoginPage() {
  // LoginForm memakai useSearchParams() untuk membaca ?next=, jadi harus
  // berada di dalam Suspense boundary supaya tetap bisa di-prerender.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
