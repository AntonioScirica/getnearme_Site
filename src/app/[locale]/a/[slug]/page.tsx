import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOfflineBrand, loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';
import SiteOffline from '@/components/site/SiteOffline';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) return { title: 'Sito non disponibile', robots: { index: false } };
  return { title: { absolute: `${s.name}, ${(s.cfg.agentRole || 'Agente immobiliare').toLowerCase()}${s.cfg.city ? ` a ${s.cfg.city}` : ''} | Immobili in vendita e affitto` }, description: s.cfg.heroSubtitle, alternates: { canonical: siteUrl(slug) }, openGraph: { images: s.cfg.heroImage || s.properties[0]?.cover ? [s.cfg.heroImage || s.properties[0].cover] : [] } };
}

// Sito vetrina dell'agente: home
export default async function Home({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) {
    // l'agente c'e' ma il sito e' spento (o il piano e' scaduto): pagina gentile con il contatto, non un 404 nudo
    const off = await getOfflineBrand(slug);
    if (!off) notFound();
    return <SiteOffline name={off.name} email={off.email} />;
  }
  return <SitePage ctx={s} page={{ page: 'home' }} />;
}
