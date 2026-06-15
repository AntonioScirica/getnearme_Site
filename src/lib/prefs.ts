// Preferenze utente locali (per-browser). Chiave con prefisso gnm_ così viene
// ripulita all'eliminazione account.

export const GEO_PREF_KEY = 'gnm_geo_enabled';

export function getGeoEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = localStorage.getItem(GEO_PREF_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setGeoEnabled(on: boolean): void {
  try { localStorage.setItem(GEO_PREF_KEY, on ? '1' : '0'); } catch { /* ignore */ }
}
