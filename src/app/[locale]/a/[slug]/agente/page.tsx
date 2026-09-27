import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  return { title: { absolute: s ? `${s.name} | ${s.cfg.agentRole}` : 'Agente' }, description: s?.cfg.aboutText.slice(0, 160), alternates: { canonical: siteUrl(slug, '/agente') } };
}

export default async function Agent({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:agente')) notFound(); // pagina nascosta dall'agente
  return <SitePage ctx={s} page={{ page: 'agente' }} />;
}
