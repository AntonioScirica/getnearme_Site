'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Link2, Loader2, Lock, Puzzle, Sparkles } from 'lucide-react';
import { createProject } from '@/lib/projects';
import { authFetch, extSend, EXTENSION_URL, go } from './api';

// "Migliora annuncio": link portale -> estensione legge l'annuncio in background ->
// scansione animata -> diagnosi + annuncio riscritto. Senza estensione: testo incollato.

type Listing = { url: string; title: string; address: string; propertyInfo: Record<string, unknown>; photos: string[] };
type Problem = { area: string; gravita: 'alta' | 'media' | 'bassa'; testo: string };
type Analysis = {
  score: number; sintesi: string; punti_forza: string[]; problemi: Problem[];
  dati_mancanti: string[]; foto_consigli: string[]; titolo: string; descrizione: string;
};
type Stage = 'input' | 'opening' | 'scanning' | 'done' | 'no-extension' | 'manual' | 'error';

const PORTAL_RE = /^https:\/\/(www\.)?(immobiliare\.it|idealista\.(it|com|pt)|casa\.it)\//i;
const SCAN_STEPS = ['Leggo i dati dell\'annuncio', 'Guardo le foto', 'Valuto titolo e descrizione', 'Cerco i dati mancanti', 'Riscrivo l\'annuncio'];

// "€ 250.000" -> 250000, "95 m²" -> 95
const toNum = (v: unknown) => {
  const m = String(v ?? '').match(/\d[\d.]*/);
  return m ? Number(m[0].replace(/\./g, '')) || 0 : 0;
};
const text = (v: unknown) => (typeof v === 'string' ? v : '');

