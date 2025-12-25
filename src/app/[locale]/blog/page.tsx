import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { getAllPosts } from "@/lib/mdx";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string }>;
};

// ============================================================================
// SEO DATA
// ============================================================================

const blogSeoData: Record<Locale, { title: string; description: string }> = {
  it: {
    title: "Blog - Guide e Consigli Immobiliari",
    description: "Articoli, guide e consigli per valutare immobili, confrontare opzioni e prendere decisioni consapevoli nel mercato immobiliare.",
  },
  en: {
    title: "Blog - Real Estate Guides and Tips",
    description: "Articles, guides and tips for evaluating properties, comparing options and making informed decisions in the real estate market.",
  },
  es: {
    title: "Blog - Guías y Consejos Inmobiliarios",
    description: "Artículos, guías y consejos para evaluar inmuebles, comparar opciones y tomar decisiones informadas en el mercado inmobiliario.",
  },
  fr: {
    title: "Blog - Guides et Conseils Immobiliers",
    description: "Articles, guides et conseils pour évaluer les biens, comparer les options et prendre des décisions éclairées sur le marché immobilier.",
  },
  ru: {
    title: "Блог - Руководства по Недвижимости",
    description: "Статьи, руководства и советы по оценке недвижимости, сравнению вариантов и принятию осознанных решений на рынке недвижимости.",
  },
  uk: {
    title: "Блог - Посібники з Нерухомості",
    description: "Статті, посібники та поради щодо оцінки нерухомості, порівняння варіантів та прийняття усвідомлених рішень на ринку нерухомості.",
  },
};

const blogTexts: Record<Locale, { heading: string; subheading: string; empty: string }> = {
  it: {
    heading: "Blog",
    subheading: "Guide, consigli e approfondimenti per orientarti nel mercato immobiliare",
    empty: "Nessun articolo disponibile al momento.",
  },
  en: {
    heading: "Blog",
    subheading: "Guides, tips and insights to navigate the real estate market",
    empty: "No articles available at the moment.",
  },
  es: {
    heading: "Blog",
    subheading: "Guías, consejos e información para orientarte en el mercado inmobiliario",
    empty: "No hay artículos disponibles en este momento.",
  },
  fr: {
    heading: "Blog",
    subheading: "Guides, conseils et informations pour vous orienter sur le marché immobilier",
    empty: "Aucun article disponible pour le moment.",
  },
  ru: {
    heading: "Блог",
    subheading: "Руководства, советы и информация для навигации на рынке недвижимости",
    empty: "На данный момент статей нет.",
  },
  uk: {
    heading: "Блог",
    subheading: "Посібники, поради та інформація для орієнтування на ринку нерухомості",
    empty: "На даний момент статей немає.",
  },
};

// ============================================================================
// STATIC PARAMS
// ============================================================================

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const seo = blogSeoData[locale as Locale] || blogSeoData.it;
  const baseUrl = "https://getnearme.it";

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${baseUrl}/${locale}/blog`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${baseUrl}/${locale}/blog`,
      type: "website",
    },
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const posts = getAllPosts(locale as Locale);
  const t = translations[locale as Locale];
  const texts = blogTexts[locale as Locale] || blogTexts.it;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: 'var(--font-old-standard), "Old Standard TT", serif' }}
          >
            {texts.heading}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {texts.subheading}
          </p>
        </header>

        {/* Articles Grid */}
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const formattedDate = new Date(post.frontmatter.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <article
                  key={post.slug}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <Link href={`/${locale}/blog/${post.slug}`} className="block">
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={post.frontmatter.image.src}
                        alt={post.frontmatter.image.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    </div>
                  </Link>

                  <div className="p-6">
                    {/* Tags */}
                    {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.frontmatter.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {post.frontmatter.title}
                      </Link>
                    </h2>

                    {/* Description */}
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {post.frontmatter.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <time dateTime={post.frontmatter.date}>{formattedDate}</time>
                      {post.frontmatter.readingTime && (
                        <span>{post.frontmatter.readingTime} min</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500">{texts.empty}</p>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center mt-16">
          <Link
            href={`/${locale}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {t.nav.backToHome.replace("← ", "")}
          </Link>
        </div>
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
