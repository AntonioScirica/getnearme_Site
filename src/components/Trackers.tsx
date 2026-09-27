'use client';


import { useSyncExternalStore } from 'react';

// I siti degli agenti (agenteimmo.me/<slug> e /<locale>/a/<slug>) sono di terzi: niente nostri tracker
// (Pixel, GA4, Clarity, Cal). Deciso nel browser, cosi' le pagine restano statiche.
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
export const isAgentSite = () =>
  (!!PORTFOLIO_HOST && location.hostname.replace(/^www\./, '') === PORTFOLIO_HOST && !/^\/([a-z]{2}(\/|$)|$)/.test(location.pathname)) || /^\/[a-z]{2}\/a(\/|$)/.test(location.pathname);
const noop = () => () => {};

export default function Trackers({ children }: { children: React.ReactNode }) {
  // sul server false: gli script partono solo dopo aver verificato che non e' il sito di un agente
  const ok = useSyncExternalStore(noop, () => !isAgentSite(), () => false);
  return ok ? <>{children}</> : null;
}

