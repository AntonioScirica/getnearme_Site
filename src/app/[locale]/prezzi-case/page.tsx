import type { Metadata } from 'next';
import { immoMeta } from '@/lib/ogMeta';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { CITIES, OMI_ANNO, OMI_CREDIT, OMI_SEMESTRE, eur } from '@/lib/omiCitta';
import { HomeownerHeader, ValuationAside, ValuationCard } from '@/components/valuation/HomeownerCta';
import { SiteFooter } from '@/components/landing/AgenteImmoLanding';

// Indice delle pagine "Prezzo case <città> al metro quadro": tutte le città, per regione e per prezzo. Solo in italiano.
const URL = 'https://agenteimmo.me/it/prezzi-case';
const TITLE = `Prezzi case al metro quadro: le città italiane ${OMI_ANNO}`;
const DESCRIPTION = `Prezzi delle case al metro quadro nelle ${CITIES.length} principali città italiane, zona per zona, dalle quotazioni OMI ${OMI_ANNO}. Confronta e calcola gratis il valore.`;

const FAQ: [string, string][] = [
  ['Da dove vengono questi prezzi?', `Dalle quotazioni dell'Osservatorio del Mercato Immobiliare (OMI) dell'Agenzia delle Entrate, ${OMI_SEMESTRE}, pubblicate con licenza CC BY 4.0. Per ogni zona di ogni comune l'OMI indica un valore minimo e massimo in euro al metro quadro per tipo di immobile.`],
  ['Cosa significa la media della città?', 'È la media dei valori minimi e massimi delle abitazioni civili in stato normale in tutte le zone OMI del comune. Serve a confrontare le città tra loro: per la tua casa conta la quotazione della tua zona.'],
  ['Ogni quanto si aggiornano le quotazioni?', 'L\'Agenzia delle Entrate pubblica le quotazioni OMI ogni sei mesi. Aggiorniamo queste pagine quando esce un nuovo semestre.'],
  ['Il prezzo OMI è il prezzo a cui vendo la casa?', 'No. È un intervallo di riferimento per case in stato normale nella zona. Il prezzo della tua casa dipende anche da piano, stato, luce, extra e trattativa. Per una stima sulla tua casa usa la valutazione gratuita.'],
];

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  ...immoMeta({ title: TITLE, description: DESCRIPTION, url: URL, card: { title: 'Prezzi delle case al m² nelle città italiane', subtitle: `Quotazioni OMI ${OMI_ANNO}, zona per zona. Confronta e calcola gratis il valore.` } }),
};

const avg = (c: (typeof CITIES)[number]) => (c.s.avgMin + c.s.avgMax) / 2;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it/prezzi-case');
  const byPrice = [...CITIES].sort((a, b) => avg(b) - avg(a));
  const regioni = [...new Set(CITIES.map(c => c.regione))].sort((a, b) => a.localeCompare(b, 'it'));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', name: TITLE, description: DESCRIPTION, url: URL, inLanguage: 'it-IT', isPartOf: { '@type': 'WebSite', name: 'Agente Immo', url: 'https://agenteimmo.me/it' } },
      { '@type': 'ItemList', itemListElement: byPrice.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: `Prezzo case ${c.nome}`, url: `${URL}/${c.slug}` })) },
      { '@type': 'BreadcrumbList', itemListElement: [['Agente Immo', 'https://agenteimmo.me/it'], ['Prezzi delle case', URL]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };

  return (
    <div className={`${platformFontVars} min-h-screen bg-white font-body text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeownerHeader />
      <main className="mx-auto max-w-4xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Prezzi delle case</span></nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">Prezzi delle case al metro quadro nelle città italiane</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Quanto costa una casa al metro quadro nelle {CITIES.length} principali città italiane: la media di ogni città e, aprendo la sua pagina, i prezzi zona per zona. Valori ufficiali OMI dell&apos;Agenzia delle Entrate, {OMI_SEMESTRE}.</p>

        <ValuationCard />

        <section className="mt-4">
          <h2 className="font-display text-[28px] font-extrabold tracking-tight">Le città dalla più cara alla più economica</h2>
          <p className="mt-2 text-[15px] text-muted">Media delle abitazioni civili in stato normale, in euro al metro quadro.</p>
          <ol className="mt-5 grid gap-x-6 sm:grid-cols-2">
            {byPrice.map((c, i) => (
              <li key={c.slug} className="border-t border-line">
                <Link href={`/it/prezzi-case/${c.slug}`} className="flex min-h-12 items-center gap-3 py-2.5 hover:text-brand">
                  <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1 font-semibold">{c.nome}</span>
                  <span className="shrink-0 tabular-nums">{eur(c.s.avgMin)} - {eur(c.s.avgMax)} €/m²</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-[28px] font-extrabold tracking-tight">Prezzi delle case per regione</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regioni.map(r => (
              <div key={r} className="rounded-[24px] bg-canvas p-5">
                <div className="font-semibold">{r}</div>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[15px]">
                  {CITIES.filter(c => c.regione === r).map(c => <li key={c.slug}><Link href={`/it/prezzi-case/${c.slug}`} className="inline-flex min-h-10 items-center text-brand underline underline-offset-4 md:min-h-0">{c.nome}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <article className="guide mt-4">
          <section id="come-leggere">
            <h2>Come leggere i prezzi al metro quadro</h2>
            <p>Ogni città è divisa dall&apos;OMI in zone omogenee: centro, semicentro, periferia, zone suburbane ed extraurbane. Per ogni zona l&apos;Agenzia delle Entrate pubblica un prezzo minimo e uno massimo al metro quadro. La media della città che vedi qui serve solo a confrontare le città: dentro la stessa città, tra il centro e la periferia, il prezzo può anche raddoppiare.</p>
            <p>Per capire quanto vale la tua casa parti dalla quotazione della tua zona, moltiplicala per la <Link href="/it/superficie-commerciale">superficie commerciale</Link> e correggi per piano, stato ed extra. Trovi il metodo completo nella guida <Link href="/it/come-valutare-una-casa">come valutare una casa</Link>, la spiegazione dei dati in <Link href="/it/quotazioni-omi">quotazioni OMI: cosa sono</Link> e tutte le guide per chi vende in <Link href="/it/vendere-casa">Vendere casa</Link>. Oppure fai tutto in un minuto con la <Link href="/it/quanto-vale-la-mia-casa#valuta">valutazione gratuita della casa</Link>.</p>
          </section>
          <section id="domande">
            <h2>Domande frequenti</h2>
            {FAQ.map(([q, a]) => (<div key={q}><h3>{q}</h3><p>{a}</p></div>))}
          </section>
        </article>

        <ValuationAside note={`${OMI_CREDIT}. Stime indicative, non sono perizie.`} />
      </main>
      <SiteFooter />
    </div>
  );
}
