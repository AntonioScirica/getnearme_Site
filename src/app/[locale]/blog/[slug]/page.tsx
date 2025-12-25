import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import {
  getPostBySlug,
  getAllPublishedSlugs,
  getRelatedPosts,
  extractHeadings,
  type BlogPost,
} from "@/lib/mdx";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ============================================================================
// STATIC PARAMS - Solo articoli pubblicati
// ============================================================================

export async function generateStaticParams() {
  const slugs = getAllPublishedSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

// ============================================================================
// METADATA - SEO per singolo articolo
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(slug, locale as Locale);

  if (!post) {
    return {
      title: "Articolo non trovato",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = "https://getnearme.it";
  const articleUrl = `${baseUrl}/${locale}/blog/${slug}`;

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    authors: [{ name: post.frontmatter.author.name, url: post.frontmatter.author.url }],
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url: articleUrl,
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updatedAt,
      authors: [post.frontmatter.author.name],
      tags: post.frontmatter.tags,
      images: [
        {
          url: `${baseUrl}${post.frontmatter.image.src}`,
          alt: post.frontmatter.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [`${baseUrl}${post.frontmatter.image.src}`],
    },
  };
}

// ============================================================================
// TESTI LOCALIZZATI
// ============================================================================

const articleTexts: Record<Locale, {
  readingTime: string;
  updated: string;
  related: string;
  backToBlog: string;
  tryGetNearMe: string;
  ctaText: string;
}> = {
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

function ArticleSchema({ post, locale }: { post: BlogPost; locale: string }) {
  const baseUrl = "https://getnearme.it";
  const articleUrl = `${baseUrl}/${locale}/blog/${post.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    author: {
      "@type": "Organization",
      name: post.frontmatter.author.name,
      url: post.frontmatter.author.url || baseUrl,
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
    datePublished: post.frontmatter.date,
    dateModified: post.frontmatter.updatedAt || post.frontmatter.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    url: articleUrl,
    inLanguage: locale,
    image: {
      "@type": "ImageObject",
      url: `${baseUrl}${post.frontmatter.image.src}`,
    },
    ...(post.frontmatter.tags && {
      keywords: post.frontmatter.tags.join(", "),
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
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
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
// CONTENT RENDERER
// ============================================================================

function ArticleContent({ content }: { content: string }) {
  // Converti markdown semplice in HTML
  const htmlContent = content
    // Headers H3
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-xl font-bold text-slate-900 mt-8 mb-4">$1</h3>'
    )
    // Headers H2 con ID per anchor
    .replace(/^## (.+)$/gm, (_, text) => {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
      return `<h2 id="${id}" class="text-2xl font-bold text-slate-900 mt-10 mb-4 scroll-mt-24">${text}</h2>`;
    })
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(
      /(<li class="ml-4">.*<\/li>\n?)+/g,
      '<ul class="list-disc list-inside space-y-2 my-4 text-slate-600">$&</ul>'
    )
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    // Paragraphs
    .replace(
      /^(?!<[hulo]|<li)(.+)$/gm,
      '<p class="text-slate-600 leading-relaxed my-4">$1</p>'
    )
    // Clean up
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
  const post = getPostBySlug(slug, locale as Locale);
  const t = translations[locale as Locale];

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const relatedPosts = getRelatedPosts(slug, locale as Locale, 2);
  const texts = articleTexts[locale as Locale] || articleTexts.it;

  const formattedDate = new Date(post.frontmatter.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const updatedDate = post.frontmatter.updatedAt
    ? new Date(post.frontmatter.updatedAt).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      {/* Schema.org JSON-LD */}
      <ArticleSchema post={post} locale={locale} />

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
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title - H1 unico */}
            <h1
              className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6"
              style={{ fontFamily: 'var(--font-old-standard), "Old Standard TT", serif' }}
            >
              {post.frontmatter.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {post.frontmatter.author.name}
              </span>
              <span>•</span>
              <time dateTime={post.frontmatter.date}>{formattedDate}</time>
              {post.frontmatter.readingTime && (
                <>
                  <span>•</span>
                  <span>
                    {post.frontmatter.readingTime} {texts.readingTime}
                  </span>
                </>
              )}
            </div>

            {updatedDate && (
              <p className="text-sm text-slate-400 mt-2">
                {texts.updated} {updatedDate}
              </p>
            )}
          </header>

          {/* Featured Image */}
          <figure className="mb-10 -mx-6 md:mx-0">
            <div className="aspect-video relative rounded-xl overflow-hidden">
              <Image
                src={post.frontmatter.image.src}
                alt={post.frontmatter.image.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
            <figcaption className="text-sm text-slate-500 text-center mt-3">
              {post.frontmatter.image.alt}
            </figcaption>
          </figure>

          {/* Table of Contents */}
          <TableOfContents
            headings={headings}
            title={tocTitle[locale as Locale]}
          />

          {/* Article Content */}
          <div className="prose-lg">
            <ArticleContent content={post.content} />
          </div>

          {/* Internal Link CTA */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-slate-700 mb-4">{texts.ctaText}</p>
            <Link
              href={`/${locale}#estensione`}
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              {texts.tryGetNearMe}
            </Link>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-5xl mx-auto px-6 mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              {texts.related}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.slug}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/${locale}/blog/${relatedPost.slug}`} className="block">
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={relatedPost.frontmatter.image.src}
                        alt={relatedPost.frontmatter.image.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      <Link
                        href={`/${locale}/blog/${relatedPost.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {relatedPost.frontmatter.title}
                      </Link>
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2">
                      {relatedPost.frontmatter.description}
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
