'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Info, Loader2, Sparkles, Star, Wand2, X } from 'lucide-react';
import FitImage from '@/components/ui/FitImage';
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
      {/* le foto: da qui ogni foto va all'AI, e una foto AI torna qui accanto all'originale (prima/dopo sul sito) */}
      <PhotoManager project={project} onChange={onChange} />
      <PropertyView p={project} hideGallery />
      {typeof extra.score === 'number' && (
        <section className="mt-10 card p-6">
          <div className="flex items-baseline justify-between"><h2 className="font-display text-lg font-semibold">Qualità dell&apos;annuncio</h2><span className="font-display text-2xl font-bold text-ai">{extra.score}/100</span></div>
          {!!extra.suggerimenti?.length && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">{extra.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>}
        </section>
      )}
    </>
  );
}

// Foto dell'immobile con le azioni: Migliora con l'AI (apre la chat con quella foto), Copertina, togli.
// Le foto AI messe accanto all'originale hanno l'etichetta Prima / Dopo.
function PhotoManager({ project, onChange }: { project: ProjectData; onChange: () => void }) {
  const d = (project.import_data ?? {}) as { photos?: unknown; prima?: Record<string, string> };
  const photos = Array.isArray(d.photos) ? d.photos.filter((x): x is string => typeof x === 'string') : project.cover ? [project.cover] : [];
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (mode: 'remove' | 'cover', photo: string) => {
    if (mode === 'remove' && !confirm('Togliere questa foto dall’immobile?')) return;
    setBusy(photo);
    const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: project.id, mode, photo }) }).catch(() => null);
    setBusy(null);
    if (r?.ok) onChange();
  };
  return (
    <section className={`mb-6 rounded-3xl bg-white p-4 ${CARD_SHADOW}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-3">
        <div><h2 className="font-display text-lg font-semibold">Le foto</h2><p className="text-sm text-muted">Passa sopra una foto per migliorarla con l’AI. Il risultato torna qui, accanto all’originale, e sul sito si vede il prima/dopo.</p></div>
        <a href={`#/staging?project=${project.id}`} className="flex h-9 items-center gap-1.5 rounded-full bg-canvas px-4 text-sm font-medium hover:bg-line/60"><Wand2 size={14} /> Apri la chat</a>
      </div>
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map(src => (
            <li key={src} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
              <FitImage src={src} />
              {src === project.cover && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-semibold text-white"><Star size={10} /> Copertina</span>}
              {d.prima?.[src] && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white"><Sparkles size={10} /> Prima / Dopo</span>}
              {busy === src ? <span className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 size={18} className="animate-spin" /></span> : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 opacity-0 ease-smooth transition-opacity group-hover:opacity-100">
                  {/* togli: in alto a destra; al centro l'azione principale e, uguale ma secondaria, Copertina */}
                  <button onClick={() => act('remove', src)} aria-label="Togli la foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"><X size={14} /></button>
                  {/* colonna larga quanto il pulsante piu' largo: i due pulsanti hanno la stessa larghezza */}
                  <div className="flex w-fit flex-col gap-2">
                    <a href={`#/staging?project=${project.id}&photo=${encodeURIComponent(src)}`} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-xs font-semibold text-white shadow-lg ease-smooth transition-transform hover:scale-105"><Wand2 size={13} /> Migliora con l’AI</a>
                    {src !== project.cover && <button onClick={() => act('cover', src)} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow-lg ease-smooth transition-transform hover:scale-105"><Star size={13} /> Copertina</button>}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="px-1 pb-2 text-sm text-muted">Nessuna foto ancora.</p>}
    </section>
  );
}
