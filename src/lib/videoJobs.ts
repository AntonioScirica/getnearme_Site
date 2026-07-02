// Job video (montaggio/avatar). Source of truth = tabella ai_video_jobs
// (finalizzata dal cron process-batch-staging anche a browser chiuso / altro
// device). localStorage resta come cache ottimistica per UX istantanea in
// sessione. Solo metadati: il file MP4 vive su R2 (cleanup-ai-videos lo pota a
// 30 giorni).

import { getTokenFast } from './staging';

export type VideoJob = {
  id: string;            // renderId (async) o id locale (done sync)
  title: string;
  template: string;
  stage: 'render' | 'done' | 'failed';
  progress: number;      // 0..1
  ctx: Record<string, unknown>;  // contesto per pollRenderProgress
  outputUrl?: string;
  error?: string;
  projectId: string | null;
  aspect: string;
  createdAt: number;
  dismissed?: boolean;   // rimosso dal tray dall'utente
};

const KEY = 'gnm_video_jobs';
const MAX = 40;

// Template che animano le foto LATO CLIENT prima di ottenere un renderId: la fase
// 'prep' dura minuti (una clip Kling per foto), non secondi. Con la soglia da 3 min
// venivano marcati falliti a meta' animazione e sparivano dal tray. Soglie estese.
const CLIENT_ANIMATE = new Set(['walkthrough', 'ai_staging', 'construction', 'day_night']);
export function prepTimeoutMs(template: string): number {
  return CLIENT_ANIMATE.has(template) ? 1_200_000 : 180_000; // 20 min vs 3 min (no renderId)
}
export function deadTimeoutMs(template: string): number {
  return CLIENT_ANIMATE.has(template) ? 2_700_000 : 1_800_000; // 45 min vs 30 min (render morto)
}
// Client-animate: l'animazione lato client E' il grosso del lavoro (~85%), il render
// server (concat) e' rapido. La barra 'prep' sale fin quasi a `prepCeiling`, poi il
// render reale riparte da `renderStartProgress` (piu' alto) -> nessuna regressione.
export function prepCeiling(template: string): number {
  return CLIENT_ANIMATE.has(template) ? 0.82 : 0.2;
}
export function renderStartProgress(template: string): number {
  return CLIENT_ANIMATE.has(template) ? 0.85 : 0.25;
}

export function loadVideoJobs(): VideoJob[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveVideoJobs(jobs: VideoJob[]) {
  try { localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, MAX))); } catch { /* quota */ }
}

export function upsertVideoJob(job: VideoJob): VideoJob[] {
  const jobs = loadVideoJobs();
  const i = jobs.findIndex(j => j.id === job.id);
  if (i >= 0) jobs[i] = { ...jobs[i], ...job };
  else jobs.unshift(job);
  saveVideoJobs(jobs);
  return jobs;
}

export function patchVideoJob(id: string, patch: Partial<VideoJob>): VideoJob[] {
  const jobs = loadVideoJobs().map(j => j.id === id ? { ...j, ...patch } : j);
  saveVideoJobs(jobs);
  return jobs;
}

export function dismissVideoJob(id: string): VideoJob[] {
  return patchVideoJob(id, { dismissed: true });
}

// Rimuove del tutto un job locale (es. il temporaneo sostituito dal renderId).
export function removeVideoJob(id: string): VideoJob[] {
  const jobs = loadVideoJobs().filter(j => j.id !== id);
  saveVideoJobs(jobs);
  return jobs;
}

// Output video finiti, per la Libreria Media (più recenti prima).
export function finishedVideos(projectId?: string | null): VideoJob[] {
  return loadVideoJobs()
    .filter(j => j.stage === 'done' && j.outputUrl && (!projectId || !j.projectId || j.projectId === projectId))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Sync server (tabella ai_video_jobs) ────────────────────────────────────

// Crea/aggiorna la riga server allo start del render (fire-and-forget).
export async function createServerVideoJob(job: {
  id: string; title: string; template: string; status: 'rendering' | 'done' | 'failed';
  progress: number; ctx: Record<string, unknown>; outputUrl?: string;
  projectId: string | null; aspect: string;
}): Promise<void> {
  try {
    const token = getTokenFast();
    if (!token) return;
    await fetch('/api/video-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(job),
    });
  } catch { /* best-effort: localStorage copre la sessione corrente */ }
}

