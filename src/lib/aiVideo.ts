// Video AI API layer — port of the extension's AI video wizard backend calls.
// Edge functions (shared with the extension, same Supabase project):
//  - `generate-ai-video-avatar`  → script gen, TTS+avatar (HeyGen), clip upload
//    URLs (R2 presigned), photo animation (fal Kling), audio transcription
//  - `render-ai-video-final`    → AWS Lambda FFmpeg composition (sync or async)
//
// Flow per template:
//  classic/split : script → render-avatar → poll check-avatar → start (with avatarVideoUrl)
//  walkthrough   : animate-photo-start/poll per photo → start
//  others        : start directly (Lambda orchestrates nano-banana / Veo / Kling)

import { supabase } from './supabase';
import { getTokenFast, refreshTokenFast } from './staging';

// ─── Templates ───────────────────────────────────────────────────────────────

export type VideoTemplate = {
  id: string;
  name: string;
  description: string;
  layout: string;
  tone_badge: string;
  script_tone: string;
  preview_video_url?: string;
  default_avatar_id?: string;
};

// Fallback list (mirrors the extension's DEFAULT_AI_VIDEO_TEMPLATES); the
// remote app_config `ai_video_templates` wins when available.
export const DEFAULT_VIDEO_TEMPLATES: VideoTemplate[] = [
  { id: 'walkthrough', name: 'Da immagini a video', description: 'Le tue foto prendono vita con movimenti di camera cinematografici e musica.', layout: 'walkthrough', tone_badge: 'Foto → Video', script_tone: 'professional', preview_video_url: 'walkthrough-preview.mp4' },
  { id: 'ai_staging', name: 'Prima vs Dopo', description: "Carica una foto, scegli lo stile: l'AI arreda e crea il video prima/dopo automaticamente.", layout: 'ai_staging', tone_badge: 'Foto → AI → Video', script_tone: 'professional', preview_video_url: 'prima-dopo-preview.mp4' },
  { id: 'construction', name: 'Timelapse AI', description: "Da una foto dell'esterno, l'AI genera scavi, struttura e risultato finale in timelapse.", layout: 'construction', tone_badge: 'Scavi → Struttura → Walkthrough', script_tone: 'professional', preview_video_url: 'construction-preview.mp4' },
  { id: 'day_night', name: 'Giorno ↔ Notte', description: "Carica una foto e l'AI trasforma l'illuminazione da giorno a notte o viceversa.", layout: 'day_night', tone_badge: 'Giorno ↔ Notte', script_tone: 'professional', preview_video_url: 'day-night-preview.mp4' },
  { id: 'classic', name: 'Avatar in Primo Piano', description: "L'avatar presenta i tuoi video con script, musica e sottotitoli generati dall'AI.", layout: 'classic', tone_badge: 'Professionale', script_tone: 'professional', preview_video_url: 'classic-preview.mp4' },
  { id: 'split', name: 'Schermo Diviso', description: "Video dell'immobile in alto, avatar in basso. Script, musica e sottotitoli generati dall'AI.", layout: 'split', tone_badge: 'Moderno', script_tone: 'professional', preview_video_url: 'split-preview.mp4' },
  { id: 'sottotitoli', name: 'Sottotitola il tuo video', description: "Carica un video già girato: l'AI taglia pause e silenzi e aggiunge sottotitoli professionali.", layout: 'sottotitoli', tone_badge: 'Il tuo video', script_tone: 'professional', preview_video_url: 'sottotitoli-preview.mp4' },
  { id: 'video_cuts', name: 'Taglia & Arreda', description: "Carica un video, scegli i punti da tagliare: l'AI sostituisce ogni taglio con un'animazione prima/dopo nello stile che scegli.", layout: 'video_cuts', tone_badge: 'Video → Tagli AI', script_tone: 'professional' },
];

export const MONTAGGIO_TEMPLATE: VideoTemplate = {
  id: 'montaggio', name: 'Montaggio Automatico', description: "Carica le clip della casa: l'AI seleziona i momenti migliori, stabilizza, rallenta e monta tutto con musica.", layout: 'montaggio', tone_badge: 'Clip → Montaggio AI', script_tone: 'professional',
};

