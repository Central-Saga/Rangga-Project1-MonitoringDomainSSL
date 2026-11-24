import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { SessionGuard } from "@/components/SessionGuard";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Monitoring Infra — Domain, Hosting & SSL",
    template: "%s · Monitoring Infra",
  },
  description: "Sistem monitoring domain, hosting, VPS, dan SSL dengan alert kedaluwarsa otomatis.",
  applicationName: "Monitoring Infra",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Monitoring Infra",
    title: "Monitoring Infra — Domain, Hosting & SSL",
    description: "Pantau masa aktif domain, hosting, VPS, dan SSL dalam satu dashboard.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monitoring Infra",
    description: "Pantau masa aktif aset infrastruktur Anda.",
  },
  robots: { index: false, follow: false },
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
        {/* Skip link: keyboard user bisa langsung ke konten (audit 8.14). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:min-h-11 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Lewati ke konten utama
        </a>
        <AuthProvider>
          <SessionGuard />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
