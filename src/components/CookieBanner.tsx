'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { isAgentSite, readConsent, setConsent, subscribeConsent } from './Trackers';

// Banner cookie di Agente Immo (non sui siti degli agenti: li' solo cookie tecnici, niente banner).
// Accetta e Rifiuta con lo stesso peso, la X vale come Rifiuta. Si riapre con l'evento 'agenteimmo:cookie-prefs'
// (link "Preferenze cookie" nel footer).
export default function CookieBanner() {
  const unset = useSyncExternalStore(subscribeConsent, () => !isAgentSite() && readConsent() === null, () => false);
  const [reopen, setReopen] = useState(false);
  useEffect(() => {
    const on = () => setReopen(true);
    window.addEventListener('agenteimmo:cookie-prefs', on);
    return () => window.removeEventListener('agenteimmo:cookie-prefs', on);
  }, []);
  if (!unset && !reopen) return null;
  const en = typeof location !== 'undefined' && location.pathname.startsWith('/en');
  const choose = (v: 'yes' | 'no') => { setReopen(false); setConsent(v); };
  return (
    <div role="dialog" aria-label="Cookie" className="blur-in fixed inset-x-3 bottom-3 z-[300] mx-auto max-w-xl rounded-[24px] bg-white p-5 pr-12 text-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] ring-1 ring-black/5 sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2">
      <button type="button" onClick={() => choose('no')} aria-label={en ? 'Close and reject' : 'Chiudi e rifiuta'} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
      <p className="leading-relaxed text-ink">
        {en
          ? 'We use technical cookies to make the site work and, only with your consent, analytics and marketing cookies (Google Analytics, Microsoft Clarity, Meta) to measure visits and ads. '
          : 'Usiamo cookie tecnici per far funzionare il sito e, solo con il tuo consenso, cookie di analisi e marketing (Google Analytics, Microsoft Clarity, Meta) per misurare visite e pubblicità. '}
        <a href={en ? '/en/cookie' : '/it/cookie'} className="font-medium underline underline-offset-4">{en ? 'Cookie policy' : 'Cookie policy'}</a>
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => choose('no')} className="h-10 flex-1 rounded-full bg-canvas px-4 font-semibold text-ink ring-1 ring-black/10 hover:bg-line/60">{en ? 'Reject' : 'Rifiuta'}</button>
        <button type="button" onClick={() => choose('yes')} className="h-10 flex-1 rounded-full bg-ink px-4 font-semibold text-white hover:bg-black">{en ? 'Accept' : 'Accetta'}</button>
      </div>
    </div>
  );
}