// Sotto-layout del Montaggio: l'utente sceglie il formato prima di caricare.
export type MontaggioLayout = 'normale' | 'split' | 'pip';
export const MONTAGGIO_LAYOUTS: { id: MontaggioLayout; label: string; desc: string }[] = [
  { id: 'normale', label: 'Montaggio automatico', desc: "Le clip della casa montate in sequenza con musica, copertina e logo." },
  { id: 'split', label: 'Schermo diviso', desc: "Sopra scorrono le clip della casa, sotto il tuo video mentre parli." },
  { id: 'pip', label: 'Picture in picture', desc: "La casa a tutto schermo e tu in un riquadro nell'angolo mentre commenti." },
];

// Templates that do NOT use the avatar/script pipeline
export const NO_AVATAR_LAYOUTS = ['walkthrough', 'sottotitoli', 'before_after', 'ai_staging', 'construction', 'day_night', 'montaggio', 'montaggio_split', 'montaggio_pip', 'video_cuts'];

// Preview videos: absolute URLs (remote config) pass through; relative names
// (extension-style "classic-preview.mp4") are served from /public.
export function resolvePreviewUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `/video-previews/${url}`;
}

export type VideoAvatar = {
  id: string;
  name?: string;
  avatar_name?: string;
  gender?: string;
  style?: string;
  heygen_avatar_id: string;
  elevenlabs_voice_id?: string;
  heygen_voice_id?: string;
  thumbnail_url?: string;
  voice_sample_url?: string;
  crop_pct?: number;
  crop_xPct?: number;
  crop_yPct?: number;
  overlay?: boolean;
};

export async function fetchVideoConfig(): Promise<{ templates: VideoTemplate[]; avatars: VideoAvatar[] }> {
  try {
    const { data } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['ai_video_templates', 'ai_video_avatars']);
    const byKey: Record<string, { templates?: VideoTemplate[]; avatars?: VideoAvatar[] }> = {};
    for (const r of data || []) byKey[r.key] = r.value;
    const dbTemplates = byKey.ai_video_templates?.templates || [];
    return {
      templates: dbTemplates.length > 0 ? dbTemplates : DEFAULT_VIDEO_TEMPLATES,
      avatars: (byKey.ai_video_avatars?.avatars || []).filter(a => !a.overlay),
    };
  } catch {
    return { templates: DEFAULT_VIDEO_TEMPLATES, avatars: [] };
  }
}

// ─── Quota ───────────────────────────────────────────────────────────────────

export type VideoQuota = { used: number; limit: number; remaining: number; extra: number; isAgency: boolean };

export async function fetchVideoQuota(): Promise<VideoQuota | null> {
  try {
    const { data: udata } = await supabase.auth.getUser();
    const uid = udata.user?.id;
    if (!uid) return null;
    const { data, error } = await supabase.rpc('get_ai_video_quota_status', { p_user_id: uid });
    if (error || !data) return null;
    const used = Number(data.used) || 0;
    const monthlyLimit = Number(data.monthly_limit) || 0;
    // extra_credits = pacchetti acquistati + video free trial (one-time, non si resettano).
    // Vanno contati nel rimanente, altrimenti il free trial (monthly_limit 0, extra 1)
    // mostrerebbe 0 e bloccherebbe il bottone.
    const extra = Number(data.extra_credits) || 0;
    const remaining = Math.max(0, monthlyLimit - used) + extra;
    const limit = monthlyLimit + extra;
    return { used, limit, remaining, extra, isAgency: monthlyLimit > 0 };
  } catch {
    return null;
  }
}

// ─── Constants (verbatim from the extension wizard) ─────────────────────────

export const ROOM_TYPES = [
  { id: 'cucina', label: 'Cucina' },
  { id: 'soggiorno', label: 'Soggiorno' },
  { id: 'camera', label: 'Camera da letto' },
  { id: 'bagno', label: 'Bagno' },
  { id: 'ingresso', label: 'Ingresso' },
  { id: 'studio', label: 'Studio' },
  { id: 'terrazzo', label: 'Terrazzo / Balcone' },
  { id: 'giardino', label: 'Giardino' },
  { id: 'vista', label: 'Vista esterna' },
  { id: 'cantina', label: 'Cantina / Box' },
  { id: 'altro', label: 'Altro' },
];

