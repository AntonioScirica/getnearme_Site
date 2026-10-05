'use client';

// Scheda immobile, sezione Casa 3D: stato (non creata / in creazione / pronta con anteprima), creazione dalle
// planimetrie dell'immobile (piu' planimetrie = piu' piani), correzione, rifacimento ed eliminazione.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Check, ExternalLink, ImagePlus, Loader2, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { CREDIT_COST } from '@/lib/pricing';
import type { Casa3d } from '@/lib/casa3d/types';
import type { ProjectData } from '@/lib/projects';
import { downscaleDataUrl } from '@/lib/imageUpload';
import Casa3DFlow, { type PlanSource, viewerUrl } from './Casa3DFlow';
import { authFetch } from './api';
import { tr } from './i18n';

export default function Casa3DCard({ project, photos, onChanged }: { project: ProjectData; photos: string[]; onChanged: () => void }) {
  const d = (project.import_data ?? {}) as { details?: { casa3d?: Casa3d }; rooms?: Record<string, { scene?: string }> };
  const saved = d.details?.casa3d ?? null
  const [casa, setCasa] = useState<Casa3d | null>(saved)
  const [seen, setSeen] = useState(saved?.updated)
  if (saved?.updated !== seen) { setSeen(saved?.updated); setCasa(saved) } // dati ricaricati dal server
  const [picking, setPicking] = useState(false)
  const [flow, setFlow] = useState<{ plans: PlanSource[]; existing?: Casa3d | null; reuseKey?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const plans = photos.filter(p => d.rooms?.[p]?.scene === 'planimetria')

  // niente planimetria tra le foto e nessuna casa gia' fatta: la sezione non c'e' (la Casa 3D nasce solo dalla planimetria vera)
  if (!plans.length && !casa && !flow && !picking) return null

  const remove = async () => {
    if (!confirm(tr('Tolgo la casa 3D da questo immobile?', 'Remove the 3D home from this listing?'))) return
    setBusy(true)
    const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'delete', projectId: project.id }) }).catch(() => null)
    setBusy(false)
    if (r?.ok) { setCasa(null); onChanged() } else alert(tr('Non sono riuscito a toglierla, riprova.', 'Could not remove it, please try again.'))
  }

  return (
    <section className="rounded-2xl bg-canvas p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-brand ring-1 ring-black/5">
          {casa?.poster ? <img src={casa.poster} alt="" className="h-full w-full object-cover" /> : flow ? <Loader2 size={18} className="animate-spin" /> : <Box size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{tr('Casa 3D', '3D home')}</span>
          <span className="block text-xs text-muted">{flow && !casa ? tr('In creazione', 'Being created') : casa ? `${tr('Pronta', 'Ready')}${casa.floors.length > 1 ? `, ${casa.floors.length} ${tr('piani', 'floors')}` : ''}` : tr('Dalla planimetria, navigabile sul tuo sito', 'From the floor plan, explorable on your site')}</span>
        </span>
      </div>
      {casa ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={viewerUrl(casa.manifest)} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white"><ExternalLink size={14} /> {tr('Apri', 'Open')}</a>
          <button type="button" onClick={() => setFlow({ plans: casa.floors.map(f => ({ src: f.image, name: f.name })), existing: casa })} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white"><Pencil size={14} /> {tr('Correggi', 'Fix')}</button>
          <button type="button" onClick={() => setFlow({ plans: casa.floors.filter(f => f.image).map(f => ({ src: f.image, name: f.name })), existing: null, reuseKey: casa.key })} title={tr('Rifà il riconoscimento delle stesse planimetrie, gratis', 'Recognizes the same floor plans again, free')} className="flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-muted hover:bg-white hover:text-ink"><RotateCcw size={14} /> {tr('Rifai', 'Redo')}</button>
          <button type="button" onClick={() => void remove()} disabled={busy} className="flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-muted hover:bg-white hover:text-ink disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {tr('Elimina', 'Delete')}</button>
        </div>
      ) : (
        <button type="button" onClick={() => setPicking(true)} disabled={!!flow} className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white disabled:opacity-60">
          <Box size={14} /> {tr('Crea la casa 3D', 'Create the 3D home')} <span className="rounded-full bg-black/[.06] px-1.5 text-[10px] font-semibold text-muted">{CREDIT_COST.casa3d}</span>
        </button>
      )}
      {picking && <PlanPicker photos={photos} plans={plans} onClose={() => setPicking(false)} onPick={sel => { setPicking(false); setFlow({ plans: sel }) }} />}
      {flow && (
        <Casa3DFlow plans={flow.plans} existing={flow.existing} reuseKey={flow.reuseKey} projectId={project.id} areaM2={project.mq || undefined}
          onClose={() => { setFlow(null); onChanged() }} onDone={c => setCasa(c)} />
      )}
    </section>
  )
}

