'use client';

import { Children, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { platformFontVars } from '@/lib/platformFonts';
import { Camera, Check, Copy, Download, ExternalLink, Loader2, Puzzle, Wand2, X } from 'lucide-react';
import { downloadImage } from '@/lib/staging';
import { AI_MOCK, mockFor } from '@/lib/aiMock';
import { authFetch, CARD_SHADOW, extSend, EXTENSION_URL, go, warm } from './api';
import CountUp from './CountUp';
import InlineSlider from '@/components/InlineSlider';
import { CRITERI, withScores, type Criteri } from '@/lib/listingScore';

// "Migliora annuncio": link portale -> estensione legge l'annuncio in background ->
// scansione animata -> diagnosi + annuncio riscritto. Senza estensione: testo incollato.
// Il flusso vive nella home (HomeView): la card "Miglioralo" diventa il browser e poi il verdetto.

// raw = pagina grezza letta dall'estensione (testo, JSON incorporati, meta, immagini): la legge Qwen lato server.
export type Listing = { url: string; title: string; address: string; propertyInfo: Record<string, unknown>; photos: string[]; raw?: Record<string, unknown> };
type Problem = { area: string; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice?: number; foto_stanza?: string; modifica_foto?: string };
export type Analysis = {
  score: number; score_potenziale: number; criteri: Criteri; sintesi: string; punti_forza: string[]; problemi: Problem[];
  dati_mancanti: string[]; foto_consigli: string[]; titolo: string; descrizione: string;
};
export type Stage = 'input' | 'opening' | 'scanning' | 'done' | 'no-extension' | 'manual' | 'error';

// Qualsiasi sito di annunci: l'estensione legge la pagina in modo generico e Qwen ne estrae i dati.
const LINK_RE = /^https:\/\/[^/\s]+\.[^/\s]+/i;
export const SCAN_STEPS = ['Leggo i dati dell\'annuncio', 'Guardo le foto', 'Valuto titolo e descrizione', 'Cerco i dati mancanti', 'Riscrivo l\'annuncio'];

// Tempo trascorso (m:ss): analisi e modifiche foto su GPU durano da secondi a minuti, cosi' si vede che va avanti.
export function Elapsed({ className = 'text-muted' }: { className?: string }) {
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(x => x + 1), 1000); return () => clearInterval(t); }, []);
  return <span className={`tabular-nums ${className}`}>{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
// Al massimo 4 cose da sistemare (anche se il modello ne manda di piu').
const cap = (a: Analysis): Analysis => ({ ...a, problemi: (a.problemi ?? []).slice(0, 4) });

// ponytail: annuncio finto solo in modalita' finta senza estensione (anteprima, demo), niente API.
const MOCK_LISTING = (url: string): Listing => ({
  url, title: 'TRILOCALE ARREDATO CON BOX - ZONA BOCCONI', address: 'Via Bernardino Verro 12, Milano',
  propertyInfo: { price: '€ 598.000', surface: '95 m²', description: 'SPLENDIDO trilocale in contesto con PORTINERIA, PISCINA e PALESTRA. Ingresso, salone con cucina a vista, due camere, doppi servizi. Parquet, infissi triplo vetro, aria condizionata. Box auto. LIBERA SUBITO. TEL. 02/36586417' },
  photos: ['/immo/home/demo-1.webp', '/immo/home/demo-2.webp', '/immo/home/demo-3.webp', '/immo/home/demo-4.webp'],
});

export function useImprove() {
  const [stage, setStage] = useState<Stage>('input');
  const [listing, setListing] = useState<Listing | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const run = useRef(0); // ogni avvio/reset cambia id: le risposte in ritardo di un giro vecchio si ignorano

  useEffect(() => {
    if (stage !== 'scanning') return;
    // passi distribuiti sulla durata tipica dell'analisi su Qwen (~1-2 min), l'ultimo resta finche' non arriva
    const t = setInterval(() => setStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)), 14000);
    return () => clearInterval(t);
  }, [stage]);

  const analyze = async (l: Listing, id = run.current, demo = false) => {
    // Connessione lenta: resta su "Apro" finche' le prime foto non sono scaricate e decodificate
    // (max 5 s), cosi' la scansione non parte su riquadri vuoti e la decodifica non blocca l'animazione.
    await Promise.race([Promise.all(l.photos.slice(0, 3).map(src => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); })), wait(5000)]);
    if (id !== run.current) return;
    setListing(l); setStep(0); setStage('scanning');
    if (demo) { await wait(6000); if (id === run.current) { setAnalysis(cap(withScores(mockFor<Analysis>('analyze')))); setStage('done'); } return; }
    const res = await authFetch('/api/platform/analyze', { method: 'POST', body: JSON.stringify({ listing: { ...l, raw: undefined } }) }).catch(() => null);
    if (id !== run.current) return;
    if (!res?.ok) { setError('Analisi non riuscita, riprova.'); setStage('error'); return; }
    setAnalysis(cap(await res.json()));
    setStage('done');
  };

  const start = async (target: string) => {
    const id = ++run.current;
    const u = target.trim();
    setError(null); setAnalysis(null);
    if (!LINK_RE.test(u)) { setError('Incolla il link completo dell\'annuncio (inizia con https://).'); setStage('error'); return; }
    warm('analysis');
    setListing({ url: u, title: '', address: '', propertyInfo: {}, photos: [] });
    setStage('opening');
    const ping = await extSend<{ ok: boolean }>({ type: 'GNM_PING' });
    if (id !== run.current) return;
    if (!ping?.ok) {
      if (AI_MOCK) { await wait(1500); if (id === run.current) analyze(MOCK_LISTING(u), id, true); return; }
      setStage('no-extension'); return;
    }
    const r = await extSend<{ ok: boolean; data?: Listing; error?: string }>({ type: 'GNM_IMPORT_LISTING', url: u });
    if (id !== run.current) return;
    if (!r?.ok || !r.data) {
      setError(r?.error === 'not_a_listing'
        ? 'Questa pagina non sembra un annuncio immobiliare (non trovo prezzo e superficie). Controlla il link.'
        : r?.error === 'timeout'
        ? 'Non sono riuscito a leggere l\'annuncio (pagina lenta, rimossa o con verifica anti-bot). Aprilo una volta nel browser e riprova, oppure incolla il testo.'
        : 'Import non riuscito. Riprova o incolla il testo dell\'annuncio.');
      setStage('error');
      return;
    }
    analyze(r.data, id);
  };

  const analyzeText = (u: string, pasted: string) => {
    const id = ++run.current; setError(null);
    analyze({ url: u.trim(), title: '', address: '', propertyInfo: { description: pasted }, photos: [] }, id);
  };
  const reset = () => { run.current++; setStage('input'); setAnalysis(null); setListing(null); setError(null); };
  const manual = () => { run.current++; setStage('manual'); };

  return { stage, listing, analysis, error, step, start, analyzeText, reset, manual };
}

