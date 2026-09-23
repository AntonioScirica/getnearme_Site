'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, GripVertical, ImagePlus, LayoutTemplate, Loader2, Minus, Plus, Sparkles, Star, X } from 'lucide-react';
import { createProject, type ProjectData } from '@/lib/projects';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';
import { ESSENTIALS, GROUPS, completeness, visible, type Details, type Field } from '@/lib/propertyFields';
import { authFetch } from './api';

// "Crea da zero": tutti i campi dei portali senza farli pesare.
// Essenziali obbligatori -> foto (riordinabili) -> dettagli opzionali a tap -> note + annuncio AI.
// La bozza (dati e note, non le foto) si salva da sola in localStorage.

type Photo = { id: string; dataUrl: string };
type AiResult = { titolo: string; descrizione: string; score: number; suggerimenti: string[] };

const DRAFT_KEY = 'gnm_new_property_draft';
const STEPS = ['Essenziali', 'Foto', 'Dettagli', 'Annuncio'] as const;
const REQUIRED = ['contratto', 'tipologia', 'indirizzo', 'superficie'];

const readFile = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});
const uid = () => Math.random().toString(36).slice(2, 10);

export default function NewPropertyWizard({ onCreated }: { onCreated: (p: ProjectData) => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Details>({ mostra_indirizzo: true });
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(GROUPS[0].id);
  const restored = useRef(false);

  // Bozza: ripristino una volta, poi salvo a ogni modifica.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { const x = JSON.parse(raw); setD(x.d ?? { mostra_indirizzo: true }); setNote(x.note ?? ''); }
    } catch { /* bozza corrotta: si riparte */ }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, note })); } catch { /* quota */ }
  }, [d, note]);

  const set = (k: string, v: Details[string]) => setD(prev => ({ ...prev, [k]: v }));
  const comp = useMemo(() => completeness(d, photos.length), [d, photos.length]);
  const missingRequired = REQUIRED.filter(k => !d[k]).concat(!d.prezzo && !d.trattativa_riservata ? ['prezzo'] : []);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all([...files].filter(f => f.type.startsWith('image/')).map(async f => ({
      id: uid(), dataUrl: await downscaleDataUrl(await readFile(f), 1600, 0.82),
    })));
    setPhotos(p => [...p, ...added].slice(0, 40));
  };

  const payload = () => ({ ...d, note_agente: note, numero_foto: photos.length, planimetria: !!plan });

  const generate = async () => {
    setStep(3); setBusy('Scrivo titolo e descrizione...'); setError(null);
    try {
      const res = await authFetch('/api/platform/describe', { method: 'POST', body: JSON.stringify({ property: payload(), nFoto: photos.length }) });
      if (!res.ok) throw new Error();
      setAi(await res.json());
    } catch { setError('Generazione non riuscita. Riprova.'); } finally { setBusy(null); }
  };

  const save = async () => {
    if (!ai) return;
    setError(null);
    try {
      const urls: string[] = [];
      for (const [i, p] of photos.entries()) {
        setBusy(`Carico foto ${i + 1} di ${photos.length}...`);
        const url = await uploadDataUrl(p.dataUrl, 'properties');
        if (url) urls.push(url);
      }
      setBusy('Salvo immobile...');
      const planUrl = plan ? await uploadDataUrl(plan, 'properties') : '';
      const thumb = photos[0] ? await uploadDataUrl(await downscaleDataUrl(photos[0].dataUrl, 100, 0.8), 'covers') : '';
      const project = await createProject({
        nome: ai.titolo, titolo: ai.titolo, descrizione: ai.descrizione,
        addr: String(d.indirizzo ?? ''), tipologia: String(d.tipologia ?? ''),
        prezzo: Number(d.prezzo) || 0, mq: Number(d.superficie) || 0, locali: Number(d.locali) || undefined,
        camere: Number(d.camere) || 0, bagni: Number(d.bagni) || 0,
        cover: urls[0] ?? '', thumb,
        import_data: { source: 'platform', details: { ...d, planimetria: planUrl || undefined }, note, photos: urls, score: ai.score, suggerimenti: ai.suggerimenti },
      });
      if (!project) throw new Error();
      localStorage.removeItem(DRAFT_KEY);
      onCreated(project);
    } catch { setError('Salvataggio non riuscito. Riprova.'); } finally { setBusy(null); }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        <a href="#/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Home</a>
        <div className="mt-4 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Nuovo immobile</h1>
          <a href="#/importa" className="shrink-0 text-sm text-brand">Importa da CSV o Excel</a>
        </div>

        {/* Step */}
        <ol className="mt-6 flex gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button onClick={() => i < 3 && (i === 0 || !missingRequired.length) && setStep(i)} disabled={i === 3 && !ai}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${i === step ? 'border-ink bg-ink text-white' : i < step ? 'border-line bg-white text-ink' : 'border-line bg-white text-muted'}`}>
                <span className="opacity-60">{i + 1}.</span> {s}
              </button>
            </li>
          ))}
        </ol>

        {/* 1. Essenziali */}
        {step === 0 && (
          <section className="mt-8 space-y-7">
            {ESSENTIALS.map(f => (
              <FieldInput key={f.key} f={f} v={d[f.key]} set={v => set(f.key, v)} required={REQUIRED.includes(f.key) || (f.key === 'prezzo' && !d.trattativa_riservata)} />
            ))}
            <Nav next={() => setStep(1)} nextLabel="Continua con le foto" disabled={missingRequired.length > 0}
              hint={missingRequired.length ? `Manca: ${missingRequired.join(', ')}` : undefined} />
          </section>
        )}

        {/* 2. Foto */}
        {step === 1 && (
          <section className="mt-8 space-y-6">
            <PhotoGrid photos={photos} setPhotos={setPhotos} onAdd={addPhotos} />
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canvas">
                  {plan ? <img src={plan} alt="" className="h-full w-full object-contain" /> : <LayoutTemplate size={22} className="text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Planimetria</div>
                  <div className="text-xs text-muted">Facoltativa, ma gli annunci con planimetria ricevono più contatti.</div>
                </div>
                <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-canvas">
                  {plan ? 'Cambia' : 'Carica'}
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setPlan(await downscaleDataUrl(await readFile(f), 2000, 0.85)); e.target.value = ''; }} />
                </label>
                {plan && <button onClick={() => setPlan(null)} aria-label="Rimuovi planimetria" className="text-muted hover:text-ink"><X size={16} /></button>}
              </div>
            </div>
            <Nav back={() => setStep(0)} next={() => setStep(2)} nextLabel="Continua con i dettagli" hint={photos.length < 10 ? 'Consigliate almeno 10 foto: tutte le stanze, esterni e vista.' : undefined} />
          </section>
        )}

        {/* 3. Dettagli */}
        {step === 2 && (
          <section className="mt-8 space-y-3">
            <p className="text-sm text-muted">Tutto facoltativo: bastano pochi tap. Più dettagli inserisci, migliore sarà l&apos;annuncio.</p>
            {GROUPS.map(g => {
              const fields = g.fields.filter(f => visible(f, d));
              const done = fields.filter(f => d[f.key] !== undefined && d[f.key] !== '' && !(Array.isArray(d[f.key]) && !(d[f.key] as string[]).length)).length;
              const open = openGroup === g.id;
              return (
                <div key={g.id} id={`g-${g.id}`} className="rounded-2xl border border-line bg-white">
                  <button onClick={() => setOpenGroup(open ? null : g.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done === fields.length ? 'bg-green-100 text-green-700' : done ? 'bg-brand/10 text-brand' : 'bg-canvas text-muted'}`}>
                      {done === fields.length ? <Check size={14} /> : `${done}/${fields.length}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{g.title}</span>
                      <span className="block truncate text-xs text-muted">{g.hint}</span>
                    </span>
                    <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="space-y-6 border-t border-line px-5 py-5">
                      {fields.map(f => <FieldInput key={f.key} f={f} v={d[f.key]} set={v => set(f.key, v)} />)}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="rounded-2xl border border-line bg-white p-5">
              <label className="block font-medium">Note e punti di forza</label>
              <p className="mt-0.5 text-xs text-muted">Scrivi come parleresti a un cliente: l&apos;AI le usa per la descrizione. Es. &quot;vicino alla M2, zona silenziosa, vista sul parco, ristrutturato nel 2022&quot;.</p>
              <textarea rows={4} value={note} onChange={e => setNote(e.target.value)} className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
            </div>
            <div className="pt-3"><Nav back={() => setStep(1)} next={generate} nextLabel="Genera l'annuncio" ai /></div>
          </section>
        )}

        {/* 4. Annuncio */}
        {step === 3 && (
          <section className="mt-8">
            {busy && <div className="flex items-center gap-2 text-muted"><Loader2 size={18} className="animate-spin" /> {busy}</div>}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            {ai && (
              <div className={`space-y-5 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="rounded-2xl border border-ai/30 bg-white p-5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted">Titolo</label>
                  <input value={ai.titolo} onChange={e => setAi({ ...ai, titolo: e.target.value })} className="mt-2 w-full rounded-lg border border-line px-4 py-3 font-medium outline-none focus:border-ai" />
                  <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted">Descrizione</label>
                  <textarea rows={14} value={ai.descrizione} onChange={e => setAi({ ...ai, descrizione: e.target.value })} className="mt-2 w-full rounded-lg border border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-ai" />
                </div>
                {!!ai.suggerimenti.length && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <div className="text-sm font-semibold">Per migliorare ancora</div>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted">{ai.suggerimenti.map(s => <li key={s} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />{s}</li>)}</ul>
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-3">
                  <button onClick={() => setStep(2)} className="text-sm text-muted hover:text-ink">Modifica i dati</button>
                  <div className="flex gap-3">
                    <button onClick={generate} className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium">Rigenera</button>
                    <button onClick={save} className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white">Salva immobile</button>
                  </div>
                </div>
              </div>
            )}
            {!ai && !busy && <button onClick={generate} className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white">Riprova</button>}
          </section>
        )}
      </div>

      {/* Completezza: sempre a vista, dice cosa aggiungere */}
      <aside className="h-fit lg:sticky lg:top-6">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Completezza annuncio</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl font-bold">{comp.score}%</span>
            <span className="pb-1 text-xs text-muted">{comp.score >= 80 ? 'ottimo' : comp.score >= 55 ? 'buono' : 'da completare'}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
            <div className={`h-full rounded-full transition-all ${comp.score >= 80 ? 'bg-green-500' : comp.score >= 55 ? 'bg-amber-500' : 'bg-brand'}`} style={{ width: `${comp.score}%` }} />
          </div>
          {!!comp.missing.length && (
            <>
              <div className="mt-5 text-xs font-medium text-muted">Aggiungi per salire</div>
              <ul className="mt-2 space-y-1.5">
                {comp.missing.slice(0, 5).map(f => {
                  const g = GROUPS.find(x => x.fields.includes(f));
                  return (
                    <li key={f.key}>
                      <button onClick={() => { setStep(g ? 2 : 0); if (g) { setOpenGroup(g.id); setTimeout(() => document.getElementById(`g-${g.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); } }}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-canvas">
                        {f.label} <Plus size={14} className="text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="mt-4 text-[11px] text-muted">La bozza si salva da sola, foto escluse.</p>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------------------

function Nav({ back, next, nextLabel, disabled, hint, ai }: { back?: () => void; next: () => void; nextLabel: string; disabled?: boolean; hint?: string; ai?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
      {back ? <button onClick={back} className="text-sm text-muted hover:text-ink">Indietro</button> : <span />}
      <div className="flex items-center gap-3">
        {hint && <span className="text-xs text-muted">{hint}</span>}
        <button onClick={next} disabled={disabled} className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40 ${ai ? 'bg-ai' : 'bg-ink'}`}>
          {ai && <Sparkles size={16} />} {nextLabel} {!ai && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-sm transition-colors ${on ? 'border-brand bg-brand/10 font-medium text-brand' : 'border-line bg-white hover:border-ink/30'}`;

function FieldInput({ f, v, set, required }: { f: Field; v: Details[string]; set: (v: Details[string]) => void; required?: boolean }) {
  const label = (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="text-sm font-medium">{f.label}{required && <span className="text-red-500"> *</span>}</span>
      {f.hint && <span className="text-xs text-muted">{f.hint}</span>}
    </div>
  );

  if (f.type === 'toggle') {
    return (
      <button type="button" role="switch" aria-checked={!!v} onClick={() => set(!v || undefined)} className="flex w-full items-center justify-between gap-4 text-left">
        <span><span className="text-sm font-medium">{f.label}</span>{f.hint && <span className="block text-xs text-muted">{f.hint}</span>}</span>
        <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${v ? 'bg-brand' : 'bg-line'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
      </button>
    );
  }
  if (f.type === 'chips' || f.type === 'select') {
    return <div>{label}<div className="flex flex-wrap gap-2">{f.options!.map(o => <button type="button" key={o} onClick={() => set(v === o ? undefined : o)} className={chip(v === o)}>{o}</button>)}</div></div>;
  }
  if (f.type === 'multi') {
    const arr = Array.isArray(v) ? v : [];
    return <div>{label}<div className="flex flex-wrap gap-2">{f.options!.map(o => <button type="button" key={o} onClick={() => set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])} className={chip(arr.includes(o))}>{o}</button>)}</div></div>;
  }
  if (f.type === 'stepper') {
    const n = Number(v) || 0;
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{f.label}{f.unit && <span className="font-normal text-muted"> ({f.unit})</span>}</span>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Meno" onClick={() => set(n > 1 ? n - 1 : undefined)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line disabled:opacity-30" disabled={!n}><Minus size={15} /></button>
          <span className="w-6 text-center font-display text-lg font-semibold">{n || '–'}</span>
          <button type="button" aria-label="Più" onClick={() => set(n + 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line"><Plus size={15} /></button>
        </div>
      </div>
    );
  }
  const numeric = f.type === 'number';
  return (
    <div>
      {label}
      <div className="flex items-center rounded-lg border border-line bg-white focus-within:border-brand">
        <input inputMode={numeric ? 'numeric' : undefined} value={v === undefined ? '' : numeric ? Number(v).toLocaleString('it-IT') : String(v)} placeholder={f.placeholder}
          onChange={e => {
            if (!numeric) return set(e.target.value || undefined);
            const n = Number(e.target.value.replace(/\D/g, ''));
            set(n ? n : undefined);
          }}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" />
        {f.unit && <span className="pr-3 text-sm text-muted">{f.unit}</span>}
      </div>
    </div>
  );
}

// Griglia foto: trascina per riordinare (desktop), frecce e "copertina" per tap (mobile).
function PhotoGrid({ photos, setPhotos, onAdd }: { photos: Photo[]; setPhotos: (fn: (p: Photo[]) => Photo[]) => void; onAdd: (f: FileList | null) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const move = (from: number, to: number) => setPhotos(p => {
    if (to < 0 || to >= p.length || from === to) return p;
    const n = [...p]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n;
  });

  return (
    <div>
      <label onDragOver={e => e.preventDefault()} onDrop={e => { if (e.dataTransfer.files.length) { e.preventDefault(); onAdd(e.dataTransfer.files); } }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white py-10 text-muted hover:border-brand hover:text-brand">
        <ImagePlus size={28} />
        <span className="text-sm font-medium">Trascina qui le foto o clicca per sceglierle</span>
        <span className="text-xs">Poi riordinale trascinandole: la prima sarà la copertina</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => { onAdd(e.target.files); e.target.value = ''; }} />
      </label>
      {photos.length > 0 && (
        <>
          <div className="mt-4 text-xs text-muted">{photos.length} foto</div>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.id} draggable
                onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null); }}
                onDragOver={e => { e.preventDefault(); setOver(i); }}
                onDrop={e => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); setOver(null); }}
                className={`group relative aspect-[4/3] cursor-grab overflow-hidden rounded-xl bg-canvas ring-2 transition ${over === i && drag !== i ? 'ring-brand' : 'ring-transparent'} ${drag === i ? 'opacity-40' : ''}`}>
                <img src={p.dataUrl} alt="" className="pointer-events-none h-full w-full object-cover" />
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-ink/75 px-2 py-0.5 text-xs text-white">
                  {i === 0 ? <><Star size={11} /> Copertina</> : <><GripVertical size={11} /> {i + 1}</>}
                </span>
                <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))} aria-label="Rimuovi foto" className="absolute right-2 top-2 rounded-full bg-white/90 p-1 opacity-0 transition group-hover:opacity-100"><X size={14} /></button>
                <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Sposta a sinistra" className="rounded-full bg-white/90 p-1 disabled:opacity-0"><ArrowLeft size={14} /></button>
                  {i > 0 && <button onClick={() => move(i, 0)} className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">Copertina</button>}
                  <button onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Sposta a destra" className="rounded-full bg-white/90 p-1 disabled:opacity-0"><ArrowRight size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
