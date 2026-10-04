import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { FACTOR_TABLE } from '@/lib/valuation';
import ValuationWizard from '@/components/valuation/ValuationWizard';

// Pagina SEO per i proprietari: "quanto vale la mia casa", valutazione gratuita online basata sulle quotazioni OMI.
// Il risultato arriva per email (lead in valuation_leads): qui solo il percorso a passi e le spiegazioni. Solo in italiano.

const SLUG = 'quanto-vale-la-mia-casa';
const URL = `https://agenteimmo.me/it/${SLUG}`;
const TITLE = 'Quanto vale la mia casa? Valutazione gratuita online';
const DESCRIPTION = 'Scopri quanto vale la tua casa con la valutazione online gratuita: stima dalle quotazioni OMI dell\'Agenzia delle Entrate, ricevi il risultato via email.';
const UPDATED = '2026-10-05';

const FAQ: [string, string][] = [
  ['La valutazione è davvero gratuita?', 'Sì. Rispondi a poche domande sulla casa, lasci la tua email e ricevi la stima senza pagare niente e senza impegno. Non devi creare un account.'],
  ['Quanto è precisa la stima online?', 'È una stima indicativa: parte dalle quotazioni ufficiali OMI della tua zona e le corregge con piano, stato, extra e classe energetica. Di solito ti dà un\'idea giusta dell\'ordine di grandezza, ma non vede luce, vista, rumore o lo stato reale delle finiture. Per un prezzo preciso serve un sopralluogo o una perizia.'],
  ['Cosa sono le quotazioni OMI?', 'Sono i prezzi al metro quadro, minimo e massimo, che l\'Osservatorio del Mercato Immobiliare dell\'Agenzia delle Entrate pubblica ogni sei mesi per ogni zona di ogni comune italiano, divisi per tipo di immobile. Sono il riferimento pubblico più usato per una prima idea del valore.'],
  ['Perché il risultato arriva per email e non sulla pagina?', 'Così hai la valutazione sempre a portata di mano, con il dettaglio di come l\'abbiamo calcolata, e puoi rileggerla con calma o girarla a chi vuoi. L\'email arriva di solito entro un minuto.'],
  ['Quali metri quadri devo inserire?', 'I metri quadri commerciali: la superficie della casa compresi i muri, come sull\'atto o sulla planimetria catastale. Se non li sai con precisione va bene un numero indicativo: puoi sempre rifare la stima.'],
  ['Mi chiamerà qualcuno?', 'Solo se lo chiedi tu, spuntando la casella apposita: in quel caso un agente immobiliare della tua zona potrà contattarti per una valutazione più precisa. Altrimenti ricevi solo l\'email con la stima.'],
  ['La stima vale anche per l\'affitto?', 'No, questa valutazione riguarda il prezzo di vendita. Per l\'affitto le quotazioni OMI hanno valori diversi, in euro al metro quadro al mese.'],
];

