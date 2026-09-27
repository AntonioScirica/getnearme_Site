import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { SECTIONS, FAQ, UPDATED } from './content';

// Pagina pilastro per la ricerca "agente immobiliare": guida completa, solo in italiano.
const URL = 'https://agenteimmo.me/it/agente-immobiliare';
const TITLE = 'Agente immobiliare: cosa fa, come diventarlo, quanto guadagna (guida 2026)';
const DESC = 'Guida completa all\'agente immobiliare: cosa fa, requisiti, corso ed esame per diventarlo, provvigioni e guadagni, e come trovare più incarichi e vendere prima.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  openGraph: { type: 'article', url: URL, siteName: 'Agente Immo', locale: 'it_IT', title: TITLE, description: DESC, images: ['/immo/home/staging-after.webp'] },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const DATE = new Date(UPDATED).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article', headline: TITLE, description: DESC, inLanguage: 'it-IT', mainEntityOfPage: URL,
      datePublished: UPDATED, dateModified: UPDATED, image: 'https://agenteimmo.me/immo/home/staging-after.webp',
      author: { '@type': 'Organization', name: 'Agente Immo', url: 'https://agenteimmo.me/it' },
      publisher: { '@type': 'Organization', name: 'Agente Immo', logo: { '@type': 'ImageObject', url: 'https://agenteimmo.me/immo/logo-mark.png' } },
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Agente Immo', item: 'https://agenteimmo.me/it' },
        { '@type': 'ListItem', position: 2, name: 'Agente immobiliare', item: URL },
      ],
    },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it/agente-immobiliare');
  return (
    <div className={`${platformFontVars} min-h-screen bg-white font-body text-ink`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/it" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/immo/logo-mark.png" alt="Agente Immo" className="h-8 w-8" /> Agente <span className="text-brand">Immo</span>
        </Link>
        <Link href="/it/dashboard" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">Prova gratis <ArrowRight size={15} /></Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24">
        <nav aria-label="Percorso" className="pt-6 text-sm text-muted"><Link href="/it" className="hover:text-ink">Agente Immo</Link> / <span>Agente immobiliare</span></nav>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">Agente immobiliare: cosa fa, come diventarlo, quanto guadagna e come trovare incarichi</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Tutto quello che serve sapere sul mestiere di agente immobiliare in Italia: il lavoro di tutti i giorni, requisiti ed esame, provvigioni, e cosa fa davvero la differenza per acquisire più incarichi e vendere prima.</p>
        <p className="mt-3 text-sm text-muted">Aggiornata il <time dateTime={UPDATED}>{DATE}</time></p>

        <nav aria-label="Indice" className="mt-10 rounded-[28px] bg-canvas p-6">
          <div className="text-sm font-semibold">In questa guida</div>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px]">
            {SECTIONS.map(s => <li key={s.id}><a href={`#${s.id}`} className="hover:text-brand">{s.title}</a></li>)}
            <li><a href="#domande" className="hover:text-brand">Domande frequenti</a></li>
          </ol>
        </nav>

        <article className="guide mt-4">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <h2>{s.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))}
          <section id="domande" className="scroll-mt-8">
            <h2>Domande frequenti sull&apos;agente immobiliare</h2>
            {FAQ.map(([q, a]) => (<div key={q}><h3>{q}</h3><p>{a}</p></div>))}
          </section>
        </article>

        <aside className="mt-16 rounded-[32px] bg-ink px-6 py-12 text-center text-white">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight">Più incarichi, case vendute prima.</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/70">Foto arredate con l&apos;AI, video per i social e il tuo sito, per ogni immobile. Senza fotografo né web agency.</p>
          <Link href="/it" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink">Scopri Agente Immo <ArrowRight size={16} /></Link>
        </aside>
      </main>
    </div>
  );
}
