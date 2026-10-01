'use client';

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { tr } from './i18n';

// Condividi da telefono: il menu del telefono con il video gia' allegato (Facebook, Instagram, WhatsApp...).
// Solo dove il browser sa condividere file (telefoni); il video si scarica prima, cosi' il tocco apre subito il menu
// (dopo un'attesa il browser non lo aprirebbe piu').
export default function ShareVideo({ url, className = '', labelClass = '' }: { url?: string | null; className?: string; labelClass?: string }) {
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    if (!url || typeof navigator === 'undefined' || !navigator.canShare) return;
    let on = true;
    fetch(url).then(r => r.blob()).then(b => {
      const f = new File([b], 'video-agente-immo.mp4', { type: 'video/mp4' });
      if (on && navigator.canShare({ files: [f] })) setFile(f);
    }).catch(() => {});
    return () => { on = false; };
  }, [url]);
  if (!file) return null;
  return (
    <button type="button" aria-label={tr('Condividi', 'Share')} onClick={() => { void navigator.share({ files: [file] }).catch(() => {}); }} className={className}>
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20"><Share2 size={15} /></span><span className={labelClass}>{tr('Condividi', 'Share')}</span>
    </button>
  );
}
