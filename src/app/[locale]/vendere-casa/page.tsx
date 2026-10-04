import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { GUIDES } from '@/lib/guides';
import { CITIES, eur } from '@/lib/omiCitta';
import { HomeownerHeader, ValuationAside, ValuationCard } from '@/components/valuation/HomeownerCta';
import { SiteFooter } from '@/components/landing/AgenteImmoLanding';

// Hub "Per chi vende casa": valutazione gratuita, guide per i proprietari (Guide con audience 'proprietari'),
// prezzi delle case per città. Solo in italiano.
const URL = 'https://agenteimmo.me/it/vendere-casa';
const TITLE = 'Vendere casa: guide, prezzi e valutazione gratuita';
const DESCRIPTION = 'Vendere casa passo passo: quanto vale, quanto costa vendere, documenti, tasse e tempi. Guide semplici, prezzi al m² per città e valutazione gratis.';
const TOP = ['milano', 'roma', 'napoli', 'torino', 'bologna', 'firenze', 'genova', 'palermo', 'bari', 'venezia', 'verona', 'catania'];

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  openGraph: { type: 'website', url: URL, siteName: 'Agente Immo', locale: 'it_IT', title: TITLE, description: DESCRIPTION, images: ['/immo/home/staging-after.webp'] },
};

// guide in ordine di percorso: prima il valore, poi costi e carte, poi come e quando vendere
const STEPS: [string, string[]][] = [
  ['1. Capire quanto vale la casa', ['come-valutare-una-casa', 'quotazioni-omi', 'superficie-commerciale']],
  ['2. Costi, documenti e tasse', ['quanto-costa-vendere-casa', 'documenti-per-vendere-casa', 'plusvalenza-vendita-casa']],
  ['3. Preparare e vendere', ['quando-conviene-vendere-casa', 'cosa-fare-prima-di-vendere-casa', 'come-vendere-casa-velocemente', 'vendere-casa-senza-agenzia']],
];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it/vendere-casa');
  const owners = GUIDES.filter(g => g.audience === 'proprietari');
  const listed = new Set(STEPS.flatMap(([, s]) => s));
  // guide per proprietari aggiunte in futuro e non ancora in un passo: in fondo all'ultimo
  const steps = STEPS.map(([t, slugs], i) => [t, [...slugs, ...(i === STEPS.length - 1 ? owners.filter(g => !listed.has(g.slug)).map(g => g.slug) : [])].map(s => owners.find(g => g.slug === s)).filter(g => !!g)] as const);
  const top = TOP.map(s => CITIES.find(c => c.slug === s)!).filter(Boolean);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: TITLE, description: DESCRIPTION, url: URL, inLanguage: 'it-IT', isPartOf: { '@type': 'WebSite', name: 'Agente Immo', url: 'https://agenteimmo.me/it' } },
      { '@type': 'ItemList', itemListElement: [{ name: 'Quanto vale la mia casa? Valutazione gratuita', url: 'https://agenteimmo.me/it/quanto-vale-la-mia-casa' }, ...owners.map(g => ({ name: g.label, url: `https://agenteimmo.me/it/${g.slug}` })), { name: 'Prezzi delle case per città', url: 'https://agenteimmo.me/it/prezzi-case' }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })) },
      { '@type': 'BreadcrumbList', itemListElement: [['Agente Immo', 'https://agenteimmo.me/it'], ['Vendere casa', URL]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
    ],
  };

  return (
    <div className={`${platformFontVars} min-h-screen bg-white font-body text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeownerHeader />
      <main className="mx-auto max-w-4xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Vendere casa</span></nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">Vendere casa: tutto quello che ti serve sapere</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Stai pensando di vendere casa? Qui trovi, in ordine, i passi da fare: capire quanto vale, sapere quanto costa vendere e quali documenti servono, preparare la casa e scegliere come venderla. Guide scritte in modo semplice, senza parole difficili.</p>

        <ValuationCard />

        {steps.map(([t, gs]) => (
          <section key={t} className="mt-12">
            <h2 className="font-display text-[26px] font-extrabold tracking-tight">{t}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {gs.map(g => (
                <li key={g.slug}><Link href={`/it/${g.slug}`} className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">{g.label}</span><span className="mt-1 block text-sm text-muted">{g.description}</span></Link></li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-14">
          <h2 className="font-display text-[26px] font-extrabold tracking-tight">Prezzi delle case al metro quadro per città</h2>
          <p className="mt-2 text-[15px] text-muted">Quotazioni OMI zona per zona nelle principali città italiane.</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {top.map(c => (
              <li key={c.slug}><Link href={`/it/prezzi-case/${c.slug}`} className="block h-full rounded-[20px] bg-canvas p-4 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">{c.nome}</span><span className="mt-0.5 block text-sm tabular-nums text-muted">{eur(c.s.avgMin)} - {eur(c.s.avgMax)} €/m²</span></Link></li>
            ))}
          </ul>
          <p className="mt-5 text-[15px]"><Link href="/it/prezzi-case" className="font-semibold text-brand underline underline-offset-4">Tutte le {CITIES.length} città</Link></p>
        </section>

        <ValuationAside />
      </main>
      <SiteFooter />
    </div>
  );
}
