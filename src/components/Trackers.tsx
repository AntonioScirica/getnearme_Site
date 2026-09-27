'use client';


import { useSyncExternalStore } from 'react';

// I siti degli agenti (agenteimmo.me/<slug> e /<locale>/a/<slug>) sono di terzi: niente nostri tracker
// (Pixel, GA4, Clarity, Cal). Deciso nel browser, cosi' le pagine restano statiche.
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
export const isAgentSite = () =>
  (!!PORTFOLIO_HOST && location.hostname.replace(/^www\./, '') === PORTFOLIO_HOST && !/^\/([a-z]{2}(\/|$)|$)/.test(location.pathname)) || /^\/[a-z]{2}\/a(\/|$)/.test(location.pathname);

// Consenso cookie (Garante, linee guida 10/06/2021), per categoria: statistiche (GA4, Clarity, Cal) e marketing
// (Meta Pixel) partono solo se accettate. Scelta nel browser per 6 mesi; 'agenteimmo:consent' avvisa banner e tracker.
const KEY = 'agenteimmo-consent';
const SIX_MONTHS = 183 * 86_400_000;
export type Consent = { stats: boolean; ads: boolean };
export type Kind = keyof Consent;
let cache: { raw: string | null; val: Consent | null } = { raw: null, val: null };
export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.val; // stesso oggetto: useSyncExternalStore non va in loop
    const v = JSON.parse(raw ?? 'null') as (Consent & { at: number }) | null;
    cache = { raw, val: v && Date.now() - v.at < SIX_MONTHS ? { stats: !!v.stats, ads: !!v.ads } : null };
    return cache.val;
  } catch { return null; }
}
export function setConsent(c: Consent) {
  const was = readConsent();
  localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() }));
  window.dispatchEvent(new Event('agenteimmo:consent'));
  // ponytail: revoca = ricarica, cosi' gli script gia' partiti si fermano
  if ((was?.stats && !c.stats) || (was?.ads && !c.ads)) location.reload();
}
export const subscribeConsent = (cb: () => void) => {
  window.addEventListener('agenteimmo:consent', cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener('agenteimmo:consent', cb); window.removeEventListener('storage', cb); };
};

export default function Trackers({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  // sul server false: gli script partono solo fuori dai siti degli agenti e con il consenso per quella categoria
  const ok = useSyncExternalStore(subscribeConsent, () => !isAgentSite() && !!readConsent()?.[kind], () => false);
  return ok ? <>{children}</> : null;
}
