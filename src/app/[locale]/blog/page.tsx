import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { getPublishedArticles } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import BlogContent from "./BlogContent";
import { tagCategories, blogTexts } from "./blogData";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
};

// ============================================================================
// SEO DATA
// ============================================================================

const blogSeoData: Record<Locale, { title: string; description: string }> = {
  it: {
    title: "Blog - Guide e Consigli Immobiliari",
    description:
      "Articoli, guide e consigli per valutare immobili, confrontare opzioni e prendere decisioni consapevoli nel mercato immobiliare.",
  },
  en: {
    title: "Blog - Real Estate Guides and Tips",
    description:
      "Articles, guides and tips for evaluating properties, comparing options and making informed decisions in the real estate market.",
  },
  es: {
    title: "Blog - Guías y Consejos Inmobiliarios",
    description:
      "Artículos, guías y consejos para evaluar inmuebles, comparar opciones y tomar decisiones informadas en el mercado inmobiliario.",
  },
  fr: {
    title: "Blog - Guides et Conseils Immobiliers",
    description:
      "Articles, guides et conseils pour évaluer les biens, comparer les options et prendre des décisions éclairées sur le marché immobilier.",
  },
  ru: {
    title: "Блог - Руководства по Недвижимости",
    description:
      "Статьи, руководства и советы по оценке недвижимости, сравнению вариантов и принятию осознанных решений на рынке недвижимости.",
  },
  uk: {
    title: "Блог - Посібники з Нерухомості",
    description:
      "Статті, посібники та поради щодо оцінки нерухомості, порівняння варіантів та прийняття усвідомлених рішень на ринку нерухомості.",
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

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tag } = await searchParams;
  const allArticles = await getPublishedArticles(locale as Locale);
  const t = translations[locale as Locale];
  const texts = blogTexts[locale as Locale] || blogTexts.it;

  // Extract existing tags and build categories
  const existingTags = new Set(
    allArticles.flatMap((article) => article.tags || [])
  );

  const categoriesWithTags: Record<string, string[]> = {};
  for (const [categoryKey, category] of Object.entries(tagCategories)) {
    const tagsInCategory = category.tags.filter((t) => existingTags.has(t));
    if (tagsInCategory.length > 0) {
      categoriesWithTags[categoryKey] = tagsInCategory;
    }
  }

  // Count articles per tag
  const tagCounts: Record<string, number> = {};
  allArticles.forEach((article) => {
    article.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  // Filter articles
  const filteredArticles = tag
    ? allArticles.filter((article) => article.tags?.includes(tag))
    : allArticles;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 font-inter">
            {texts.heading}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            {texts.subheading}
          </p>
        </header>

        <BlogContent
          articles={filteredArticles}
          allArticles={allArticles}
          locale={locale as Locale}
          activeTag={tag || null}
          categoriesWithTags={categoriesWithTags}
          tagCounts={tagCounts}
          texts={texts}
        />

        {/* Back to home */}
        <div className="text-center mt-12">
          <a
            href={`/${locale}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {t.nav.backToHome.replace("← ", "")}
          </a>
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
