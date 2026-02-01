import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

const baseUrl = "https://getnearme.it";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ===== LANDING PAGES =====
  // Homepage per ogni lingua
  locales.forEach((locale) => {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    });
  });

  // Pagine legali per ogni lingua
  const legalPages = ["/privacy", "/cookie", "/termini"];
  legalPages.forEach((page) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.3,
      });
    });
  });

  return entries;
}
