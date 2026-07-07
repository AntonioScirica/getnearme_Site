// Foto AI (virtual staging) API layer.
// Talks to the shared Supabase edge functions used by the Chrome extension:
//  - `replicate-staging`     → single photo generation (nano-banana via Replicate)
//  - `create-batch-staging`  → 2..30 photos, async processing + email delivery
//
// Style prompts live SERVER-SIDE in the edge function (STYLE_PROMPTS): we send
// only the style id. Angle presets are client-side (the edge wraps them in a
// camera-position template). Custom prompt wins over both.

import { supabase } from './supabase';
import { saveOriginalMedia } from '@/lib/localMediaCache';

// ── Raw fetch verso le Edge Functions ───────────────────────────────────────
// supabase.functions.invoke() in browser può andare in deadlock sul lock di
// auth (navigator.locks) durante il polling ripetuto → la promise non si
// risolve mai. Bypassiamo con fetch diretto + token di sessione.
const FN_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Legge l'access_token DIRETTAMENTE da localStorage (chiave sb-<ref>-auth-token),
// senza passare per supabase.auth.getSession() che può andare in deadlock sul
// lock di navigator.locks durante un refresh token in corso.
export function getTokenFast(): string {
  try {
    const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\./)?.[1];
    if (ref) {
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (raw) {
        const t = JSON.parse(raw)?.access_token;
        if (t) return t;
      }
    }
  } catch { /* fallback anon */ }
  return ANON_KEY;
}

// Rinfresca l'access_token usando il refresh_token, via l'endpoint Supabase
// (niente supabase.auth → niente deadlock navigator.locks su localhost).
// Aggiorna localStorage e torna il nuovo token, o null se non recuperabile.
export async function refreshTokenFast(): Promise<string | null> {
  try {
    const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\./)?.[1];
    if (!ref) return null;
    const key = `sb-${ref}-auth-token`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const sess = JSON.parse(raw);
    const refresh = sess?.refresh_token;
    if (!refresh) return null;
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.access_token) return null;
    const merged = { ...sess, ...data, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) };
    localStorage.setItem(key, JSON.stringify(merged));
    return data.access_token as string;
  } catch {
    return null;
  }
}

async function invokeFn<T = any>(name: string, body: unknown, timeoutMs = 60_000): Promise<{ data: T | null; status: number; error: string | null }> {
  const once = async (token: string) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(`${FN_BASE}/${name}`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(timer); }
  };
  try {
    let resp = await once(getTokenFast());
    if (resp.status === 401) {
      const fresh = await refreshTokenFast();
      if (fresh) resp = await once(fresh);
    }
    let json: any = null;
    try { json = await resp.json(); } catch { /* no body */ }
    return { data: json, status: resp.status, error: resp.ok ? null : (json?.error || `HTTP ${resp.status}`) };
  } catch (e: any) {
    return { data: null, status: 0, error: e?.name === 'AbortError' ? '__timeout' : (e?.message || 'network') };
  }
}

export type StagingStyle = {
  id: string;
  label: string;
  desc: string;
  icon: string; // Lucide icon name (see dashboard/ui.tsx ICONS registry)
};

// 6 style presets (ids must match the edge function's STYLE_PROMPTS keys).
// NB: 'industrial' is the Luxury style (historical id kept for API compat).
export const STAGING_STYLES: StagingStyle[] = [
  {
    id: 'modern', label: 'Moderno', desc: 'Linee pulite, palette neutra, pezzi di design',
    icon: 'sofa',
  },
  {
    id: 'nordic', label: 'Nordico', desc: 'Legno chiaro, bianco e grigio, minimal',
    icon: 'snowflake',
  },
  {
    id: 'industrial', label: 'Luxury', desc: 'Marmo, ottone, noce scuro, eleganza',
    icon: 'crown',
  },
  {
    id: 'boho', label: 'Boho', desc: 'Rattan, piante, toni terrosi, pattern',
    icon: 'palette',
  },
  {
    id: 'daynight', label: 'Giorno e Notte', desc: 'Inverte l’illuminazione della scena',
    icon: 'moon',
  },
  {
    id: 'empty', label: 'Svuota stanza', desc: 'Rimuove mobili e oggetti, stanza vuota',
    icon: 'refresh-cw',
  },
];