const STEPS: [string, string][] = [
  ['Scrivi l\'indirizzo', 'Troviamo la zona della casa e le quotazioni OMI di quella zona.'],
  ['Rispondi a poche domande', 'Tipo di casa, metri quadri, piano, stato ed extra. Un minuto, una domanda alla volta.'],
  ['Ricevi la stima per email', 'Valore minimo, massimo e centrale, con tutte le correzioni spiegate.'],
];

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  openGraph: { type: 'website', url: URL, siteName: 'Agente Immo', locale: 'it_IT', title: TITLE, description: DESCRIPTION, images: ['/immo/home/staging-after.webp'] },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect(`/it/${SLUG}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication', name: 'Valutazione casa gratuita di Agente Immo', url: URL, description: DESCRIPTION, inLanguage: 'it-IT',
        applicationCategory: 'BusinessApplication', operatingSystem: 'Web', isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        provider: { '@type': 'Organization', name: 'Agente Immo', url: 'https://agenteimmo.me/it' },
      },
      {
        '@type': 'Service', name: 'Valutazione immobile online gratuita', serviceType: 'Stima del valore di una casa', areaServed: { '@type': 'Country', name: 'Italia' },
        provider: { '@type': 'Organization', name: 'Agente Immo', url: 'https://agenteimmo.me/it' }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, url: URL,
      },
      { '@type': 'BreadcrumbList', itemListElement: [['Agente Immo', 'https://agenteimmo.me/it'], ['Quanto vale la mia casa', URL]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
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
        <a href="#valuta" className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">Valuta gratis</a>
      </header>

      <main className="pb-24">
        <section className="bg-canvas">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-8 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-14 lg:pb-20 lg:pt-14">
            <div className="lg:pt-6">
              <nav aria-label="Percorso" className="text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Quanto vale la mia casa</span></nav>
              <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-5xl">Quanto vale la mia casa? <span className="text-brand">Valutazione gratuita</span></h1>
              <p className="mt-5 text-lg leading-relaxed text-muted">Per sapere quanto vale la tua casa scrivi l&apos;indirizzo e rispondi a poche domande: calcoliamo una stima dai prezzi ufficiali OMI della tua zona e te la mandiamo per email, gratis e senza impegno.</p>
              <ul className="mt-6 hidden space-y-2.5 text-[16px] lg:block">
                {['Prezzi ufficiali dell\'Agenzia delle Entrate, zona per zona', 'Valore minimo, massimo e centrale, con i calcoli spiegati', 'Un minuto, nessun account, nessun costo'].map(t => (
                  <li key={t} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check size={14} strokeWidth={3} /></span>{t}</li>
                ))}
              </ul>
            </div>
            <div id="valuta" className="scroll-mt-4"><ValuationWizard /></div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4">
          <section className="mt-14">
            <h2 className="font-display text-[28px] font-extrabold tracking-tight">Come funziona la valutazione</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="rounded-[24px] bg-canvas p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-display font-extrabold text-white">{i + 1}</span>
                  <span className="mt-3 block font-semibold">{t}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-muted">{d}</span>
                </li>
              ))}
            </ol>
          </section>

          <article className="guide mt-4">
            <section id="omi">
              <h2>Da dove vengono i prezzi: le quotazioni OMI</h2>
              <p>L&apos;Osservatorio del Mercato Immobiliare (OMI) dell&apos;Agenzia delle Entrate divide ogni comune italiano in zone omogenee e, ogni sei mesi, pubblica per ciascuna un prezzo minimo e uno massimo al metro quadro, distinti per tipo di immobile: abitazioni civili, signorili, economiche, ville e villini.</p>
              <p>Sono valori ufficiali e pubblici, calcolati sulle compravendite e sulle offerte della zona. Per questo li usiamo come base: la stima parte dalla quotazione della zona in cui si trova la tua casa, non da una media nazionale.</p>
              <p>Le quotazioni OMI si riferiscono a case in stato normale. Una casa ristrutturata, all&apos;ultimo piano con ascensore o con il box vale di più; una da rifare o al piano terra vale di meno. Per questo applichiamo qualche correzione.</p>
            </section>
            <section id="fattori">
              <h2>Cosa cambia il valore della tua casa</h2>
              <p>Ogni correzione è una percentuale sommata alle altre, sempre tra il -35% e il +35% del prezzo OMI. Nell&apos;email trovi quelle applicate alla tua casa.</p>
              <div className="not-prose mt-5 overflow-hidden rounded-[24px] ring-1 ring-black/5">
                <table className="w-full text-left text-[15px]">
                  <thead className="bg-canvas"><tr><th className="px-4 py-3 font-semibold">Caratteristica</th><th className="px-4 py-3 text-right font-semibold">Correzione</th></tr></thead>
                  <tbody>{FACTOR_TABLE.map(([k, v]) => <tr key={k} className="border-t border-line"><td className="px-4 py-3">{k}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{v}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
            <section id="metri">
              <h2>Come calcolare i metri quadri</h2>
              <p>Il prezzo al metro quadro si moltiplica per la superficie commerciale: la superficie interna più i muri. Balconi, terrazzi e cantine contano solo in parte, per questo nella valutazione li indichi a parte come extra.</p>
              <p>Il dato più comodo è quello della visura o della planimetria catastale. Se non lo hai, misura le stanze e aggiungi circa il 10% per i muri.</p>
            </section>
            <section id="perizia">
              <h2>Stima online o perizia: che differenza c&apos;è</h2>
              <p>La stima online ti dice in un minuto in che fascia di prezzo si trova la tua casa: è utile per capire se vale la pena vendere, per confrontare le proposte delle agenzie o per fissare un prezzo di partenza realistico.</p>
              <p>Una perizia, invece, la fa un tecnico abilitato dopo aver visto la casa e i documenti: serve per un mutuo, una successione o una causa. Se vuoi un prezzo preciso per vendere, il passo successivo è far vedere la casa a un agente immobiliare della zona.</p>
            </section>
            <section id="domande">
              <h2>Domande frequenti</h2>
              {FAQ.map(([q, a]) => (<div key={q}><h3>{q}</h3><p>{a}</p></div>))}
            </section>
          </article>

          <aside className="mt-16 rounded-[32px] bg-ink px-6 py-12 text-center text-white">
            <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight">Scopri quanto vale la tua casa</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">Un minuto, gratis, senza impegno. La stima ti arriva per email.</p>
            <a href="#valuta" className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-semibold text-ink max-sm:w-full">Valuta la tua casa</a>
            <p className="mt-6 text-xs text-white/50">Stima indicativa basata sulle quotazioni OMI, non è una perizia. Aggiornata il <time dateTime={UPDATED}>5 ottobre 2026</time>.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
