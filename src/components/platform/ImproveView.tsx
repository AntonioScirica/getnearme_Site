'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, Copy, Download, ExternalLink, Link2, Loader2, Lock, Puzzle, Sparkles, Wand2 } from 'lucide-react';
import { downloadImage, generateStaging } from '@/lib/staging';
import { AI_MOCK, mockDelay } from '@/lib/aiMock';
import { authFetch, extSend, EXTENSION_URL, go } from './api';

// "Migliora annuncio": link portale -> estensione legge l'annuncio in background ->
// scansione animata -> diagnosi + annuncio riscritto. Senza estensione: testo incollato.

type Listing = { url: string; title: string; address: string; propertyInfo: Record<string, unknown>; photos: string[] };
type Problem = { area: string; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice?: number; modifica_foto?: string };
type Analysis = {
  score: number; sintesi: string; punti_forza: string[]; problemi: Problem[];
  dati_mancanti: string[]; foto_consigli: string[]; titolo: string; descrizione: string;
};
type Stage = 'input' | 'opening' | 'scanning' | 'done' | 'no-extension' | 'manual' | 'error';

const PORTAL_RE = /^https:\/\/(www\.)?(immobiliare\.it|idealista\.(it|com|pt)|casa\.it)\//i;
const SCAN_STEPS = ['Leggo i dati dell\'annuncio', 'Guardo le foto', 'Valuto titolo e descrizione', 'Cerco i dati mancanti', 'Riscrivo l\'annuncio'];

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

// ---------------------------------------------------------------------------
// Risultati: pensati per l'agente che deve capire cosa ha sbagliato e correggerlo
// subito. Ogni blocco e' copiabile, una sola foto, annuncio riscritto sempre a vista.
// ---------------------------------------------------------------------------

