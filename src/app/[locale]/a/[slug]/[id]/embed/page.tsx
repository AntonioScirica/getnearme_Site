import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';
import EmbedHeight from '@/components/site/EmbedHeight';

// Scheda immobile da incorporare in un altro sito (iframe): la stessa pagina della scheda, con foto, dati, mappa e
// contatti dell'agente, senza intestazione e piede del sito. Fuori da Google: la pagina vera resta quella del sito.
export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  const p = s?.properties.find(x => x.id === id);
  return { title: p ? { absolute: `${p.titolo} | ${s!.name}` } : 'Immobile', robots: { index: false, follow: false }, alternates: { canonical: siteUrl(slug, `/${id}`) } };
}

export default async function EmbedPropertyPage({ params }: Props) {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  if (!s || s.cfg.hidden.includes('page:immobile') || !s.properties.some(x => x.id === id)) notFound();
  return <><SitePage ctx={{ ...s, embed: true }} page={{ page: 'immobile', id }} /><EmbedHeight id={id} /></>;
}
