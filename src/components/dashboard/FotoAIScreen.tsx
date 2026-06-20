'use client';

// Foto AI (virtual staging) — port of the extension's unified photo wizard.
// 1 photo  → instant generation (replicate-staging, nano-banana)
// 2..30    → batch (create-batch-staging), results delivered by email.

import React from 'react';
import { s, Box, Icon } from './ui';
import {
  STAGING_STYLES, STAGING_ANGLES, MAX_BATCH_PHOTOS,
  fileToResizedDataUrl, startStaging, pollStagingStatus, findLatestProcessingPrediction, createBatchStaging, downloadImage,
  fetchStagingQuota, type StagingQuota, getTokenFast,
} from '@/lib/staging';
import { saveSingleGenerationToBatch, deleteBatchPhoto } from '@/lib/stagingBatches';
import { saveOriginalMedia } from '@/lib/localMediaCache';

type Photo = { id: string; dataUrl: string; name: string; w: number; h: number };

const GEN_SECONDS = 45; // countdown estimate, same ballpark as the extension
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 120_000; // cap totale: oltre questo → timeout client
const PENDING_KEY = 'gnm_pending_staging';

// Pending single-photo generation tracked across tab switches / reload.
type Pending = { predictionId: string; before: string; style: string | null; customPrompt: string | null; startedAt: number; replaceBatchId?: string | null };

import type { Project } from './types';

// Pacchetti foto extra (Stripe Payment Links reali da ai_photo_packages).
const PHOTO_PACKS = [
  { id: 'ai-listing-boost', name: 'Listing Boost', photos: 500, price: 50, popular: false, link: 'https://buy.stripe.com/00wdR92Cn6nx36U01aak00A' },
  { id: 'ai-real-estate-pro', name: 'Real Estate Pro', photos: 1500, price: 99, popular: true, link: 'https://buy.stripe.com/fZucN54KvaDN0YM5luak00B' },
  { id: 'ai-agency', name: 'Agency Pack', photos: 4000, price: 199, popular: false, link: 'https://buy.stripe.com/14AdR9b8T6nx36U8xGak00C' },
];

function userFromToken(): { id?: string; email?: string } {
  try { const t = getTokenFast(); const p = JSON.parse(atob(t.split('.')[1])); return { id: p.sub, email: p.email }; } catch { return {}; }
}

// Popup "Pacchetti AI Foto" quando la quota mensile è esaurita.
function PhotoPacksModal({ onClose }: { onClose: () => void }) {
  const buy = (link: string) => {
    const { id, email } = userFromToken();
    let url = link;
    try { const u = new URL(link); if (id) u.searchParams.set('client_reference_id', id); if (email) u.searchParams.set('prefilled_email', email); url = u.toString(); } catch { /* keep link */ }
    window.open(url, '_blank');
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,17,.55)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: 20, boxShadow: '0 28px 72px rgba(20,18,15,.3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0ede7' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-.3px' }}>Pacchetti AI Foto</h3>
          <button onClick={onClose} aria-label="Chiudi" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8c867d' }}><Icon name="x" size={20} color="#8c867d" /></button>
        </div>
        <div style={{ padding: '22px 28px 26px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Hai esaurito le foto di questo mese</div>
            <div style={{ fontSize: 13.5, color: '#57534c', lineHeight: 1.5 }}>Acquista un pacchetto extra per continuare a generare foto AI. I crediti extra non scadono e si sommano al tuo piano attuale.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PHOTO_PACKS.map(p => (
              <div key={p.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: p.popular ? '2px solid #3B83F6' : '1px solid #e4e1da', background: p.popular ? '#eff6ff' : '#fff' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: p.popular ? '#fff' : '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="image" size={19} color={p.popular ? '#1d5fd0' : '#57534c'} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>{p.name}{p.popular && <span style={{ fontSize: 10, fontWeight: 800, color: '#1d5fd0', background: '#dbeafe', padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '.04em' }}>Popolare</span>}</div>
                  <div style={{ fontSize: 12.5, color: '#8c867d', marginTop: 1 }}>{p.photos} foto AI extra</div>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, flex: 'none', minWidth: 64, textAlign: 'right' }}>€{p.price}</div>
                <Box as="button" onClick={() => buy(p.link)} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', flex: 'none' } as React.CSSProperties} hover={{ background: '#2b6fe0' }}>Scegli</Box>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEMO_BEFORE = '/demo/foto_demo.jpg';
const DEMO_AFTER = '/demo/dopo_demo.jpg';

function DemoBeforeAfter() {
  const [phase, setPhase] = React.useState<'line' | 'slider'>('line');
  React.useEffect(() => {
    const t = setTimeout(() => setPhase('slider'), 850);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 12, animation: 'foto-reveal .45s cubic-bezier(.22,1,.36,1) both' }}>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', zIndex: 4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DEMO_BEFORE} alt="" style={{ position: 'relative', width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
        <InlineSlider before={DEMO_BEFORE} after={DEMO_AFTER} isVertical={false} showImages={phase === 'slider'} interactive={phase === 'slider'} />
        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99, zIndex: 12, opacity: phase === 'slider' ? 1 : 0, transition: 'opacity .6s' }}>Prima</span>
        <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99, zIndex: 12, opacity: phase === 'slider' ? 1 : 0, transition: 'opacity .6s' }}>Dopo</span>
      </div>
    </div>
  );
}

