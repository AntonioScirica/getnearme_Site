import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import {
  getArticleBySlug,
  getAllPublishedSlugs,
  getRelatedArticles,
  extractHeadings,
  type Article,
} from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ============================================================================
// STATIC PARAMS
// ============================================================================

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

// ============================================================================
// METADATA SEO
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale as Locale);

  if (!article) {
    return {
      title: "Articolo non trovato",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = "https://getnearme.it";
  const articleUrl = `${baseUrl}/${locale}/blog/${slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at,
      authors: [article.author],
      tags: article.tags,
      ...(article.image_url && {
        images: [
          {
            url: article.image_url.startsWith("http")
              ? article.image_url
              : `${baseUrl}${article.image_url}`,
            alt: article.image_alt || article.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      ...(article.image_url && {
        images: [
          article.image_url.startsWith("http")
            ? article.image_url
            : `${baseUrl}${article.image_url}`,
        ],
      }),
    },
  };
}

// ============================================================================
// TESTI LOCALIZZATI
// ============================================================================

const articleTexts: Record<
  Locale,
  {
    readingTime: string;
    updated: string;
    related: string;
    backToBlog: string;
    tryGetNearMe: string;
    ctaText: string;
  }
> = {
  it: {
    readingTime: "min di lettura",
    updated: "Aggiornato il",
    related: "Articoli correlati",
    backToBlog: "← Torna al blog",
    tryGetNearMe: "Prova GetNearMe",
    ctaText: "Vuoi analizzare immobili in modo strutturato?",
  },
  en: {
    readingTime: "min read",
    updated: "Updated on",
    related: "Related articles",
    backToBlog: "← Back to blog",
    tryGetNearMe: "Try GetNearMe",
    ctaText: "Want to analyze properties in a structured way?",
  },
  es: {
    readingTime: "min de lectura",
    updated: "Actualizado el",
    related: "Artículos relacionados",
    backToBlog: "← Volver al blog",
    tryGetNearMe: "Prueba GetNearMe",
    ctaText: "¿Quieres analizar inmuebles de forma estructurada?",
  },
  fr: {
    readingTime: "min de lecture",
    updated: "Mis à jour le",
    related: "Articles connexes",
    backToBlog: "← Retour au blog",
    tryGetNearMe: "Essayez GetNearMe",
    ctaText: "Vous voulez analyser des biens de manière structurée?",
  },
  ru: {
    readingTime: "мин чтения",
    updated: "Обновлено",
    related: "Похожие статьи",
    backToBlog: "← Вернуться в блог",
    tryGetNearMe: "Попробуйте GetNearMe",
    ctaText: "Хотите анализировать недвижимость структурированно?",
  },
  uk: {
    readingTime: "хв читання",
    updated: "Оновлено",
    related: "Схожі статті",
    backToBlog: "← Повернутися до блогу",
    tryGetNearMe: "Спробуйте GetNearMe",
    ctaText: "Хочете аналізувати нерухомість структуровано?",
  },
};

const tocTitle: Record<Locale, string> = {
  it: "Indice",
  en: "Table of Contents",
  es: "Índice",
  fr: "Sommaire",
  ru: "Содержание",
  uk: "Зміст",
};

// ============================================================================
// SCHEMA.ORG JSON-LD
// ============================================================================

function ArticleSchema({
  article,
  locale,
}: {
  article: Article;
  locale: string;
}) {
  const baseUrl = "https://getnearme.it";
  const articleUrl = `${baseUrl}/${locale}/blog/${article.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    author: {
      "@type": "Organization",
      name: article.author,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "GetNearMe",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.ico`,
      },
    },
    datePublished: article.published_at,
    dateModified: article.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    url: articleUrl,
    inLanguage: locale,
    ...(article.image_url && {
      image: {
        "@type": "ImageObject",
        url: article.image_url.startsWith("http")
          ? article.image_url
          : `${baseUrl}${article.image_url}`,
      },
    }),
    ...(article.tags &&
      article.tags.length > 0 && {
        keywords: article.tags.join(", "),
      }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================

function TableOfContents({
  headings,
  title,
}: {
  headings: { id: string; text: string }[];
  title: string;
}) {
  if (headings.length < 3) return null;

  return (
    <nav
      className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200"
      aria-label="Indice dei contenuti"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4 font-inter">
        {title}
      </h2>
      <ol className="space-y-2 list-decimal list-inside">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ============================================================================
// MARKDOWN → HTML RENDERER
// ============================================================================

function ArticleContent({ content }: { content: string }) {
  const htmlContent = content
    // Separatori orizzontali (---)
    .replace(/^---$/gm, '<hr class="my-6 border-t border-slate-200" />')
    // H3
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-xl font-bold text-slate-900 mt-8 mb-4 font-inter">$1</h3>'
    )
    // H2 con anchor
    .replace(/^## (.+)$/gm, (_, text) => {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      return `<h2 id="${id}" class="text-2xl font-bold text-slate-900 mt-10 mb-4 scroll-mt-24 font-inter">${text}</h2>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
    // Liste non ordinate
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(
      /(<li class="ml-4">.*<\/li>\n?)+/g,
      '<ul class="list-disc list-inside space-y-2 my-4 text-slate-600">$&</ul>'
    )
    // Liste ordinate
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    // Paragrafi (skip lines that are already HTML or hr)
    .replace(
      /^(?!<[hulo]|<li|<div|<span|<hr)(.+)$/gm,
      '<p class="text-slate-600 leading-relaxed my-4">$1</p>'
    )
    // Cleanup
    .replace(/<p class="[^"]*"><\/p>/g, "");

  return (
    <div
      className="prose prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale as Locale);
  const t = translations[locale as Locale];

  if (!article) {
    notFound();
  }

  const headings = extractHeadings(article.content);
  const relatedArticles = await getRelatedArticles(
    slug,
    locale as Locale,
    article.tags || [],
    2
  );
  const texts = articleTexts[locale as Locale] || articleTexts.it;

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const updatedDate = new Date(article.updated_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />
      <ArticleSchema article={article} locale={locale} />

      <main className="pt-32 pb-20">
        <article className="max-w-3xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <Link
              href={`/${locale}/blog`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {texts.backToBlog}
            </Link>
          </nav>

          {/* Header */}
          <header className="mb-10">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6 font-inter">
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {article.author}
              </span>
              <span>•</span>
              <time dateTime={article.published_at || ""}>
                {formattedDate}
              </time>
              {article.reading_time && (
                <>
                  <span>•</span>
                  <span>
                    {article.reading_time} {texts.readingTime}
                  </span>
                </>
              )}
            </div>

            {updatedDate && formattedDate !== updatedDate && (
              <p className="text-sm text-slate-400 mt-2">
                {texts.updated} {updatedDate}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {article.image_url && (
            <div className="mb-10 -mx-6 md:mx-0">
              <div className="aspect-video relative rounded-xl overflow-hidden">
                <Image
                  src={article.image_url}
                  alt={article.image_alt || article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            </div>
          )}

          {/* Table of Contents */}
          <TableOfContents
            headings={headings}
            title={tocTitle[locale as Locale]}
          />

          {/* Content */}
          <div className="prose-lg">
            <ArticleContent content={article.content} />
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-slate-700 mb-4">{texts.ctaText}</p>
            <a
              href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              {texts.tryGetNearMe}
            </a>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="max-w-5xl mx-auto px-6 mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center font-inter">
              {texts.related}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedArticles.map((related) => (
                <article
                  key={related.slug}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link
                    href={`/${locale}/blog/${related.slug}`}
                    className="block"
                  >
                    {related.image_url && (
                      <div className="aspect-video relative overflow-hidden">
                        <Image
                          src={related.image_url}
                          alt={related.image_alt || related.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </Link>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 font-inter">
                      <Link
                        href={`/${locale}/blog/${related.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {related.title}
                      </Link>
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