// ---------------------------------------------------------------------------
// Corpo del "browser" dentro la card: annuncio in apertura/scansione, oppure i casi
// senza estensione, errore e testo incollato.
// ---------------------------------------------------------------------------

export function BrowserBody({ stage, listing, error, url, onRetry, onManual, onText }: {
  stage: Stage; listing: Listing | null; error: string | null; url: string;
  onRetry: () => void; onManual: () => void; onText: (t: string) => void;
}) {
  const [pasted, setPasted] = useState('');

  if (stage === 'no-extension') return (
    <Center icon={<Puzzle size={22} />} title="Serve l'estensione per leggere l'annuncio"
      body="I portali non permettono ad altri siti di leggere le loro pagine: l'estensione lo fa dal tuo browser, in background. Si installa in un click (Chrome, Edge, Brave).">
      <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold">Installa l&apos;estensione</a>
      <button onClick={onRetry} className="btn-ghost rounded-full px-5 py-2.5 text-sm font-medium">L&apos;ho installata, riprova</button>
      <button onClick={onManual} className="px-2 text-sm text-muted hover:text-ink">Incolla il testo a mano</button>
    </Center>
  );
  if (stage === 'error') return (
    <Center title="Qualcosa non è andato" body={error ?? 'Riprova tra poco.'}>
      <button onClick={onRetry} className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold">Riprova</button>
      <button onClick={onManual} className="btn-ghost rounded-full px-5 py-2.5 text-sm font-medium">Incolla il testo</button>
    </Center>
  );
  if (stage === 'manual') return (
    <div className="blur-in flex h-full flex-col p-2">
      <textarea autoFocus value={pasted} onChange={e => setPasted(e.target.value)} placeholder="Titolo, prezzo, caratteristiche e descrizione, copiati dalla pagina dell'annuncio..."
        className="min-h-0 w-full flex-1 resize-none rounded-2xl bg-canvas p-4 text-sm leading-relaxed outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{url ? 'Il link resta collegato all\'analisi.' : ''}</span>
        <button onClick={() => onText(pasted)} disabled={pasted.trim().length < 80} className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold">Analizza il testo</button>
      </div>
    </div>
  );

  // Anteprima dell'annuncio: stessa impaginazione in apertura e in scansione, ogni dato
  // che manca (o non e' ancora arrivato) resta uno skeleton al suo posto: niente salti.
  const info = listing?.propertyInfo ?? {};
  const photos = stage === 'opening' ? [] : listing?.photos ?? [];
  const title = stage === 'opening' ? '' : listing?.title ?? '';
  const desc = stage === 'opening' ? '' : text(info.description);
  const facts = stage === 'opening' ? [] : [text(info.price), text(info.surface), listing?.address ?? ''].filter(Boolean);
  const fade = (d: number) => ({ className: 'blur-in', style: { animationDelay: `${d}s` } });
  return (
    <div className="relative flex h-full flex-col overflow-hidden p-2">
      {/* righe esplicite (grid-rows-2 = minmax(0,1fr)): senza, le foto piccole crescono all'altezza naturale e sforano sul testo */}
      <div className="grid h-60 shrink-0 grid-cols-3 grid-rows-2 gap-2 overflow-hidden">
        {[0, 1, 2].map(i => photos[i]
          ? <img key={photos[i]} src={photos[i]} alt="" decoding="async" {...fade(i * 0.08)} className={`blur-in h-full min-h-0 w-full rounded-2xl object-cover ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />
          : <div key={i} className={`shimmer rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />)}
      </div>
      <div className="px-2 pt-6">
        {title ? <h3 {...fade(0.2)} className="blur-in line-clamp-1 text-xl font-bold tracking-tight">{title}</h3> : <div className="shimmer h-6 w-2/3 rounded-full" />}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {facts.length
            ? facts.map((f, i) => <span key={f} {...fade(0.25 + i * 0.05)} className="blur-in rounded-full bg-canvas px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-inset ring-black/10">{f}</span>)
            : ['w-20', 'w-16', 'w-40'].map(w => <span key={w} className={`shimmer h-6 rounded-full ${w}`} />)}
        </div>
        {desc
          ? <p {...fade(0.35)} className="blur-in mt-5 line-clamp-4 text-sm leading-relaxed text-muted">{desc}</p>
          : <div className="mt-5 space-y-2.5">{['w-full', 'w-full', 'w-11/12', 'w-3/5'].map((w, i) => <div key={i} className={`shimmer h-3 rounded-full ${w}`} />)}</div>}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

function Center({ icon, title, body, children }: { icon?: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="blur-in flex h-full flex-col items-center justify-center px-6 text-center">
      {icon && <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-ink">{icon}</span>}
      <h2 className="mt-4 text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>
    </div>
  );
}

// Verdetto: cio' che resta nella card a fine analisi (foto, score, sintesi).
export function Verdict({ listing, analysis: a }: { listing: Listing; analysis: Analysis }) {
  const tone = a.score >= 75 ? { text: 'text-emerald-600', bar: 'bg-emerald-500' } : a.score >= 55 ? { text: 'text-amber-500', bar: 'bg-amber-400' } : { text: 'text-rose-600', bar: 'bg-rose-500' };
  const urgent = a.problemi.filter(p => p.gravita === 'alta').length;
  return (
    <div className="flex h-full gap-5 p-2">
      <div className="blur-in hidden w-64 shrink-0 overflow-hidden rounded-2xl bg-canvas sm:block" style={{ animationDelay: '.3s' }}>
        {listing.photos[0] && <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="blur-in flex items-end justify-between gap-3" style={{ animationDelay: '.4s' }}>
          <div>
            <div className="text-xs font-medium text-muted">Score dell&apos;annuncio attuale</div>
            <div className={`mt-1 text-5xl font-bold leading-none tracking-tight ${tone.text}`}><CountUp value={a.score} delay={400} duration={1200} /><span className="text-xl text-muted">/100</span>
              {a.score_potenziale > a.score && <span className="ml-3 text-sm font-semibold tracking-normal text-emerald-600">→ {a.score_potenziale} sistemando tutto</span>}</div>
          </div>
          <a href={listing.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-ink"><ExternalLink size={12} /> Originale</a>
        </div>
        <div className="blur-in relative mt-3 h-1.5 overflow-hidden rounded-full bg-canvas" style={{ animationDelay: '.5s' }}>
          <div className="grow-x absolute inset-y-0 left-0 rounded-full bg-emerald-500/25" style={{ width: `${a.score_potenziale}%` }} />
          <div className={`grow-x absolute inset-y-0 left-0 rounded-full ${tone.bar}`} style={{ width: `${a.score}%` }} />
        </div>
        <p className="blur-in mt-3 line-clamp-3 text-sm leading-relaxed text-ink/80" style={{ animationDelay: '.6s' }}>{a.sintesi}</p>
        <div className="stagger-chips mt-auto flex flex-wrap gap-1.5 pt-3 text-xs">
          {urgent > 0 && <span className="rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-700/20">{urgent} da fare subito</span>}
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{a.problemi.length} punti da sistemare</span>
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{a.dati_mancanti.length} dati mancanti</span>
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{listing.photos.length} foto</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risultati, sotto la card: annuncio riscritto a tutta larghezza, poi cosa sistemare.
// ---------------------------------------------------------------------------

const BOX = `rounded-[28px] bg-white p-6 sm:p-7 ${CARD_SHADOW}`;

const GRAVITA: Record<Problem['gravita'], { label: string; cls: string }> = {
  alta: { label: 'Da fare subito', cls: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-700/20' },
  media: { label: 'Consigliato', cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/20' },
  bassa: { label: 'Rifinitura', cls: 'bg-canvas text-muted ring-1 ring-inset ring-black/10' },
};

export function Results({ listing, analysis: a, onSaved, onRestart }: { listing: Listing; analysis: Analysis; onSaved?: () => void; onRestart: () => void }) {
  const [titolo, setTitolo] = useState(a.titolo);
  const [descrizione, setDescrizione] = useState(a.descrizione);
  const [showBefore, setShowBefore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const words = descrizione.trim().split(/\s+/).filter(Boolean).length;

  // Salvataggio lato server: copia tutte le foto su R2 e tiene tutti i dati dell'estensione.
  const save = async () => {
    setSaving(true); setSaveError(null);
    const res = await authFetch('/api/platform/save-listing', {
      method: 'POST',
      body: JSON.stringify({ titolo, descrizione, listing: { ...listing, raw: undefined }, score: a.score, suggerimenti: a.problemi.map(x => x.soluzione) }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) { setSaveError('Salvataggio non riuscito, riprova.'); return; }
    const { id } = await res.json();
    onSaved?.(); go(`/immobile/${id}`);
  };

  const input = 'w-full rounded-2xl bg-canvas px-4 py-3 outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15';

  return (
    <div className="mx-auto mt-6 w-full max-w-[56rem] space-y-6 text-left">
      {/* Annuncio riscritto: prima cosa, a tutta larghezza */}
      <section className={`rise ${BOX}`} style={{ animationDelay: '1.2s' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold leading-none tracking-tight">Annuncio riscritto</h2>
              <ScoreInfo a={a} />
            </div>
            <p className="mt-2 text-sm text-muted">Pronto da incollare sul portale.</p>
          </div>
          <button onClick={() => setShowBefore(v => !v)} className="btn-ghost shrink-0 self-start rounded-full px-4 py-2 text-sm font-medium">{showBefore ? 'Nascondi originale' : 'Confronta con originale'}</button>
        </div>

        <Field label="Titolo" meta={`${titolo.length}/60`} warn={titolo.length > 60}>
          {showBefore && <Before text={listing.title} />}
          <div className="relative">
            <input value={titolo} onChange={e => setTitolo(e.target.value)} className={`${input} pr-12 text-base font-medium`} />
            <CopyIcon text={titolo} center />
          </div>
        </Field>
        <Field label="Descrizione" meta={`${words} parole`}>
          <div className={showBefore ? 'grid gap-4 lg:grid-cols-2' : ''}>
            {showBefore && <Before text={text(listing.propertyInfo.description)} tall />}
            <div className="relative">
              <textarea rows={14} value={descrizione} onChange={e => setDescrizione(e.target.value)} className={`${input} pr-12 text-[15px] leading-relaxed ${showBefore ? 'block h-[26rem] resize-none' : ''}`} />
              <CopyIcon text={descrizione} />
            </div>
          </div>
        </Field>
      </section>

      {/* Cosa sistemare */}
      <section className="rise pt-6" style={{ animationDelay: '1.3s' }}>
        <h2 className="text-center text-3xl font-bold tracking-tight">Cosa sistemare sul portale</h2>
        <p className="mt-1 text-center text-muted">In ordine di priorità: cosa non va, perché ti fa perdere contatti, cosa fare adesso.</p>
        {/* auto-rows-fr: tutte le card alte uguali; la modifica foto si apre in un pannello sopra, non allunga la card */}
        <ol className="mt-8 grid auto-rows-fr gap-5 lg:grid-cols-2">
          {a.problemi.map((p, i) => <ProblemCard key={i} p={p} i={i} photos={listing.photos} />)}
        </ol>
      </section>

      <div className="space-y-5 pt-2">
        <Section title="Dati da aggiungere" hint="I compratori li cercano prima di chiamare.">
          {a.dati_mancanti.length ? <Checklist items={a.dati_mancanti} /> : <li className="text-sm text-muted">Nessuno, i dati principali ci sono.</li>}
        </Section>
        <Section limit={3} title="Foto: cosa rifare" hint={`Valutate le prime ${Math.min(3, listing.photos.length)} foto.`}>
          {a.foto_consigli.map(f => <li key={f} className="flex gap-2 text-sm"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{f}</li>)}
        </Section>
        <Section limit={3} title="Cosa funziona già" hint="Da tenere anche nella nuova versione.">
          {a.punti_forza.map(f => <li key={f} className="flex gap-2 text-sm text-muted"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{f}</li>)}
        </Section>
      </div>

      {/* CTA finale: salva titolo e descrizione (anche ritoccati), foto e dati letti dall'estensione */}
      <section className={`flex flex-col items-center gap-4 text-center ${BOX} sm:p-10`}>
        <h2 className="text-2xl font-bold tracking-tight">Salvalo nei tuoi immobili</h2>
        <p className="max-w-md text-sm text-muted">Tieni la versione riscritta, le {listing.photos.length} foto e tutti i dati dell&apos;annuncio, pronti per il tuo portfolio.</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button onClick={onRestart} className="btn-ghost rounded-full px-5 py-3 text-sm font-medium">Analizza un altro annuncio</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 btn-ink rounded-full px-6 py-3 text-sm font-semibold">
            {saving && <Loader2 size={16} className="animate-spin" />} {saving ? `Salvo ${listing.photos.length} foto...` : 'Salva nei miei immobili'}
          </button>
        </div>
        {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
      </section>
      <div className="pb-6" />
    </div>
  );
}

// Badge "91/100" accanto al titolo + "i": apre i criteri, cosa guadagni e perche' non si arriva a 100.
function ScoreInfo({ a }: { a: Analysis }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc, true); };
  }, [open]);
  const gap = 100 - a.score_potenziale;
  return (
    // translate-y 2px: centro ottico, il titolo e' quasi tutto minuscolo e il suo centro cade sotto quello delle maiuscole
    <div ref={box} className="relative translate-y-[2px]">
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} title="Come calcoliamo il punteggio"
        className="flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 pl-2.5 pr-1 text-sm font-semibold leading-none text-emerald-700 outline-none ring-1 ring-inset ring-emerald-700/20 ease-smooth transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-300">
        {a.score_potenziale}/100
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">i</span>
      </button>
      {open && (
        <div className="blur-in absolute left-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-3rem))] rounded-3xl bg-white p-5 text-left shadow-[0_2px_6px_rgba(0,0,0,.05),0_24px_48px_-16px_rgba(0,0,0,.22)] ring-1 ring-black/5">
          <div className="text-base font-bold tracking-tight">{gap > 0 ? `Perché ${a.score_potenziale} e non 100` : 'Punteggio pieno'}</div>
          <p className="mt-1 text-xs text-muted">Cinque criteri, 100 punti. Ora {a.score}, con le correzioni {a.score_potenziale}.{gap > 0 ? ' Quello che manca non si risolve modificando l\'annuncio:' : ''}</p>
          <ul className="mt-4 space-y-3.5">
            {CRITERI.map(c => {
              const x = a.criteri[c.key];
              return (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="shrink-0 tabular-nums text-muted">{x.punti}{x.punti_dopo > x.punti && <span className="font-semibold text-emerald-600"> → {x.punti_dopo}</span>}/{c.max}</span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/30" style={{ width: `${(x.punti_dopo / c.max) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${(x.punti / c.max) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{x.punti_dopo < c.max ? (x.limite || x.nota) : 'Pieno con le correzioni.'}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// Checklist vera: spunti i dati man mano che li aggiungi sul portale (stato solo in pagina).
function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (d: string) => setDone(prev => { const n = new Set(prev); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  return (
    <>
      {items.map(d => {
        const on = done.has(d);
        return (
          <li key={d}>
            <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(d)}
              className="group flex w-full items-center gap-2.5 rounded-xl py-1 text-left text-sm">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ease-smooth transition-colors ${on ? 'bg-emerald-500 text-white' : 'ring-1 ring-line group-hover:ring-ink/30'}`}>
                <Check size={13} strokeWidth={3} className={`ease-smooth transition-[opacity,transform] ${on ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
              </span>
              <span className={`ease-smooth transition-colors ${on ? 'text-muted line-through' : ''}`}>{d}</span>
            </button>
          </li>
        );
      })}
      <li className="pt-2 text-xs text-muted">{done.size === items.length ? 'Tutto aggiunto.' : `${done.size} di ${items.length} aggiunti`}</li>
    </>
  );
}

// "la foto della cucina" (stanza riconosciuta dall'AI); se manca, "la foto 3" come ripiego.
const roomLabel = (p: Problem) => {
  const r = (p.foto_stanza ?? '').trim();
  return r ? `la foto ${r.startsWith('l\'') ? `del${r.replace(/^l'/, 'l\'')}` : r.replace(/^(il|lo|la|i|gli|le) /, (_, a: string) => ({ il: 'del ', lo: 'dello ', la: 'della ', i: 'dei ', gli: 'degli ', le: 'delle ' } as Record<string, string>)[a])}` : `la foto ${p.foto_indice}`;
};

// Card di un punto da sistemare. Se riguarda una foto sistemabile con l'AI, la CTA sta in alto a destra.
function ProblemCard({ p, i, photos }: { p: Problem; i: number; photos: string[] }) {
  const [fix, setFix] = useState(false);
  const [fixed, setFixed] = useState<string | null>(null); // foto sistemata (scaricata o confermata con Finito)
  const g = GRAVITA[p.gravita];
  // Foto indicata dall'AI (1..3 = prime foto dell'annuncio, quelle analizzate)
  const src = p.foto_indice ? photos[p.foto_indice - 1] : undefined;
  const edit = src ? p.modifica_foto ?? '' : '';
  return (
    <li className={`rise flex flex-col ${BOX}`} style={{ animationDelay: `${1.35 + i * 0.08}s` }}>
      <div className="flex h-8 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${g.cls}`}>{g.label}</span>
        {edit && (fixed ? (
          <button onClick={() => setFix(true)} title="Riapri la modifica" className="blur-in ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/20">
            <Check size={14} strokeWidth={3} /> Foto sistemata
          </button>
        ) : (
          <button onClick={() => setFix(true)} onMouseEnter={() => warm('photo')} onFocus={() => warm('photo')} className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-xs font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.97]">
            <Wand2 size={14} /> Sistema con AI
          </button>
        ))}
      </div>
      <p className="mt-6 text-[17px] font-semibold leading-snug tracking-tight">{p.problema}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{p.perche}</p>
      {src && (
        <div className="mt-4 flex items-center gap-3">
          <img key={fixed ?? src} src={fixed ?? src} alt="" className="blur-in h-12 w-16 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 text-xs text-muted">
            <div className="font-medium text-ink first-letter:uppercase">{roomLabel(p)}</div>
            {fixed ? 'Sistemata con l\'AI, pronta da ricaricare sul portale.' : edit ? 'Si può sistemare con l\'AI, senza rifarla.' : 'Va rifatta o sostituita: l\'AI non basta.'}
          </div>
          {!edit && <Camera size={16} className="ml-auto shrink-0 text-muted" />}
        </div>
      )}
      <div className="mt-auto pt-4">
        <div className="rounded-2xl bg-canvas p-4">
          <div className="text-xs font-semibold text-ink">Come sistemarlo</div>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{p.soluzione}</p>
        </div>
      </div>
      {fix && src && <PhotoFix src={src} label={roomLabel(p)} edit={edit} onDone={setFixed} onClose={() => setFix(false)} />}
    </li>
  );
}

// Modifica foto con l'AI (Qwen-Image su RunPod) in un pannello sopra la pagina: prima/dopo e download.
// Messaggi a rotazione durante la modifica (come Foto AI).
const FIX_MSGS = ['Guardo la foto', 'Applico la modifica', 'Sistemo luce e dettagli', 'Rifinisco i bordi', 'Quasi pronta'];

function PhotoFix({ src, label, edit, onDone, onClose }: { src: string; label: string; edit: string; onDone: (url: string) => void; onClose: () => void }) {
  const [prompt, setPrompt] = useState(edit);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  // Rivelazione come Foto AI: burst (l'alone sfuma) -> line (linea + maniglia) -> slider (prima/dopo)
  const [reveal, setReveal] = useState<'burst' | 'line' | 'slider' | null>(null);
  const [msg, setMsg] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // capture + stop: Esc chiude solo il pannello, non tutto il flusso Migliora
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, [onClose]);
  useEffect(() => { warm('photo'); }, []); // pannello aperto: la GPU parte mentre si legge/ritocca l'istruzione
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setMsg(m => (m + 1) % FIX_MSGS.length), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const run = async () => {
    if (busy || !prompt.trim()) return;
    setBusy(true); setErr(null); setMsg(0); setReveal(null); setOut(null);
    // in modalita' finta la route torna la stessa foto
    const res = await authFetch('/api/platform/photo-edit', { method: 'POST', body: JSON.stringify({ imageUrl: src, prompt }) }).catch(() => null);
    let d = res ? await res.json().catch(() => ({})) : {};
    // ponytail: demo senza login (anteprima) in modalita' finta: stessa foto dopo qualche secondo
    if (AI_MOCK && res?.status === 401) { await wait(5000); d = { url: src }; }
    setBusy(false);
    if (!d.url) { setErr(d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Modifica non riuscita, riprova.'); return; }
    setOut(d.url); setReveal('burst');
    setTimeout(() => setReveal('line'), 600);
    setTimeout(() => setReveal('slider'), 1450);
  };

  const aurora = busy || reveal === 'burst';
  const tag = 'absolute z-[12] rounded-full bg-[rgba(33,31,28,.72)] px-3 py-1.5 text-[11px] font-bold text-white';

  // Portal su body: un antenato con transform (animazioni di ingresso) farebbe da contenitore al fixed e l'overlay non coprirebbe tutto.
  return createPortal(
    <div role="dialog" aria-modal="true" className={`${platformFontVars} fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 font-body text-ink backdrop-blur-sm`} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`rise relative w-full max-w-3xl rounded-[28px] bg-white p-5 text-left ${CARD_SHADOW}`}>
        <div className="flex items-start justify-between gap-4 px-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight first-letter:uppercase">{label}</h3>
            <p className="mt-0.5 text-sm text-muted">Descrivi la modifica, l&apos;AI la applica alla foto.</p>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>

        {/* Una sola foto grande: l'originale con l'alone mentre lavora, poi lo slider prima/dopo */}
        <div className="relative mt-4 aspect-[3/2] max-h-[60vh] w-full overflow-hidden rounded-2xl bg-canvas">
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {aurora && (
            <div className="pointer-events-none absolute inset-0 z-[6]" style={{ animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) both' }}>
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 86% 76% at 50% 50%, rgba(83,126,236,0) 46%, rgba(83,126,236,.5) 76%, rgba(83,126,236,.95) 100%)',
                animation: reveal === 'burst' ? 'gnm-aurora-burst .6s ease-out forwards' : 'gnm-aurora-edge 2.4s ease-in-out infinite',
              }} />
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 40% 120% at 0% 50%, rgba(83,126,236,.85) 0%, transparent 55%), radial-gradient(ellipse 40% 120% at 100% 50%, rgba(83,126,236,.85) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 0%, rgba(83,126,236,.7) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 100%, rgba(83,126,236,.7) 0%, transparent 55%)',
                backgroundSize: '200% 200%', mixBlendMode: 'screen',
                animation: reveal === 'burst' ? 'gnm-aurora-burst .6s ease-out forwards' : 'gnm-aurora-shift 3s ease-in-out infinite, gnm-aurora-pulse 4s ease-in-out infinite',
              }} />
              {busy && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-black/55 px-5 py-2.5 backdrop-blur-xl">
                  <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span key={msg} className="blur-in bg-clip-text text-xs font-bold text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #dbe5fb 20%, #537eec 50%, #dbe5fb 80%)', backgroundSize: '200% auto', animation: 'gnm-shimmer-text 2.5s linear infinite' }}>{FIX_MSGS[msg]}...</span>
                  <Elapsed className="text-xs font-bold text-white/70" />
                </div>
              )}
            </div>
          )}
          {out && (reveal === 'line' || reveal === 'slider') && (
            <InlineSlider before={src} after={out} isVertical={false} showImages={reveal === 'slider'} interactive={reveal === 'slider'} />
          )}
          {reveal === 'slider' && (
            <>
              <span className={`blur-in bottom-3 left-3 ${tag}`}>Prima</span>
              <span className={`blur-in bottom-3 right-3 ${tag}`}>Dopo</span>
              <button onClick={() => { downloadImage(out!, `${label.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-sistemata.jpg`); onDone(out!); }}
                className="blur-in absolute right-3 top-3 z-[12] flex h-9 items-center gap-1.5 rounded-full bg-white/85 px-3.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-white"><Download size={14} /> Scarica</button>
            </>
          )}
        </div>

        {/* Campo modifica stile home: testo + bottone primario dentro lo stesso contenitore */}
        <div className="mt-3 flex items-center gap-2 rounded-[22px] bg-canvas p-2 pl-4 ease-smooth transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/15">
          <textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Es. togli gli oggetti dal tavolo, lascia invariato il resto"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
            className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted/60" />
          {/* Dopo la prima generazione: Rigenera (secondario) a sinistra, Finito (primario) a destra */}
          {out && !busy && (
            <button onClick={run} disabled={!prompt.trim()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold ring-1 ring-black/10 ease-smooth transition-colors hover:bg-canvas disabled:opacity-40">
              <Wand2 size={14} /> Rigenera
            </button>
          )}
          {out && !busy ? (
            <button onClick={() => { onDone(out); onClose(); }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,transform] hover:bg-brand/90 active:scale-[0.97]">
              <Check size={14} strokeWidth={3} /> Finito
            </button>
          ) : (
            <button onClick={run} disabled={busy || !prompt.trim()}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {busy ? <>Modifico <Elapsed className="text-white/80" /></> : 'Genera'}
            </button>
          )}
        </div>
        {err && <p className="mt-2 px-1 text-sm text-rose-600">{err}</p>}
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, hint, children, limit }: { title: string; hint?: string; children: React.ReactNode; limit?: number }) {
  const [all, setAll] = useState(false);
  const items = Children.toArray(children);
  const hidden = limit && !all ? items.length - limit : 0;
  return (
    <section className={BOX}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">{hidden > 0 ? items.slice(0, limit) : items}</ul>
      {hidden > 0 && <button onClick={() => setAll(true)} className="mt-3 text-sm font-medium text-brand hover:underline">Leggi di più ({hidden})</button>}
    </section>
  );
}

// Copia dentro il campo, in alto a destra: solo icona, diventa spunta per 1,5 s.
function CopyIcon({ text: t, center }: { text: string; center?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" aria-label="Copia" title="Copia" onClick={() => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={`absolute right-2.5 flex h-7 w-7 ${center ? 'top-1/2 -translate-y-1/2' : 'top-2.5'} items-center justify-center rounded-full bg-white text-muted shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:text-ink`}>
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function Field({ label, meta, warn, children }: { label: string; meta: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-1.5">
        <span className="text-xs font-semibold text-muted">{label} <span className={`ml-1 font-normal ${warn ? 'text-rose-600' : ''}`}>{meta}</span></span>
      </div>
      {children}
    </div>
  );
}

function Before({ text: t, tall }: { text: string; tall?: boolean }) {
  // tall = affiancato alla descrizione: stessa altezza del campo (26rem), scorre dentro
  return t ? <p className={`${tall ? 'h-[26rem]' : 'mb-2 max-h-40 text-xs'} overflow-y-auto whitespace-pre-line rounded-2xl bg-canvas p-4 leading-relaxed text-muted ${tall ? 'text-sm' : ''}`}>{t}</p> : null;
}
