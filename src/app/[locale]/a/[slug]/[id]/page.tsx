import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PropertyView from '@/components/property/PropertyView';
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

  return (
    <>
      <PortfolioHeader brand={brand} base={base} />
      <main className="mx-auto max-w-6xl px-6 py-6 md:py-8">
        <a href={base} className="mb-5 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Tutti gli immobili</a>
        <PropertyView p={p} contact={{ name: brand.company_name || brand.display_name || 'Agenzia', email: brand.company_email, color: brand.primary_color }} />
      </main>
    </>
  );
}
