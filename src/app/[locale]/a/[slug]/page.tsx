import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { getBrand, getPublicProperties, portfolioBase } from '@/lib/portfolio';
import PortfolioHeader from './PortfolioHeader';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

const price = (n: number) => (n ? `€ ${Number(n).toLocaleString('it-IT')}` : 'Trattativa riservata');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) return { title: 'Portfolio non trovato' };
  const name = brand.company_name || brand.display_name || 'Portfolio immobili';
  return { title: { absolute: `${name} | Immobili` }, description: `Gli immobili di ${name}.` };
}

export default async function PortfolioPage({ params }: Props) {
  const { locale, slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const properties = await getPublicProperties(brand.user_id);
  const base = await portfolioBase(locale, slug);

  return (
    <>
      <PortfolioHeader brand={brand} base={base} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Immobili disponibili</h1>
        <p className="mt-1 text-muted">{properties.length} {properties.length === 1 ? 'immobile' : 'immobili'}</p>
        <div className="stagger mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(p => (
            <a key={p.id} href={`${base}/${p.id}`} className="group card card-hover overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-canvas">{p.cover && <img src={p.cover} alt={p.titolo} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</div>
              <div className="p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">{[p.tipologia, p.import_data?.contratto].filter(Boolean).join(' · ')}</div>
                <div className="mt-1 font-display text-xl font-semibold">{price(p.prezzo)}</div>
                <div className="mt-1 line-clamp-2 text-sm">{p.titolo || p.nome}</div>
                <div className="mt-3 flex items-center gap-1 truncate text-xs text-muted"><MapPin size={12} /> {p.addr}</div>
              </div>
            </a>
          ))}
        </div>
        {!properties.length && <p className="text-muted">Nessun immobile pubblicato al momento.</p>}
      </main>
    </>
  );
}
