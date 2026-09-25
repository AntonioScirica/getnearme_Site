import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite } from '@/lib/portfolio';
import { zoneSlug } from '@/lib/siteTemplates';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string; zona: string }> };

// Pagina di una localita' ("Casa a Sirolo"): testo dell'agente + annunci della zona, utile per la SEO locale
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, zona } = await params;
  const s = await loadSite(locale, slug);
  const z = s?.cfg.zones.find(x => zoneSlug(x.name) === zona);
  if (!s || !z) return { title: 'Zona non trovata' };
  return { title: { absolute: `Casa a ${z.name} | ${s.name}` }, description: z.text.replace(/^## .*$/gm, '').trim().slice(0, 160) };
}

export default async function Zone({ params }: Props) {
  const { locale, slug, zona } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:zona') || !s.cfg.zones.some(x => zoneSlug(x.name) === zona)) notFound(); // anche se l'agente ha nascosto le pagine zona
  return <SitePage ctx={s} page={{ page: 'zona', slug: zona }} />;
}
