import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getAllPublishedSlugs } from "@/lib/supabase";

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

  // ===== BLOG LISTING =====
  locales.forEach((locale) => {
    entries.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  });

  // ===== BLOG ARTICLES (da Supabase) =====
  const publishedArticles = await getAllPublishedSlugs();

  publishedArticles.forEach(({ locale, slug, updated_at }) => {
    entries.push({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: updated_at ? new Date(updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  return entries;
}
