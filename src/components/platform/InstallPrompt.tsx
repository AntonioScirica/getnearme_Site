'use client';

import { useEffect, useState } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';

// Popup "Installa Agente Immo" nella piattaforma: Android e computer (Chrome, Edge) con il pulsante del browser
// (beforeinstallprompt), iPhone e iPad con le istruzioni (Apple non permette il pulsante). Non compare se l'app e'
// gia' installata (display-mode standalone) e, se chiuso, per 30 giorni. Parte dopo 20 secondi di uso, non all'ingresso.
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = 'agenteimmo:install-later';
const DAYS = 30;

export default function InstallPrompt() {
  const [ev, setEv] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
    const later = Number(localStorage.getItem(KEY) || 0);
    if (standalone || Date.now() - later < DAYS * 86_400_000) return;
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const t = setTimeout(() => {
      if (isIos && safari) { setIos(true); setOpen(true); } // su iPhone solo Safari sa aggiungere alla schermata Home
      else setOpen(o => o); // altrove si apre quando arriva l'evento del browser (vedi sotto)
    }, 20_000);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); clearTimeout(t); };
  }, []);
  // Chrome/Edge: il browser dice che si puo' installare, si mostra dopo il primo momento di uso
  useEffect(() => {
    if (!ev) return;
    const t = setTimeout(() => setOpen(true), 20_000);
    return () => clearTimeout(t);
  }, [ev]);

  const close = () => { localStorage.setItem(KEY, String(Date.now())); setOpen(false); };
  const install = async () => {
    if (!ev) return;
    await ev.prompt();
    const r = await ev.userChoice.catch(() => ({ outcome: 'dismissed' }));
    if (r.outcome !== 'accepted') localStorage.setItem(KEY, String(Date.now()));
    setEv(null); setOpen(false);
  };
  if (!open || (!ev && !ios)) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-[420px] md:bottom-6 md:left-auto md:right-6 md:mx-0">
      <div className="rise rounded-[32px] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)] ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="h-14 w-14 shrink-0 rounded-[16px] ring-1 ring-black/5" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Metti Agente Immo sul telefono</p>
            <p className="mt-1 text-sm leading-snug text-muted">Si apre come un&apos;app, a tutto schermo, con la sua icona. Niente App Store.</p>
          </div>
          <button type="button" onClick={close} aria-label="Chiudi" className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={16} /></button>
        </div>
        {ios ? (
          <ol className="mt-4 space-y-2 rounded-[24px] bg-canvas p-4 text-sm text-ink">
            <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold">1</span>Tocca <Share size={16} className="text-brand" /> <b>Condividi</b> in basso</li>
            <li className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold">2</span>Scegli <SquarePlus size={16} className="text-brand" /> <b>Aggiungi alla schermata Home</b></li>
          </ol>
        ) : (
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={close} className="h-11 rounded-full px-5 text-sm font-medium text-muted hover:bg-canvas hover:text-ink">Più tardi</button>
            <button type="button" onClick={() => void install()} className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand">Installa</button>
          </div>
        )}
      </div>
    </div>
  );
}