// Rimuove un job (riga server + cache locale).
export async function deleteServerVideoJob(id: string): Promise<void> {
  try {
    const token = getTokenFast();
    if (token) {
      await fetch(`/api/video-jobs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch { /* best-effort */ }
  saveVideoJobs(loadVideoJobs().filter(j => j.id !== id));
}

// Legge i job dal server (source of truth).
export async function fetchServerVideoJobs(): Promise<VideoJob[]> {
  try {
    const token = getTokenFast();
    if (!token) return [];
    const res = await fetch('/api/video-jobs', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs : [];
  } catch { return []; }
}

// Fonde i job server in quelli locali e persiste. Server vince sugli stati
// terminali (done/failed) e sul progress piu' avanzato; i job solo-locali
// (appena avviati, non ancora visibili al GET) restano. Ritorna l'elenco unito.
export function mergeServerJobs(server: VideoJob[]): VideoJob[] {
  const local = loadVideoJobs();
  const byId = new Map<string, VideoJob>();
  for (const j of local) byId.set(j.id, j);
  for (const s of server) {
    const prev = byId.get(s.id);
    if (!prev) { byId.set(s.id, s); continue; }
    const serverTerminal = s.stage === 'done' || s.stage === 'failed';
    byId.set(s.id, {
      ...prev,
      ...s,
      // preserva flag locali e il dismiss scelto dall'utente
      dismissed: prev.dismissed || s.dismissed,
      stage: serverTerminal ? s.stage : prev.stage,
      progress: Math.max(prev.progress, s.progress),
      outputUrl: s.outputUrl || prev.outputUrl,
      title: prev.title || s.title,
      ctx: Object.keys(prev.ctx || {}).length ? prev.ctx : s.ctx,
    });
  }
  let merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  // Bonifica job 'render' bloccati: senza renderId dopo 3 min (avvio fallito) o
  // con renderId dopo 30 min (render morto) → falliti. Evita skeleton infiniti
  // e contatori fantasma anche al solo reload (non solo dal loop di polling).
  const nowMs = Date.now();
  merged = merged.map(j => {
    if (j.stage !== 'render') return j;
    const age = nowMs - (j.createdAt || 0);
    const hasRenderId = !!(j.ctx as { renderId?: string } | undefined)?.renderId;
    if ((!hasRenderId && age > prepTimeoutMs(j.template)) || age > deadTimeoutMs(j.template)) {
      return { ...j, stage: 'failed' as const, error: hasRenderId ? 'Render interrotto (timeout)' : 'Avvio non riuscito' };
    }
    return j;
  });
  // Riconciliazione orfani: un job "prep_" (temporaneo, senza renderId) e' valido
  // solo finche' non viene sostituito dal render reale. Se esiste gia' un job
  // server dello stesso template+progetto creato nello stesso intervallo, il prep
  // e' un orfano (la sostituzione e' fallita) → si scarta. Evita il "fermo al 20%
  // mentre il video e' in realta' finito".
  const realJobs = merged.filter(j => !j.id.startsWith('prep_') && (j.ctx as { renderId?: string })?.renderId || j.stage === 'done' || j.stage === 'failed');
  merged = merged.filter(j => {
    if (!j.id.startsWith('prep_')) return true;
    const orphan = realJobs.some(r =>
      r.template === j.template &&
      (r.projectId || null) === (j.projectId || null) &&
      r.createdAt >= j.createdAt - 60_000 &&
      r.createdAt <= j.createdAt + 1_200_000
    );
    return !orphan;
  });
  saveVideoJobs(merged);
  return merged;
}
