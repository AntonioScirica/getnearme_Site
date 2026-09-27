'use client';


import { useSyncExternalStore } from 'react';

// I siti degli agenti (agenteimmo.me/<slug> e /<locale>/a/<slug>) sono di terzi: niente nostri tracker
// (Pixel, GA4, Clarity, Cal). Deciso nel browser, cosi' le pagine restano statiche.
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
export const isAgentSite = () =>
  (!!PORTFOLIO_HOST && location.hostname.replace(/^www\./, '') === PORTFOLIO_HOST && !/^\/([a-z]{2}(\/|$)|$)/.test(location.pathname)) || /^\/[a-z]{2}\/a(\/|$)/.test(location.pathname);

// Consenso cookie (Garante, linee guida 10/06/2021): Pixel, GA4 e Clarity partono solo dopo "Accetta".
// Scelta nel browser per 6 mesi; 'agenteimmo:consent' avvisa banner e tracker quando cambia.
const KEY = 'agenteimmo-consent';
const SIX_MONTHS = 183 * 86_400_000;
export type Consent = 'yes' | 'no' | null;
export function readConsent(): Consent {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { v: 'yes' | 'no'; at: number } | null;
    return v && Date.now() - v.at < SIX_MONTHS ? v.v : null;
  } catch { return null; }
}
export function setConsent(v: 'yes' | 'no') {
  localStorage.setItem(KEY, JSON.stringify({ v, at: Date.now() }));
  window.dispatchEvent(new Event('agenteimmo:consent'));
  if (v === 'no') location.reload(); // ponytail: revoca = ricarica, cosi' gli script gia' partiti si fermano
}
export const subscribeConsent = (cb: () => void) => {
  window.addEventListener('agenteimmo:consent', cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener('agenteimmo:consent', cb); window.removeEventListener('storage', cb); };
};

export default function Trackers({ children }: { children: React.ReactNode }) {
  // sul server false: gli script partono solo fuori dai siti degli agenti e con il consenso
  const ok = useSyncExternalStore(subscribeConsent, () => !isAgentSite() && readConsent() === 'yes', () => false);
  return ok ? <>{children}</> : null;
}
