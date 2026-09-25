import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  const p = s?.properties.find(x => x.id === id);
  if (!s || !p) return { title: 'Immobile non trovato' };
  const description = p.descrizione?.slice(0, 160);
  return { title: { absolute: `${p.titolo} | ${s.name}` }, description, openGraph: { title: p.titolo, description, images: p.cover ? [p.cover] : [] } };
}

// Scheda immobile (solo immobili pubblici dell'agente)
export default async function PublicPropertyPage({ params }: Props) {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:immobile') || !s.properties.some(x => x.id === id)) notFound(); // anche se l'agente ha nascosto le schede
  return <SitePage ctx={s} page={{ page: 'immobile', id }} />;
}
