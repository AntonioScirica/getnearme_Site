import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { CHAPTERS } from "./[locale]/guida-acquisto-casa/data";
import { getPublishedPosts } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";

const baseUrl = "https://agenteimmo.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ===== LANDING PAGES =====
  // Home e guida pilastro: solo italiano (le altre lingue rimandano a /it)
  entries.push({ url: `${baseUrl}/it`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 });
  GUIDES.forEach((g, i) => entries.push({ url: `${baseUrl}/it/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: "monthly", priority: i === 0 ? 0.9 : 0.8 }));

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

  // ===== GUIDA ACQUISTO CASA =====
  // Hub page
  entries.push({ url: `${baseUrl}/it/guida-acquisto-casa`, lastModified: new Date("2026-05-23"), changeFrequency: "monthly", priority: 0.8 });

  // Chapter pages
  // (solo italiano: il contenuto non e' tradotto, le altre lingue hanno canonical su /it)
  CHAPTERS.forEach((chapter) => {
    entries.push({ url: `${baseUrl}/it/guida-acquisto-casa/${chapter.slug}`, lastModified: new Date("2026-05-23"), changeFrequency: "monthly", priority: 0.7 });
  });

  // ===== BLOG (IT-only in V1) =====
  entries.push({
    url: `${baseUrl}/it/blog`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  });

  try {
    const posts = await getPublishedPosts("it");
    posts.forEach((post) => {
      entries.push({
        url: `${baseUrl}/it/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });
  } catch (e) {
    // Sitemap must still build if Supabase is briefly unreachable.
    console.error("sitemap: failed to fetch blog posts", e);
  }

  return entries;
}
