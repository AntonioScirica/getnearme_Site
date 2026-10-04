import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";
import { CITIES } from "@/lib/omiCitta";

const baseUrl = "https://agenteimmo.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ===== LANDING PAGES =====
  // Home in italiano e inglese; guide solo in italiano
  entries.push({ url: `${baseUrl}/it`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 });
  entries.push({ url: `${baseUrl}/en`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 });
  // strumento per i proprietari: valutazione casa gratuita (quotazioni OMI)
  entries.push({ url: `${baseUrl}/it/quanto-vale-la-mia-casa`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.9 });
  // per chi vende casa: hub, indice dei prezzi per città e una pagina per città (quotazioni OMI, aggiornate a semestre)
  entries.push({ url: `${baseUrl}/it/vendere-casa`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.8 });
  entries.push({ url: `${baseUrl}/it/prezzi-case`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.8 });
  CITIES.forEach(c => entries.push({ url: `${baseUrl}/it/prezzi-case/${c.slug}`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.7 }));
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

  // Guida acquisto casa (GetNearMe): rimossa, rimanda alla home

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
