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

export type StagingStyle = {
  id: string;
  label: string;
  desc: string;
  icon: string; // inline SVG
};

// 6 style presets (ids must match the edge function's STYLE_PROMPTS keys).
// NB: 'industrial' is the Luxury style (historical id kept for API compat).
export const STAGING_STYLES: StagingStyle[] = [
  {
    id: 'modern', label: 'Moderno', desc: 'Linee pulite, palette neutra, pezzi di design',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>',
  },
  {
    id: 'nordic', label: 'Nordico', desc: 'Legno chiaro, bianco e grigio, minimal',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 14l3 3H4l3-3"/><path d="M15 10l3 3H6l3-3"/><path d="M13 6l2 2H9l2-2"/><path d="M12 2v4"/><line x1="12" y1="22" x2="12" y2="14"/></svg>',
  },
  {
    id: 'industrial', label: 'Luxury', desc: 'Marmo, ottone, noce scuro, eleganza',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>',
  },
  {
    id: 'boho', label: 'Boho', desc: 'Rattan, piante, toni terrosi, pattern',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
  },
  {
    id: 'daynight', label: 'Giorno e Notte', desc: 'Inverte l’illuminazione della scena',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/><path d="M12 3v1"/><path d="M4.22 5.22l.71.71"/></svg>',
  },
  {
    id: 'empty', label: 'Svuota stanza', desc: 'Rimuove mobili e oggetti, stanza vuota',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="21" x2="21" y2="3"/></svg>',
  },
];

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
  const { data, error } = await supabase.functions.invoke('create-batch-staging', {
    method: 'POST',
    body: { images, style, customPrompt: customPrompt?.trim() || null, projectId },
  });
  if (error) {
    const { message, status, body } = await fnError(error);
    if (status === 401) return { ok: false, error: 'Accedi per generare le foto AI', notAuthenticated: true };
    if (status === 402 || body?.quota_exhausted) return { ok: false, error: 'Crediti insufficienti', quotaExhausted: true };
    return { ok: false, error: message };
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
    const limit = Number(data.monthly_limit) || remaining;
    return { remaining, limit };
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
