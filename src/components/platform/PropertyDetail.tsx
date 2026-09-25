'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Info, Loader2 } from 'lucide-react';
import { TEMPLATES, type TemplateId } from '@/lib/siteTemplates';
import type { ProjectData } from '@/lib/projects';
import PropertyView from '../property/PropertyView';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { PublicSwitch } from './PortfolioView';

// Dettaglio in piattaforma: stessa pagina della casa del portfolio pubblico + barra agente
// (torna agli immobili, pubblico/privato) e suggerimenti dell'AI in fondo.
export default function PropertyDetail({ project, loading, onChange }: { project?: ProjectData; loading: boolean; onChange: () => void }) {
  // modello del sito e indirizzo: per l'avviso "sul sito si vede con lo stile del modello"
  const [site, setSite] = useState<{ slug: string | null; template: TemplateId } | null>(null);
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSite({ slug: d.slug ?? null, template: d.config?.template })).catch(() => {}); }, []);
  if (loading) return <Loader2 className="animate-spin text-muted" />;
  if (!project) return <p className="text-muted">Immobile non trovato. <a href="#/immobili" className="text-brand">Torna agli immobili</a>.</p>;

  const extra = (project.import_data ?? {}) as { score?: number; suggerimenti?: string[] };
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <a href="#/immobili" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Immobili</a>
        <PublicSwitch on={!!project.is_public} onClick={async () => { if (await setPublic(project.id, !project.is_public)) onChange(); }} />
      </div>
      {/* avviso: qui e' la scheda della piattaforma, sul sito cambia con il modello scelto */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-2 pl-4 text-sm ${CARD_SHADOW}`}>
        <Info size={16} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1 text-muted">Questa è la scheda nella piattaforma. Sul tuo sito l&apos;immobile si vede con lo stile del modello scelto{site?.template ? <> (<b className="text-ink">{TEMPLATES.find(t => t.id === site.template)?.name}</b>)</> : ''}: colori, caratteri e disposizione cambiano.</span>
        <a href="#/portfolio" className="flex h-9 items-center rounded-full px-3 font-medium hover:bg-canvas">Cambia modello</a>
        {project.is_public && site?.slug && <a href={`${portfolioUrl(site.slug)}/${project.id}`} target="_blank" rel="noopener" className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-4 font-medium hover:bg-line/60">Vedi sul sito <ExternalLink size={14} /></a>}
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
