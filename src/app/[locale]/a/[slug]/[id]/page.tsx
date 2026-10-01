import type { Metadata } from 'next';
import { zoneOnly } from '@/lib/siteTemplates';
import { notFound } from 'next/navigation';
import { getOfflineBrand, loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';
import SiteOffline from '@/components/site/SiteOffline';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  const p = s?.properties.find(x => x.id === id);
  if (!s || !p) return { title: 'Immobile non trovato' };
  const description = p.descrizione?.slice(0, 160);
  return { title: { absolute: `${p.titolo} | ${s.name}` }, description, alternates: { canonical: siteUrl(slug, `/${id}`) }, openGraph: { title: p.titolo, description, images: p.cover ? [p.cover] : [] } };
}

// Scheda immobile (solo immobili pubblici dell'agente)
export default async function PublicPropertyPage({ params }: Props) {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  if (!s) { const off = await getOfflineBrand(slug); if (!off) notFound(); return <SiteOffline name={off.name} email={off.email} />; } // sito spento: pagina gentile
  if (!s || s.cfg.hidden.includes('page:immobile') || !s.properties.some(x => x.id === id)) notFound(); // anche se l'agente ha nascosto le schede
  const p = s.properties.find(x => x.id === id)!;
  // annuncio per Google: prezzo, foto, indirizzo (solo zona se l'agente non mostra l'indirizzo esatto)
  const addr = (p.details as { mostra_indirizzo?: boolean } | undefined)?.mostra_indirizzo ? p.addr : zoneOnly(p.addr);
  const ld = {
    '@context': 'https://schema.org', '@type': 'RealEstateListing', name: p.titolo, url: siteUrl(slug, `/${id}`),
    description: p.descrizione?.slice(0, 500), image: p.photos?.slice(0, 10), datePosted: p.createdAt,
    ...(p.prezzo && s.cfg.showPrices && !(p.details as { trattativa_riservata?: boolean } | undefined)?.trattativa_riservata ? { offers: { '@type': 'Offer', price: p.prezzo, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', seller: { '@type': 'RealEstateAgent', name: s.name } } } : {}),
    ...(addr ? { contentLocation: { '@type': 'Place', address: addr } } : {}),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} /><SitePage ctx={s} page={{ page: 'immobile', id }} /></>;
}
