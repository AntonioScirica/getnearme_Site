import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) return { title: 'Sito non trovato' };
  return { title: { absolute: `${s.name}, ${(s.cfg.agentRole || 'Agente immobiliare').toLowerCase()}${s.cfg.city ? ` a ${s.cfg.city}` : ''} | Immobili in vendita e affitto` }, description: s.cfg.heroSubtitle, alternates: { canonical: siteUrl(slug) }, openGraph: { images: s.cfg.heroImage || s.properties[0]?.cover ? [s.cfg.heroImage || s.properties[0].cover] : [] } };
}

// Sito vetrina dell'agente: home
export default async function Home({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) notFound();
  return <SitePage ctx={s} page={{ page: 'home' }} />;
}
