import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getBrand, getPublicProperty, portfolioBase } from '@/lib/portfolio';
import PortfolioHeader from '../PortfolioHeader';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

async function load(slug: string, id: string) {
  const brand = await getBrand(slug);
  const property = brand ? await getPublicProperty(brand.user_id, id) : null;
  return brand && property ? { brand, property } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) return { title: 'Immobile non trovato' };
  const { property: p } = data;
  const description = p.descrizione?.slice(0, 160);
  return {
    title: { absolute: `${p.titolo || p.nome} | ${data.brand.company_name || data.brand.display_name || 'Immobili'}` },
    description,
    openGraph: { title: p.titolo || p.nome, description, images: p.cover ? [p.cover] : [] },
  };
}

export default async function PublicPropertyPage({ params }: Props) {
  const { locale, slug, id } = await params;
  const data = await load(slug, id);
  if (!data) notFound();
  const { brand, property: p } = data;
  const base = await portfolioBase(locale, slug);
  const extra = p.import_data ?? {};
  const gallery = extra.photos?.length ? extra.photos : p.cover ? [p.cover] : [];
  const facts = [
    ['Superficie', p.mq ? `${p.mq} m²` : null],
    ['Locali', p.locali],
    ['Camere', p.camere],
    ['Bagni', p.bagni],
    ['Piano', extra.piano],
    ['Classe energetica', extra.classe],
    // Dati letti dall'estensione (Migliora annuncio): mostrati se presenti.
    ['Spese condominiali', extra.info?.condominium],
    ['Riscaldamento', extra.info?.riscaldamento],
    ['Anno di costruzione', extra.info?.yearBuilt],
    ['Esposizione', extra.info?.esposizione],
    ['Posto auto', extra.info?.parking],
    ['Stato', extra.info?.stato],
  ].filter(([, v]) => v && typeof v !== 'object');

  return (
    <>
      <PortfolioHeader brand={brand} base={base} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <a href={base} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Tutti gli immobili</a>

        {gallery.length > 0 && (
          <div className="mt-4 grid gap-2 overflow-hidden rounded-2xl sm:h-[28rem] sm:grid-cols-4 sm:grid-rows-2">
            {gallery.slice(0, 5).map((src, i) => (
              <img key={src} src={src} alt="" className={`h-full w-full object-cover ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : 'hidden sm:block'}`} />
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-muted">{[p.tipologia, extra.contratto].filter(Boolean).join(' · ')}</div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{p.titolo || p.nome}</h1>
            <div className="mt-2 flex items-center gap-1 text-muted"><MapPin size={16} /> {p.addr}</div>
            <p className="mt-6 whitespace-pre-line leading-relaxed">{p.descrizione}</p>
            {!!extra.caratteristiche?.length && (
              <div className="mt-6 flex flex-wrap gap-2">
                {extra.caratteristiche.map(c => <span key={c} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-line">{c}</span>)}
              </div>
            )}
            {gallery.length > 5 && (
              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gallery.slice(5).map(src => <img key={src} src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />)}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-6">
            <div className="font-display text-3xl font-bold">{p.prezzo ? `€ ${Number(p.prezzo).toLocaleString('it-IT')}` : 'Trattativa riservata'}</div>
            <dl className="mt-5 space-y-2 text-sm">
              {facts.map(([k, v]) => (
                <div key={k as string} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            {brand.company_email && (
              <a href={`mailto:${brand.company_email}?subject=${encodeURIComponent(`Informazioni: ${p.titolo || p.nome}`)}`}
                className="mt-6 block rounded-lg py-3 text-center text-sm font-medium text-white" style={{ background: brand.primary_color }}>
                Richiedi informazioni
              </a>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
