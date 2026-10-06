'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, ExternalLink, Menu, MonitorDown, MoreHorizontal, MoreVertical, PanelBottom, Share, Smartphone, SquarePlus, X, type LucideIcon } from 'lucide-react';

// Popup "Installa Agente Immo" nella piattaforma. Ogni sistema e ogni browser salva sulla Home in modo diverso:
// - Chrome/Edge (Android e computer) danno il pulsante del browser (beforeinstallprompt): bottone "Installa" diretto;
//   se l'evento non arriva, istruzioni dal menu.
// - iPhone/iPad, Samsung Internet, Firefox Android, Safari Mac: istruzioni passo passo (non esiste un pulsante).
// - Browser dentro le app (Instagram, Facebook, TikTok...): non si puo' installare, si spiega come aprire il browser.
// - Firefox computer e Safari Mac vecchio (prima della 17): non si puo', il popup non compare.
// Regole: non compare se gia' installata (standalone o installata da questo browser), parte dopo 20 s di uso,
// se chiuso torna dopo 30 giorni. Prova: ?install=1 lo apre subito (ignora timer e 30 giorni);
// ?install=<variante> forza anche la variante (ios26, ios, ipad, ios-other, android, android-event, samsung,
// firefox-android, desktop, desktop-event, mac-safari, inapp-ios, inapp-android).
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = 'agenteimmo:install-later';
const INSTALLED = 'agenteimmo:installed';
const DAYS = 30;

type Variant = 'ios26' | 'ios' | 'ipad' | 'ios-other' | 'android' | 'samsung' | 'firefox-android' | 'desktop' | 'mac-safari' | 'inapp-ios' | 'inapp-android';
type Step = { icon?: LucideIcon; text: ReactNode };

// Rilevamento da userAgent (+ userAgentData dove c'e'). Esportata per provarla con stringhe finte.
export function detect(ua: string, touch = 0, uaPlatform = ''): Variant | null {
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && touch > 1); // iPad recenti si dichiarano Mac
  const ipad = /ipad/i.test(ua) || (/macintosh/i.test(ua) && touch > 1);
  const android = /android/i.test(ua) || /android/i.test(uaPlatform);
  if (/Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|WhatsApp|TikTok|musical_ly|BytedanceWebview|Line\/|Snapchat|Pinterest|LinkedInApp|; wv\)/i.test(ua)) return ios ? 'inapp-ios' : 'inapp-android';
  if (ios) {
    if (/CriOS|EdgiOS|FxiOS|OPiOS|YaBrowser|DuckDuckGo/i.test(ua)) return 'ios-other';
    if (ipad) return 'ipad';
    // Safari 26 tiene ferma la versione di iOS nello userAgent: conta "Version/26"
    const v = Number(/Version\/(\d+)/.exec(ua)?.[1] || 0);
    return v >= 26 ? 'ios26' : 'ios';
  }
  if (android) {
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/Firefox/i.test(ua)) return 'firefox-android';
    return 'android'; // Chrome, Edge, Opera e gli altri Chromium
  }
  if (/Firefox/i.test(ua)) return null; // Firefox computer non installa le web app
  if (/Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg\//i.test(ua)) {
    return Number(/Version\/(\d+)/.exec(ua)?.[1] || 0) >= 17 ? 'mac-safari' : null; // Aggiungi al Dock da Safari 17 (Sonoma)
  }
  if (/Chrome|Edg\//i.test(ua)) return 'desktop';
  return null;
}

