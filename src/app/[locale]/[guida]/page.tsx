import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { GUIDES, guideBySlug } from '@/lib/guides';
import ProvvigioneCalc from '@/components/ProvvigioneCalc';
import { PRICING, photosFor } from '@/lib/pricing';

// Guide SEO su /it/<slug> (pilastro "agente immobiliare" + satelliti), solo in italiano.
// Le rotte statiche sotto [locale] hanno la precedenza: qui arrivano solo gli slug delle guide.
export const dynamicParams = false;

type Props = { params: Promise<{ locale: string; guida: string }> };

const urlOf = (slug: string) => `https://agenteimmo.me/it/${slug}`;

export function generateStaticParams() {
  return locales.flatMap(locale => GUIDES.map(g => ({ locale, guida: g.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).guida);
  if (!g) return {};
  const url = urlOf(g.slug);
  return {
    title: { absolute: g.title },
    description: g.description,
    alternates: { canonical: url, languages: { it: url, 'x-default': url } },
    openGraph: { type: 'article', url, siteName: 'Agente Immo', locale: 'it_IT', title: g.title, description: g.description, images: ['/immo/home/staging-after.webp'] },
  };
}

// Chi arriva da Google sulle guide: inviti a provare sparsi nella pagina, tutti verso la prova sulla home
const TRY = '/it/accedi?next=/it/prova'; // Prova gratis porta sempre al login, poi alla prova
// guide su prezzo e valutazione: in "Leggi anche" anche la pagina per i proprietari (valutazione OMI gratuita)
const VALUATION_GUIDES = new Set(['valutazione-immobile-acquisizione', 'casa-che-non-si-vende', 'annuncio-immobiliare-senza-contatti', 'lettera-acquisizione-immobili', 'script-telefonata-proprietari']);
function TryCard({ compact = false }: { compact?: boolean }) {
  return (
    <Link href={TRY} className={`not-prose group my-10 flex items-center gap-5 rounded-[28px] bg-canvas p-3 pr-6 no-underline ring-1 ring-black/5 ease-smooth transition-shadow hover:shadow-md ${compact ? '' : 'mt-8'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/immo/home/staging-after.webp" alt="Stanza arredata con l'AI da Agente Immo" className={`${compact ? 'h-20 w-28' : 'h-24 w-36'} shrink-0 rounded-[20px] object-cover`} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold leading-tight text-ink">{compact ? 'Vuoi vedere la tua stanza arredata?' : 'Provalo sulla tua foto, gratis'}</span>
        <span className="mt-1 block text-sm text-muted">{compact ? 'Carica una foto e l\'AI la arreda in pochi secondi. Gratis.' : `1 foto arredata e 1 video per i social, gratis e senza carta di credito. Poi da ${PRICING.starter} € al mese.`}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">Prova gratis <ArrowRight size={14} className="ease-smooth transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  );
}

export default async function Page({ params }: Props) {
  const { locale, guida } = await params;
  const g = guideBySlug(guida);
  if (!g) notFound();
  if (locale !== 'it') permanentRedirect(`/it/${g.slug}`);
  const url = urlOf(g.slug);
  const pillar = GUIDES[0];
  const date = new Date(g.updated).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const crumbs = g.slug === pillar.slug ? [['Agente Immo', 'https://agenteimmo.me/it'], [g.label, url]] : [['Agente Immo', 'https://agenteimmo.me/it'], [pillar.label, urlOf(pillar.slug)], [g.label, url]];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: g.title, description: g.description, inLanguage: 'it-IT', mainEntityOfPage: url,
        datePublished: g.updated, dateModified: g.updated, image: 'https://agenteimmo.me/immo/home/staging-after.webp',
        author: { '@type': 'Organization', name: 'Agente Immo', url: 'https://agenteimmo.me/it' },
        publisher: { '@type': 'Organization', name: 'Agente Immo', logo: { '@type': 'ImageObject', url: 'https://agenteimmo.me/immo/logo-mark.png' } },
      },
      { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      { '@type': 'FAQPage', mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  };
  // le 6 guide che seguono nell'elenco (a giro): ogni guida ne linka altre, tutte ricevono link senza liste infinite
  const at = GUIDES.indexOf(g);
  const related = Array.from({ length: Math.min(6, GUIDES.length - 1) }, (_, i) => GUIDES[(at + 1 + i) % GUIDES.length]);

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
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted">
          {crumbs.map(([name, item], i) => (
            <span key={item}>{i > 0 && ' / '}{i < crumbs.length - 1 ? <Link href={item.replace('https://agenteimmo.me', '')} className="hover:text-ink">{name}</Link> : <span>{name}</span>}</span>
          ))}
        </nav>
        <h1 className="mt-4 font-display text-[32px] font-extrabold sm:text-4xl leading-[1.1] tracking-tight md:text-5xl">{g.h1}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{g.intro}</p>
        <p className="mt-3 text-sm text-muted">Aggiornata il <time dateTime={g.updated}>{date}</time></p>

        <nav aria-label="Indice" className="mt-10 rounded-[28px] bg-canvas p-6">
          <div className="text-sm font-semibold">In questa guida</div>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px]">
            {g.sections.map(s => <li key={s.id}><a href={`#${s.id}`} className="hover:text-brand">{s.title}</a></li>)}
            <li><a href="#domande" className="hover:text-brand">Domande frequenti</a></li>
          </ol>
        </nav>

        <TryCard />

        <article className="guide mt-4">
          {g.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <h2>{s.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
              {g.slug === 'provvigione-agente-immobiliare' && s.id === 'calcolo' && <ProvvigioneCalc />}
              {/* a meta' guida (dopo la 2a e la 4a sezione) un invito a provare sulla home */}
              {(i === 1 || i === 3) && i < g.sections.length - 1 && <TryCard compact />}
            </section>
          ))}
          <section id="domande" className="scroll-mt-8">
            <h2>Domande frequenti</h2>
            {g.faq.map(([q, a]) => (<div key={q}><h3>{q}</h3><p>{a}</p></div>))}
          </section>
        </article>

        <nav aria-label="Leggi anche" className="mt-14">
          <div className="font-display text-xl font-bold">Leggi anche</div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {VALUATION_GUIDES.has(g.slug) && (
              <li><Link href="/it/quanto-vale-la-mia-casa" className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">Quanto vale la mia casa? Valutazione gratuita</span><span className="mt-1 block text-sm text-muted">La stima online dalle quotazioni OMI della zona, da girare anche ai proprietari: arriva per email in un minuto.</span></Link></li>
            )}
            {related.map(r => (
              <li key={r.slug}><Link href={`/it/${r.slug}`} className="block h-full rounded-[24px] bg-canvas p-5 ease-smooth transition-colors hover:bg-line/60"><span className="font-semibold">{r.label}</span><span className="mt-1 block text-sm text-muted">{r.description}</span></Link></li>
            ))}
          </ul>
        </nav>

        <aside className="mt-16 rounded-[32px] bg-ink px-6 py-12 text-center text-white">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight">Più incarichi, case vendute prima.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/70">Foto arredate con l&apos;AI, video per i social e il tuo sito, per ogni immobile. Senza fotografo né web agency.</p>
          {/* chi arriva da Google cerca "quanto costa": il prezzo detto subito */}
          <p className="mx-auto mt-4 max-w-lg text-sm font-semibold text-white">Da {PRICING.starter} € al mese con {PRICING.starterCredits} crediti: {photosFor(PRICING.starterCredits)} foto arredate. Disdici quando vuoi.</p>
          <Link href={TRY} className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink max-sm:w-full">Provalo gratis sulla tua foto <ArrowRight size={16} /></Link>
        </aside>
      </main>
    </div>
  );
}