// Stessi 6 id/stile, ma etichette diverse per esterno/giardino (i prompt dietro
// sono scene-aware lato edge function, qui cambia solo testo/icona del bottone).
export const SCENE_STYLE_LABELS: Record<'esterno' | 'giardino', Record<string, string>> = {
  esterno: { modern: 'Moderna', nordic: 'Nordica', industrial: 'Luxury', boho: 'Mediterranea', daynight: 'Giorno e Notte', empty: 'Rinnova' },
  giardino: { modern: 'Moderno', nordic: 'Naturale', industrial: 'Lussuoso', boho: 'Mediterraneo', daynight: 'Giorno e Notte', empty: 'Rinnova' },
};

// Icone per esterno/giardino: tutte e 6 esplicite (niente fallback sull'icona
// interno, che raffigura arredo e non ha senso su una facciata o un giardino).
export const SCENE_STYLE_ICONS: Record<'esterno' | 'giardino', Record<string, string>> = {
  esterno: { modern: 'home', nordic: 'warehouse', industrial: 'crown', boho: 'sun', daynight: 'moon', empty: 'refresh-cw' },
  giardino: { modern: 'fence', nordic: 'tree-pine', industrial: 'crown', boho: 'sun', daynight: 'moon', empty: 'refresh-cw' },
};

export type StagingAngle = {
  id: string;
  label: string;
  prompt: string;
  icon: string;
};

// Camera angle presets (prompt sent as customPrompt + angle id; the edge
// function wraps it in its camera-position template).
export const STAGING_ANGLES: StagingAngle[] = [
  {
    id: 'day-to-night', label: 'Giorno a notte',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>',
    prompt: 'This is a LIGHTING-ONLY edit. DO NOT remove, add, move, resize, reshape, recolor, or alter ANY object in the scene — every piece of furniture, wall, ceiling, floor, door, window, curtain, rug, lamp, painting, shelf, plant, and decorative item must remain EXACTLY as in the original photo with identical shape, position, size, color, material, and texture. DO NOT change the camera angle, perspective, framing, or composition in any way. Transform to nighttime — replace sky with deep dark-blue night sky with subtle stars. ALL visible light fixtures (chandeliers, table lamps, bedside lamps, wall sconces, floor lamps, ceiling lights, spotlights, outdoor lanterns, garden lights) MUST be turned ON emitting warm realistic light with soft halos and proper light falloff on nearby surfaces. Windows should show warm interior glow. Deep natural shadows, soft ambient fill. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.',
  },
  {
    id: 'night-to-day', label: 'Notte a giorno',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>',
    prompt: 'This is a LIGHTING-ONLY edit. DO NOT remove, add, move, resize, reshape, recolor, or alter ANY object in the scene — every piece of furniture, wall, ceiling, floor, door, window, curtain, rug, lamp, painting, shelf, plant, and decorative item must remain EXACTLY as in the original photo with identical shape, position, size, color, material, and texture. DO NOT change the camera angle, perspective, framing, or composition in any way. Transform this scene to BRIGHT MIDDAY DAYLIGHT. The sky visible through windows must be vivid blue with white clouds. Intense natural sunlight floods through every window creating strong, crisp sun beams and well-defined shadows on floors and walls. The overall exposure must be significantly BRIGHTER than the original — lift shadows aggressively, fill dark corners with bounced daylight, increase ambient brightness across the entire frame. All artificial lights (lamps, sconces, ceiling fixtures) should be OFF — the room is lit entirely by abundant natural sunlight. Surfaces should appear warm and sun-kissed. The transformation must be dramatic and unmistakable — the viewer should immediately perceive this as a sun-drenched daytime scene. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.',
  },
  {
    id: 'close-up', label: 'Dettaglio',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><circle cx="11" cy="11" r="3"/></svg>',
    prompt: 'Ricrea un dettaglio ravvicinato (close-up) dell’elemento principale di questa stanza. Avvicinati significativamente mostrando i dettagli dei materiali, le texture e le finiture. Mantieni gli stessi colori e materiali. Risultato fotorealistico.',
  },
  {
    id: 'birds-eye', label: 'Dall’alto',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V4"/><path d="M5 11l7 7 7-7"/><line x1="4" y1="4" x2="20" y2="4"/></svg>',
    prompt: 'Ricrea questa stessa stanza vista dall’alto, con una prospettiva a volo d’uccello (bird’s eye view). Mostra il pavimento e i mobili visti dal soffitto, guardando in basso con un angolo di circa 90 gradi. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.',
  },
  {
    id: 'low-angle', label: 'Dal basso',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V4"/><path d="M5 13l7-7 7 7"/><line x1="4" y1="20" x2="20" y2="20"/></svg>',
    prompt: 'Ricrea questa stessa stanza da un’angolazione bassa (low angle), con la camera posizionata vicino al pavimento e rivolta verso l’alto. I mobili appaiono più imponenti e il soffitto è ben visibile. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.',
  },
  {
    id: 'wide-angle', label: 'Grandangolo',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12h20"/><path d="M2 12c0-4 4.5-8 10-8s10 4 10 8"/><path d="M2 12c0 4 4.5 8 10 8s10-4 10-8"/></svg>',
    prompt: 'Ricrea questa stessa stanza con un obiettivo grandangolare (ultra-wide angle lens, 14mm). Mostra una visuale molto ampia che include più pareti e angoli della stanza. La distorsione prospettica tipica del grandangolo deve essere visibile. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.',
  },
];