// Prompt per svuotare completamente la stanza (usato sia dallo stile "Vuoto"
// sia da "Mantieni arredo", che genera il frame vuoto come PRIMA del video).
const EMPTY_ROOM_PROMPT = 'Crea una versione dello stesso ambiente COMPLETAMENTE VUOTO. Rimuovi TUTTO ciò che non fa parte della struttura edilizia, SENZA ECCEZIONI: cucina (anche se a muro o incassata), mobili fissi, pensili, elettrodomestici incassati, mensole, armadi a muro, arredi, decorazioni, oggetti personali, sanitari. Mantieni ESCLUSIVAMENTE: muri, pavimento, soffitto, porte, finestre, battiscopa. NON mantenere cucine, sanitari, mobili o elementi installati. NON aggiungere nuovi oggetti. Mantieni IDENTICHE: inquadratura, prospettiva, dimensioni e geometria. Risultato fotorealistico, 8k.';

export const AI_STAGING_STYLES = [
  { id: 'modern', label: 'Moderno', desc: 'Arredo contemporaneo, linee pulite', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>', prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione moderna contemporanea dello stesso tipo. Se c'è un tavolo, metti un tavolo moderno. Se ci sono armadi, metti armadi moderni. Stile: linee pulite, palette neutra con accenti di colore, pezzi di design, illuminazione elegante. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k." },
  { id: 'nordic', label: 'Nordico', desc: 'Legno chiaro, bianco, minimale', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 14l3 3H4l3-3"/><path d="M15 10l3 3H6l3-3"/><path d="M13 6l2 2H9l2-2"/><path d="M12 2v4"/><line x1="12" y1="22" x2="12" y2="14"/></svg>', prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione scandinava nordica dello stesso tipo. Se c'è un tavolo, metti un tavolo nordico. Se ci sono armadi, metti armadi nordici. Stile: legno chiaro di quercia/betulla, palette bianca e grigia, pezzi funzionali e minimali, tessuti in lana/lino, aspetto pulito e ordinato. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k." },
  { id: 'industrial', label: 'Luxury', desc: 'Marmo, ottone, alta gamma', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>', prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione luxury contemporanea di alta gamma dello stesso tipo. Se c'è un tavolo, metti un tavolo luxury. Se ci sono armadi, metti armadi luxury. Stile: marmo pregiato, travertino, ottone spazzolato, vetro fumé, noce scuro, finiture in rovere, illuminazione ambientale soffusa, texture eleganti, palette neutra di lusso, mobili minimalisti sofisticati. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k." },
  { id: 'boho', label: 'Boho', desc: 'Rattan, piante, toni caldi', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>', prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione bohemian dello stesso tipo. Se c'è un tavolo, metti un tavolo boho. Se ci sono armadi, metti armadi boho. Stile: rattan, vimini, macramè, legno naturale, piante da interno, toni terrosi, juta, bambù, pattern eclettici. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k." },
  { id: 'empty', label: 'Vuoto', desc: 'Svuota la stanza, solo muri', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="21" x2="21" y2="3"/></svg>', prompt: EMPTY_ROOM_PROMPT },
  // "Mantieni arredo": l'AI svuota la stanza (frame PRIMA), il frame DOPO è la
  // foto caricata originale. Il video rivela da vuoto → arredo reale dell'utente.
  // keep:true → l'edge inverte la coppia FLF (before=vuoto, after=originale).
  { id: 'keep', label: 'Mantieni arredo', desc: 'Da vuoto alla tua foto reale', keep: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="m9 14 2 2 4-4"/></svg>', prompt: EMPTY_ROOM_PROMPT },
];

export const AI_STAGING_ANIMATION_STYLES = [
  { id: 'stop_motion', label: 'Stop Motion', videoPrompt: null as string | null },
  { id: 'particle_dust', label: 'Particelle', videoPrompt: 'Objects are made of ultra-fine dust particles. Particles softly lift from the surface, moving upward with a gentle fading effect, becoming less visible. The same particles then reappear and fall back down, reconstructing new objects. Continuous morphing between elements using particles. No large debris, no rocks, no explosion, no dense layer covering the scene. Only light, small particles with smooth fade in and fade out behavior. Structure forms gradually from particles.' },
];

export const DAY_NIGHT_DIRECTIONS = [
  { id: 'day_to_night', label: 'Giorno → Notte', prompt: 'This is a lighting-only edit. DO NOT remove, add, move, resize, reshape, or alter ANY object in the scene — every building, wall, roof, window, door, fence, tree, plant, car, pole, sign, and ground surface must remain EXACTLY as in the original photo with identical shape, position, size, color, and texture. DO NOT change the camera angle, perspective, or composition in any way. The ONLY permitted change is the ambient lighting and sky: replace the current sky with a dark deep-blue night sky with subtle stars, shift all surface lighting to match nighttime — warm interior lights turned ON in windows, soft exterior ambient glow, deeper shadows. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.' },
  { id: 'night_to_day', label: 'Notte → Giorno', prompt: 'This is a lighting-only edit. DO NOT remove, add, move, resize, reshape, or alter ANY object in the scene — every building, wall, roof, window, door, fence, tree, plant, car, pole, sign, and ground surface must remain EXACTLY as in the original photo with identical shape, position, size, color, and texture. DO NOT change the camera angle, perspective, or composition in any way. The ONLY permitted change is the ambient lighting and sky: replace the current sky with a bright clear blue daytime sky with soft clouds, shift all surface lighting to match midday sunlight — all artificial lights OFF, natural daylight flooding every surface, soft realistic shadows from sun position. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.' },
];

export const SUBTITLE_STYLES = [
  { id: 'bold', label: 'Bold' },
  { id: 'bar', label: 'Barra' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'neon', label: 'Neon' },
  { id: 'shadow', label: 'Ombra' },
  { id: 'uppercase', label: 'Maiuscolo' },
  { id: 'yellow', label: 'Giallo' },
  { id: 'box', label: 'Box' },
  { id: 'pop', label: 'Pop' },
  { id: 'pill', label: 'Pill' },
  { id: 'chip', label: 'Chip' },
  { id: 'italic', label: 'Corsivo' },
  { id: 'underline', label: 'Sottolineato' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'glow', label: 'Glow' },
  { id: 'orange', label: 'Arancio' },
];

export const COVER_STYLES = [
  { id: 'classic', label: 'Classico' },
  { id: 'accent', label: 'Accento' },
  { id: 'highlight', label: 'Evidenza' },
  { id: 'address', label: 'Indirizzo' },
  { id: 'block', label: 'Blocco' },
  { id: 'minimal', label: 'Minimale' },
  { id: 'glow', label: 'Bagliore' },
  { id: 'circle', label: 'Cerchio' },
  { id: 'underline', label: 'Sottolineato' },
];

// ─── Music library (R2 catalog, mirrors the service worker) ─────────────────

const R2_PUBLIC = 'https://pub-cd3d5947375c4207af2dc57da61686ee.r2.dev';

export const MOOD_LABELS: Record<string, string> = {
  'ambient-walkthrough': 'Ambient',
  'luxury-showcase': 'Luxury',
  'open-house-vibes': 'Open House',
  'property-reveal': 'Property Reveal',
  'smart-home-tour': 'Smart Home',
  'virtual-tour': 'Virtual Tour',
};

export type MusicTrack = { id: string; title: string; mood: string; url: string };

import { MUSIC_CATALOG } from './aiVideoMusic';

export function getMusicLibrary(): MusicTrack[] {
  const tracks: MusicTrack[] = [];
  for (const [mood, files] of Object.entries(MUSIC_CATALOG)) {
    for (const file of files) {
      const base = file.replace(/\.[a-z0-9]+$/i, '');
      const title = base.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      tracks.push({ id: `music/${mood}/${file}`, title, mood, url: `${R2_PUBLIC}/music/${mood}/${encodeURIComponent(file)}` });
    }
  }
  return tracks;
}

// ─── Edge function helpers ───────────────────────────────────────────────────

export class AIVideoError extends Error {
  status: number;
  body: Record<string, unknown> | null;
  constructor(message: string, status = 0, body: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Fetch diretto: supabase.functions.invoke() + getSession() vanno in deadlock
// sul lock di navigator.locks (la promise non si risolve). Bypass con fetch +
// token letto da localStorage.
const FN_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

async function callEdge<T = Record<string, unknown>>(name: string, body: Record<string, unknown>, timeoutMs = 60_000): Promise<T> {
  const doFetch = async (token: string): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(`${FN_BASE}/${name}`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(timer); }
  };
  let resp: Response;
  try {
    resp = await doFetch(getTokenFast());
    // Token scaduto → rinfresca (raw, no deadlock) e riprova una volta.
    if (resp.status === 401) {
      const fresh = await refreshTokenFast();
      if (fresh) resp = await doFetch(fresh);
    }
  } catch (e: any) {
    throw new AIVideoError(e?.name === 'AbortError' ? 'Richiesta troppo lenta, riprova' : (e?.message || 'Errore di rete'));
  }
  let json: any = null;
  try { json = await resp.json(); } catch { /* no body */ }
  if (!resp.ok) {
    const msg = (json?.error as string) || `HTTP ${resp.status}`;
    throw new AIVideoError(resp.status === 401 ? 'Accedi per usare Video AI' : msg, resp.status, json);
  }
  return json as T;
}

// Presigned R2 upload URLs
export async function getUploadUrls(count: number, mediaType: 'video' | 'photo' | 'audio', mimeTypes?: string[]) {
  const res = await callEdge<{ success: boolean; items: { uploadUrl: string; readUrl: string }[]; error?: string }>(
    'generate-ai-video-avatar',
    { mode: 'get-clip-upload-urls', count, mediaType, ...(mimeTypes ? { mimeTypes } : {}) },
  );
  if (!res.success || !Array.isArray(res.items)) throw new AIVideoError(res.error || 'Upload URL non disponibili');
  return res.items;
}

export async function uploadToPresigned(uploadUrl: string, blob: Blob, contentType: string) {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
      if (r.ok) return;
      lastErr = new Error(`PUT ${r.status}`);
    } catch (e) { lastErr = e; }
    await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt)));
  }
  throw new AIVideoError('Caricamento file non riuscito: ' + ((lastErr as Error)?.message || ''));
}

// Script generation (classic/split)
export type ScriptSection = { id: string; label: string; text: string; maxWords?: number };
export async function generateScript(payload: {
  propertyData: Record<string, unknown>;
  clips: { room: string; finalDuration: number; captionFrames: string[] }[];
  scriptTone: string;
}) {
  const res = await callEdge<{ success: boolean; script: string; sections: ScriptSection[]; error?: string }>(
    'generate-ai-video-avatar',
    { mode: 'generate-script', ...payload },
  );
  if (!res.success) throw new AIVideoError(res.error || 'Generazione script non riuscita');
  return { script: res.script, sections: res.sections || [] };
}

// Avatar render (HeyGen) + polling
export async function renderAvatar(payload: { script: string; avatarId: string; voiceId: string; template: string | null }) {
  const res = await callEdge<{ success: boolean; jobId: string; audioDurationSeconds: number; wordTimestamps: { word: string; start: number; end: number }[]; error?: string; detail?: string }>(
    'generate-ai-video-avatar',
    { mode: 'render-avatar', ...payload },
  );
  if (!res.success || !res.jobId) throw new AIVideoError((res.error || 'Sintesi avatar non riuscita') + (res.detail ? ` (${res.detail})` : ''));
  return res;
}

export async function checkAvatar(jobId: string) {
  return callEdge<{ success: boolean; done: boolean; avatarUrl?: string; status?: string; error?: string }>(
    'generate-ai-video-avatar',
    { mode: 'check-avatar', jobId },
  );
}

// Photo animation (walkthrough)
export async function animatePhotoStart(payload: { photoUrl: string; room: string; duration: string; aspectRatio: string; photoIndex?: number }) {
  return callEdge<{ success: boolean; requestId: string; statusUrl: string; responseUrl: string; room: string; error?: string }>(
    'generate-ai-video-avatar',
    { mode: 'animate-photo-start', ...payload },
  );
}

export async function animatePhotoPoll(payload: { statusUrl: string; responseUrl: string; requestId: string; room: string }) {
  return callEdge<{ success: boolean; status: string; clip?: { url: string; room: string }; error?: string; falBody?: string }>(
    'generate-ai-video-avatar',
    { mode: 'animate-photo-poll', ...payload },
  );
}

// Riconoscimento ambiente da thumbnail (Groq vision). Best-effort: torna [] su errore.
export async function detectRooms(thumbnails: string[]): Promise<string[]> {
  try {
    const res = await callEdge<{ rooms?: string[] }>('generate-ai-video-avatar', { mode: 'detect-rooms', thumbnails }, 20_000);
    return Array.isArray(res.rooms) ? res.rooms : [];
  } catch {
    return [];
  }
}

// Audio transcription (sottotitoli)
export async function transcribeAudio(payload: { audioUrl: string; autoCut: boolean; silenceSegments?: { start: number; end: number }[] }) {
  return callEdge<{
    success: boolean; transcript: string;
    wordTimestamps: { word: string; start: number; end: number }[];
    keepSegments: { start: number; end: number }[];
    audioDurationSeconds: number; error?: string;
  }>('generate-ai-video-avatar', { mode: 'transcribe-audio', ...payload });
}

// Final render (Lambda). Sync for most templates (done+outputUrl), async for
// Veo-based ones (renderId + veo context → poll with mode 'progress').
export type RenderStartResponse = {
  success: boolean; done?: boolean; outputUrl?: string; renderId?: string;
  bucketName?: string; veoStatusUrl?: string; veoResponseUrl?: string;
  aiModel?: string; aspectRatio?: string; pairs?: unknown; constructionJobs?: unknown;
  error?: string; detail?: string; monthly_limit?: number;
};

export async function startRender(payload: Record<string, unknown>): Promise<RenderStartResponse> {
  // keepR2: il sito si stacca dal flusso Litterbox/worker dell'estensione. Il
  // video finito resta su R2 (scaricabile direttamente da Media per 30 giorni).
  return callEdge<RenderStartResponse>('render-ai-video-final', { mode: 'start', keepR2: true, ...payload });
}

export async function pollRenderProgress(ctx: Record<string, unknown>): Promise<RenderStartResponse> {
  return callEdge<RenderStartResponse>('render-ai-video-final', { mode: 'progress', ...ctx });
}

// ─── Client media helpers ────────────────────────────────────────────────────

export function createImageThumbnail(file: File, maxDim = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Immagine non valida')); };
    img.src = url;
  });
}

