'use client';

import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import { formatPrice, setPublic } from './api';
import { PublicSwitch } from './PortfolioView';

export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void }) {
  if (loading) return <Loader2 className="animate-spin text-muted" />;
  if (!project) return <p className="text-muted">Immobile non trovato. <a href="#/immobili" className="text-brand">Torna agli immobili</a>.</p>;

  const extra = (project.import_data ?? {}) as { contratto?: string; piano?: string; classe?: string; caratteristiche?: string[]; score?: number; suggerimenti?: string[]; photos?: string[] };
  // Foto su R2, elenco URL in import_data.photos (la tabella media non esiste in prod).
  const gallery = extra.photos?.length ? extra.photos : project.cover ? [project.cover] : [];
  const facts = [
    ['Superficie', project.mq ? `${project.mq} m²` : null],
    ['Locali', project.locali],
    ['Camere', project.camere],
    ['Bagni', project.bagni],
    ['Piano', extra.piano],
    ['Classe energetica', extra.classe],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Immobili</a>
        <PublicSwitch on={!!project.is_public} onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} />
      </div>

      {gallery.length > 0 && (
        <div className="mt-4 grid h-96 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
          {gallery.slice(0, 5).map((src, i) => (
            <img key={src} src={src} alt="" className={`h-full w-full object-cover ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="text-sm font-medium uppercase tracking-wide text-muted">{[project.tipologia, extra.contratto].filter(Boolean).join(' · ')}</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{project.titolo || project.nome}</h1>
          <div className="mt-2 flex items-center gap-1 text-muted"><MapPin size={16} /> {project.addr}</div>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{project.descrizione}</p>
          {!!extra.caratteristiche?.length && (
            <div className="mt-6 flex flex-wrap gap-2">
              {extra.caratteristiche.map(c => <span key={c} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-line">{c}</span>)}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="font-display text-3xl font-bold">{formatPrice(project.prezzo)}</div>
          <dl className="mt-5 space-y-2 text-sm">
            {facts.map(([k, v]) => (
              <div key={k as string} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
          {typeof extra.score === 'number' && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Score annuncio</span><span className="font-display text-2xl font-bold text-ai">{extra.score}/100</span></div>
              {!!extra.suggerimenti?.length && (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted">{extra.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