// Scelta delle planimetrie tra le foto dell'immobile (o da file): selezione multipla = piu' piani, nell'ordine dei tocchi
function PlanPicker({ photos, plans, onClose, onPick }: { photos: string[]; plans: string[]; onClose: () => void; onPick: (p: PlanSource[]) => void }) {
  const [sel, setSel] = useState<string[]>(plans.length === 1 ? plans : [])
  const [extra, setExtra] = useState<string[]>([])
  const [broken, setBroken] = useState<string[]>([]) // foto che non si caricano: via dalla griglia (niente celle vuote)
  const list = [...extra, ...plans, ...photos.filter(p => !plans.includes(p))]
  const toggle = (p: string) => setSel(s => (s.includes(p) ? s.filter(x => x !== p) : s.length >= 4 ? s : [...s, p]))
  const addFiles = async (files: FileList | null) => {
    for (const f of Array.from(files ?? []).slice(0, 4)) {
      const url = await new Promise<string>(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(f) })
      const small = await downscaleDataUrl(url, 2400).catch(() => url)
      setExtra(e => [small, ...e]); setSel(s => (s.length >= 4 ? s : [...s, small]))
    }
  }
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">{tr('Scegli la planimetria', 'Choose the floor plan')}</h2>
            <p className="mt-1 text-sm text-muted">{tr('Se la casa ha più piani, tocca una planimetria per piano, dal piano più basso.', 'If the home has more floors, tap one plan per floor, starting from the lowest.')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>
        <div className="mt-4 grid min-h-0 auto-rows-max grid-cols-2 content-start gap-3 overflow-y-auto p-1 sm:grid-cols-3">
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-[20px] border border-dashed border-black/15 bg-canvas text-center hover:border-black/30">
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { void addFiles(e.target.files); e.target.value = '' }} />
            <ImagePlus size={20} className="text-muted" /><span className="text-sm font-semibold">{tr('Carica una planimetria', 'Upload a floor plan')}</span>
          </label>
          {list.filter(p => !broken.includes(p)).map(p => {
            const k = sel.indexOf(p), plan = plans.includes(p)
            return (
              <button key={p.slice(0, 200)} type="button" onClick={() => toggle(p)} className={`relative aspect-[4/3] overflow-hidden rounded-[20px] ring-2 transition-shadow duration-[600ms] ${plan || p.startsWith('data:') ? 'bg-white' : 'bg-canvas'} ${k >= 0 ? 'ring-brand' : 'ring-black/10 hover:ring-black/25'}`}>
                <Thumb src={p} plan={plan} onFail={() => setBroken(b => [...b, p])} />
                {plan && <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">{tr('Planimetria', 'Floor plan')}</span>}
                {k >= 0 && <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-xs font-bold text-white">{sel.length > 1 ? k + 1 : <Check size={14} />}</span>}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <span className="mr-auto text-xs text-muted">{sel.length > 1 ? `${sel.length} ${tr('piani', 'floors')}` : ''}</span>
          <button type="button" disabled={!sel.length} onClick={() => onPick(sel.map(src => ({ src })))} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-brand disabled:opacity-40">
            <Box size={16} /> {tr('Avanti', 'Next')} <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{CREDIT_COST.casa3d}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// miniatura leggera (api/thumb, WebP) con lo scheletro finche' non arriva; le planimetrie intere (contain) su bianco
function Thumb({ src, plan, onFail }: { src: string; plan: boolean; onFail: () => void }) {
  const [url, setUrl] = useState(/^https:\/\//.test(src) ? `/api/thumb?w=480&u=${encodeURIComponent(src)}` : src)
  const [ok, setOk] = useState(false)
  return (
    <>
      {!ok && <span className="absolute inset-0 animate-pulse bg-black/[0.05]" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" onLoad={() => setOk(true)} onError={() => (url !== src ? setUrl(src) : onFail())}
        className={`h-full w-full transition-opacity duration-[600ms] ${plan || src.startsWith('data:') ? 'object-contain p-2' : 'object-cover'} ${ok ? 'opacity-100' : 'opacity-0'}`} />
    </>
  )
}
