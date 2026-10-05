import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { CITIES, FASCE, aCity, OMI_CREDIT, OMI_SEMESTRE, OMI_SOURCE_URL, cityBySlug, cityDescription, cityFaq, cityParagraphs, cityTitle, cityUrl, eur, valuationHref, worth, zoneOf, type City, type CityZone } from '@/lib/omiCitta';
import { HomeownerHeader, ValuationAside, ValuationCard } from '@/components/valuation/HomeownerCta';
import { SiteFooter } from '@/components/landing/AgenteImmoLanding';

// "Prezzo case <città> al metro quadro": una pagina per ognuna delle grandi città in src/data/omiCitta.json
// (quotazioni OMI per zona, riassunte da scripts/omi-citta.mjs). Solo in italiano, tutte generate al build.
export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; citta: string }> };
const INDEX = 'https://agenteimmo.me/it/prezzi-case';

export function generateStaticParams() {
  return locales.flatMap(locale => CITIES.map(c => ({ locale, citta: c.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = cityBySlug((await params).citta);
  if (!c) return {};
  const url = cityUrl(c.slug), title = cityTitle(c), description = cityDescription(c);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: { it: url, 'x-default': url } },
    openGraph: { type: 'website', url, siteName: 'Agente Immo', locale: 'it_IT', title, description, images: ['/immo/home/staging-after.webp'] },
  };
}

const range = (r: [number, number] | null) => (r ? `${eur(r[0])} - ${eur(r[1])}` : '')

function ZoneRow({ z }: { z: CityZone }) {
  const other = !z.civ && (z.eco ? `${range(z.eco)} (economiche)` : z.vil ? `${range(z.vil)} (ville)` : '');
  return (
    <tr className="border-t border-line align-top">
      <td className="py-3 pl-4 pr-2"><span className="font-semibold tabular-nums">{z.c}</span><span className="block text-[14px] leading-snug text-muted">{z.d}</span></td>
      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{z.civ ? range(z.civ) : <span className="text-[14px] text-muted">{other || 'n.d.'}</span>}</td>
      <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right tabular-nums text-muted">{z.sig ? range(z.sig) : ''}</td>
    </tr>
  );
}

function ZoneLink({ c, code }: { c: City; code: string }) {
  const z = zoneOf(c, code);
  return <li className="flex items-baseline justify-between gap-3 border-t border-line py-2.5 first:border-t-0"><span className="min-w-0"><span className="font-semibold">{z.c}</span> <span className="text-muted">{z.d}</span></span><span className="shrink-0 font-semibold tabular-nums">{range(z.civ)} €/m²</span></li>;
}

export default async function Page({ params }: Props) {
  const { locale, citta } = await params;
  const c = cityBySlug(citta);
  if (!c) notFound();
  if (locale !== 'it') permanentRedirect(`/it/prezzi-case/${c.slug}`);
  const url = cityUrl(c.slug), faq = cityFaq(c), s = c.s;
  const cta = valuationHref(c);
  const fasce = Object.keys(FASCE).map(f => [f, c.zone.filter(z => z.f === f)] as const).filter(([, zs]) => zs.length);
  const vicine = c.vicine.map(cityBySlug).filter((x): x is City => !!x);
  const regione = CITIES.filter(o => o !== c && o.regione === c.regione && !c.vicine.includes(o.slug)).slice(0, 4);
  // città con prezzi medi vicini (2 sopra e 2 sotto in classifica): così anche le città isolate ricevono link
  const shown = new Set([c.slug, ...vicine.map(o => o.slug), ...regione.map(o => o.slug)]);
  const byPrice = [...CITIES].sort((a, b) => (b.s.avgMin + b.s.avgMax) - (a.s.avgMin + a.s.avgMax));
  const at = byPrice.indexOf(c);
  const simili = [byPrice[at - 1], byPrice[at + 1], byPrice[at - 2], byPrice[at + 2]].filter((o): o is City => !!o && !shown.has(o.slug)).slice(0, 4);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset', name: `Prezzi delle case a ${c.nome} al metro quadro per zona OMI, ${OMI_SEMESTRE}`, url, inLanguage: 'it-IT',
        description: `Quotazioni minime e massime in euro al metro quadro delle abitazioni civili e signorili nelle ${s.n} zone OMI del comune di ${c.nome} (${c.prov}), ${OMI_SEMESTRE}, con medie della città. Dati dell'Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate rielaborati da Agente Immo.`,
        license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, isBasedOn: OMI_SOURCE_URL,
        creator: { '@type': 'Organization', name: 'Agenzia delle Entrate, Osservatorio del Mercato Immobiliare', url: 'https://www.agenziaentrate.gov.it' },
        publisher: { '@type': 'Organization', name: 'Agente Immo', url: 'https://agenteimmo.me/it' },
        temporalCoverage: '2025-07-01/2025-12-31',
        spatialCoverage: { '@type': 'Place', name: `${c.nome}, ${c.regione}, Italia`, ...(c.lat ? { geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lon } } : {}) },
        variableMeasured: ['Prezzo minimo al metro quadro (EUR)', 'Prezzo massimo al metro quadro (EUR)'],
      },
      { '@type': 'BreadcrumbList', itemListElement: [['Agente Immo', 'https://agenteimmo.me/it'], ['Prezzi delle case', INDEX], [c.nome, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };

  return (
    <div className={`${platformFontVars} min-h-screen bg-white font-body text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeownerHeader href={cta} />

      <main className="mx-auto max-w-3xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted">
          <Link href="/it" className="hover:text-ink">Agente Immo</Link> / <Link href="/it/prezzi-case" className="hover:text-ink">Prezzi delle case</Link> / <span>{c.nome}</span>
        </nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">Prezzo delle case {aCity(c)} al metro quadro <span className="text-brand">({OMI_SEMESTRE})</span></h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Quanto costa una casa {aCity(c)}? In media tra {eur(s.avgMin)} e {eur(s.avgMax)} € al metro quadro, secondo le quotazioni OMI dell&apos;Agenzia delle Entrate. Qui trovi le quotazioni ufficiali OMI di tutte le {s.n} zone della città e quanto vale in media una casa di 60, 90 o 120 metri quadri.</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 rounded-[24px] bg-ink p-5 text-white sm:col-span-1"><div className="text-sm text-white/70">Media della città</div><div className="mt-1 font-display text-2xl font-extrabold tabular-nums">{eur(s.avgMin)} - {eur(s.avgMax)} €/m²</div></div>
          <div className="rounded-[24px] bg-canvas p-5"><div className="text-sm text-muted">Zona più economica</div><div className="mt-1 font-display text-xl font-extrabold tabular-nums">da {eur(s.min)} €/m²</div></div>
          <div className="rounded-[24px] bg-canvas p-5"><div className="text-sm text-muted">Zona più cara</div><div className="mt-1 font-display text-xl font-extrabold tabular-nums">fino a {eur(s.max)} €/m²</div></div>
        </div>
        <p className="mt-3 text-[13px] text-muted">{OMI_CREDIT}. Abitazioni civili in stato normale, superficie commerciale. Stime indicative.</p>

        <ValuationCard href={cta} title={`Quanto vale la tua casa ${aCity(c)}? Scoprilo gratis`} text="Scrivi l'indirizzo: partiamo dalla quotazione OMI della tua zona e la correggiamo con piano, stato ed extra. La stima arriva per email." />

        <article className="guide">
          <section id="prezzi">
            <h2>Quanto costano le case {aCity(c)}</h2>
            {cityParagraphs(c).map(p => <p key={p}>{p}</p>)}
          </section>

          <section id="valore">
            <h2>Quanto vale una casa di 60, 90 o 120 m² {aCity(c)}</h2>
            <p>Moltiplicando le quotazioni medie della città per la superficie commerciale (la superficie della casa compresi i muri) ottieni un primo ordine di grandezza. Sono valori medi per case in stato normale: la zona, il piano, lo stato e gli extra spostano molto il risultato.</p>
            <div className="not-prose mt-5 overflow-hidden rounded-[24px] ring-1 ring-black/5">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-canvas"><tr><th className="px-4 py-3 font-semibold">Superficie</th><th className="px-4 py-3 text-right font-semibold">Valore medio indicativo</th></tr></thead>
                <tbody>{[60, 90, 120].map(mq => { const [a, b] = worth(c, mq); return <tr key={mq} className="border-t border-line"><td className="px-4 py-3">{mq} m²{mq === 60 ? ', bilocale' : mq === 90 ? ', trilocale' : ', quadrilocale'}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">{eur(a)} - {eur(b)} €</td></tr>; })}</tbody>
              </table>
            </div>
            <p>Un esempio: nella zona più cara ({zoneOf(c, s.dear[0]).d}) gli stessi 90 m² valgono tra {eur(zoneOf(c, s.dear[0]).civ![0] * 90)} e {eur(zoneOf(c, s.dear[0]).civ![1] * 90)} €, nella più economica ({zoneOf(c, s.cheap[0]).d}) tra {eur(zoneOf(c, s.cheap[0]).civ![0] * 90)} e {eur(zoneOf(c, s.cheap[0]).civ![1] * 90)} €. Per un calcolo sulla tua casa, con le correzioni per piano, stato ed extra, usa la <Link href={cta}>valutazione gratuita della casa</Link>. Se vuoi capire come si misura la superficie, leggi la guida sulla <Link href="/it/superficie-commerciale">superficie commerciale</Link>.</p>
          </section>

          <section id="zone-care">
            <h2>Le zone più care e più economiche di {c.nome}</h2>
            <div className="not-prose mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] bg-canvas p-5"><div className="font-semibold">Le più care</div><ul className="mt-2 text-[15px]">{s.dear.map(code => <ZoneLink key={code} c={c} code={code} />)}</ul></div>
              <div className="rounded-[24px] bg-canvas p-5"><div className="font-semibold">Le più economiche</div><ul className="mt-2 text-[15px]">{s.cheap.map(code => <ZoneLink key={code} c={c} code={code} />)}</ul></div>
            </div>
          </section>

          <section id="zone">
            <h2>Prezzi al metro quadro per zona {aCity(c)}</h2>
            <p>L&apos;OMI divide {c.nome} in {s.n} zone omogenee. Per ognuna trovi il valore minimo e massimo in euro al metro quadro delle abitazioni civili e, dove esiste, delle abitazioni signorili. Cerca la tua zona: se non la conosci, la valutazione gratuita la trova dall&apos;indirizzo. Per capire come leggere questi numeri c&apos;è la guida sulle <Link href="/it/quotazioni-omi">quotazioni OMI</Link>.</p>
            {fasce.map(([f, zs]) => (
              <div key={f}>
                <h3>{FASCE[f]} (fascia {f})</h3>
                <div className="not-prose mt-3 overflow-x-auto rounded-[24px] ring-1 ring-black/5">
                  <table className="w-full min-w-[480px] text-left text-[15px]">
                    <thead className="bg-canvas"><tr><th className="py-3 pl-4 pr-2 font-semibold">Zona OMI</th><th className="px-2 py-3 text-right font-semibold">Civili €/m²</th><th className="py-3 pl-2 pr-4 text-right font-semibold">Signorili €/m²</th></tr></thead>
                    <tbody>{zs.map(z => <ZoneRow key={z.c} z={z} />)}</tbody>
                  </table>
                </div>
              </div>
            ))}
            <p className="text-[15px]">{OMI_CREDIT}. Valori minimi e massimi per abitazioni in stato conservativo normale, riferiti alla superficie lorda. Stime indicative: non sono il prezzo di una casa specifica.</p>
          </section>

          <ValuationCard compact href={cta} title={`Trova la tua zona ${aCity(c)}`} text="Scrivi l'indirizzo della casa: ricevi la stima con la quotazione della tua zona, gratis e senza impegno." />

          <section id="come-usarli">
            <h2>Come usare questi prezzi per la tua casa</h2>
            <p>Le quotazioni OMI sono un riferimento pubblico, non il prezzo della tua casa. Per arrivare a una stima sensata segui tre passi:</p>
            <ol>
              <li><strong>Trova la zona</strong> in cui si trova la casa e parti dal suo intervallo: verso il minimo se la casa ha bisogno di lavori, verso il massimo se è in ottimo stato.</li>
              <li><strong>Moltiplica per i metri quadri commerciali</strong>, quelli della planimetria catastale compresi i muri, con balconi e cantina contati solo in parte.</li>
              <li><strong>Correggi per quello che l&apos;OMI non vede</strong>: piano e ascensore, luce, box o posto auto, terrazzo, classe energetica.</li>
            </ol>
            <p>La <Link href={cta}>valutazione gratuita</Link> fa questi passi per te. Se stai pensando di vendere, nella guida <Link href="/it/come-valutare-una-casa">come valutare una casa</Link> trovi il metodo completo e in <Link href="/it/vendere-casa">Vendere casa</Link> tutte le guide per chi vende.</p>
          </section>

          <section id="domande">
            <h2>Domande frequenti sui prezzi delle case {aCity(c)}</h2>
            {faq.map(([q, a]) => (<div key={q}><h3>{q}</h3><p>{a}</p></div>))}
          </section>
        </article>

        <nav aria-label="Altre città" className="mt-14">
          <div className="font-display text-xl font-bold">Prezzi delle case vicino {aCity(c)}</div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[...vicine, ...regione].map(o => (
              <li key={o.slug}><Link href={`/it/prezzi-case/${o.slug}`} className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">Prezzo case {o.nome}</span><span className="mt-1 block text-sm text-muted">{eur(o.s.avgMin)} - {eur(o.s.avgMax)} €/m² in media, {o.regione}</span></Link></li>
            ))}
          </ul>
          {simili.length > 0 && <>
            <div className="mt-10 font-display text-xl font-bold">Città con prezzi simili a {c.nome}</div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {simili.map(o => (
                <li key={o.slug}><Link href={`/it/prezzi-case/${o.slug}`} className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">Prezzo case {o.nome}</span><span className="mt-1 block text-sm text-muted">{eur(o.s.avgMin)} - {eur(o.s.avgMax)} €/m² in media, {o.regione}</span></Link></li>
              ))}
            </ul>
          </>}
          <p className="mt-5 text-[15px]"><Link href="/it/prezzi-case" className="font-semibold text-brand underline underline-offset-4">Tutte le città: prezzi delle case al metro quadro</Link></p>
        </nav>

        <ValuationAside href={cta} title={`Quanto vale la tua casa ${aCity(c)}?`} text="Un minuto, gratis, senza impegno. Partiamo dalla quotazione OMI della tua zona e la stima ti arriva per email." note={`${OMI_CREDIT}. Stime indicative, non è una perizia.`} />
      </main>
      <SiteFooter />
    </div>
  );
}
