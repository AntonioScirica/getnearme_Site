'use client';

import { Children, useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, ExternalLink, Loader2, Wand2 } from 'lucide-react';
import { AI_MOCK, mockFor } from '@/lib/aiMock';
import { authFetch, CARD_SHADOW, go } from './api';
import CountUp from './CountUp';
import { PhotoEditModal } from './AiPhoto';
import { CRITERI, withScores, type Criteri } from '@/lib/listingScore';
import { pageLang, tr, trf } from './i18n';

// "Migliora annuncio": link di qualsiasi sito -> il nostro server legge l'annuncio (api/platform/read-listing) ->
// scansione animata -> verdetto a regole, riscrittura a richiesta. Se non si riesce a leggere: testo incollato.
// Il flusso vive nella home (HomeView): la card "Miglioralo" diventa il browser e poi il verdetto.

// raw = pagina grezza letta dall'estensione (testo, JSON incorporati, meta, immagini): la legge Qwen lato server.
export type Listing = { url: string; title: string; address: string; propertyInfo: Record<string, unknown>; photos: string[]; raw?: Record<string, unknown> };
type Problem = { area: string; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice?: number; foto_stanza?: string; modifica_foto?: string };
export type Analysis = {
  score: number; score_potenziale: number; criteri: Criteri; sintesi: string; punti_forza: string[]; problemi: Problem[];
  dati_mancanti: string[]; foto_consigli: string[]; titolo: string; descrizione: string;
  // dal 28/09/2026 il verdetto e' a regole e la riscrittura a richiesta: riscritto false = titolo e descrizione originali
  riscritto?: boolean; fields?: Record<string, unknown>;
};
export type Stage = 'input' | 'opening' | 'scanning' | 'done' | 'manual' | 'error';

