import { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";
import { CITIES } from "@/lib/omiCitta";

// rigenerata ogni ora (come indice e articoli del blog): gli articoli pubblicati dal database entrano senza un nuovo deploy
export const revalidate = 3600;

const baseUrl = "https://agenteimmo.me";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ultima modifica dei contenuti (guide): data stabile, non "adesso" a ogni build
  const lastGuide = new Date(GUIDES.map(g => g.updated).sort().at(-1)!);

  // ===== LANDING PAGES =====
  // Home in italiano e inglese; guide solo in italiano
  entries.push({ url: `${baseUrl}/it`, lastModified: lastGuide, changeFrequency: "weekly", priority: 1.0 });
  entries.push({ url: `${baseUrl}/en`, lastModified: lastGuide, changeFrequency: "weekly", priority: 0.8 });
  // indice delle guide per agenti e pagina "Chi siamo"
  entries.push({ url: `${baseUrl}/it/guide`, lastModified: lastGuide, changeFrequency: "weekly", priority: 0.8 });
  entries.push({ url: `${baseUrl}/it/chi-siamo`, lastModified: new Date("2026-10-05"), changeFrequency: "yearly", priority: 0.5 });
  // strumento per i proprietari: valutazione casa gratuita (quotazioni OMI)
  entries.push({ url: `${baseUrl}/it/quanto-vale-la-mia-casa`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.9 });
  // per chi vende casa: hub, indice dei prezzi per città e una pagina per città (quotazioni OMI, aggiornate a semestre)
  entries.push({ url: `${baseUrl}/it/vendere-casa`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.8 });
  entries.push({ url: `${baseUrl}/it/prezzi-case`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.8 });
  CITIES.forEach(c => entries.push({ url: `${baseUrl}/it/prezzi-case/${c.slug}`, lastModified: new Date("2026-10-05"), changeFrequency: "monthly", priority: 0.7 }));
  GUIDES.forEach((g, i) => entries.push({ url: `${baseUrl}/it/${g.slug}`, lastModified: new Date(g.updated), changeFrequency: "monthly", priority: i === 0 ? 0.9 : 0.8 }));

  // Pagine legali in italiano e inglese (le altre lingue mostrano il testo inglese: canonical su /en)
  const legalPages = ["/privacy", "/cookie", "/termini"];
  legalPages.forEach((page) => {
    (["it", "en"] as const).forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date("2026-10-05"),
        changeFrequency: "monthly",
        priority: 0.3,
      });
    });
  });

  // Guida acquisto casa (GetNearMe): rimossa, rimanda alla home

  // ===== BLOG (IT-only in V1) =====
  try {
    const posts = await getPublishedPosts("it");
    const latest = posts.map((p) => p.updated_at || p.published_at).filter(Boolean).sort().at(-1);
    entries.push({ url: `${baseUrl}/it/blog`, lastModified: latest ? new Date(latest) : lastGuide, changeFrequency: "daily", priority: 0.7 });
    posts.forEach((post) => {
      entries.push({
        url: `${baseUrl}/it/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });
  } catch (e) {
    entries.push({ url: `${baseUrl}/it/blog`, lastModified: lastGuide, changeFrequency: "daily", priority: 0.7 });
    // Sitemap must still build if Supabase is briefly unreachable.
    console.error("sitemap: failed to fetch blog posts", e);
  }

  return entries;
}
