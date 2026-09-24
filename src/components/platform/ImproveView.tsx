'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, Download, ExternalLink, Loader2, Puzzle, Sparkles, Wand2 } from 'lucide-react';
import { downloadImage } from '@/lib/staging';
import { AI_MOCK, mockFor } from '@/lib/aiMock';
import { authFetch, CARD_SHADOW, extSend, EXTENSION_URL, go } from './api';
import CountUp from './CountUp';

// "Migliora annuncio": link portale -> estensione legge l'annuncio in background ->
// scansione animata -> diagnosi + annuncio riscritto. Senza estensione: testo incollato.
// Il flusso vive nella home (HomeView): la card "Miglioralo" diventa il browser e poi il verdetto.

export type Listing = { url: string; title: string; address: string; propertyInfo: Record<string, unknown>; photos: string[] };
type Problem = { area: string; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice?: number; modifica_foto?: string };
export type Analysis = {
  score: number; sintesi: string; punti_forza: string[]; problemi: Problem[];
  dati_mancanti: string[]; foto_consigli: string[]; titolo: string; descrizione: string;
};
export type Stage = 'input' | 'opening' | 'scanning' | 'done' | 'no-extension' | 'manual' | 'error';

const PORTAL_RE = /^https:\/\/(www\.)?(immobiliare\.it|idealista\.(it|com|pt)|casa\.it)\//i;
export const SCAN_STEPS = ['Leggo i dati dell\'annuncio', 'Guardo le foto', 'Valuto titolo e descrizione', 'Cerco i dati mancanti', 'Riscrivo l\'annuncio'];

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

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
    const t = setInterval(() => setStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, [stage]);

  const analyze = async (l: Listing, id = run.current, demo = false) => {
    // Connessione lenta: resta su "Apro" finche' le prime foto non sono scaricate e decodificate
    // (max 5 s), cosi' la scansione non parte su riquadri vuoti e la decodifica non blocca l'animazione.
    await Promise.race([Promise.all(l.photos.slice(0, 3).map(src => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); })), wait(5000)]);
    if (id !== run.current) return;
    setListing(l); setStep(0); setStage('scanning');
    if (demo) { await wait(6000); if (id === run.current) { setAnalysis(mockFor<Analysis>('analyze')); setStage('done'); } return; }
    const res = await authFetch('/api/platform/analyze', { method: 'POST', body: JSON.stringify({ listing: l }) }).catch(() => null);
    if (id !== run.current) return;
    if (!res?.ok) { setError('Analisi non riuscita, riprova.'); setStage('error'); return; }
    setAnalysis(await res.json());
    setStage('done');
  };

  const start = async (target: string) => {
    const id = ++run.current;
    const u = target.trim();
    setError(null); setAnalysis(null);
    if (!PORTAL_RE.test(u)) { setError('Incolla il link di un annuncio da immobiliare.it, idealista o casa.it.'); setStage('error'); return; }
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
      setError(r?.error === 'timeout'
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
            ? facts.map((f, i) => <span key={f} {...fade(0.25 + i * 0.05)} className="blur-in rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink/70">{f}</span>)
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
            <div className={`mt-1 text-5xl font-bold leading-none tracking-tight ${tone.text}`}><CountUp value={a.score} delay={400} duration={1200} /><span className="text-xl text-muted">/100</span></div>
          </div>
          <a href={listing.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-ink"><ExternalLink size={12} /> Originale</a>
        </div>
        <div className="blur-in mt-3 h-1.5 overflow-hidden rounded-full bg-canvas" style={{ animationDelay: '.5s' }}><div className={`grow-x h-full rounded-full ${tone.bar}`} style={{ width: `${a.score}%` }} /></div>
        <p className="blur-in mt-3 line-clamp-3 text-sm leading-relaxed text-ink/80" style={{ animationDelay: '.6s' }}>{a.sintesi}</p>
        <div className="stagger-chips mt-auto flex flex-wrap gap-1.5 pt-3 text-xs">
          {urgent > 0 && <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">{urgent} da fare subito</span>}
          <span className="rounded-full bg-canvas px-3 py-1 text-muted">{a.problemi.length} punti da sistemare</span>
          <span className="rounded-full bg-canvas px-3 py-1 text-muted">{a.dati_mancanti.length} dati mancanti</span>
          <span className="rounded-full bg-canvas px-3 py-1 text-muted">{listing.photos.length} foto</span>
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
  alta: { label: 'Da fare subito', cls: 'bg-rose-50 text-rose-700' },
  media: { label: 'Consigliato', cls: 'bg-amber-50 text-amber-700' },
  bassa: { label: 'Rifinitura', cls: 'bg-canvas text-muted' },
};

function CopyBtn({ text: t }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} {copied ? 'Copiato' : 'Copia'}
    </button>
  );
}

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
      body: JSON.stringify({ titolo, descrizione, listing, score: a.score, suggerimenti: a.problemi.map(x => x.soluzione) }),
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
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Sparkles size={20} /> Annuncio riscritto</h2>
            <p className="mt-1 text-sm text-muted">Pronto da incollare sul portale, puoi ritoccarlo qui.</p>
          </div>
          <button onClick={() => setShowBefore(v => !v)} className="btn-ghost shrink-0 self-start rounded-full px-4 py-2 text-sm font-medium">{showBefore ? 'Nascondi originale' : 'Confronta con originale'}</button>
        </div>

        <Field label="Titolo" meta={`${titolo.length}/70`} warn={titolo.length > 70}>
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
        <ol className="mt-8 grid gap-5 lg:grid-cols-2">
          {a.problemi.map((p, i) => {
            const g = GRAVITA[p.gravita];
            return (
              <li key={i} className={`rise flex flex-col ${BOX}`} style={{ animationDelay: `${1.35 + i * 0.08}s` }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${g.cls}`}>{g.label}</span>
                  <span className="text-xs text-muted">{p.area}</span>
                </div>
                <p className="mt-4 text-[17px] font-semibold leading-snug tracking-tight">{p.problema}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.perche}</p>
                {/* Foto indicata dall'AI (1..3 = prime foto dell'annuncio, quelle analizzate) */}
                {!!p.foto_indice && listing.photos[p.foto_indice - 1] && (
                  <PhotoFix src={listing.photos[p.foto_indice - 1]} index={p.foto_indice} edit={p.modifica_foto ?? ''} />
                )}
                <div className="mt-auto pt-4">
                  <div className="rounded-2xl bg-canvas p-4">
                    <div className="text-xs font-semibold text-ink">Come sistemarlo</div>
                    <p className="mt-1 text-sm leading-relaxed text-ink/80">{p.soluzione}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-5 pt-2 lg:grid-cols-3">
        <Section title="Dati da aggiungere" hint="I compratori li cercano prima di chiamare." copyText={a.dati_mancanti.map(d => `- ${d}`).join('\n')}>
          {a.dati_mancanti.length ? a.dati_mancanti.map(d => (
            <li key={d} className="flex items-center gap-2 text-sm"><span className="h-4 w-4 shrink-0 rounded-md ring-1 ring-line" />{d}</li>
          )) : <li className="text-sm text-muted">Nessuno, i dati principali ci sono.</li>}
        </Section>
        <Section title="Foto: cosa rifare" hint={`Valutate le prime ${Math.min(3, listing.photos.length)} foto.`} copyText={a.foto_consigli.map(f => `- ${f}`).join('\n')}>
          {a.foto_consigli.map(f => <li key={f} className="flex gap-2 text-sm"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{f}</li>)}
        </Section>
        <Section title="Cosa funziona già" hint="Da tenere anche nella nuova versione." copyText={a.punti_forza.map(f => `- ${f}`).join('\n')}>
          {a.punti_forza.map(f => <li key={f} className="flex gap-2 text-sm text-muted"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{f}</li>)}
        </Section>
      </div>

      {/* CTA finale: salva titolo e descrizione (anche ritoccati), foto e dati letti dall'estensione */}
      <section className={`flex flex-col items-center gap-4 text-center ${BOX} sm:p-10`}>
        <h2 className="text-2xl font-bold tracking-tight">Salvalo nei tuoi immobili</h2>
        <p className="max-w-md text-sm text-muted">Tieni la versione riscritta, le {listing.photos.length} foto e tutti i dati dell&apos;annuncio, pronti per il tuo portfolio.</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 btn-ink rounded-full px-6 py-3 text-sm font-semibold">
            {saving && <Loader2 size={16} className="animate-spin" />} {saving ? `Salvo ${listing.photos.length} foto...` : 'Salva nei miei immobili'}
          </button>
          <button onClick={onRestart} className="btn-ghost rounded-full px-5 py-3 text-sm font-medium">Analizza un altro annuncio</button>
        </div>
        {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
      </section>
      <div className="pb-6" />
    </div>
  );
}

// Foto citata da un problema: miniatura + modifica AI proposta (Qwen-Image su RunPod)
// con prima/dopo e download. Se la modifica e' vuota va rifatta a mano.
function PhotoFix({ src, index, edit }: { src: string; index: number; edit: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(edit);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setErr(null);
    // Qwen-Image sul nostro endpoint RunPod (in modalita' finta la route torna la stessa foto).
    const res = await authFetch('/api/platform/photo-edit', { method: 'POST', body: JSON.stringify({ imageUrl: src, prompt }) }).catch(() => null);
    setBusy(false);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.url) setOut(d.url);
    else setErr(d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Modifica non riuscita, riprova.');
  };

  return (
    <div className="mt-4 rounded-2xl ring-1 ring-line p-2.5">
      <div className="flex items-center gap-3">
        <img src={src} alt="" className="h-14 w-20 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Foto {index} dell&apos;annuncio</div>
          <div className="text-xs text-muted">{edit ? 'Si può sistemare con l\'AI, senza rifarla.' : 'Va rifatta o sostituita: l\'AI non basta.'}</div>
        </div>
        {edit ? (
          <button onClick={() => setOpen(v => !v)} className="flex shrink-0 items-center gap-1.5 btn-ink rounded-full px-3.5 py-2 text-sm font-semibold">
            <Wand2 size={15} /> Sistema con AI
          </button>
        ) : <Camera size={18} className="mr-2 shrink-0 text-muted" />}
      </div>

      {open && (
        <div className="blur-in mt-3 space-y-3 border-t border-line px-1 pb-1 pt-3">
          <label className="block text-xs font-semibold text-muted">Modifica da fare</label>
          <textarea rows={2} value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full rounded-xl bg-canvas px-3 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
          {out ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <figure><img src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" /><figcaption className="mt-1 text-xs text-muted">Prima</figcaption></figure>
                <figure><img src={out} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" /><figcaption className="mt-1 text-xs text-muted">Dopo</figcaption></figure>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadImage(out, `foto-${index}-sistemata.jpg`)} className="flex items-center gap-1.5 btn-ink rounded-full px-4 py-2 text-sm font-semibold"><Download size={15} /> Scarica</button>
                <button onClick={run} disabled={busy} className="btn-ghost rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50">Rigenera</button>
              </div>
            </>
          ) : (
            <button onClick={run} disabled={busy || !prompt.trim()} className="flex items-center gap-2 btn-ink rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} {busy ? 'Sto modificando la foto...' : 'Genera'}
            </button>
          )}
          {err && <p className="text-sm text-rose-600">{err}</p>}
        </div>
      )}
    </div>
  );
}

function Section({ title, hint, copyText, children }: { title: string; hint?: string; copyText: string; children: React.ReactNode }) {
  return (
    <section className={BOX}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      <ul className="mt-4 space-y-2.5">{children}</ul>
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
