import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { termsContent } from "@/lib/legalContent";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const content = termsContent[locale as Locale];

  return {
    title: `${content.title} — GetNearMe`,
    description: content.description,
    alternates: {
      canonical: `https://getnearme.it/${locale}/termini`,
    },
  };
}

export default async function TerminiServizio({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];
  const content = termsContent[locale as Locale];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href={`/${locale}`} className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            {t.nav.backToHome}
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-serif font-bold text-slate-900">{content.title}</h1>
          <p className="text-slate-500 text-sm mb-8">{content.lastUpdated}</p>

          {content.blocks.map((block, i) => {
            switch (block.type) {
              case "h2":
                return <h2 key={i} className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">{block.text}</h2>;
              case "h3":
                return <h3 key={i} className="text-xl font-serif font-bold text-slate-900 mt-6 mb-3">{block.text}</h3>;
              case "p":
                return <p key={i} className="text-slate-600 leading-relaxed whitespace-pre-line">{block.text}</p>;
              case "ul":
                return (
                  <ul key={i} className="text-slate-600 leading-relaxed">
                    {block.items.map((item, j) => {
                      const colonIdx = item.indexOf(":");
                      if (colonIdx > 0 && colonIdx < 40) {
                        return (
                          <li key={j}>
                            <strong>{item.slice(0, colonIdx + 1)}</strong>{item.slice(colonIdx + 1)}
                          </li>
                        );
                      }
                      return <li key={j}>{item}</li>;
                    })}
                  </ul>
                );
            }
          })}
        </article>
      </main>

      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2026 GetNearMe. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
