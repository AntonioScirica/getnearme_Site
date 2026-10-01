import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import { termsContent } from "@/lib/legalContent";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/landing/AgenteImmoLanding";

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
    title: `${content.title} — Agente Immo`,
    description: content.description,
    alternates: {
      canonical: `https://agenteimmo.me/${locale}/termini`,
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

      {/* telefono: la barra e' gia' nel flusso, 128px sopra lasciavano un vuoto */}
      <main className="pt-32 max-sm:pt-8 pb-20 px-4 max-w-4xl mx-auto">
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

      {/* stesso footer del resto del sito (prima uno blu scuro diverso, con l'anno scritto a mano) */}
      <SiteFooter lang={locale === "en" ? "en" : "it"} />
    </div>
  );
}