export default function FotoAIScreen({ toast, routeKey, project, onBatchCreated, onGoPlan, onGoPost, onGoVideo, onCreated, demoMode = false, lockBrand }: {
  toast: (msg: string, icon?: string) => void;
  routeKey: number;
  project?: Project;
  onBatchCreated?: () => void;
  onGoPlan?: () => void;
  onGoPost?: () => void;
  onGoVideo?: (url: string) => void;
  onCreated?: (count?: number) => void; // staging completato -> notifica galleria (badge +N)
  demoMode?: boolean;
  lockBrand?: boolean; // free: niente acquisto extra, solo stato esaurito
}) {
  const [quota, setQuota] = React.useState<StagingQuota | null>(null);
  const [packsOpen, setPacksOpen] = React.useState(false);
  React.useEffect(() => { fetchStagingQuota().then(setQuota); }, []);
  // Refetch al ritorno dal checkout pacchetti (aperto in nuova tab): rientrando
  // sulla tab la pill crediti si aggiorna subito.
  React.useEffect(() => {
    const onFocus = () => { if (!document.hidden) fetchStagingQuota().then(setQuota); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, []);
  // Warm-up: spin up the edge function on mount so the first real generation
  // doesn't hit a cold start (which can exceed the start timeout).
  React.useEffect(() => { pollStagingStatus('warmup-noop').catch(() => {}); }, []);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [selStyle, setSelStyle] = React.useState<string | null>(demoMode ? 'modern' : null);
  React.useEffect(() => { if (demoMode) setSelStyle('modern'); }, [demoMode]);
  const [selAngle, setSelAngle] = React.useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [countdown, setCountdown] = React.useState(GEN_SECONDS);
  const [result, setResult] = React.useState<{ before: string; after: string } | null>(null);
  const [revealing, setRevealing] = React.useState<'burst' | 'line' | 'slider' | null>(null);
  const [reprompt, setReprompt] = React.useState('');
  const [batchDone, setBatchDone] = React.useState<number | null>(null); // itemCount
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const currentBatchId = React.useRef<string | null>(null); // batch della foto mostrata (per sostituire al reprompt)
  const dragDepth = React.useRef(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [activePhotoId, setActivePhotoId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const pollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingActive = React.useRef(false);

  // Reveal sequence: burst (aurora fades) → line (divider sweeps + handle pops) → slider (images fade in)
  React.useEffect(() => {
    if (!revealing) return;
    if (revealing === 'burst') {
      const t = setTimeout(() => setRevealing('line'), 600);
      return () => clearTimeout(t);
    }
    if (revealing === 'line') {
      const t = setTimeout(() => setRevealing('slider'), 850);
      return () => clearTimeout(t);
    }
  }, [revealing]);

  // Stop polling + clear pending state (memory + localStorage).
  const clearPending = React.useCallback(() => {
    pollingActive.current = false;
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
    setPending(null);
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  }, []);

  // Polling driver: while a prediction is pending, poll on a short interval.
  // Short requests survive tab suspension; on failure we treat as "still processing".
  React.useEffect(() => {
    if (!pending) return;
    console.log('[FotoAI] polling effect ATTIVO per', pending.predictionId);
    pollingActive.current = true;

    const tick = async () => {
      if (!pollingActive.current) return;
      // Client-side total cap → timeout
      if (Date.now() - pending.startedAt > POLL_MAX_MS) {
        clearPending();
        setGenerating(false);
        setError('Il server non ha risposto in tempo, riprova');
        return;
      }
      const res = await pollStagingStatus(pending.predictionId);
      console.log('[FotoAI] poll', pending.predictionId, '→', res.status);
      if (!pollingActive.current) return;
      if (res.status === 'succeeded') {
        clearPending();
        // before può mancare se la generazione è stata recuperata dal server
        // (stato locale perso): in quel caso niente slider, mostra il risultato.
        setResult({ before: pending.before || res.outputUrl, after: res.outputUrl });
        onCreated?.();
        setGenerating(false);
        setRevealing('burst');
        // Ogni generazione (incl. reprompt) scala 1 dalla quota: aggiorna live.
        setQuota(q => q ? { ...q, remaining: Math.max(0, q.remaining - 1) } : q);
        try {
          const batchId = await saveSingleGenerationToBatch({
            projectId: project?.id || null,
            style: pending.style,
            customPrompt: pending.customPrompt,
            sourceUrl: '',
            resultUrl: res.outputUrl,
          });
          // Salva l'originale (prima) in IndexedDB locale: Media mostrerà
          // prima/dopo finché la cache esiste, altrimenti solo il dopo.
          if (batchId && pending.before) {
            saveOriginalMedia(batchId, 0, pending.before).catch(() => {});
          }
          // Reprompt: la nuova versione sostituisce la precedente in Media.
          if (pending.replaceBatchId && pending.replaceBatchId !== batchId) {
            deleteBatchPhoto(pending.replaceBatchId, 0).catch(() => {});
          }
          currentBatchId.current = batchId;
          onBatchCreated?.();
        } catch (saveErr) {
          console.error('[FotoAI] save to batch failed (non-blocking):', saveErr);
        }
        return;
      }
      if (res.status === 'failed') {
        clearPending();
        setGenerating(false);
        console.error('[FotoAI] generation failed:', res.error);
        setError('Non siamo riusciti a modificare questa foto. Riprova o usa un\'altra immagine.');
        return;
      }
      // processing → schedule next poll
      pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
    };

    // first poll quickly so the user sees progress fast
    pollTimer.current = setTimeout(tick, 600);

    // Poll immediately when the tab regains focus / visibility
    const wake = () => {
      if (!pollingActive.current) return;
      if (pollTimer.current) clearTimeout(pollTimer.current);
      pollTimer.current = setTimeout(tick, 50);
    };
    const onVis = () => { if (document.visibilityState === 'visible') wake(); };
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Recovery: riprende una generazione in corso anche se lo stato locale è
  // andato perso (cambio focus, reload, DevTools). Prima prova localStorage
  // (ha l'immagine "prima" → slider completo); altrimenti interroga il server
  // (tabella staging_predictions) per l'ultima prediction ancora in corso.
  const tryRecover = React.useCallback(async () => {
    if (pending || result || generating) return;
    // 1) localStorage (ha il "before")
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Pending;
        if (p?.predictionId && Date.now() - p.startedAt < POLL_MAX_MS) {
          console.log('[FotoAI] recovery(local): resuming', p.predictionId);
          setGenerating(true);
          setPending(p);
          return;
        }
        localStorage.removeItem(PENDING_KEY);
      }
    } catch { /* ignore */ }
    // 2) server: prediction orfana ancora in corso
    const serverPid = await findLatestProcessingPrediction();
    if (serverPid) {
      console.log('[FotoAI] recovery(server): resuming', serverPid);
      setGenerating(true);
      setPending({ predictionId: serverPid, before: '', style: null, customPrompt: null, startedAt: Date.now() });
    }
  }, [pending, result, generating]);

  React.useEffect(() => {
    tryRecover();
    const onFocus = () => { tryRecover(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [tryRecover]);

  // Reset when re-entering from sidebar. Skip the very first mount so the
  // recovery effect above can resume a pending generation without being wiped.
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    clearPending();
    setPhotos([]); setSelStyle(demoMode ? 'modern' : null); setSelAngle(null); setCustomPrompt(''); setActivePhotoId(null);
    setResult(null); setRevealing(null); setReprompt(''); setBatchDone(null); setError(null); setGenerating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  React.useEffect(() => {
    const existing = document.getElementById('foto-ai-gooey-css');
    if (existing) existing.remove();
    const st = document.createElement('style');
    st.id = 'foto-ai-gooey-css';
    st.textContent = `
@keyframes foto-reveal{0%{opacity:0}100%{opacity:1}}
@keyframes aurora-shift{0%{background-position:0% 50%;opacity:.45}25%{opacity:.55}50%{background-position:100% 50%;opacity:.45}75%{opacity:.55}100%{background-position:0% 50%;opacity:.45}}
@keyframes aurora-pulse{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.08) rotate(2deg)}}
@keyframes aurora-edge{0%{opacity:.78;transform:scale(1.012)}25%{opacity:1;transform:scale(1)}50%{opacity:.82;transform:scale(1.018)}75%{opacity:1;transform:scale(1.004)}100%{opacity:.78;transform:scale(1.012)}}
@keyframes aurora-burst{0%{opacity:.5}40%{opacity:.85}100%{opacity:0}}
@keyframes result-fade-in{0%{opacity:0}100%{opacity:1}}
@keyframes slider-line-sweep{0%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 0% 0)}}
@keyframes slider-handle-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes export-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes shimmer-text{0%{background-position:200% center}100%{background-position:-200% center}}
`;
    document.head.appendChild(st);
  }, []);

  // Countdown during generation
  React.useEffect(() => {
    if (!generating) return;
    setCountdown(GEN_SECONDS);
    const t = setInterval(() => setCountdown(c => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [generating]);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    if (photos.length + list.length > MAX_BATCH_PHOTOS) {
      toast(`Massimo ${MAX_BATCH_PHOTOS} foto`, 'x');
      return;
    }
    try {
      const converted = await Promise.all(list.map(async f => {
        const dataUrl = await fileToResizedDataUrl(f);
        const dims = await new Promise<{w:number;h:number}>(res => {
          const img = new Image();
          img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => res({ w: 1, h: 1 });
          img.src = dataUrl;
        });
        return { id: `${Date.now()}-${Math.random()}`, dataUrl, name: f.name, ...dims };
      }));
      setPhotos(p => [...p, ...converted]);
      setError(null);
    } catch {
      toast('Errore lettura immagine', 'x');
    }
  };

  const pickStyle = (id: string) => { if (generating) return; setSelStyle(v => v === id ? null : id); setSelAngle(null); setCustomPrompt(''); };
  const pickAngle = (id: string) => { if (generating) return; setSelAngle(v => v === id ? null : id); setSelStyle(null); setCustomPrompt(''); };
  const onPrompt = (v: string) => { if (generating) return; setCustomPrompt(v); if (v.trim()) { setSelStyle(null); setSelAngle(null); } };

  const isBatch = photos.length > 1;
  const outOfQuota = !!quota && quota.remaining <= 0;
  const notEnoughForBatch = !!quota && photos.length > 1 && photos.length > quota.remaining;
  const canGenerate = photos.length > 0 && (selStyle || customPrompt.trim()) && !generating && !outOfQuota && !notEnoughForBatch;

  // Start an async single-photo generation: kick off the prediction, persist it,
  // and let the polling effect drive the result. Resilient to tab switches.
  const beginSingle = async (opts: { imageDataUrl: string; before: string; style: string | null; angle: string | null; customPrompt: string | null; replaceBatchId?: string | null }) => {
    // Start con retry: il primo tentativo può scadere su cold start; il secondo
    // (function calda) di solito va. Prima di ogni retry controlla se una
    // prediction è già stata creata server-side (evita doppio scalo quota).
    let res = await (async () => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`[FotoAI] startStaging… (tentativo ${attempt})`);
        const r = await startStaging({ imageDataUrl: opts.imageDataUrl, style: opts.style, angle: opts.angle, customPrompt: opts.customPrompt });
        console.log('[FotoAI] start result:', r.ok ? `ok predictionId=${(r as any).predictionId}` : `FAIL ${r.error}`);
        if (r.ok) return r;
        if (!r.error?.includes('troppo lento')) return r; // errore vero (quota/auth) → non ritentare
        // timeout: forse la prediction è stata creata lo stesso → recupera
        const pid = await findLatestProcessingPrediction();
        if (pid) {
          console.log('[FotoAI] recovered orphan prediction after timeout', pid);
          return { ok: true as const, predictionId: pid, outputUrl: undefined };
        }
        // altrimenti ritenta (function ora calda)
      }
      return { ok: false as const, error: 'Avvio generazione troppo lento, riprova' };
    })();

    if (!res.ok) {
      console.error('[FotoAI] start failed:', res.error);
      setError('Non siamo riusciti a modificare questa foto. Riprova o usa un\'altra immagine.');
      setGenerating(false);
      return;
    }
    const p: Pending = {
      predictionId: res.predictionId,
      before: opts.before,
      style: opts.style,
      customPrompt: opts.customPrompt,
      startedAt: Date.now(),
      replaceBatchId: opts.replaceBatchId ?? null,
    };
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch { /* storage full → memoria basta per il cambio tab */ }
    // Caso raro: già pronta al primo colpo
    if (res.outputUrl) {
      setResult({ before: opts.before, after: res.outputUrl });
      onCreated?.();
      setGenerating(false);
      setRevealing('burst');
      setQuota(q => q ? { ...q, remaining: Math.max(0, q.remaining - 1) } : q);
      try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
      try {
        const batchId = await saveSingleGenerationToBatch({ projectId: project?.id || null, style: opts.style, customPrompt: opts.customPrompt, sourceUrl: '', resultUrl: res.outputUrl });
        if (batchId && opts.before) saveOriginalMedia(batchId, 0, opts.before).catch(() => {});
        if (opts.replaceBatchId && opts.replaceBatchId !== batchId) deleteBatchPhoto(opts.replaceBatchId, 0).catch(() => {});
        currentBatchId.current = batchId;
        onBatchCreated?.();
      } catch (e) { console.error('[FotoAI] save to batch failed (non-blocking):', e); }
      return;
    }
    console.log('[FotoAI] setPending → avvio polling per', p.predictionId);
    setPending(p); // → triggers polling effect
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError(null);
    setGenerating(true);
    try {
      if (isBatch) {
        const res = await createBatchStaging({
          images: photos.map(p => p.dataUrl),
          style: selStyle,
          customPrompt: customPrompt.trim() || null,
          projectId: project?.id || null,
        });
        if (res.ok) {
          setBatchDone(res.itemCount);
          setGenerating(false);
          setQuota(q => q ? { ...q, remaining: Math.max(0, q.remaining - res.itemCount) } : q);
          toast(`${res.itemCount} foto inviate per l'elaborazione`, 'sparkles');
          onBatchCreated?.();
        } else {
          setError(res.error);
          setGenerating(false);
        }
      } else {
        currentBatchId.current = null; // nuova generazione = nuova catena
        await beginSingle({
          imageDataUrl: photos[0].dataUrl,
          before: photos[0].dataUrl,
          style: selStyle,
          angle: selAngle,
          customPrompt: customPrompt.trim() || null,
        });
      }
    } catch (err: any) {
      console.error('[FotoAI] exception:', err);
      setError(err?.message || 'Errore di connessione al server AI');
      setGenerating(false);
    }
  };

  const handleReprompt = async () => {
    if (!result || !reprompt.trim() || generating) return;
    setError(null);
    const prompt = reprompt.trim();
    const fromImage = result.after;   // rigenera dal risultato corrente
    const baseBefore = result.before; // slider compara con l'originale
    setReprompt('');
    // NON tornare agli stili: resta sul risultato corrente (slider), lo dimmiamo
    // e blocchiamo le azioni finché la nuova foto non è pronta.
    setGenerating(true);
    try {
      await beginSingle({
        imageDataUrl: fromImage,
        before: baseBefore,
        style: null,
        angle: null,
        customPrompt: prompt,
        replaceBatchId: currentBatchId.current, // sostituisci la versione precedente
      });
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione al server AI');
      setGenerating(false);
    }
  };

  const resetAll = () => {
    clearPending();
    currentBatchId.current = null;
    setPhotos([]); setSelStyle(null); setSelAngle(null); setCustomPrompt('');
    setResult(null); setRevealing(null); setReprompt(''); setBatchDone(null); setError(null); setGenerating(false);
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#fff', resize: 'vertical' };

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:1160px;margin:0 auto;padding:32px 32px 64px')}>
      <div className="max-md:!flex-col max-md:!items-stretch max-md:!gap-3" style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:24px')}>
        <div style={{ minWidth: 0 }}>
          <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Homestaging AI</h1>
          <div style={s('color:#8c867d;font-size:14px')}>Arreda, svuota o trasforma le foto dei tuoi immobili con l’AI.</div>
        </div>
        {!demoMode && !quota && (
          <div style={{ width: 140, height: 37, borderRadius: 99, background: 'linear-gradient(90deg,#efece7,#f7f5f1,#efece7)', backgroundSize: '200% 100%', animation: 'demo-ai-shimmer 1.4s linear infinite', flex: 'none' }} />
        )}
        {!demoMode && quota && (quota.remaining > 0 ? (
          <div className={batchDone !== null ? "max-md:!hidden" : "max-md:!w-full"} style={s('display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#fff;border:1px solid #f0ede7;border-radius:99px;padding:8px 16px;flex:none;white-space:nowrap')}>
            <Icon name="image" size={15} color="#3B83F6" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{quota.remaining} {quota.remaining === 1 ? 'foto rimanente' : 'foto rimanenti'}</span>
          </div>
        ) : lockBrand ? (
          // Free esaurito: CTA verso i piani al posto della pill.
          <Box as="button" className="max-md:!w-full max-md:!justify-center" onClick={() => onGoPlan?.()} style={s('display:flex;align-items:center;gap:8px;background:#3B83F6;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;flex:none') as React.CSSProperties} hover={s('background:#2b6fe0')}>
            <Icon name="crown" size={15} color="#fff" />Vedi i piani
          </Box>
        ) : null)}
      </div>

      {/* ── GLOBAL ERROR ── */}
      {!generating && error && !result && batchDone === null && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 14, padding: '16px 20px', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Icon name="alert-circle" size={18} color="#b91c1c" />
          {error}
        </div>
      )}

      {/* ── BATCH SUBMITTED ── blob animato col logo al centro */}
      {!generating && batchDone !== null && (
        <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:16px;padding:64px 24px;text-align:center;width:100%;margin:0 auto')}>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Cerchi che pulsano dietro, molto fade */}
            <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite' }} />
            <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite', animationDelay: '1.4s' }} />
            {/* Blob blu che si muove dietro il logo */}
            <div style={{ position: 'absolute', width: 72, height: 72, background: 'radial-gradient(circle at 30% 26%, #AECBFF 0%, #3B83F6 46%, #5B6CF0 100%)', opacity: .95, boxShadow: '0 0 30px rgba(91,108,240,.45), 0 0 14px rgba(59,131,246,.55)', animation: 'organic-blob 8s ease-in-out infinite' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard/logo-mark-white.svg" alt="" style={{ position: 'relative', width: 56, height: 56, animation: 'aurora-pulse 4s ease-in-out infinite' }} />
          </div>
          <div style={s('font-size:20px;font-weight:800;margin-bottom:8px')}>{batchDone} foto in elaborazione</div>
          <div style={s('color:#8c867d;font-size:15px;max-width:500px;margin:0 auto 32px;line-height:1.5')}>
            Puoi fare quello che vuoi e chiudere la pagina. Le trovi nell'area di lavoro una volta pronte, controlla l'icona&nbsp;<span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', background: '#eef4fe', borderRadius: 6, padding: '2px 6px', gap: 4 }}><Icon name="inbox" size={14} color="#3B83F6" /></span>&nbsp;in alto a destra.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Box as="button" onClick={resetAll} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#2b6fe0')}>
              Elabora altre foto
            </Box>
          </div>
        </div>
      )}

      {/* ── SETUP (upload + style/prompt) — stays visible during reveal ── */}
      {((!result && batchDone === null) || revealing) && (
        <div style={{ position: 'relative' }}>
          {/* Avviso quota esaurita / batch insufficiente: banner a tutta larghezza. */}
          {((outOfQuota && !lockBrand) || notEnoughForBatch) && (
            <div style={{ width: '100%', boxSizing: 'border-box', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#1d5fd0', marginBottom: 6 }}>
                {outOfQuota ? 'Hai usato tutte le foto del mese' : 'Foto insufficienti per questo batch'}
              </div>
              <div style={{ fontSize: 14.5, color: '#3b6fb0', lineHeight: 1.55, marginBottom: 14 }}>
                {outOfQuota
                  ? 'La quota riparte il primo del mese prossimo. Per averne di più ora, acquista un pacchetto extra: i crediti non scadono e si sommano.'
                  : `Te ne restano ${quota!.remaining}: riduci le foto o acquista un pacchetto extra.`}
              </div>
              {outOfQuota ? (
                <Box as="button" onClick={() => setPacksOpen(true)} style={s('border:none;background:#3B83F6;color:#fff;font-size:13.5px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                  <Icon name="zap" size={15} color="#fff" />
                  Ottieni altre foto
                </Box>
              ) : onGoPlan && (
                <Box as="button" onClick={onGoPlan} style={s('border:none;background:#3B83F6;color:#fff;font-size:13.5px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                  <Icon name="crown" size={15} color="#fff" />
                  Vedi i piani
                </Box>
              )}
            </div>
          )}
          <div className="max-md:!grid-cols-1 max-md:!flex max-md:!flex-col max-md:!items-stretch" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* left: upload */}
          <div>
            <div
              className={`max-md:!flex-none max-md:!min-h-0 ${photos.length === 0 && !demoMode ? "max-md:!aspect-video" : ""}`}
              onClick={() => { if (!generating && !revealing && !result) fileRef.current?.click(); }}
              onDragEnter={e => { e.preventDefault(); dragDepth.current++; setDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragOver(false); } }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); dragDepth.current = 0; setDragOver(false); addFiles(e.dataTransfer.files); }}
            style={{
              flex: 1, minHeight: 400,
              borderRadius: (photos.length === 0 && !demoMode) ? 20 : 0,
              padding: (photos.length === 0 && !demoMode) ? 24 : 0,
              border: dragOver ? '2px dashed #3B83F6' : ((photos.length === 0 && !demoMode) ? '2px dashed #d8d4cb' : '2px solid transparent'),
              background: dragOver ? '#eff6ff' : ((photos.length === 0 && !demoMode) ? '#fff' : 'transparent'),
              display: 'flex', flexDirection: 'column', alignItems: (photos.length === 0 && !demoMode) ? 'center' : 'stretch', justifyContent: (photos.length === 0 && !demoMode) ? 'center' : 'flex-start',
              textAlign: 'center', transition: 'all .2s', position: 'relative', cursor: (photos.length === 0 && !demoMode) ? 'pointer' : 'default'
            }}
          >
              {photos.length === 0 && demoMode ? (
                <DemoBeforeAfter />
              ) : photos.length === 0 ? (
                <>
                  <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
                    <Icon name="image-plus" size={24} color="#3B83F6" />
                  </div>
                  <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>Carica le foto da trasformare</div>
                  <div style={s('color:#8c867d;font-size:13px')}>Trascina qui o clicca per scegliere</div>
                </>
              ) : (
                <div>
                  {(() => {
                    const ap = photos.find(p => p.id === activePhotoId) || photos[0];
                    const isVertical = ap.h > ap.w;
                    return (
                      <div key={ap.id} className={isVertical ? "max-md:!aspect-video" : undefined} style={{ position: 'relative', borderRadius: 16, overflow: 'visible', marginBottom: 12, ...(isVertical ? { aspectRatio: '4/3' } : {}), animation: 'foto-reveal .45s cubic-bezier(.22,1,.36,1) both' }}>
                        {/* Inner clipping container for the photo. Per le verticali riempie
                            il box ad aspect-ratio fisso (4/3 desktop, 16/9 mobile) → blur dietro + foto contenuta. */}
                        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', zIndex: 4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', ...(isVertical ? { position: 'absolute' as const, inset: 0 } : {}) }}>
                        {isVertical && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ap.dataUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px) brightness(.85)', transform: 'scale(1.15)' }} />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ap.dataUrl} alt="" style={{ position: 'relative', width: '100%', height: isVertical ? '100%' : 'auto', objectFit: isVertical ? 'contain' : 'cover', display: 'block' }} />
                        {/* Aurora overlay during generation.
                            Single (1 foto): edge-glow leggero, la foto resta visibile per il reveal in-place.
                            Batch (>1 foto): blob pieni che coprono — è una semplice "elaborazione", niente reveal AI. */}
                        {(generating || revealing === 'burst') && (
                          <>
                            {/* Layer base: bordo aurora intenso (singola) — ogni lato al 100%
                                e ben delineato, sfuma verso il centro trasparente.
                                Batch: blob pieni che coprono. */}
                            <div style={{
                              position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
                              background: isBatch
                                ? 'linear-gradient(135deg, rgba(59,131,246,.7) 0%, rgba(37,99,210,.6) 25%, rgba(96,165,250,.65) 50%, rgba(59,131,246,.6) 75%, rgba(37,99,210,.7) 100%)'
                                : 'radial-gradient(ellipse 86% 76% at 50% 50%, rgba(59,131,246,0) 46%, rgba(59,131,246,.5) 76%, rgba(59,131,246,.95) 100%)',
                              backgroundSize: isBatch ? '400% 400%' : undefined,
                              animation: revealing === 'burst'
                                ? 'aurora-burst .6s ease-out forwards'
                                : (isBatch ? 'aurora-shift 4s ease-in-out infinite, aurora-pulse 6s ease-in-out infinite' : 'aurora-edge 2.4s ease-in-out infinite'),
                              mixBlendMode: 'normal',
                            }} />
                            {/* Animated colored blobs anchored to the four edges (screen blend) */}
                            <div style={{
                              position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none',
                              background: 'radial-gradient(ellipse 40% 120% at 0% 50%, rgba(96,165,250,.85) 0%, transparent 55%), radial-gradient(ellipse 40% 120% at 100% 50%, rgba(59,131,246,.85) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 0%, rgba(59,131,246,.7) 0%, transparent 55%), radial-gradient(ellipse 120% 40% at 50% 100%, rgba(37,99,210,.7) 0%, transparent 55%)',
                              backgroundSize: '200% 200%',
                              animation: revealing === 'burst'
                                ? 'aurora-burst .6s ease-out forwards'
                                : 'aurora-shift 3s ease-in-out infinite, aurora-pulse 4s ease-in-out infinite',
                              mixBlendMode: 'screen',
                            }} />
                            {generating && (
                              <div style={{
                                position: 'absolute',
                                bottom: 20, left: '50%', transform: 'translateX(-50%)',
                                zIndex: 10,
                                background: 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                borderRadius: 99,
                                padding: '10px 22px',
                                display: 'flex', alignItems: 'center', gap: 10,
                                whiteSpace: 'nowrap',
                              }}>
                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'export-spin 1s linear infinite', flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 700, background: 'linear-gradient(to right, #dbeafe 20%, #3B83F6 50%, #dbeafe 80%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'shimmer-text 2.5s linear infinite' }}>
                                  {isBatch && !result ? 'Invio...' : (countdown > 0 ? `Creazione in corso... ${countdown}s` : 'Rifinitura dei dettagli...')}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {/* Reveal slider: line sweeps + handle pops during 'line', before/after images fade in at 'slider'.
                            Mounted across both phases so the line/handle CSS animations play once and don't replay. */}
                        {result && (revealing === 'line' || revealing === 'slider') && (
                          <InlineSlider before={result.before} after={result.after} isVertical={isVertical} showImages={revealing === 'slider'} interactive={revealing === 'slider'} />
                        )}
                        {/* Labels — appear with the images at slider phase */}
                        {revealing === 'slider' && result && !generating && (
                          <>
                            <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99, zIndex: 12, animation: 'result-fade-in .4s ease both' }}>Prima</span>
                            <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99, zIndex: 12, animation: 'result-fade-in .4s ease both' }}>Dopo</span>
                          </>
                        )}
                        {/* Reprompt in corso: dim sopra il risultato + spinner, blocca tutto finché pronto */}
                        {generating && result && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 14, background: 'rgba(20,40,80,0.42)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 99, padding: '10px 22px', whiteSpace: 'nowrap' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'export-spin 1s linear infinite', flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 700, background: 'linear-gradient(to right, #dbeafe 20%, #3B83F6 50%, #dbeafe 80%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'shimmer-text 2.5s linear infinite' }}>Rigenerazione...</span>
                            </div>
                          </div>
                        )}
                        {!generating && !revealing && !result && (
                        <button
                          onClick={e => { e.stopPropagation(); setPhotos(ph => ph.filter(x => x.id !== ap.id)); if (activePhotoId === ap.id) setActivePhotoId(null); }}
                          style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(33,31,28,.72)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
                        ><Icon name="x" size={13} color="#fff" /></button>
                        )}
                        </div>
                      </div>
                    );
                  })()}
                  {/* thumbnail strip */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 10, ...(revealing ? { opacity: 0, pointerEvents: 'none' as const, height: 0, paddingBottom: 0, overflow: 'hidden' } : {}) }}>
                    {photos.map(p => (
                      <div key={p.id} className="group" onClick={e => { e.stopPropagation(); setActivePhotoId(p.id); }} style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: (activePhotoId || photos[0].id) === p.id ? '2px solid #3B83F6' : '2px solid transparent', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={e => { e.stopPropagation(); setPhotos(ph => ph.filter(x => x.id !== p.id)); if (activePhotoId === p.id) setActivePhotoId(null); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(33,31,28,.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                        ><Icon name="x" size={10} color="#fff" /></button>
                      </div>
                    ))}
                    <div style={{ width: 56, height: 56, borderRadius: 8, border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="plus" size={16} color="#b3aca1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ position: 'absolute', opacity: 0, width: 1, height: 1, top: -9999, pointerEvents: 'none' }} onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Divider mobile tra upload e stili (solo con foto caricata).
              top -24 assorbe il marginBottom:12 del blocco foto + metà gap → spazio simmetrico. */}
          {photos.length > 0 && (
            <div className="md:hidden" style={{ height: 1, background: '#ece9e2', margin: '-24px 0 -12px' }} />
          )}

          {/* right: style / angle / prompt OR result actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...(generating ? { opacity: .5, pointerEvents: 'none' as const, transition: 'opacity .3s' } : (revealing && revealing !== 'slider' ? { opacity: 0, pointerEvents: 'none' as const, transition: 'opacity .3s' } : (revealing === 'slider' ? { animation: 'result-fade-in .5s ease both' } : {}))) }}>

            {revealing === 'slider' && result ? (
              <>
                {/* Reprompt (sopra) */}
                <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 10px' }}>Modifica con un prompt</div>
                  <textarea value={reprompt} onChange={e => setReprompt(e.target.value)} maxLength={2000} rows={3} placeholder="Es. cambia il colore del divano in beige" style={inputStyle} />
                  <button onClick={handleReprompt} disabled={!reprompt.trim() || generating} style={{
                    marginTop: 10, width: '100%', border: 'none',
                    background: reprompt.trim() && !generating ? 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)' : '#e5e7eb',
                    color: reprompt.trim() && !generating ? '#fff' : '#9ca3af',
                    fontSize: 14, fontWeight: 600, padding: '12px 20px', borderRadius: 10,
                    cursor: reprompt.trim() && !generating ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all .2s',
                  }}>
                    <Icon name="sparkles" size={15} color={reprompt.trim() && !generating ? '#fff' : '#9ca3af'} />
                    Rigenera
                  </button>
                </div>

                {/* Export / salvataggio (sotto) */}
                <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Risultato</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Box as="button" onClick={async () => { if (downloading) return; setDownloading(true); try { await downloadImage(result.after, 'homestaging-ai.jpg'); } finally { setDownloading(false); } }} style={{ border: 'none', background: 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '14px 20px', borderRadius: 12, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? .85 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as React.CSSProperties} hover={downloading ? undefined : s('opacity:.9')}>
                      {downloading
                        ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'export-spin 1s linear infinite', display: 'inline-block' }} />Scaricando...</>
                        : <><Icon name="download" size={16} color="#fff" />Scarica risultato</>}
                    </Box>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <Box as="button" onClick={() => onGoPost?.()} style={{ flex: 1, border: '1.5px solid #3B83F6', background: '#eff6ff', color: '#1d5fd0', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as React.CSSProperties} hover={s('background:#dbeafe')}>
                        <Icon name="share" size={16} color="#1d5fd0" />
                        Crea post
                      </Box>
                      <Box as="button" onClick={() => onGoVideo?.(result.after)} style={{ flex: 1, border: '1.5px solid #3B83F6', background: '#eff6ff', color: '#1d5fd0', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as React.CSSProperties} hover={s('background:#dbeafe')}>
                        <Icon name="film" size={16} color="#1d5fd0" />
                        Crea video
                      </Box>
                    </div>
                    <Box as="button" onClick={resetAll} style={{ border: '1.5px solid #e4e1da', background: '#fff', color: '#211f1c', fontSize: 14, fontWeight: 600, padding: '13px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as React.CSSProperties} hover={s('background:#f8f7f5')}>
                      <Icon name="image-plus" size={16} color="#57534c" />
                      Nuova foto
                    </Box>
                  </div>
                </div>
                {/* Fuori dal container: dove ritrovare la foto */}
                <div style={{ textAlign: 'center', fontSize: 12.5, color: '#8a8275', marginTop: 2 }}>
                  La foto è stata salvata nella tua galleria
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Stile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {STAGING_STYLES.map(st => {
                      const sel = selStyle === st.id;
                      return (
                        <div key={st.id} className="group" onClick={() => pickStyle(st.id)} title={st.desc} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px',
                          borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          border: sel ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                          background: sel ? '#eff6ff' : '#f8f7f5',
                          boxShadow: sel ? '0 4px 12px rgba(59,131,246,0.12)' : 'none',
                          transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                          position: 'relative'
                        }}>
                          <span className="transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 24, height: 24, display: 'flex', color: sel ? '#1d5fd0' : '#57534c' }} dangerouslySetInnerHTML={{ __html: st.icon }} />
                          <span className="transition-transform duration-300 group-hover:-translate-y-0.5" style={{ fontSize: 11, fontWeight: 600, color: sel ? '#1d5fd0' : '#57534c' }}>{st.label}</span>
                          {sel && (
                            <div style={{ position: 'absolute', top: -6, right: -6, background: '#3B83F6', borderRadius: '50%', padding: 2, display: 'flex', border: '2px solid #fff' }}>
                              <Icon name="check" size={10} color="#fff" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 10px' }}>Oppure scrivi cosa vuoi</div>
                  <textarea value={customPrompt} onChange={e => onPrompt(e.target.value)} maxLength={2000} rows={3} placeholder="Es. trasforma in soggiorno moderno con divano color crema e parquet chiaro" style={inputStyle} />
                </div>

                {(() => { const mainActive = canGenerate || outOfQuota; return (
                <button onClick={outOfQuota ? (lockBrand ? onGoPlan : () => setPacksOpen(true)) : handleGenerate} disabled={!mainActive} className="group" style={{
                  border: 'none',
                  background: mainActive ? 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)' : '#e5e7eb',
                  color: mainActive ? '#fff' : '#9ca3af',
                  fontSize: 15, fontWeight: 600,
                  padding: '16px 20px', borderRadius: 14, cursor: mainActive ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: mainActive ? '0 8px 24px rgba(99,102,241,0.25)' : 'none',
                  transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                }}>
                  <span className={mainActive ? "group-hover:rotate-12 transition-transform duration-300" : ""} style={{ display: 'flex' }}>
                    <Icon name={outOfQuota ? (lockBrand ? 'crown' : 'zap') : 'sparkles'} size={18} color={mainActive ? "#fff" : "#9ca3af"} />
                  </span>
                  {outOfQuota ? (lockBrand ? 'Vedi i piani' : 'Ottieni altre foto') : notEnoughForBatch ? `Restano solo ${quota!.remaining} foto` : (isBatch ? `Genera ${photos.length} foto` : 'Genera foto')}
                </button>
                ); })()}

              </>
            )}
          </div>
        </div>


      </div>
      )}
      {packsOpen && <PhotoPacksModal onClose={() => setPacksOpen(false)} />}
    </div>
  );
}

// ── Inline slider overlay (renders inside the photo container during reveal) ──
// Two-phase: line sweeps top→bottom + handle pops (showImages=false), then the
// before/after images fade in (showImages=true). Stays mounted across the
// transition so the line/handle CSS animations play once and don't replay.
function InlineSlider({ before, after, isVertical, showImages, interactive }: { before: string; after: string; isVertical: boolean; showImages: boolean; interactive: boolean }) {
  const [pos, setPos] = React.useState(50);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const userTouched = React.useRef(false);

  const updateFromEvent = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    userTouched.current = true;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };

  React.useEffect(() => {
    if (!interactive) return;
    const move = (e: MouseEvent) => { if (dragging.current) updateFromEvent(e.clientX); };
    const up = () => { dragging.current = false; };
    const tmove = (e: TouchEvent) => { if (dragging.current && e.touches[0]) updateFromEvent(e.touches[0].clientX); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', tmove);
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', tmove); window.removeEventListener('touchend', up); };
  }, [interactive]);

  React.useEffect(() => {
    if (!showImages) return;
    let raf: number;
    let start = 0;
    const delay = setTimeout(() => {
      if (userTouched.current) return;
      const tick = (t: number) => {
        if (userTouched.current) return;
        if (!start) start = t;
        const elapsed = (t - start) / 1000;
        setPos(50 + Math.sin(elapsed * 0.8) * 18);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 1100);
    return () => { clearTimeout(delay); cancelAnimationFrame(raf); };
  }, [showImages]);

  return (
    <div
      ref={boxRef}
      onMouseDown={interactive ? e => { e.stopPropagation(); dragging.current = true; updateFromEvent(e.clientX); } : undefined}
      onTouchStart={interactive ? e => { e.stopPropagation(); dragging.current = true; if (e.touches[0]) updateFromEvent(e.touches[0].clientX); } : undefined}
      style={{ position: 'absolute', inset: 0, zIndex: 11, cursor: interactive ? 'col-resize' : 'default', userSelect: 'none', pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {/* Before/after images — montate SUBITO a opacità 0 (così l'immagine AI si
          carica durante lo sweep della linea), poi transizione liscia 0→1 quando
          la linea è pronta (showImages=true). Niente jank di caricamento. */}
      <div style={{ position: 'absolute', inset: 0, opacity: showImages ? 1 : 0, transition: 'opacity .9s cubic-bezier(.4,0,.2,1)' }}>
        {/* After image (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="Dopo" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: isVertical ? 'contain' : 'cover', display: 'block' }} />
        {/* Before image (clipped) */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Prima" draggable={false} style={{ width: '100%', height: '100%', objectFit: isVertical ? 'contain' : 'cover', display: 'block' }} />
        </div>
      </div>
      {/* Divider line — sweeps top to bottom on mount (slow) */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#fff', transform: 'translateX(-1px)', boxShadow: '0 0 8px rgba(0,0,0,.35)', animation: 'slider-line-sweep .65s cubic-bezier(.45,.05,.35,1) both' }} />
      {/* Handle circle — separate element (not clipped by the line sweep), pops in once the line lands */}
      <div style={{ position: 'absolute', top: '50%', left: `${pos}%`, transform: 'translate(-50%,-50%)', width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.25)', opacity: 0, animation: 'slider-handle-pop .4s cubic-bezier(.34,1.56,.64,1) .5s forwards' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#211f1c" strokeWidth="2.5"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
      </div>
    </div>
  );
}
