import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrand, getPublicProperties, getSite, portfolioBase } from '@/lib/portfolio';
import SiteRenderer from '@/components/site/SiteRenderer';

export const revalidate = 60;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) return { title: 'Portfolio non trovato' };
  const site = await getSite(brand);
  const name = brand.company_name || brand.display_name || 'Portfolio immobili';
  return { title: { absolute: `${name} | Immobili` }, description: site.heroSubtitle || `Gli immobili di ${name}.` };
}

// Vetrina pubblica: il template scelto dall'agente (SiteRenderer) con i suoi immobili pubblici.
export default async function PortfolioPage({ params }: Props) {
  const { locale, slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const [properties, cfg, base] = await Promise.all([getPublicProperties(brand.user_id), getSite(brand), portfolioBase(locale, slug)]);
  return (
    <SiteRenderer cfg={cfg} base={base} name={brand.company_name || brand.display_name || 'Immobili'} logo={brand.logo_colored_h || brand.logo_black_h}
      properties={properties.map(p => ({ id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, tipologia: p.tipologia, cover: p.cover }))} />
  );
}
