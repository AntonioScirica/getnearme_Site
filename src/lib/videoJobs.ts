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
  const merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  saveVideoJobs(merged);
  return merged;
}
