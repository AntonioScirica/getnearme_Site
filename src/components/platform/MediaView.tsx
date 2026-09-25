'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Wand2 } from 'lucide-react';
import PhotoViewer from '@/components/ui/PhotoViewer';
import { downloadImage } from '@/lib/staging';
import { authFetch, CARD_SHADOW } from './api';

export type MediaItem = { dopo: string; prima: string | null; at: number };

export async function fetchMedia(): Promise<MediaItem[]> {
  const r = await authFetch('/api/platform/media').catch(() => null);
  const d = r?.ok ? await r.json() : null;
  return d?.items ?? [];
}

const DAY = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// Galleria: tutte le foto create in chat, con il prima. Passando sopra si vede il prima, clic = a tutto schermo.
export default function MediaView() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [viewer, setViewer] = useState<MediaItem | null>(null);
  useEffect(() => { fetchMedia().then(setItems); }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Galleria</h1>
          <p className="pt-1 text-sm text-muted">Tutte le foto create con l&apos;AI, con il prima e il dopo. Passa sopra una foto per vedere com&apos;era.</p>
        </div>
        <a href="#/staging" className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90"><Wand2 size={15} /> Nuova foto</a>
      </div>

      {items === null ? (
        <div className="flex h-64 items-center justify-center text-muted"><Loader2 size={20} className="animate-spin" /></div>
      ) : !items.length ? (
        <p className="flex h-64 items-center justify-center text-sm text-muted">Qui finiranno le foto che crei nella chat di home staging.</p>
      ) : (
        <div className="blur-in grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(m => (
            <div key={m.dopo} className={`group rounded-3xl bg-white p-2 ${CARD_SHADOW}`}>
              <button type="button" onClick={() => setViewer(m)} className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-canvas">
                <img src={m.dopo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                {m.prima && <img src={m.prima} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 ease-smooth transition-opacity group-hover:opacity-100" />}
                {m.prima && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    <span className="group-hover:hidden">Dopo</span><span className="hidden group-hover:inline">Prima</span>
                  </span>
                )}
              </button>
              <div className="flex min-h-12 items-center gap-3 px-2 pt-2 text-xs text-muted">
                <span className="min-w-0 flex-1 truncate">{DAY.format(m.at)}</span>
                <button type="button" onClick={() => downloadImage(m.dopo, 'agenteimmo.jpg')} className="flex h-8 items-center gap-1.5 rounded-full px-3 font-medium leading-none text-ink hover:bg-canvas"><Download size={14} className="translate-y-px" /> Scarica</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {viewer && <PhotoViewer src={viewer.dopo} before={viewer.prima ?? undefined} onClose={() => setViewer(null)} />}
    </div>
  );
}
