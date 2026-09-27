'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { isAgentSite, readConsent, setConsent, subscribeConsent, type Consent } from './Trackers';

// Banner cookie di Agente Immo, in basso a sinistra (non sui siti degli agenti: li' solo cookie tecnici).
// Tre scelte: Solo necessari, Personalizza (statistiche e marketing separati), Accetta tutti.
// Si riapre con l'evento 'agenteimmo:cookie-prefs' (link "Preferenze cookie" nel footer).
const TXT = {
  it: {
    title: 'Cookie e privacy',
    body: 'Usiamo cookie necessari al funzionamento del sito e, se ce lo permetti, cookie di statistica e di marketing per migliorarlo. Puoi cambiare idea quando vuoi.',
    privacy: 'Privacy', cookie: 'Cookie policy', only: 'Solo necessari', custom: 'Personalizza', all: 'Accetta tutti', save: 'Salva le scelte',
    cats: [
      ['need', 'Necessari', 'Accesso, sicurezza e la tua scelta sui cookie. Sempre attivi.'],
      ['stats', 'Statistiche', 'Come viene usato il sito, in forma aggregata.'],
      ['ads', 'Marketing', 'Misurare le nostre campagne pubblicitarie.'],
    ],
  },
  en: {
    title: 'Cookies and privacy',
    body: 'We use cookies needed for the site to work and, if you allow us, analytics and marketing cookies to improve it. You can change your mind anytime.',
    privacy: 'Privacy', cookie: 'Cookie policy', only: 'Necessary only', custom: 'Customize', all: 'Accept all', save: 'Save choices',
    cats: [
      ['need', 'Necessary', 'Sign-in, security and your cookie choice. Always on.'],
      ['stats', 'Analytics', 'How the site is used, in aggregate.'],
      ['ads', 'Marketing', 'Measuring our ad campaigns.'],
    ],
  },
} as const;

export default function CookieBanner() {
  // niente banner dentro una cornice (anteprima dei modelli): c'e' gia' nella pagina che la contiene
  const unset = useSyncExternalStore(subscribeConsent, () => !isAgentSite() && window.self === window.top && readConsent() === null, () => false);
  const [reopen, setReopen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [pick, setPick] = useState<Consent>({ stats: false, ads: false });
  useEffect(() => {
    const on = () => { setPick(readConsent() ?? { stats: false, ads: false }); setCustom(true); setReopen(true); };
    window.addEventListener('agenteimmo:cookie-prefs', on);
    return () => window.removeEventListener('agenteimmo:cookie-prefs', on);
  }, []);
  if (!unset && !reopen) return null;
  const lang = location.pathname.startsWith('/en') ? 'en' : 'it';
  const t = TXT[lang];
  const choose = (c: Consent) => { setReopen(false); setCustom(false); setConsent(c); };
  const btn = 'h-10 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors';
  return (
    <div role="dialog" aria-label={t.title} className="blur-in fixed bottom-3 left-3 right-3 z-[300] rounded-[24px] bg-white p-5 text-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] ring-1 ring-black/5 sm:right-auto sm:w-[400px]">
      <div className="font-display text-base font-bold">{t.title}</div>
      <p className="mt-1.5 leading-relaxed text-muted">
        {t.body} <a href={`/${lang}/privacy`} className="font-medium text-ink underline underline-offset-4">{t.privacy}</a> · <a href={`/${lang}/cookie`} className="font-medium text-ink underline underline-offset-4">{t.cookie}</a>
      </p>
      {custom && (
        <ul className="mt-4 space-y-2">
          {t.cats.map(([k, l, d]) => {
            const on = k === 'need' || pick[k];
            return (
              <li key={k} className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
                <span className="min-w-0 flex-1"><span className="block font-semibold">{l}</span><span className="block text-xs text-muted">{d}</span></span>
                <button type="button" role="switch" aria-checked={on} aria-label={l} disabled={k === 'need'} onClick={() => k !== 'need' && setPick(p => ({ ...p, [k]: !p[k] }))}
                  className={`relative h-6 w-10 shrink-0 rounded-full ease-smooth transition-colors disabled:opacity-50 ${on ? 'bg-ink' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ease-smooth transition-[left] ${on ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {/* Solo necessari e Accetta tutti con lo stesso peso (Garante: rifiutare facile quanto accettare) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose({ stats: false, ads: false })} className={`${btn} bg-canvas text-ink ring-1 ring-black/10 hover:bg-line/60`}>{t.only}</button>
        <button type="button" onClick={() => choose({ stats: true, ads: true })} className={`${btn} bg-ink text-white hover:bg-black`}>{t.all}</button>
      </div>
      {custom
        ? <button type="button" onClick={() => choose(pick)} className={`${btn} mt-2 w-full bg-canvas text-ink ring-1 ring-black/10 hover:bg-line/60`}>{t.save}</button>
        : <button type="button" onClick={() => setCustom(true)} className="mt-3 w-full text-center text-sm font-medium text-muted underline underline-offset-4 hover:text-ink">{t.custom}</button>}
    </div>
  );
}