export const MAX_BATCH_PHOTOS = 30;

// Resize an uploaded image to max 1500px (longest side), JPEG 85% — same as
// the extension, keeps the data URI under ~1MB for the edge function payload.
export function fileToResizedDataUrl(file: File, maxSide = 1500): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (Math.max(w, h) > maxSide) {
        const k = maxSide / Math.max(w, h);
        w = Math.round(w * k); h = Math.round(h * k);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Immagine non valida')); };
    img.src = url;
  });
}

export type StagingResult =
  | { ok: true; outputUrl: string }
  | { ok: false; error: string; quotaExhausted?: boolean; notAuthenticated?: boolean };

async function fnError(error: unknown): Promise<{ message: string; status: number; body: Record<string, unknown> | null }> {
  let status = 0;
  let body: Record<string, unknown> | null = null;
  try {
    const ctx = (error as { context?: Response })?.context;
    if (ctx) {
      status = ctx.status;
      body = await ctx.json().catch(() => null);
    }
  } catch { /* ignore */ }
  const message = (body?.error as string) || (error as { message?: string })?.message || 'Errore di rete';
  return { message, status, body };
}

// Single photo generation. style XOR angle XOR customPrompt (custom wins).
export async function generateStaging(opts: {
  imageDataUrl: string;
  style?: string | null;
  angle?: string | null;
  customPrompt?: string | null;
}): Promise<StagingResult> {
  const { imageDataUrl, style = null, angle = null, customPrompt = null } = opts;

  // Resolve angle preset text client-side (the edge wraps it in its
  // camera-position template when `angle` is set). Styles stay server-side.
  let promptToSend = customPrompt?.trim() || null;
  if (!promptToSend && angle) {
    promptToSend = STAGING_ANGLES.find(a => a.id === angle)?.prompt || null;
  }

  const { data, error } = await supabase.functions.invoke('replicate-staging', {
    method: 'POST',
    body: {
      imageUrl: imageDataUrl,
      style: style || null,
      angle: angle || null,
      customPrompt: promptToSend,
      provider: 'nano-banana',
    },
  });

  if (error) {
    const { message, status, body } = await fnError(error);
    if (status === 401) return { ok: false, error: 'Accedi per generare le foto AI', notAuthenticated: true };
    if (status === 402 || body?.quota_exhausted) return { ok: false, error: 'Quota foto esaurita', quotaExhausted: true };
    return { ok: false, error: message };
  }
  if (!data?.success || !data?.outputUrl) {
    return { ok: false, error: (data?.error as string) || 'Generazione non riuscita' };
  }
  return { ok: true, outputUrl: data.outputUrl };
}

