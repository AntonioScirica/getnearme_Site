import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  return { title: { absolute: s ? `Servizi | ${s.name}` : 'Servizi' }, description: s ? `I servizi di ${s.name}${s.cfg.city ? ` a ${s.cfg.city}` : ''}: ${s.cfg.services.map(x => x.title).join(', ')}`.slice(0, 160) : undefined, alternates: { canonical: siteUrl(slug, '/servizi') } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:servizi')) notFound(); // pagina nascosta dall'agente
  return <SitePage ctx={s} page={{ page: 'servizi' }} />;
}
