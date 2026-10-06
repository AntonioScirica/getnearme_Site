'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, X } from 'lucide-react';
import { viewerUrl } from './Casa3DFlow';
import { authFetch } from './api';
import { tr } from './i18n';
import { isStyle, type Casa3d } from '@/lib/casa3d/types';

// Casa 3D aperta sopra la pagina (non in una scheda nuova): si chiude con la X, con Esc, cliccando fuori
// o col tasto indietro del browser/telefono (stato aggiunto alla cronologia all'apertura).
// save: casa dell'immobile dell'agente, lo stile d'arredo scelto nel visore si salva (manifest nuovo, il visore aperto resta)
export default function Casa3DViewer({ manifest, title, onClose, save }: { manifest: string; title?: string; onClose: () => void; save?: { key: string; projectId: string; onSaved?: (c: Casa3d) => void } }) {
  const box = useRef<HTMLDivElement>(null);
  const [src] = useState(() => viewerUrl(manifest));
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const on = async (e: MessageEvent) => {
      const sv = saveRef.current
      if (!sv || e.origin !== location.origin || !isStyle(e.data?.casa3dStyle)) return
      const r = await authFetch('/api/platform/casa3d', { method: 'POST', body: JSON.stringify({ action: 'style', key: sv.key, projectId: sv.projectId, style: e.data.casa3dStyle }) }).catch(() => null)
      const d = await r?.json().catch(() => null) as { casa3d?: Casa3d } | null
      if (d?.casa3d) sv.onSaved?.(d.casa3d)
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, []);
  const closed = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const close = () => { if (!closed.current) { closed.current = true; onCloseRef.current(); } };
    // un solo stato in cronologia anche se l'effetto gira due volte (sviluppo) o la pagina si ridisegna
    if (!(history.state as { casa3d?: boolean } | null)?.casa3d) history.pushState({ ...(history.state ?? {}), casa3d: true }, '');
    const pop = () => close();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') history.back(); };
    window.addEventListener('popstate', pop);
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('popstate', pop); window.removeEventListener('keydown', key); document.body.style.overflow = overflow; };
  }, []);
  const back = () => history.back(); // toglie lo stato aggiunto e chiude (popstate)
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6" onClick={back}>
      <div className="rise flex h-[88vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3">
          <p className="min-w-0 flex-1 truncate font-semibold">{title || tr('Casa 3D', '3D home')}</p>
          <button type="button" onClick={() => void box.current?.requestFullscreen?.().catch(() => {})} className="hidden h-10 items-center gap-2 rounded-full bg-canvas px-4 text-sm font-medium hover:bg-black/[0.06] sm:flex"><Expand size={15} /> {tr('Schermo intero', 'Full screen')}</button>
          <button type="button" onClick={back} aria-label={tr('Chiudi', 'Close')} className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={18} /></button>
        </div>
        <div ref={box} className="min-h-0 flex-1 bg-canvas">
          <iframe title={title || tr('Casa 3D', '3D home')} src={src} allow="fullscreen" allowFullScreen className="block h-full w-full border-0" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