// ── Async single generation (start + polling) ──────────────────────────────
// `start` ritorna subito il predictionId; il client poi fa polling con
// `pollStagingStatus`. Resistente al cambio tab (richieste brevi, niente
// connessione HTTP lunga aperta).

export type StartResult =
  | { ok: true; predictionId: string; outputUrl?: string }
  | { ok: false; error: string; quotaExhausted?: boolean; notAuthenticated?: boolean };

// Interno/esterno(facciata)/giardino — determina il guard-prompt applicato ai
// custom prompt lato edge function (buildFinalPrompt). Classificata all'upload
// per pilotare il toggle UI, invece che rifarla server-side alla generazione.
export type SceneType = 'interno' | 'esterno' | 'giardino';

// Thumbnail piccola SOLO per la classificazione (Groq deve solo capire interno/
// esterno/giardino, non serve alta risoluzione): payload molto più leggero
// della foto a 1500px usata per la generazione -> risposta più veloce.
async function downscaleForClassify(dataUrl: string, maxDim = 288): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl;
    });
    let w = img.naturalWidth, h = img.naturalHeight;
    if (Math.max(w, h) > maxDim) {
      const k = maxDim / Math.max(w, h);
      w = Math.round(w * k); h = Math.round(h * k);
    }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.55);
  } catch {
    return dataUrl;
  }
}

// confident:false = il server non e' riuscito a classificare davvero (errore/
// timeout Groq) ed e' ricaduto su "interno" di default: in quel caso la UI
// mostra il toggle Interno/Esterno/Giardino cosi' l'utente puo' correggerlo.
export async function classifyScene(dataUrl: string): Promise<{ scene: SceneType; confident: boolean }> {
  const thumb = await downscaleForClassify(dataUrl);
  const { data } = await invokeFn('replicate-staging', { action: 'classify', imageUrl: thumb }, 15_000);
  const t = (data as any)?.sceneType;
  const scene: SceneType = t === 'esterno' || t === 'giardino' ? t : 'interno';
  const confident = (data as any)?.confident !== false;
  return { scene, confident };
}

// Riconosce se l'immagine è una PLANIMETRIA (line-art: quasi bianco, saturazione
// bassissima, pochi colori) invece di una foto. Serve per il render 3D automatico.
// Soglie tarate su dati reali: foto stanza sat>=0.14/colori>=79; planimetria sat~0/colori~12.
export async function detectFloorPlan(dataUrl: string): Promise<boolean> {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl;
    });
    const w = Math.min(160, img.naturalWidth || 160);
    const h = Math.max(1, Math.round(w * (img.naturalHeight || 1) / (img.naturalWidth || 1)));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); if (!ctx) return false;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data; const n = w * h;
    let white = 0, satSum = 0; const colors = new Set<number>();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255;
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      satSum += sat;
      if (v > 0.90 && sat < 0.12) white++;
      colors.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    }
    return (white / n) > 0.35 && (satSum / n) < 0.10 && colors.size < 50;
  } catch { return false; }
}

