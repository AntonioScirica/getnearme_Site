import type { Metadata } from 'next';
import { immoMeta } from '@/lib/ogMeta';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { guideBySlug } from '@/lib/guides';
import { AGENT_TOPICS, PILLAR } from '@/lib/guides/related';
import { SiteFooter } from '@/components/landing/AgenteImmoLanding';
import { breadcrumbs, ORG_ID, SITE_ID } from '@/lib/seo';

// Indice delle guide per agenti immobiliari, divise per argomento (gruppi in src/lib/guides/related.ts). Solo in italiano.
const URL = 'https://agenteimmo.me/it/guide';
const TITLE = 'Guide per agenti immobiliari: incarichi, annunci, social';
const DESCRIPTION = 'Tutte le guide gratuite di Agente Immo per agenti immobiliari: acquisire incarichi, scrivere annunci, home staging, video, social, software e provvigioni.';
const TRY = '/it/accedi?next=/it/prova';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  ...immoMeta({ title: TITLE, description: DESCRIPTION, url: URL, card: { title: 'Guide per agenti immobiliari', subtitle: 'Incarichi, annunci, home staging, video, social e provvigioni. Gratis.' } }),
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it/guide');
  const pillar = guideBySlug(PILLAR)!;
  const topics = AGENT_TOPICS.map(t => ({ ...t, guides: t.slugs.map(s => guideBySlug(s)).filter(g => !!g) }));
  const all = [pillar, ...topics.flatMap(t => t.guides)];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': URL, name: TITLE, description: DESCRIPTION, url: URL, inLanguage: 'it-IT', isPartOf: { '@id': SITE_ID }, publisher: { '@id': ORG_ID } },
      { '@type': 'ItemList', itemListElement: all.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.label, url: `https://agenteimmo.me/it/${g.slug}` })) },
      breadcrumbs([['Agente Immo', 'https://agenteimmo.me/it'], ['Guide per agenti immobiliari', URL]]),
    ],
  };

  return (
    <div className={`${platformFontVars} min-h-screen bg-white font-body text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/it" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/immo/logo-mark.png" alt="Agente Immo" className="h-8 w-8" /><span className="whitespace-nowrap">Agente <span className="text-brand">Immo</span></span>
        </Link>
        <Link href={TRY} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">Prova gratis <ArrowRight size={15} /></Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Guide per agenti immobiliari</span></nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">Guide per agenti immobiliari</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Guide pratiche e gratuite per chi fa l&apos;agente immobiliare in Italia: come acquisire più incarichi, presentare meglio gli immobili, farsi conoscere nella propria zona e scegliere gli strumenti giusti. Scritte da Agente Immo, aggiornate nel 2026, con le norme citate quando servono.</p>
        <p className="mt-6 rounded-[24px] bg-canvas p-5 text-[17px] leading-relaxed"><strong>Da dove partire:</strong> se vuoi il quadro completo del mestiere (cosa fa un agente immobiliare, requisiti, provvigioni, strumenti) leggi prima la guida pilastro, poi scegli l&apos;argomento che ti serve.</p>

        <Link href={`/it/${pillar.slug}`} className="group mt-8 flex items-center gap-5 rounded-[28px] bg-ink p-6 text-white ease-smooth transition-shadow hover:shadow-md">
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold">{pillar.h1}</span>
            <span className="mt-1 block text-sm text-white/70">{pillar.description}</span>
          </span>
          <ArrowRight size={20} className="shrink-0 ease-smooth transition-transform group-hover:translate-x-0.5" />
        </Link>

        {topics.map(t => (
          <section key={t.id} id={t.id} className="mt-12 scroll-mt-8">
            <h2 className="font-display text-[26px] font-extrabold tracking-tight">{t.title}</h2>
            <p className="mt-1 text-[15px] text-muted">{t.text}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {t.guides.map(g => (
                <li key={g.slug}><Link href={`/it/${g.slug}`} className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">{g.label}</span><span className="mt-1 block text-sm text-muted">{g.description}</span></Link></li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-14">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Per i tuoi clienti che vendono casa</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Guide semplici da girare ai proprietari: <Link href="/it/vendere-casa" className="font-semibold text-brand underline underline-offset-4">vendere casa passo passo</Link>, la <Link href="/it/quanto-vale-la-mia-casa" className="font-semibold text-brand underline underline-offset-4">valutazione gratuita della casa</Link> e i <Link href="/it/prezzi-case" className="font-semibold text-brand underline underline-offset-4">prezzi delle case al metro quadro per città</Link>. Altri articoli sono nel <Link href="/it/blog" className="font-semibold text-brand underline underline-offset-4">blog di Agente Immo</Link>.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