// Qualsiasi sito di annunci: l'estensione legge la pagina in modo generico e Qwen ne estrae i dati.
const LINK_RE = /^https:\/\/[^/\s]+\.[^/\s]+/i;
export const SCAN_STEPS = [tr('Leggo i dati dell\'annuncio', 'Reading the listing details'), tr('Guardo le foto', 'Checking the photos'), tr('Valuto titolo e descrizione', 'Reviewing title and description'), tr('Cerco i dati mancanti', 'Looking for missing details'), tr('Riscrivo l\'annuncio', 'Rewriting the listing')];

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
    // passi distribuiti sulla durata tipica del verdetto (lettura dei campi + regole, pochi secondi)
    const t = setInterval(() => setStep(s => Math.min(s + 1, SCAN_STEPS.length - 1)), 1500);
    return () => clearInterval(t);
  }, [stage]);

  const analyze = async (l: Listing, id = run.current, demo = false) => {
    // Connessione lenta: resta su "Apro" finche' le prime foto non sono scaricate e decodificate
    // (max 5 s), cosi' la scansione non parte su riquadri vuoti e la decodifica non blocca l'animazione.
    await Promise.race([Promise.all(l.photos.slice(0, 3).map(src => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); })), wait(5000)]);
    if (id !== run.current) return;
    setListing(l); setStep(0); setStage('scanning');
    if (demo) { await wait(6000); if (id === run.current) { setAnalysis(cap(withScores(mockFor<Analysis>('analyze')))); setStage('done'); } return; }
    // pagina grezza accorciata: bastano l'inizio del testo e dei dati incorporati per leggere i campi
    const raw = l.raw as { text?: string; json?: string; meta?: unknown } | undefined;
    const slim = raw ? { text: raw.text?.slice(0, 20000), json: raw.json?.slice(0, 20000), meta: raw.meta } : undefined;
    const res = await authFetch('/api/platform/analyze', { method: 'POST', body: JSON.stringify({ listing: { ...l, raw: slim }, lang: pageLang() }) }).catch(() => null);
    if (id !== run.current) return;
    if (res?.status === 402) { window.dispatchEvent(new Event('agenteimmo:no-credits')); setError(tr('Hai usato le 5 analisi gratuite. Scegli un piano per continuare.', 'You have used your 5 free analyses. Choose a plan to continue.')); setStage('error'); return; }
    if (!res?.ok) { setError(tr('Analisi non riuscita, riprova.', 'Analysis failed, please try again.')); setStage('error'); return; }
    setAnalysis(cap(await res.json()));
    setStage('done');
  };

  const start = async (target: string) => {
    const id = ++run.current;
    const u = target.trim();
    setError(null); setAnalysis(null);
    if (!LINK_RE.test(u)) { setError(tr('Incolla il link completo dell\'annuncio (inizia con https://).', 'Paste the full listing link (it starts with https://).')); setStage('error'); return; }
    setListing({ url: u, title: '', address: '', propertyInfo: {}, photos: [] });
    setStage('opening');
    if (AI_MOCK) { await wait(1500); if (id === run.current) analyze(MOCK_LISTING(u), id, true); return; }
    // la legge il nostro server (browser headless, o ZenRows per i portali che bloccano): niente estensione
    // se va male si ricomincia da soli (fino a 3 volte), l'agente vede solo "Apro l'annuncio"
    let res: Response | null = null, d: { error?: string } | null = null;
    for (let tent = 0; tent < 3; tent++) {
      res = await authFetch('/api/platform/read-listing', { method: 'POST', body: JSON.stringify({ url: u }) }).catch(() => null);
      if (id !== run.current) return;
      d = res ? await res.json().catch(() => null) : null;
      if ((res?.ok && d) || d?.error === 'not_a_listing' || d?.error === 'invalid_url' || res?.status === 401) break;
    }
    if (res?.ok && d) { analyze(d as unknown as Listing, id); return; }
    setError(d?.error === 'not_a_listing'
      ? tr('Questa pagina non sembra un annuncio immobiliare (non trovo prezzo e superficie). Controlla il link.', 'This page does not look like a property listing (no price or floor area found). Check the link.')
      : tr('Non sono riuscito a leggere l\'annuncio (pagina lenta, rimossa o bloccata). Riprova tra poco, oppure incolla il testo.', 'I could not read the listing (slow, removed or blocked page). Try again shortly, or paste the text.'));
    setStage('error');
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

  if (stage === 'error') return (
    <Center title={tr('Qualcosa non è andato', 'Something went wrong')} body={error ?? tr('Riprova tra poco.', 'Try again shortly.')}>
      <button onClick={onRetry} className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold">{tr('Riprova', 'Retry')}</button>
      <button onClick={onManual} className="btn-ghost rounded-full px-5 py-2.5 text-sm font-medium">{tr('Incolla il testo', 'Paste the text')}</button>
    </Center>
  );
  if (stage === 'manual') return (
    <div className="blur-in flex h-full flex-col p-2">
      <textarea autoFocus value={pasted} onChange={e => setPasted(e.target.value)} placeholder={tr('Titolo, prezzo, caratteristiche e descrizione, copiati dalla pagina dell\'annuncio...', 'Title, price, features and description, copied from the listing page...')}
        className="min-h-0 w-full flex-1 resize-none rounded-2xl bg-canvas p-4 text-sm leading-relaxed outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{url ? tr('Il link resta collegato all\'analisi.', 'The link stays attached to the analysis.') : ''}</span>
        <button onClick={() => onText(pasted)} disabled={pasted.trim().length < 80} className="btn-ink rounded-full px-5 py-2.5 text-sm font-semibold">{tr('Analizza il testo', 'Analyse the text')}</button>
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
            <div className="text-xs font-medium text-muted">{tr('Score dell\'annuncio attuale', 'Current listing score')}</div>
            <div className={`mt-1 text-5xl font-bold leading-none tracking-tight ${tone.text}`}><CountUp value={a.score} delay={400} duration={1200} /><span className="text-xl text-muted">/100</span>
              {a.score_potenziale > a.score && <span className="ml-3 text-sm font-semibold tracking-normal text-emerald-600">→ {a.score_potenziale} {tr('sistemando tutto', 'once everything is fixed')}</span>}</div>
          </div>
          <a href={listing.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-ink"><ExternalLink size={12} /> {tr('Originale', 'Original')}</a>
        </div>
        <div className="blur-in relative mt-3 h-1.5 overflow-hidden rounded-full bg-canvas" style={{ animationDelay: '.5s' }}>
          <div className="grow-x absolute inset-y-0 left-0 rounded-full bg-emerald-500/25" style={{ width: `${a.score_potenziale}%` }} />
          <div className={`grow-x absolute inset-y-0 left-0 rounded-full ${tone.bar}`} style={{ width: `${a.score}%` }} />
        </div>
        <p className="blur-in mt-3 line-clamp-3 text-sm leading-relaxed text-ink/80" style={{ animationDelay: '.6s' }}>{a.sintesi}</p>
        <div className="stagger-chips mt-auto flex flex-wrap gap-1.5 pt-3 text-xs">
          {urgent > 0 && <span className="rounded-full bg-rose-50 px-3 py-1.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-700/20">{urgent} {tr('da fare subito', 'to fix now')}</span>}
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{a.problemi.length} {tr('punti da sistemare', 'points to fix')}</span>
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{a.dati_mancanti.length} {tr('dati mancanti', 'missing details')}</span>
          <span className="rounded-full bg-canvas px-3 py-1.5 text-muted ring-1 ring-inset ring-black/10">{listing.photos.length} {tr('foto', 'photos')}</span>
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
  alta: { label: tr('Da fare subito', 'Fix now'), cls: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-700/20' },
  media: { label: tr('Consigliato', 'Recommended'), cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/20' },
  bassa: { label: tr('Rifinitura', 'Polish'), cls: 'bg-canvas text-muted ring-1 ring-inset ring-black/10' },
};

export function Results({ listing, analysis: a, onSaved, onRestart }: { listing: Listing; analysis: Analysis; onSaved?: () => void; onRestart: () => void }) {
  const [titolo, setTitolo] = useState(a.titolo);
  const [descrizione, setDescrizione] = useState(a.descrizione);
  // riscrittura su richiesta (gratis con Gemini, altrimenti 1 credito)
  const [riscritto, setRiscritto] = useState(a.riscritto !== false);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const rewrite = async () => {
    setRewriting(true); setRewriteError(null);
    const res = await authFetch('/api/platform/rewrite', { method: 'POST', body: JSON.stringify({ url: listing.url, fields: { ...a.fields, titolo, descrizione } }) }).catch(() => null);
    const d = res ? await res.json().catch(() => null) : null;
    setRewriting(false);
    if (!res?.ok || !d?.descrizione) { setRewriteError(d?.error === 'no_credits' ? tr('Crediti finiti: scegli un piano per riscrivere l\'annuncio.', 'Out of credits: choose a plan to rewrite the listing.') : tr('Riscrittura non riuscita, riprova.', 'Rewrite failed, please try again.')); return; }
    setTitolo(d.titolo); setDescrizione(d.descrizione); setRiscritto(true); setShowBefore(true);
  };
  const origTitle = text(a.fields?.titolo) || listing.title;
  const origDescr = text(a.fields?.descrizione) || text(listing.propertyInfo.description);
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
    if (!res?.ok) { setSaveError(tr('Salvataggio non riuscito, riprova.', 'Save failed, please try again.')); return; }
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
              <h2 className="text-2xl font-bold leading-none tracking-tight">{riscritto ? tr('Annuncio riscritto', 'Rewritten listing') : tr('Il tuo annuncio', 'Your listing')}</h2>
              <ScoreInfo a={a} />
            </div>
            <p className="mt-2 text-sm text-muted">{riscritto ? tr('Pronto da incollare sul portale.', 'Ready to paste on the portal.') : tr('Titolo e descrizione come sono ora. Falli riscrivere dall\'AI, poi ritocca quello che vuoi.', 'Title and description as they are now. Have the AI rewrite them, then tweak anything you like.')}</p>
            {rewriteError && <p className="mt-2 text-sm text-rose-600">{rewriteError}</p>}
          </div>
          {riscritto
            ? <button onClick={() => setShowBefore(v => !v)} className="btn-ghost shrink-0 self-start rounded-full px-4 py-2 text-sm font-medium">{showBefore ? tr('Nascondi originale', 'Hide original') : tr('Confronta con originale', 'Compare with original')}</button>
            : <button onClick={rewrite} disabled={rewriting} className="btn-ink flex shrink-0 items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold">{rewriting ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />} {rewriting ? tr('Riscrivo...', 'Rewriting...') : tr('Riscrivi con l\'AI', 'Rewrite with AI')}</button>}
        </div>

        <Field label={tr('Titolo', 'Title')} meta={`${titolo.length}/60`} warn={titolo.length > 60}>
          {showBefore && <Before text={origTitle} />}
          <div className="relative">
            <input value={titolo} onChange={e => setTitolo(e.target.value)} className={`${input} pr-12 text-base font-medium`} />
            <CopyIcon text={titolo} center />
          </div>
        </Field>
        <Field label={tr('Descrizione', 'Description')} meta={`${words} ${tr('parole', 'words')}`}>
          <div className={showBefore ? 'grid gap-4 lg:grid-cols-2' : ''}>
            {showBefore && <Before text={origDescr} tall />}
            <div className="relative">
              <textarea rows={14} value={descrizione} onChange={e => setDescrizione(e.target.value)} className={`${input} pr-12 text-[15px] leading-relaxed ${showBefore ? 'block h-[26rem] resize-none' : ''}`} />
              <CopyIcon text={descrizione} />
            </div>
          </div>
        </Field>
      </section>

      {/* Cosa sistemare */}
      <section className="rise pt-6" style={{ animationDelay: '1.3s' }}>
        <h2 className="text-center text-3xl font-bold tracking-tight">{tr('Cosa sistemare sul portale', 'What to fix on the portal')}</h2>
        <p className="mt-1 text-center text-muted">{tr('In ordine di priorità: cosa non va, perché ti fa perdere contatti, cosa fare adesso.', 'In order of priority: what is wrong, why it costs you leads, what to do now.')}</p>
        {/* auto-rows-fr: tutte le card alte uguali; la modifica foto si apre in un pannello sopra, non allunga la card */}
        <ol className="mt-8 grid auto-rows-fr gap-5 lg:grid-cols-2">
          {a.problemi.map((p, i) => <ProblemCard key={i} p={p} i={i} photos={listing.photos} />)}
        </ol>
      </section>

      <div className="space-y-5 pt-2">
        <Section title={tr('Dati da aggiungere', 'Details to add')} hint={tr('I compratori li cercano prima di chiamare.', 'Buyers look for them before calling.')}>
          {a.dati_mancanti.length ? <Checklist items={a.dati_mancanti} /> : <li className="text-sm text-muted">{tr('Nessuno, i dati principali ci sono.', 'None, the key details are there.')}</li>}
        </Section>
        {a.foto_consigli.length > 0 && <Section limit={3} title={tr('Foto: cosa rifare', 'Photos: what to redo')} hint={tr(`Valutate le prime ${Math.min(3, listing.photos.length)} foto.`, `First ${Math.min(3, listing.photos.length)} photos reviewed.`)}>
          {a.foto_consigli.map(f => <li key={f} className="flex gap-2 text-sm"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />{f}</li>)}
        </Section>}
        {a.punti_forza.length > 0 && 
<Section limit={3} title={tr('Cosa funziona già', 'What already works')} hint={tr('Da tenere anche nella nuova versione.', 'Keep it in the new version too.')}>
          {a.punti_forza.map(f => <li key={f} className="flex gap-2 text-sm text-muted"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{f}</li>)}
        </Section>}
      </div>

      {/* CTA finale: salva titolo e descrizione (anche ritoccati), foto e dati letti dall'estensione */}
      <section className={`flex flex-col items-center gap-4 text-center ${BOX} sm:p-10`}>
        <h2 className="text-2xl font-bold tracking-tight">{tr('Salvalo nei tuoi immobili', 'Save it to your properties')}</h2>
        <p className="max-w-md text-sm text-muted">{tr(`Tieni la versione riscritta, le ${listing.photos.length} foto e tutti i dati dell'annuncio, pronti per il tuo portfolio.`, `Keep the rewritten version, the ${listing.photos.length} photos and all the listing details, ready for your portfolio.`)}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button onClick={onRestart} className="btn-ghost rounded-full px-5 py-3 text-sm font-medium">{tr('Analizza un altro annuncio', 'Analyse another listing')}</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 btn-ink rounded-full px-6 py-3 text-sm font-semibold">
            {saving && <Loader2 size={16} className="animate-spin" />} {saving ? tr(`Salvo ${listing.photos.length} foto...`, `Saving ${listing.photos.length} photos...`) : tr('Salva nei miei immobili', 'Save to my properties')}
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
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} title={tr('Come calcoliamo il punteggio', 'How we calculate the score')}
        className="flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 pl-2.5 pr-1 text-sm font-semibold leading-none text-emerald-700 outline-none ring-1 ring-inset ring-emerald-700/20 ease-smooth transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-300">
        {a.score_potenziale}/100
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">i</span>
      </button>
      {open && (
        <div className="blur-in absolute left-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-3rem))] rounded-3xl bg-white p-5 text-left shadow-[0_2px_6px_rgba(0,0,0,.05),0_24px_48px_-16px_rgba(0,0,0,.22)] ring-1 ring-black/5">
          <div className="text-base font-bold tracking-tight">{gap > 0 ? tr(`Perché ${a.score_potenziale} e non 100`, `Why ${a.score_potenziale} and not 100`) : tr('Punteggio pieno', 'Full score')}</div>
          <p className="mt-1 text-xs text-muted">{tr(`Cinque criteri, 100 punti. Ora ${a.score}, con le correzioni ${a.score_potenziale}.`, `Five criteria, 100 points. Now ${a.score}, with the fixes ${a.score_potenziale}.`)}{gap > 0 ? tr(' Quello che manca non si risolve modificando l\'annuncio:', ' The rest cannot be fixed by editing the listing:') : ''}</p>
          <ul className="mt-4 space-y-3.5">
            {CRITERI.map(c => {
              const x = a.criteri[c.key];
              return (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{trf(c.label)}</span>
                    <span className="shrink-0 tabular-nums text-muted">{x.punti}{x.punti_dopo > x.punti && <span className="font-semibold text-emerald-600"> → {x.punti_dopo}</span>}/{c.max}</span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/30" style={{ width: `${(x.punti_dopo / c.max) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${(x.punti / c.max) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{x.punti_dopo < c.max ? (x.limite || x.nota) : tr('Pieno con le correzioni.', 'Full marks with the fixes.')}</p>
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
      <li className="pt-2 text-xs text-muted">{done.size === items.length ? tr('Tutto aggiunto.', 'All added.') : tr(`${done.size} di ${items.length} aggiunti`, `${done.size} of ${items.length} added`)}</li>
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
          <button onClick={() => setFix(true)} title={tr('Riapri la modifica', 'Reopen the edit')} className="blur-in ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/20">
            <Check size={14} strokeWidth={3} /> {tr('Foto sistemata', 'Photo fixed')}
          </button>
        ) : (
          <button onClick={() => setFix(true)} className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-xs font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.97]">
            <Wand2 size={14} /> {tr('Sistema con AI', 'Fix with AI')}
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
            {fixed ? tr('Sistemata con l\'AI, pronta da ricaricare sul portale.', 'Fixed with AI, ready to upload to the portal again.') : edit ? tr('Si può sistemare con l\'AI, senza rifarla.', 'It can be fixed with AI, no need to reshoot.') : tr('Va rifatta o sostituita: l\'AI non basta.', 'It needs to be reshot or replaced: AI is not enough.')}
          </div>
          {!edit && <Camera size={16} className="ml-auto shrink-0 text-muted" />}
        </div>
      )}
      <div className="mt-auto pt-4">
        <div className="rounded-2xl bg-canvas p-4">
          <div className="text-xs font-semibold text-ink">{tr('Come sistemarlo', 'How to fix it')}</div>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{p.soluzione}</p>
        </div>
      </div>
      {fix && src && <PhotoFix src={src} label={roomLabel(p)} edit={edit} onDone={setFixed} onClose={() => setFix(false)} />}
    </li>
  );
}

// Modifica foto con l'AI (GPT Image) in un pannello sopra la pagina: prima/dopo e download.
function PhotoFix({ src, label, edit, onDone, onClose }: { src: string; label: string; edit: string; onDone: (url: string) => void; onClose: () => void }) {
  return <PhotoEditModal src={src} title={label} initialText={edit} onClose={onClose}
    actions={[{ label: tr('Finito', 'Done'), primary: true, onClick: url => { onDone(url); onClose(); } }]} />;
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
      {hidden > 0 && <button onClick={() => setAll(true)} className="mt-3 text-sm font-medium text-brand hover:underline">{tr('Leggi di più', 'Read more')} ({hidden})</button>}
    </section>
  );
}

// Copia dentro il campo, in alto a destra: solo icona, diventa spunta per 1,5 s.
export function CopyIcon({ text: t, center }: { text: string; center?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" aria-label={tr('Copia', 'Copy')} title={tr('Copia', 'Copy')} onClick={() => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
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
