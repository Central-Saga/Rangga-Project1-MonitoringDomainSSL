import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Hanya halaman publik yang masuk sitemap. Halaman terautentikasi sengaja
 * tidak dicantumkan agar tidak diindeks (audit 14.4).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/login", "/register"];

  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