export function createVideoThumbnail(file: File): Promise<{ thumb: string; duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 1) / 2); };
    v.onseeked = () => {
      const c = document.createElement('canvas');
      const k = Math.min(1, 600 / Math.max(v.videoWidth, v.videoHeight));
      c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
      try { c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height); } catch { /* tainted */ }
      const out = { thumb: c.toDataURL('image/jpeg', 0.8), duration: v.duration || 0, width: v.videoWidth, height: v.videoHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Video non valido')); };
    v.src = url;
  });
}

// Estrae N frame equidistanti da un video (per la mini-anteprima della timeline).
// Best-effort: torna [] se il video non è leggibile. Frame piccoli (jpeg ~160px).
export function extractFrames(file: File, count = 8): Promise<string[]> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    const out: string[] = [];
    let times: number[] = [];
    let i = 0;
    const c = document.createElement('canvas');
    const done = () => { URL.revokeObjectURL(url); resolve(out); };
    const seekNext = () => { if (i >= times.length) { done(); return; } v.currentTime = times[i]; };
    v.onloadeddata = () => {
      const d = v.duration || 0;
      if (!d) { done(); return; }
      times = Array.from({ length: count }, (_, k) => d * ((k + 0.5) / count));
      seekNext();
    };
    v.onseeked = () => {
      const k = Math.min(1, 240 / Math.max(v.videoWidth || 1, v.videoHeight || 1));
      c.width = Math.round((v.videoWidth || 240) * k);
      c.height = Math.round((v.videoHeight || 180) * k);
      try { c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height); out.push(c.toDataURL('image/jpeg', 0.82)); } catch { /* tainted */ }
      i++; seekNext();
    };
    v.onerror = () => done();
    v.src = url;
  });
}

