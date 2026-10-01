import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOfflineBrand, loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-6 font-sans text-[#1d1d1f]">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <h1 className="text-2xl font-bold tracking-tight">{off.name || 'Sito non disponibile'}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">Il sito non è disponibile in questo momento. Torna a trovarci presto.</p>
          {off.email && <a href={`mailto:${off.email}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1d1d1f] px-6 text-sm font-semibold text-white">Scrivi a {off.email}</a>}
        </div>
      </main>
    );
  }
  return <SitePage ctx={s} page={{ page: 'home' }} />;
}