const GRAVITA: Record<Problem['gravita'], { label: string; cls: string; dot: string }> = {
  alta: { label: 'Da fare subito', cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  media: { label: 'Consigliato', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  bassa: { label: 'Rifinitura', cls: 'bg-canvas text-muted ring-line', dot: 'bg-muted' },
};

function useCopy(): [boolean, (t: string) => void] {
  const [copied, setCopied] = useState(false);
  return [copied, (t: string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); }];
}

function CopyBtn({ text: t, label = 'Copia', solid = false }: { text: string; label?: string; solid?: boolean }) {
  const [copied, copy] = useCopy();
  const base = solid
    ? 'rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white'
    : 'rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink';
  return (
    <button type="button" onClick={() => copy(t)} className={`flex shrink-0 items-center gap-1.5 ${base}`}>
      {copied ? <Check size={solid ? 16 : 13} className="text-green-500" /> : <Copy size={solid ? 16 : 13} />} {copied ? 'Copiato' : label}
    </button>
  );
}

function buildReport(listing: Listing, a: Analysis, titolo: string, descrizione: string) {
  const lines = [
    `ANALISI ANNUNCIO – score ${a.score}/100`, listing.url, '', a.sintesi, '',
    'COSA SISTEMARE',
    ...a.problemi.map((p, i) => `${i + 1}. [${GRAVITA[p.gravita].label} · ${p.area}] ${p.problema}\n   Perché: ${p.perche}\n   Come: ${p.soluzione}${p.foto_indice ? `\n   Foto: n. ${p.foto_indice}${p.modifica_foto ? ` (modifica AI: ${p.modifica_foto})` : ' (da rifare)'}` : ''}`),
    '', 'DATI DA AGGIUNGERE', ...a.dati_mancanti.map(d => `- ${d}`),
    '', 'FOTO', ...a.foto_consigli.map(f => `- ${f}`),
    '', 'NUOVO TITOLO', titolo, '', 'NUOVA DESCRIZIONE', descrizione,
  ];
  return lines.join('\n');
}

function Results({ listing, analysis: a, onSaved, onRestart }: { listing: Listing; analysis: Analysis; onSaved: () => void; onRestart: () => void }) {
  const [titolo, setTitolo] = useState(a.titolo);
  const [descrizione, setDescrizione] = useState(a.descrizione);
  const [showBefore, setShowBefore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const info = listing.propertyInfo;
  const urgent = a.problemi.filter(p => p.gravita === 'alta').length;
  const tone = a.score >= 75 ? { text: 'text-green-600', bar: 'bg-green-500' } : a.score >= 50 ? { text: 'text-amber-600', bar: 'bg-amber-500' } : { text: 'text-red-600', bar: 'bg-red-500' };
  const words = descrizione.trim().split(/\s+/).filter(Boolean).length;

  // Salvataggio lato server: copia tutte le foto su R2 e tiene tutti i dati dell'estensione.
  const save = async () => {
    setSaving(true); setSaveError(null);
    const res = await authFetch('/api/platform/save-listing', {
      method: 'POST',
      body: JSON.stringify({ titolo, descrizione, listing, score: a.score, suggerimenti: a.problemi.map(x => x.soluzione) }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) { setSaveError('Salvataggio non riuscito, riprova.'); return; }
    const { id } = await res.json();
    onSaved(); go(`/immobile/${id}`);
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Verdetto */}
      <section className="grid gap-0 overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[280px_1fr]">
        <div className="aspect-[4/3] bg-canvas md:aspect-auto md:h-full">
          {listing.photos[0] && <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">Score dell&apos;annuncio attuale</div>
              <div className={`mt-1 font-display text-6xl font-bold leading-none ${tone.text}`}>{a.score}<span className="text-2xl text-muted">/100</span></div>
              <div className="mt-3 h-2 w-56 overflow-hidden rounded-full bg-canvas"><div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${a.score}%` }} /></div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CopyBtn text={buildReport(listing, a, titolo, descrizione)} label="Copia tutto il report" solid />
              <a href={listing.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted hover:text-ink"><ExternalLink size={12} /> Apri l&apos;annuncio originale</a>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed">{a.sintesi}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {urgent > 0 && <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">{urgent} da fare subito</span>}
            <span className="rounded-full bg-canvas px-3 py-1 text-muted">{a.problemi.length} punti da sistemare</span>
            <span className="rounded-full bg-canvas px-3 py-1 text-muted">{a.dati_mancanti.length} dati mancanti</span>
            <span className="rounded-full bg-canvas px-3 py-1 text-muted">{listing.photos.length} foto</span>
          </div>
        </div>
      </section>

      {/* Annuncio riscritto: prima cosa, a tutta larghezza */}
      <section className="rounded-2xl border border-ai/30 bg-white p-6 shadow-[0_8px_30px_-12px] shadow-ai/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles size={18} className="text-ai" /> Annuncio riscritto</h2>
            <p className="mt-1 text-sm text-muted">Pronto da incollare sul portale. Puoi ritoccarlo qui prima di copiare.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowBefore(v => !v)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">{showBefore ? 'Nascondi originale' : 'Confronta con originale'}</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-canvas disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} {saving ? `Salvo ${listing.photos.length} foto...` : 'Salva nei miei immobili'}
            </button>
            <CopyBtn text={`${titolo}\n\n${descrizione}`} label="Copia titolo e descrizione" solid />
          </div>
        </div>

        {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}
        <Field label="Titolo" meta={`${titolo.length}/70`} warn={titolo.length > 70} copyText={titolo}>
          {showBefore && <Before text={listing.title} />}
          <input value={titolo} onChange={e => setTitolo(e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-base font-medium outline-none focus:border-ai" />
        </Field>
        <Field label="Descrizione" meta={`${words} parole`} copyText={descrizione}>
          <div className={showBefore ? 'grid gap-4 lg:grid-cols-2' : ''}>
            {showBefore && <Before text={text(info.description)} tall />}
            <textarea rows={14} value={descrizione} onChange={e => setDescrizione(e.target.value)} className="w-full rounded-lg border border-line px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-ai" />
          </div>
        </Field>
      </section>

      {/* Cosa sistemare */}
      <section>
        <h2 className="font-display text-xl font-semibold">Cosa sistemare sul portale, in ordine di priorità</h2>
        <p className="mt-1 text-sm text-muted">Per ogni punto: cosa non va, perché ti fa perdere contatti, cosa fare adesso.</p>
        <ol className="mt-4 grid gap-4 lg:grid-cols-2">
          {a.problemi.map((p, i) => {
            const g = GRAVITA[p.gravita];
            return (
              <li key={i} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-white">{i + 1}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${g.cls}`}>{g.label}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">{p.area}</span>
                  <span className="ml-auto"><CopyBtn text={`${p.problema}\nPerché: ${p.perche}\nCome: ${p.soluzione}`} /></span>
                </div>
                <p className="mt-3 text-[15px] font-medium leading-snug">{p.problema}</p>
                <p className="mt-1.5 text-sm text-muted"><span className="font-medium text-ink/70">Perché conta:</span> {p.perche}</p>
                {/* Foto indicata dall'AI (1..3 = prime foto dell'annuncio, quelle analizzate) */}
                {!!p.foto_indice && listing.photos[p.foto_indice - 1] && (
                  <PhotoFix src={listing.photos[p.foto_indice - 1]} index={p.foto_indice} edit={p.modifica_foto ?? ''} />
                )}
                <div className="mt-auto pt-3">
                  <div className="flex items-start gap-3 rounded-xl bg-ai/5 p-3.5 ring-1 ring-ai/15">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-ai" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ai">Come sistemarlo</div>
                      <p className="mt-1 text-sm leading-relaxed">{p.soluzione}</p>
                    </div>
                    <CopyBtn text={p.soluzione} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Dati da aggiungere" hint="I compratori li cercano prima di chiamare." copyText={a.dati_mancanti.map(d => `- ${d}`).join('\n')}>
          {a.dati_mancanti.length ? a.dati_mancanti.map(d => (
            <li key={d} className="flex items-center gap-2 text-sm"><span className="h-4 w-4 shrink-0 rounded border border-line" />{d}</li>
          )) : <li className="text-sm text-muted">Nessuno, i dati principali ci sono.</li>}
        </Section>
        <Section title="Foto: cosa rifare" hint={`Valutate le prime ${Math.min(3, listing.photos.length)} foto.`} copyText={a.foto_consigli.map(f => `- ${f}`).join('\n')}>
          {a.foto_consigli.map(f => <li key={f} className="flex gap-2 text-sm"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />{f}</li>)}
        </Section>
        <Section title="Cosa funziona già" hint="Da tenere anche nella nuova versione." copyText={a.punti_forza.map(f => `- ${f}`).join('\n')}>
          {a.punti_forza.map(f => <li key={f} className="flex gap-2 text-sm text-muted"><Check size={15} className="mt-0.5 shrink-0 text-green-600" />{f}</li>)}
        </Section>
      </div>

      <button onClick={onRestart} className="mx-auto block text-sm text-muted hover:text-ink">Analizza un altro annuncio</button>
    </div>
  );
}

// Foto citata da un problema: miniatura + modifica AI proposta (staging esistente,
// customPrompt) con prima/dopo e download. Se la modifica e' vuota va rifatta a mano.
function PhotoFix({ src, index, edit }: { src: string; index: number; edit: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(edit);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setErr(null);
    // Modalita' finta: nessuna chiamata allo staging (a pagamento), torna la stessa foto.
    const r = AI_MOCK ? (await mockDelay(2000), { ok: true as const, outputUrl: src }) : await generateStaging({ imageDataUrl: src, customPrompt: prompt });
    setBusy(false);
    if (r.ok) setOut(r.outputUrl); else setErr(r.error);
  };

  return (
    <div className="mt-3 rounded-xl border border-line p-3">
      <div className="flex items-center gap-3">
        <img src={src} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Foto {index} dell&apos;annuncio</div>
          <div className="text-xs text-muted">{edit ? 'Si può sistemare con l\'AI, senza rifarla.' : 'Va rifatta o sostituita: l\'AI non basta.'}</div>
        </div>
        {edit ? (
          <button onClick={() => setOpen(v => !v)} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-ai px-3 py-2 text-sm font-medium text-white">
            <Wand2 size={15} /> Sistema con AI
          </button>
        ) : <Camera size={18} className="shrink-0 text-muted" />}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">Modifica da fare</label>
          <textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-ai" />
          {out ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <figure><img src={src} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" /><figcaption className="mt-1 text-xs text-muted">Prima</figcaption></figure>
                <figure><img src={out} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" /><figcaption className="mt-1 text-xs text-muted">Dopo</figcaption></figure>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadImage(out, `foto-${index}-sistemata.jpg`)} className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white"><Download size={15} /> Scarica</button>
                <button onClick={run} disabled={busy} className="rounded-lg border border-line px-3 py-2 text-sm font-medium disabled:opacity-50">Rigenera</button>
              </div>
            </>
          ) : (
            <button onClick={run} disabled={busy || !prompt.trim()} className="flex items-center gap-2 rounded-lg bg-ai px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} {busy ? 'Sto modificando la foto...' : 'Genera'}
            </button>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, copyText, children }: { title: string; hint?: string; copyText: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      <ul className="mt-3 space-y-2">{children}</ul>
    </section>
  );
}

function Field({ label, meta, warn, copyText, children }: { label: string; meta: string; warn?: boolean; copyText: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label} <span className={`ml-1 font-normal normal-case ${warn ? 'text-red-600' : ''}`}>{meta}</span></span>
        <CopyBtn text={copyText} />
      </div>
      {children}
    </div>
  );
}

function Before({ text: t, tall }: { text: string; tall?: boolean }) {
  return t ? <p className={`mb-2 ${tall ? 'max-h-[26rem]' : 'max-h-40'} overflow-y-auto whitespace-pre-line rounded-lg bg-canvas p-3 text-xs leading-relaxed text-muted`}>{t}</p> : null;
}
