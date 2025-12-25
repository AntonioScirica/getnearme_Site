import { MetadataRoute } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { getAllPublishedSlugs, getPostBySlug } from "@/lib/mdx";

const baseUrl = "https://getnearme.it";

export default function sitemap(): MetadataRoute.Sitemap {
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

  // ===== BLOG ARTICLES (solo articoli pubblicati) =====
  const publishedSlugs = getAllPublishedSlugs();

  publishedSlugs.forEach(({ locale, slug }) => {
    const post = getPostBySlug(slug, locale as Locale);
    if (!post) return;

    entries.push({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: new Date(post.frontmatter.updatedAt || post.frontmatter.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  return entries;
}