export async function startStaging(opts: {
  imageDataUrl: string;
  style?: string | null;
  angle?: string | null;
  customPrompt?: string | null;
  planimetria?: boolean | null; // decisione UI: true forza render 3D, false lo esclude, null = auto-detect
  sceneType?: SceneType | null; // interno/esterno/giardino, già classificata dal toggle UI
}): Promise<StartResult> {
  const { imageDataUrl, style = null, angle = null, customPrompt = null, planimetria = null, sceneType = null } = opts;

  let promptToSend = customPrompt?.trim() || null;
  let effAngle = angle;
  // Planimetria -> render 3D isometrico. Il prompt custom NON e' ammesso (solo lo
  // stile arreda il render): ignora custom/angolo. Usa la decisione UI se data,
  // altrimenti auto-detect.
  const isPlan = planimetria != null ? planimetria : await detectFloorPlan(imageDataUrl);
  if (isPlan) {
    promptToSend = null;
    effAngle = null;
  }
  if (!promptToSend && effAngle) {
    promptToSend = STAGING_ANGLES.find(a => a.id === effAngle)?.prompt || null;
  }

  const { data, status, error } = await invokeFn('replicate-staging', {
    action: 'start',
    imageUrl: imageDataUrl,
    style: style || null,
    angle: effAngle || null,
    customPrompt: promptToSend,
    planimetria: isPlan,
    sceneType: isPlan ? null : sceneType,
  }, 60_000);

  console.log('[staging] start fetch returned', { status, hasData: !!data, error });

  if (error === '__timeout') return { ok: false, error: 'Avvio generazione troppo lento, riprova' };
  if (status === 401) return { ok: false, error: 'Accedi per generare le foto AI', notAuthenticated: true };
  if (status === 402 || (data as any)?.quota_exhausted) return { ok: false, error: 'Quota foto esaurita', quotaExhausted: true };
  if (error && !data) return { ok: false, error };
  if (!data?.success || !data?.predictionId) {
    return { ok: false, error: (data?.error as string) || 'Generazione non riuscita' };
  }
  return { ok: true, predictionId: data.predictionId, outputUrl: data.outputUrl };
}