// Estrae un singolo frame da un video a un dato istante (secondi), come data URL
// JPEG a piena risoluzione (max 1280px). Usato come "prima" per i tagli AI.
export function extractFrameAt(file: File, t: number, maxDim = 1280): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.onloadeddata = () => { v.currentTime = Math.max(0, Math.min((v.duration || 0), t)); };
    v.onseeked = () => {
      const c = document.createElement('canvas');
      const k = Math.min(1, maxDim / Math.max(v.videoWidth || 1, v.videoHeight || 1));
      c.width = Math.round((v.videoWidth || maxDim) * k);
      c.height = Math.round((v.videoHeight || maxDim) * k);
      try {
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.9);
        URL.revokeObjectURL(url);
        resolve({ dataUrl, width: c.width, height: c.height });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e instanceof Error ? e : new Error('Frame non estraibile'));
      }
    };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Video non valido')); };
    v.src = url;
  });
}

// Estrae N frame attorno a un istante `t` (finestra ±windowSec/2), usando UN
// solo elemento <video> con seek sequenziali (leggero in memoria). Ritorna i
// frame con il loro timestamp così l'utente sceglie il fotogramma migliore.
export function extractFramesAround(file: File, t: number, count = 5, windowSec = 3): Promise<{ dataUrl: string; time: number }[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    const out: { dataUrl: string; time: number }[] = [];
    const c = document.createElement('canvas');
    let times: number[] = [];
    let i = 0;
    const done = () => { URL.revokeObjectURL(url); resolve(out); };
    const seekNext = () => { if (i >= times.length) { done(); return; } v.currentTime = times[i]; };
    v.onloadeddata = () => {
      const d = v.duration || 0;
      if (!d) { done(); return; }
      const half = windowSec / 2;
      const lo = Math.max(0, t - half);
      const hi = Math.min(d, t + half);
      const span = Math.max(0.001, hi - lo);
      times = Array.from({ length: count }, (_, k) => lo + span * (count === 1 ? 0.5 : k / (count - 1)));
      seekNext();
    };
    v.onseeked = () => {
      const k = Math.min(1, 900 / Math.max(v.videoWidth || 1, v.videoHeight || 1));
      c.width = Math.round((v.videoWidth || 640) * k);
      c.height = Math.round((v.videoHeight || 360) * k);
      try { c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height); out.push({ dataUrl: c.toDataURL('image/jpeg', 0.85), time: v.currentTime }); } catch { /* tainted */ }
      i++; seekNext();
    };
    v.onerror = () => done();
    v.src = url;
  });
}

