// Galleria a pagine: filtri e cursore condivisi tra la rotta /api/platform/media (dati veri) e la Galleria
// (esempi del tour guidato), cosi' le due strade danno gli stessi risultati.
export type MediaItem = { id: string; video?: string; pending?: boolean; job?: string; dopo: string; prima: string | null; at: number; casa: string | null; text: string; room: string; steps: { url: string; text: string }[]; all: string; keys: string[] };
export type MediaFilters = { q?: string; casa?: string; since?: number; tipo?: 'tutto' | 'foto' | 'video' };
export type MediaPage = { items: MediaItem[]; next: string | null; total: number; counts: Record<string, number>; casas: string[] };
type ProjectText = { id: string; titolo?: string; nome?: string; addr?: string };

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// ordine unico: dal piu' recente, a pari data per id (il cursore deve essere stabile)
export const byRecent = (a: MediaItem, b: MediaItem) => b.at - a.at || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
const cursorOf = (m: MediaItem) => `${m.at}_${m.id}`;

export function pageMedia(all: MediaItem[], f: MediaFilters, projects: ProjectText[], before: string | null, limit: number): MediaPage {
  const words = norm(f.q ?? '').split(/\s+/).filter(Boolean);
  const since = f.since ?? 0;
  const filtered = all.filter(m => {
    if (f.casa && f.casa !== 'tutte' && (m.casa ?? 'nessuna') !== f.casa) return false;
    if (f.tipo && f.tipo !== 'tutto' && !!m.video !== (f.tipo === 'video')) return false;
    if (m.at < since) return false;
    if (!words.length) return true;
    const p = m.casa ? projects.find(x => x.id === m.casa) : null;
    const hay = norm([m.room, m.all, p?.titolo, p?.nome, p?.addr].filter(Boolean).join(' '));
    return words.every(w => hay.includes(w));
  }).sort(byRecent);
  const counts: Record<string, number> = {};
  for (const m of filtered) counts[m.casa ?? 'nessuna'] = (counts[m.casa ?? 'nessuna'] ?? 0) + 1;
  const start = before ? filtered.findIndex(m => cursorOf(m) === before) + 1 : 0;
  // cursore non piu' valido (voce cancellata nel frattempo): si riparte dalla data
  const from = before && start === 0 ? filtered.findIndex(m => m.at < Number(before.split('_')[0])) : start;
  const items = from < 0 ? [] : filtered.slice(from, from + limit);
  const last = items[items.length - 1];
  return { items, next: last && from + limit < filtered.length ? cursorOf(last) : null, total: filtered.length, counts, casas: [...new Set(all.map(m => m.casa ?? 'nessuna'))] };
}