const b = (t: string) => <b className="font-semibold">{t}</b>;
const STEPS: Record<Variant, Step[]> = {
  ios26: [
    { icon: MoreHorizontal, text: <>Tocca {b('i tre puntini')} in basso a destra, accanto all&apos;indirizzo</> },
    { icon: Share, text: <>Tocca {b('Condividi')}</> },
    { icon: SquarePlus, text: <>Tocca {b('Visualizza altro')}, poi {b('Aggiungi alla schermata Home')}</> },
    { text: <>Tocca {b('Aggiungi')} in alto a destra</> },
  ],
  ios: [
    { icon: Share, text: <>Tocca {b('Condividi')} in basso al centro</> },
    { icon: SquarePlus, text: <>Scorri e tocca {b('Aggiungi alla schermata Home')}</> },
    { text: <>Tocca {b('Aggiungi')} in alto a destra</> },
  ],
  ipad: [
    { icon: Share, text: <>Tocca {b('Condividi')} in alto, vicino all&apos;indirizzo. Non lo vedi? Tocca prima i tre puntini</> },
    { icon: SquarePlus, text: <>Scorri e tocca {b('Aggiungi alla schermata Home')}</> },
    { text: <>Tocca {b('Aggiungi')}</> },
  ],
  'ios-other': [
    { icon: Share, text: <>Tocca {b('Condividi')} in alto a destra, nella barra dell&apos;indirizzo</> },
    { icon: SquarePlus, text: <>Tocca {b('Aggiungi alla schermata Home')}. Non lo vedi? Tocca prima {b('Visualizza altro')}</> },
    { text: <>Tocca {b('Aggiungi')}</> },
  ],
  android: [
    { icon: MoreVertical, text: <>Tocca {b('i tre puntini')} in alto a destra</> },
    { icon: Smartphone, text: <>Tocca {b('Aggiungi a schermata Home')} oppure {b('Installa app')}</> },
    { text: <>Tocca {b('Installa')}</> },
  ],
  samsung: [
    { icon: Menu, text: <>Tocca {b('le tre righe')} in basso a destra</> },
    { icon: SquarePlus, text: <>Tocca {b('Aggiungi pagina a')}</> },
    { text: <>Scegli {b('Schermata Home')}</> },
  ],
  'firefox-android': [
    { icon: MoreVertical, text: <>Tocca {b('i tre puntini')} del menu</> },
    { icon: Smartphone, text: <>Tocca {b('Installa')}. Non lo vedi? Cerca {b('Aggiungi a schermata Home')}</> },
    { text: <>Tocca {b('Aggiungi')}</> },
  ],
  desktop: [
    { icon: MonitorDown, text: <>Clicca {b('questa icona')} a destra nella barra dell&apos;indirizzo</> },
    { text: <>Clicca {b('Installa')}</> },
  ],
  'mac-safari': [
    { text: <>In alto, nella barra dei menu, clicca {b('File')}</> },
    { icon: PanelBottom, text: <>Clicca {b('Aggiungi al Dock')}</> },
    { text: <>Clicca {b('Aggiungi')}</> },
  ],
  'inapp-ios': [
    { icon: MoreHorizontal, text: <>Tocca {b('i tre puntini')} in alto a destra</> },
    { icon: ExternalLink, text: <>Tocca {b('Apri in Safari')} o {b('Apri nel browser')}</> },
    { text: <>Lì ti mostriamo come metterla sulla Home</> },
  ],
  'inapp-android': [
    { icon: MoreVertical, text: <>Tocca {b('i tre puntini')} in alto a destra</> },
    { icon: ExternalLink, text: <>Tocca {b('Apri in Chrome')} o {b('Apri nel browser')}</> },
    { text: <>Lì ti mostriamo come metterla sulla Home</> },
  ],
};
const FORCED: Record<string, Variant> = { 'android-event': 'android', 'desktop-event': 'desktop' };

// il profilo apre il popup con window.dispatchEvent(new Event(INSTALL_EVENT))
export const INSTALL_EVENT = 'agenteimmo:install';
/** true se l'app e' gia' aperta come web app installata (allora nel profilo non si propone) */
export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || !!(navigator as { standalone?: boolean }).standalone);

