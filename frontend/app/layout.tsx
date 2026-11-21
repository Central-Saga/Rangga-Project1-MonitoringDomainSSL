import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Monitoring Infra — Domain, Hosting & SSL",
  description: "Sistem monitoring domain, hosting, VPS, dan SSL dengan alert kedaluwarsa otomatis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" nonce={nonce} async />
      </head>
      <body className="antialiased bg-app text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
