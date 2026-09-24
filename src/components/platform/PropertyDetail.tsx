'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import PropertyView from '../property/PropertyView';
import { setPublic } from './api';
import { PublicSwitch } from './PortfolioView';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void }) {
  if (loading) return <Loader2 className="animate-spin text-muted" />;
  if (!project) return <p className="text-muted">Immobile non trovato. <a href="#/immobili" className="text-brand">Torna agli immobili</a>.</p>;

  const extra = (project.import_data ?? {}) as { score?: number; suggerimenti?: string[] };
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Immobili</a>
        <PublicSwitch on={!!project.is_public} onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} />
      </div>
      <PropertyView p={project} />
      {typeof extra.score === 'number' && (
        <section className="mt-10 card p-6">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-lg font-semibold">Qualità dell&apos;annuncio</h2><span className="font-display text-2xl font-bold text-ai">{extra.score}/100</span></div>
          {!!extra.suggerimenti?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{extra.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>}
        </section>
      )}
    </>
  );
}