export default function InstallPrompt() {
  const [ev, setEv] = useState<BIP | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [open, setOpen] = useState(false); // montato
  const [vis, setVis] = useState(false); // visibile (per l'animazione di entrata e uscita)
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('install');
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone && !q) return; // gia' installata: niente popup, ne' automatico ne' dal profilo
    const uaData = (navigator as { userAgentData?: { platform?: string } }).userAgentData;
    const forced = q && q !== '1' ? (FORCED[q] ?? (q in STEPS ? (q as Variant) : null)) : null;
    const v = forced ?? detect(navigator.userAgent, navigator.maxTouchPoints, uaData?.platform);
    if (!v) return;
    setVariant(v); // eslint-disable-line react-hooks/set-state-in-effect
    if (q === 'android-event' || q === 'desktop-event') { // finto evento del browser, per vedere il bottone Installa
      setEv({ prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) } as unknown as BIP);
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    const onInstalled = () => { localStorage.setItem(INSTALLED, '1'); setOpen(false); };
    const onAsk = () => setOpen(true); // dal profilo: "Agente Immo sul telefono", sempre, anche se chiuso prima
    if (!forced) window.addEventListener('beforeinstallprompt', onPrompt); // variante forzata: niente evento vero, si vedono le istruzioni
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener(INSTALL_EVENT, onAsk);
    // da solo dopo 20 s di uso (subito con ?install), se non e' gia' installata o rimandata da meno di 30 giorni;
    // su Chrome/Edge a quel punto l'evento di solito e' gia' arrivato, altrimenti si mostrano le istruzioni dal menu
    const later = Number(localStorage.getItem(KEY) || 0);
    const auto = !!q || (!localStorage.getItem(INSTALLED) && Date.now() - later >= DAYS * 86_400_000);
    const t = auto ? setTimeout(() => setOpen(true), q ? 0 : 20_000) : undefined;
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); window.removeEventListener(INSTALL_EVENT, onAsk); clearTimeout(t); };
  }, []);

  // entrata: monta, poi al frame dopo accende la transizione; focus nel pannello, poi lo restituisce
  useEffect(() => {
    if (!open) return;
    back.current = document.activeElement as HTMLElement | null;
    const r = requestAnimationFrame(() => { setVis(true); panel.current?.focus({ preventScroll: true }); });
    return () => cancelAnimationFrame(r);
  }, [open]);

  const close = useCallback(() => {
    localStorage.setItem(KEY, String(Date.now()));
    setVis(false);
    setTimeout(() => { setOpen(false); back.current?.focus?.(); }, 600);
  }, []);
  const install = async () => {
    if (!ev) return;
    await ev.prompt();
    const r = await ev.userChoice.catch(() => ({ outcome: 'dismissed' }));
    if (r.outcome === 'accepted') localStorage.setItem(INSTALLED, '1');
    setEv(null); close();
  };
  const copy = async () => {
    const url = location.origin + location.pathname;
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // Esc chiude, Tab resta dentro il pannello
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panel.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, close]);

  if (!open || !variant) return null;
  const inapp = variant.startsWith('inapp');
  const computer = variant === 'desktop' || variant === 'mac-safari';
  const direct = !!ev && (variant === 'android' || variant === 'desktop');
  const title = inapp ? 'Apri Agente Immo nel browser' : computer ? 'Agente Immo sul computer' : variant === 'ipad' ? 'Agente Immo sul tablet' : 'Agente Immo sul telefono';
  const sub = inapp ? 'Da qui dentro non si può installare. Aprila nel browser del telefono, ci vuole un attimo.'
    : computer ? 'Come un’app.' : 'Come un’app, senza App Store.';
  const steps = STEPS[variant];
  const T = 'transition-[opacity,transform] duration-[var(--gnm-dur)] ease-[var(--gnm-ease)]';

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center md:items-center md:p-6">
      {/* sfondo scuro: un tocco fuori chiude */}
      <div onClick={close} aria-hidden className={`absolute inset-0 bg-black/40 ${T} ${vis ? 'opacity-100' : 'opacity-0'}`} />
      {/* telefono: foglio dal basso; da md: finestra al centro */}
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="install-title" tabIndex={-1}
        className={`relative w-full rounded-t-[32px] outline-none bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)] md:max-w-[440px] md:rounded-[32px] md:pb-6 ${T} ${
          vis ? 'translate-y-0 opacity-100 md:scale-100' : 'translate-y-full opacity-0 md:translate-y-6 md:scale-[.97]'}`}>
        <span aria-hidden className="mx-auto -mt-2 mb-4 block h-1 w-10 rounded-full bg-line md:hidden" />
        <div className="flex items-center gap-4">
          {/* riquadro bianco come l'icona sulla Home, il logo piu' piccolo dentro */}
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-white shadow-sm ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <p id="install-title" className="text-lg font-semibold leading-snug text-ink">{title}</p>
            {sub && <p className="mt-0.5 text-sm leading-snug text-muted">{sub}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Chiudi" className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>

        {!direct && (
          <ol className="mt-5 space-y-3 rounded-[24px] bg-canvas p-4 text-[15px] leading-snug text-ink">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold">{i + 1}</span>
                <span className="min-w-0 flex-1">{s.text}</span>
                {s.icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-brand ring-1 ring-black/5"><s.icon size={18} /></span>}
              </li>
            ))}
          </ol>
        )}
        {variant === 'desktop' && !direct && <p className="mt-3 text-sm text-muted">Non vedi l&apos;icona? Apri il menu del browser e cerca {b('Installa Agente Immo')}.</p>}

        <div className="mt-5 flex justify-end gap-2">
          {direct ? <>
            <button type="button" onClick={close} className="h-12 rounded-full px-5 text-[15px] font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">Più tardi</button>
            <button type="button" onClick={() => void install()} className="h-12 rounded-full bg-ink px-7 text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-brand">Installa</button>
          </> : inapp ? <>
            <button type="button" onClick={close} className="h-12 rounded-full px-5 text-[15px] font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">Più tardi</button>
            <button type="button" onClick={() => void copy()} className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-brand">
              {copied ? <><Check size={16} /> Link copiato</> : <><Copy size={16} /> Copia il link</>}
            </button>
          </> : (
            <button type="button" onClick={close} className="h-12 w-full rounded-full bg-ink px-7 text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-brand md:w-auto">Ho capito</button>
          )}
        </div>
      </div>
    </div>
  );
}