// Rileva quanto a lungo la scena resta "ferma" a partire da `tStart`: campiona
// frame piccoli e misura la differenza pixel col precedente. Quando il movimento
// riparte (o l'audio... qui solo video), ritorna l'istante di fine. Best-effort:
// torna tStart + minSpan se non riesce. Usato per proporre in automatico la
// durata del taglio (la "pausa") in Taglia & Anima.
export function detectStaticEnd(file: File, tStart: number, maxSpan = 30, step = 0.4): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    const W = 64, H = 36;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
    let prev: Float32Array | null = null;
    let t = tStart, end = tStart, dur = 0;
    // Movimento "sostenuto": serve qualche frame di fila sopra soglia prima di
    // dire che la pausa è finita (un singolo gesto non taglia corto). Memorizziamo
    // l'istante in cui il movimento è INIZIATO, così tagliamo lì.
    let streak = 0, streakStart = tStart;
    const MIN = 0.8, THRESH = 9, NEED = 3; // 3 frame di fila ≈ 1.2s di movimento
    const finish = () => { URL.revokeObjectURL(url); resolve(Math.max(tStart + MIN, Math.min(end, tStart + maxSpan))); };
    const gray = (d: Uint8ClampedArray) => { const g = new Float32Array(W * H); for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = (d[i] + d[i + 1] + d[i + 2]) / 3; return g; };
    v.onloadeddata = () => { dur = v.duration || 0; t = tStart; v.currentTime = tStart; };
    v.onseeked = () => {
      try {
        ctx!.drawImage(v, 0, 0, W, H);
        const g = gray(ctx!.getImageData(0, 0, W, H).data);
        if (prev) {
          let diff = 0; for (let i = 0; i < g.length; i++) diff += Math.abs(g[i] - prev[i]);
          diff /= g.length;
          if (diff > THRESH) {
            if (streak === 0) streakStart = t; // primo frame del movimento
            streak++;
            if (streak >= NEED) { end = streakStart; finish(); return; } // movimento sostenuto → fine alla ripartenza
          } else {
            streak = 0; end = t; // ancora fermo: la pausa continua
          }
        } else { end = t; }
        prev = g;
      } catch { /* tainted */ }
      t += step;
      if (t > Math.min(dur, tStart + maxSpan)) { end = Math.min(dur, tStart + maxSpan); finish(); return; }
      v.currentTime = t;
    };
    v.onerror = () => finish();
    v.src = url;
  });
}

// dataURL → Blob (per upload presigned R2)
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(head)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Detect portrait/landscape from a media's natural dimensions
export function aspectFromDims(w: number, h: number): 'portrait' | 'landscape' {
  return w > h ? 'landscape' : 'portrait';
}
