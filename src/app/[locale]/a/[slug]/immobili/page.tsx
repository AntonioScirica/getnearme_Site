import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  return { title: { absolute: s ? `Immobili | ${s.name}` : 'Immobili' } };
}

// Ricerca: i filtri arrivano dal modulo della home (form GET)
export default async function Listings({ params, searchParams }: Props) {
  const [{ locale, slug }, q] = await Promise.all([params, searchParams]);
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:immobili')) notFound(); // pagina nascosta dall'agente
  const f = { q: q.q?.slice(0, 80) || undefined, tipo: q.tipo?.slice(0, 60) || undefined, max: Number(q.max) || undefined, contratto: q.contratto === 'affitto' || q.contratto === 'vendita' ? q.contratto : undefined, camere: Number(q.camere) || undefined, bagni: Number(q.bagni) || undefined, rif: q.rif?.slice(0, 30) || undefined };
  return <SitePage ctx={s} page={{ page: 'immobili', f }} />;
}
