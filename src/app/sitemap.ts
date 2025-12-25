import { MetadataRoute } from "next";
import { locales, defaultLocale, hreflangMap, type Locale } from "@/lib/i18n";
import { getAllPublishedSlugs, getPostBySlug } from "@/lib/mdx";

const baseUrl = "https://getnearme.it";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // ===== LANDING PAGES =====
  const landingRoutes = ["", "/privacy", "/cookie", "/termini"];

  landingRoutes.forEach((route) => {
    locales.forEach((locale) => {
      const url = `${baseUrl}/${locale}${route}`;
      const priority = route === "" ? 1.0 : 0.3;
      const changeFrequency: "weekly" | "monthly" = route === "" ? "weekly" : "monthly";

      // Genera alternates per hreflang
      const languages: Record<string, string> = {};
      locales.forEach((l) => {
        languages[hreflangMap[l]] = `${baseUrl}/${l}${route}`;
      });
      languages["x-default"] = `${baseUrl}/${defaultLocale}${route}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages,
        },
      });
    });
  });

  // ===== BLOG LISTING =====
  locales.forEach((locale) => {
    const languages: Record<string, string> = {};
    locales.forEach((l) => {
      languages[hreflangMap[l]] = `${baseUrl}/${l}/blog`;
    });
    languages["x-default"] = `${baseUrl}/${defaultLocale}/blog`;

    entries.push({
      url: `${baseUrl}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages,
      },
    });
  });

  // ===== BLOG ARTICLES (solo articoli pubblicati) =====
  const publishedSlugs = getAllPublishedSlugs();

  // Raggruppa per slug per trovare le versioni in altre lingue
  const slugsByLocale = new Map<string, Set<Locale>>();
  publishedSlugs.forEach(({ locale, slug }) => {
    if (!slugsByLocale.has(slug)) {
      slugsByLocale.set(slug, new Set());
    }
    slugsByLocale.get(slug)!.add(locale);
  });

  publishedSlugs.forEach(({ locale, slug }) => {
    const post = getPostBySlug(slug, locale);
    if (!post) return;

    const languages: Record<string, string> = {};

    // Aggiungi alternates solo per lingue dove l'articolo esiste
    const availableLocales = slugsByLocale.get(slug);
    if (availableLocales) {
      availableLocales.forEach((l) => {
        languages[hreflangMap[l]] = `${baseUrl}/${l}/blog/${slug}`;
      });
    }

    // x-default: usa italiano se disponibile, altrimenti primo locale disponibile
    if (availableLocales?.has(defaultLocale)) {
      languages["x-default"] = `${baseUrl}/${defaultLocale}/blog/${slug}`;
    } else if (availableLocales && availableLocales.size > 0) {
      const firstLocale = [...availableLocales][0];
      languages["x-default"] = `${baseUrl}/${firstLocale}/blog/${slug}`;
    }

    entries.push({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: new Date(post.frontmatter.updatedAt || post.frontmatter.date),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages,
      },
    });
  });

  return entries;
}