// Recupero server-side: trova l'ultima prediction ancora "processing" dell'utente
// (entro 3 min). Serve a riprendere una generazione anche se il client ha perso
// tutto lo stato locale (cambio focus, reload, DevTools, ecc.).
export async function findLatestProcessingPrediction(): Promise<string | null> {
  try {
    const token = getTokenFast();
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/staging_predictions?select=replicate_id,created_at,status&status=eq.processing&order=created_at.desc&limit=1`;
    const resp = await fetch(url, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!rows?.[0]) return null;
    const ageMs = Date.now() - new Date(rows[0].created_at).getTime();
    if (ageMs > 180_000) return null;
    return rows[0].replicate_id as string;
  } catch {
    return null;
  }
}

export type PollResult =
  | { status: 'processing' }
  | { status: 'succeeded'; outputUrl: string }
  | { status: 'failed'; error: string };

export async function pollStagingStatus(predictionId: string): Promise<PollResult> {
  const { data } = await invokeFn('replicate-staging', { action: 'status', predictionId }, 20_000);
  // Errore transitorio (rete / tab risvegliato / timeout): trattalo come "in corso"
  if (data?.status === 'succeeded' && data?.outputUrl) {
    return { status: 'succeeded', outputUrl: data.outputUrl };
  }
  if (data?.status === 'failed') {
    return { status: 'failed', error: (data?.error as string) || 'Generazione non riuscita' };
  }
  return { status: 'processing' };
}

export type BatchResult =
  | { ok: true; batchId: string; itemCount: number }
  | { ok: false; error: string; quotaExhausted?: boolean; notAuthenticated?: boolean };

// Batch (2..30 photos): server processes async and emails the download link.
export async function createBatchStaging(opts: {
  images: string[]; // data URLs
  style?: string | null;
  customPrompt?: string | null;
  projectId?: string | null;
}): Promise<BatchResult> {
  const { images, style = null, customPrompt = null, projectId = null } = opts;
  const { data, status, error } = await invokeFn('create-batch-staging', {
    images, style, customPrompt: customPrompt?.trim() || null, projectId,
  }, 120_000);
  if (error && !data) {
    if (error === '__timeout') return { ok: false, error: 'Invio troppo lento, riprova' };
    if (status === 401) return { ok: false, error: 'Accedi per generare le foto AI', notAuthenticated: true };
    if (status === 402 || (data as any)?.quota_exhausted) return { ok: false, error: 'Crediti insufficienti', quotaExhausted: true };
    return { ok: false, error };
  }
  if (!data?.success) return { ok: false, error: (data?.error as string) || 'Invio non riuscito' };
  
  // Save originals to IndexedDB so they don't consume backend storage
  if (data?.batchId) {
    Promise.all(images.map((img, i) => saveOriginalMedia(data.batchId, i, img))).catch(console.error);
  }
  
  return { ok: true, batchId: data.batchId, itemCount: data.itemCount };
}

export type StagingQuota = { remaining: number; limit: number };

export async function fetchStagingQuota(): Promise<StagingQuota | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('get_team_staging_credits', { p_user_id: uid });
    if (error || !data) return null;
    const remaining = Number(data.photo_credits) || 0;
    // Free trial: monthly_limit e' NULL (grant one-time di 10 foto). Il totale da
    // mostrare e' 10 fisso, non "remaining" (altrimenti "7 su 7" invece di "7 su 10").
    const FREE_PHOTO_TRIAL = 10;
    const ml = Number(data.monthly_limit);
    const limit = ml > 0 ? ml : Math.max(remaining, FREE_PHOTO_TRIAL);
    return { remaining, limit };
  } catch {
    return null;
  }
}

// ─── Post quota (5 gratis per account, illimitati sui piani a pagamento) ───
export type PostQuota = { unlimited: boolean; remaining: number };

export async function fetchPostQuota(): Promise<PostQuota | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('get_post_quota_status', { p_user_id: uid });
    if (error || !data) return null;
    return { unlimited: !!data.unlimited, remaining: Number(data.remaining) || 0 };
  } catch {
    return null;
  }
}

// Registra un export (post/video) per le metrics. Non-bloccante: best-effort.
export async function trackExport(payload: { export_type: 'post_png' | 'post_video' | 'staging_photo' | 'staging_video' | 'pdf_report' | 'zone_analysis'; width?: number; height?: number; format?: string; template?: string }): Promise<void> {
  try {
    await fetch('/api/track-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${getTokenFast()}` },
      body: JSON.stringify(payload),
    });
  } catch { /* non-bloccante */ }
}

// Consuma 1 post. Paid -> allowed:true unlimited (nessun decremento).
export async function consumePostQuota(): Promise<{ allowed: boolean; unlimited: boolean; remaining: number | null } | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('check_and_decrement_post_quota', { p_user_id: uid });
    if (error || !data) return null;
    return {
      allowed: !!data.allowed,
      unlimited: !!data.unlimited,
      remaining: typeof data.remaining === 'number' ? data.remaining : null,
    };
  } catch {
    return null;
  }
}

// ─── Montaggio quota (5 gratis per account, illimitato sui piani a pagamento) ───
export type MontaggioQuota = { unlimited: boolean; remaining: number };

export async function fetchMontaggioQuota(): Promise<MontaggioQuota | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('get_montaggio_quota_status', { p_user_id: uid });
    if (error || !data) return null;
    return { unlimited: !!data.unlimited, remaining: Number(data.remaining) || 0 };
  } catch {
    return null;
  }
}

// Consuma 1 montaggio. Paid -> allowed:true unlimited (nessun decremento).
export async function consumeMontaggioQuota(): Promise<{ allowed: boolean; unlimited: boolean; remaining: number | null } | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('check_and_decrement_montaggio_quota', { p_user_id: uid });
    if (error || !data) return null;
    return {
      allowed: !!data.allowed,
      unlimited: !!data.unlimited,
      remaining: typeof data.remaining === 'number' ? data.remaining : null,
    };
  } catch {
    return null;
  }
}

// Download a generated image (remote URL) as a local file.
export async function downloadImage(url: string, filename = 'foto-ai.png') {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
