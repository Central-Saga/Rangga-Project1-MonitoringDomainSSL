import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Aplikasi internal: semua halaman dilarang diindeks (audit 14.5). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
