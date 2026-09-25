import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  return { title: { absolute: s ? `Servizi | ${s.name}` : 'Servizi' } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:servizi')) notFound(); // pagina nascosta dall'agente
  return <SitePage ctx={s} page={{ page: 'servizi' }} />;
}