export default function ImproveView({ initialUrl, onSaved }: { initialUrl: string; onSaved: () => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [stage, setStage] = useState<Stage>('input');
  const [listing, setListing] = useState<Listing | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const started = useRef(false);

  const analyze = async (l: Listing) => {
    setListing(l); setStage('scanning');
    const res = await authFetch('/api/platform/analyze', { method: 'POST', body: JSON.stringify({ listing: l }) }).catch(() => null);
    if (!res?.ok) { setError('Analisi non riuscita, riprova.'); setStage('error'); return; }
    setAnalysis(await res.json());
    setStage('done');
  };

  const start = async (target = url) => {
    setError(null);
    if (!PORTAL_RE.test(target.trim())) { setError('Incolla il link di un annuncio da immobiliare.it, idealista o casa.it.'); return; }
    const ping = await extSend<{ ok: boolean }>({ type: 'GNM_PING' });
    if (!ping?.ok) { setStage('no-extension'); return; }
    setListing({ url: target.trim(), title: '', address: '', propertyInfo: {}, photos: [] });
    setStage('opening');
    const r = await extSend<{ ok: boolean; data?: Listing; error?: string }>({ type: 'GNM_IMPORT_LISTING', url: target.trim() });
    if (!r?.ok || !r.data) {
      setError(r?.error === 'timeout'
        ? 'Non sono riuscito a leggere l\'annuncio (pagina lenta, rimossa o con verifica anti-bot). Aprilo una volta nel browser e riprova, oppure incolla il testo.'
        : 'Import non riuscito. Riprova o incolla il testo dell\'annuncio.');
      setStage('error');
      return;
    }
    analyze(r.data);
  };

  // Arrivo dalla home con ?url=... : parte subito.
  useEffect(() => {
    if (initialUrl && !started.current) { started.current = true; start(initialUrl); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const analyzePasted = () => analyze({ url: url.trim(), title: '', address: '', propertyInfo: { description: pasted }, photos: [] });

  return (
    <div className="mx-auto max-w-6xl">
      <a href="#/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Home</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Migliora un annuncio</h1>

      {(stage === 'input' || stage === 'error' || stage === 'no-extension' || stage === 'manual') && (
        <form onSubmit={e => { e.preventDefault(); start(); }} className="mt-6 flex max-w-3xl gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand">
            <Link2 size={16} className="text-muted" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.immobiliare.it/annunci/..." className="w-full bg-transparent py-3 text-sm outline-none" />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-ai px-5 text-sm font-medium text-white"><Sparkles size={16} /> Analizza</button>
        </form>
      )}
      {error && <p className="mt-3 max-w-3xl text-sm text-red-600">{error}</p>}

      {stage === 'no-extension' && (
        <div className="mt-6 max-w-3xl rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Puzzle size={20} /></div>
            <div>
              <h2 className="font-display text-lg font-semibold">Serve l&apos;estensione GetNearMe per leggere l&apos;annuncio</h2>
              <p className="mt-1 text-sm text-muted">I portali non permettono ad altri siti di leggere le loro pagine: l&apos;estensione lo fa dal tuo browser, in un attimo e in background. Si installa in un click (Chrome, Edge, Brave).</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white">Installa l&apos;estensione</a>
                <button onClick={() => start()} className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium">L&apos;ho installata, riprova</button>
                <button onClick={() => setStage('manual')} className="px-2 text-sm text-muted hover:text-ink">Incolla il testo a mano</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(stage === 'manual' || (stage === 'error' && !analysis)) && (
        <div className="mt-6 max-w-3xl">
          <label className="mb-1.5 block text-sm font-medium">Oppure incolla il testo dell&apos;annuncio</label>
          <textarea rows={8} value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Titolo, prezzo, caratteristiche e descrizione, copiati dalla pagina dell'annuncio..."
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
          <button onClick={analyzePasted} disabled={pasted.trim().length < 80} className="mt-3 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Analizza il testo</button>
        </div>
      )}

      {(stage === 'opening' || stage === 'scanning') && listing && <Scanner listing={listing} stage={stage} />}

      {stage === 'done' && listing && analysis && (
        <Results listing={listing} analysis={analysis} onSaved={onSaved} onRestart={() => { setStage('input'); setAnalysis(null); setListing(null); setUrl(''); }} />
      )}
    </div>
  );
}

// Finta finestra browser: ricostruzione dell'annuncio letto + fascio di scansione.
function Scanner({ listing, stage }: { listing: Listing; stage: 'opening' | 'scanning' }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (stage !== 'scanning') return;
    const t = setInterval(() => setStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, [stage]);

  const info = listing.propertyInfo;
  const desc = text(info.description);
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5">
          <div className="flex gap-1.5"><span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" /></div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-white px-3 py-1 text-xs text-muted"><Lock size={11} /> <span className="truncate">{listing.url}</span></div>
        </div>
        <div className="relative h-[460px] overflow-hidden p-5">
          {stage === 'opening' ? (
            <div className="animate-pulse space-y-4">
              <div className="grid h-60 grid-cols-3 grid-rows-2 gap-2"><div className="col-span-2 row-span-2 rounded-xl bg-canvas" /><div className="rounded-xl bg-canvas" /><div className="rounded-xl bg-canvas" /></div>
              <div className="h-6 w-2/3 rounded bg-canvas" /><div className="h-4 w-1/3 rounded bg-canvas" />
              <div className="space-y-2 pt-2">{[...Array(5)].map((_, i) => <div key={i} className="h-3 rounded bg-canvas" />)}</div>
              <div className="absolute inset-0 flex items-center justify-center"><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow"><Loader2 size={16} className="animate-spin" /> Apro l&apos;annuncio...</span></div>
            </div>
          ) : (
            <>
              {/* righe esplicite (grid-rows-2 = minmax(0,1fr)): senza, le foto piccole crescono all'altezza naturale e sforano sul testo */}
              <div className="grid h-60 grid-cols-3 grid-rows-2 gap-2 overflow-hidden">
                {listing.photos.slice(0, 3).map((src, i) => <img key={src} src={src} alt="" className={`h-full min-h-0 w-full rounded-xl object-cover ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />)}
                {!listing.photos.length && <div className="col-span-3 row-span-2 rounded-xl bg-canvas" />}
              </div>
              <div className="mt-4 font-display text-xl font-semibold">{listing.title}</div>
              <div className="mt-1 text-sm text-muted">{[text(info.price), text(info.surface), listing.address].filter(Boolean).join(' · ')}</div>
              <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted">{desc}</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-ai/25 to-transparent"
                style={{ animation: 'gnm-scan 2.2s ease-in-out infinite alternate' }}>
                <div className="absolute inset-x-0 bottom-1/2 h-0.5 bg-ai shadow-[0_0_16px_4px] shadow-ai/60" />
              </div>
            </>
          )}
        </div>
      </div>
      <ul className="h-fit space-y-3 rounded-2xl border border-line bg-white p-5">
        {SCAN_STEPS.map((s, i) => {
          const done = stage === 'scanning' && i < step;
          const active = stage === 'scanning' && i === step;
          return (
            <li key={s} className={`flex items-center gap-3 text-sm ${done || active ? 'text-ink' : 'text-muted/60'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? 'bg-ai text-white' : active ? 'bg-ai/10 text-ai' : 'bg-canvas'}`}>
                {done ? <Check size={14} /> : active ? <Loader2 size={14} className="animate-spin" /> : null}
              </span>
              {s}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const GRAVITA = { alta: 'bg-red-50 text-red-700', media: 'bg-amber-50 text-amber-700', bassa: 'bg-canvas text-muted' };

function Results({ listing, analysis: a, onSaved, onRestart }: { listing: Listing; analysis: Analysis; onSaved: () => void; onRestart: () => void }) {
  const [titolo, setTitolo] = useState(a.titolo);
  const [descrizione, setDescrizione] = useState(a.descrizione);
  const [saving, setSaving] = useState(false);
  const info = listing.propertyInfo;
  const scoreColor = a.score >= 75 ? 'text-green-600' : a.score >= 50 ? 'text-amber-600' : 'text-red-600';

  const save = async () => {
    setSaving(true);
    const p = await createProject({
      nome: titolo, titolo, descrizione, addr: listing.address, tipologia: text(info.type),
      prezzo: toNum(info.price), mq: toNum(info.surface), locali: toNum(info.rooms) || undefined,
      camere: toNum(info.bedrooms), bagni: toNum(info.bathrooms), cover: listing.photos[0] ?? '',
      import_data: {
        source: 'portal', url: listing.url, photos: listing.photos, score: a.score,
        suggerimenti: a.problemi.map(x => x.testo), piano: text(info.floor), classe: text(info.energyClass),
        caratteristiche: Array.isArray(info.features) ? info.features : [],
        originale: { titolo: listing.title, descrizione: text(info.description) },
      },
    });
    setSaving(false);
    if (p) { onSaved(); go(`/immobile/${p.id}`); }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="text-sm text-muted">Score attuale</div>
          <div className={`font-display text-5xl font-bold ${scoreColor}`}>{a.score}<span className="text-xl text-muted">/100</span></div>
          <p className="mt-2 text-sm">{a.sintesi}</p>
          <a href={listing.url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-xs text-brand">{listing.url}</a>
        </div>
        <Section title="Da sistemare">
          {a.problemi.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm"><span className={`h-fit shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${GRAVITA[p.gravita]}`}>{p.area}</span>{p.testo}</li>
          ))}
        </Section>
        {!!a.dati_mancanti.length && (
          <Section title="Dati mancanti">
            <li className="flex flex-wrap gap-2">{a.dati_mancanti.map(d => <span key={d} className="rounded-full bg-canvas px-3 py-1 text-xs">{d}</span>)}</li>
          </Section>
        )}
        <Section title="Foto">{a.foto_consigli.map(f => <li key={f} className="text-sm text-muted">{f}</li>)}</Section>
        <Section title="Funziona già">{a.punti_forza.map(f => <li key={f} className="text-sm text-muted">{f}</li>)}</Section>
      </div>

      <div className="space-y-5">
        {!!listing.photos.length && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {listing.photos.map(src => <img key={src} src={src} alt="" className="h-24 w-32 shrink-0 rounded-lg object-cover" />)}
          </div>
        )}
        <Rewrite label="Titolo" before={listing.title} value={titolo} onChange={setTitolo} rows={2} />
        <Rewrite label="Descrizione" before={text(info.description)} value={descrizione} onChange={setDescrizione} rows={14} />
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onRestart} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium">Analizza un altro annuncio</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />} Salva nei miei immobili
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function Rewrite({ label, before, value, onChange, rows }: { label: string; before: string; value: string; onChange: (v: string) => void; rows: number }) {
  const [copied, setCopied] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={14} className="text-ai" /> {label} riscritto</span>
        <div className="flex gap-3 text-xs">
          {before && <button onClick={() => setShowBefore(v => !v)} className="text-muted hover:text-ink">{showBefore ? 'Nascondi originale' : 'Vedi originale'}</button>}
          <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex items-center gap-1 font-medium text-brand">
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copiato' : 'Copia'}
          </button>
        </div>
      </div>
      {showBefore && <p className="mb-3 whitespace-pre-line rounded-lg bg-canvas p-3 text-sm text-muted">{before}</p>}
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-brand" />
    </div>
  );
}
