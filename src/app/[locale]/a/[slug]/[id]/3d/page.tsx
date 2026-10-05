import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { casa3dOf } from '@/lib/casa3d/types';
import ViewBeacon from '@/components/site/ViewBeacon';

// Casa 3D dell'immobile a schermo intero (da condividere o incorporare: ?embed=1 toglie il ritorno alla scheda).
// Fuori da Google: la pagina vera resta la scheda dell'immobile, il poster con l'alt sta li'.
export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string; id: string }>; searchParams: Promise<{ embed?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, id } = await params;
  const s = await loadSite(locale, slug);
  const p = s?.properties.find(x => x.id === id);
  const c = p ? casa3dOf(p) : null;
  return {
    title: p ? { absolute: `Casa 3D, ${p.titolo} | ${s!.name}` } : 'Casa 3D',
    robots: { index: false, follow: true }, alternates: { canonical: siteUrl(slug, `/${id}`) },
    ...(c?.poster ? { openGraph: { images: [c.poster] } } : {}),
  };
}

export default async function Casa3DPage({ params, searchParams }: Props) {
  const { locale, slug, id } = await params;
  const { embed } = await searchParams;
  const s = await loadSite(locale, slug);
  const p = s && !s.cfg.hidden.includes('page:immobile') ? s.properties.find(x => x.id === id) : null;
  const c = p ? casa3dOf(p) : null;
  if (!p || !c) notFound();
  return (
    <div className="fixed inset-0 bg-[#eceae6]">
      <iframe src={`/casa3d/v1/index.html?src=${encodeURIComponent(c.manifest)}`} title={`Casa 3D di ${p.titolo}`} allow="fullscreen" allowFullScreen className="h-full w-full border-0" />
      {embed !== '1' && (
        <a href={siteUrl(slug, `/${id}`)} className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-3 z-10 hidden max-w-[22vw] truncate rounded-full bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#1d1d1b] shadow-lg backdrop-blur lg:block">
          ← {p.titolo}
        </a>
      )}
      <ViewBeacon slug={slug} id={id} />
    </div>
  );
}
