import type { Metadata } from 'next';
import { immoMeta } from '@/lib/ogMeta';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { SiteFooter } from '@/components/landing/AgenteImmoLanding';
import { breadcrumbs, ORGANIZATION, ORG_DESCRIPTION, SITE_ID } from '@/lib/seo';
import { CITIES, OMI_SEMESTRE } from '@/lib/omiCitta';

// "Chi siamo": chi c'e' dietro Agente Immo, cosa fa e i dati aziendali (gli stessi delle note legali). Solo fatti veri.
const URL = 'https://agenteimmo.me/it/chi-siamo';
const TITLE = 'Chi siamo: Agente Immo, software per agenti immobiliari';
const DESCRIPTION = 'Agente Immo è la piattaforma per agenti immobiliari italiani: foto arredate con l\'AI, video e sito per ogni immobile. Nata a Roma, fondata da Antonio Scirica.';
const TRY = '/it/accedi?next=/it/prova';

const FACTS: [string, string][] = [
  ['Nome', 'Agente Immo'],
  ['Sito', 'agenteimmo.me'],
  ['Cosa fa', 'Piattaforma per agenti immobiliari italiani: foto arredate con l\'AI, video per i social, sito personale e report per ogni immobile'],
  ['Fondatore', 'Antonio Scirica'],
  ['CTO', 'Federico'],
  ['Sede', 'Viale Pretoriano 3, Roma (RM)'],
  ['Partita IVA', '16096461005'],
  ['Lancio', 'Autunno 2026'],
  ['Contatti', 'info@agenteimmo.me'],
];

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  ...immoMeta({ title: TITLE, description: DESCRIPTION, url: URL, card: { title: 'Chi siamo', subtitle: 'La piattaforma per agenti immobiliari italiani: foto arredate con l\'AI, video e sito. Nata a Roma.' } }),
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it/chi-siamo');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'AboutPage', '@id': URL, url: URL, name: TITLE, description: DESCRIPTION, inLanguage: 'it-IT', isPartOf: { '@id': SITE_ID }, mainEntity: { '@id': ORGANIZATION['@id'] } },
      ORGANIZATION,
      breadcrumbs([['Agente Immo', 'https://agenteimmo.me/it'], ['Chi siamo', URL]]),
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

      <main className="mx-auto max-w-3xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Chi siamo</span></nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">Chi siamo</h1>
        <p className="mt-6 rounded-[24px] bg-canvas p-5 text-[17px] leading-relaxed"><strong>In breve:</strong> {ORG_DESCRIPTION}</p>

        <article className="guide mt-4">
          <section id="cosa-facciamo">
            <h2>Cosa fa Agente Immo</h2>
            <p>Un <Link href="/it/agente-immobiliare">agente immobiliare</Link> passa molte ore lontano dai clienti: foto da sistemare, annunci da scrivere, video da montare, siti da aggiornare. Agente Immo serve a fare questo lavoro in pochi minuti per ogni immobile, così resta più tempo per acquisire incarichi e trattare.</p>
            <ul>
              <li><strong>Foto arredate con l&apos;AI</strong>: <Link href="/it/home-staging-virtuale">home staging virtuale</Link> delle stanze vuote o datate, senza cambiare muri, finestre e dimensioni.</li>
              <li><strong>Video per i social</strong>: clip verticali per Instagram e TikTok a partire dalle foto dell&apos;immobile.</li>
              <li><strong>Il sito dell&apos;agente</strong>: una pagina personale con gli immobili, da mandare ai proprietari e ai clienti.</li>
              <li><strong>Annunci e report</strong> per ogni immobile.</li>
            </ul>
            <p>Si prova gratis su una propria foto; i piani a pagamento sono descritti nella <Link href="/it#prezzi">pagina dei prezzi</Link>.</p>
          </section>

          <section id="per-chi-vende">
            <h2>Per chi vende casa</h2>
            <p>Per i proprietari pubblichiamo strumenti e guide gratuite: la <Link href="/it/quanto-vale-la-mia-casa">valutazione gratuita della casa</Link>, i <Link href="/it/prezzi-case">prezzi delle case al metro quadro in {CITIES.length} città</Link> e le <Link href="/it/vendere-casa">guide per vendere casa</Link>. I prezzi vengono dalle quotazioni OMI dell&apos;Agenzia delle Entrate ({OMI_SEMESTRE}, licenza CC BY 4.0).</p>
          </section>

          <section id="chi-ce-dietro">
            <h2>Chi c&apos;è dietro Agente Immo</h2>
            <p>Agente Immo è stata fondata da <strong>Antonio Scirica</strong> ed è sviluppata a Roma insieme a <strong>Federico</strong>, CTO. La piattaforma è stata lanciata nell&apos;autunno 2026 ed è pensata per il mercato immobiliare italiano: lingua, norme e abitudini degli agenti italiani.</p>
          </section>

          <section id="come-scriviamo">
            <h2>Come scriviamo le guide</h2>
            <p>Le <Link href="/it/guide">guide per agenti immobiliari</Link> e quelle per chi vende casa spiegano il lavoro di tutti i giorni in modo pratico. Quando citiamo una norma indichiamo il riferimento (per esempio la Legge 39/1989 sulla mediazione o il Codice civile), quando citiamo un dato indichiamo la fonte e la data. Non inventiamo statistiche: se un valore cambia da caso a caso, diciamo da cosa dipende. Ogni guida riporta la data dell&apos;ultimo aggiornamento.</p>
          </section>

          <section id="dati">
            <h2>Dati aziendali</h2>
            <div className="not-prose mt-5 overflow-hidden rounded-[24px] ring-1 ring-black/5">
              <table className="w-full text-left text-[15px]">
                <tbody>{FACTS.map(([k, v]) => <tr key={k} className="border-t border-line first:border-t-0"><th scope="row" className="w-36 bg-canvas px-4 py-3 align-top font-semibold">{k}</th><td className="px-4 py-3">{v}</td></tr>)}</tbody>
              </table>
            </div>
            <p>Agente Immo è il nome commerciale con cui opera Antonio Scirica. Trovi tutti i dettagli nei <Link href="/it/termini">termini di servizio</Link> e nell&apos;<Link href="/it/privacy">informativa sulla privacy</Link>. Per scriverci: <a href="mailto:info@agenteimmo.me">info@agenteimmo.me</a>.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
