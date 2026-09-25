'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Loader2, Monitor, X } from 'lucide-react';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';

// Scelta della foto per la chat: dalla vetrina (gli immobili dell'agente, poi le foto di quello scelto) o dal computer.
// Finestra ad altezza fissa: passando da immobili a foto non cambia misura.
// la prima foto dell'annuncio e' in taglia grande: la copertina salvata puo' essere una miniatura
const photosOf = (p: ProjectData) => {
  const d = (p.import_data ?? {}) as { photos?: unknown };
  const list = Array.isArray(d.photos) ? d.photos.filter((x): x is string => typeof x === 'string') : [];
  return list.length ? list : p.cover ? [p.cover] : [];
};
// le foto degli annunci stanno su altri siti: passano dal nostro proxy per poterle leggere
const toFile = async (url: string) => {
  const src = url.startsWith('data:') || url.startsWith('/') ? url : `/api/site/img?u=${encodeURIComponent(url)}`;
  const blob = await (await fetch(src)).blob();
  return new File([blob], 'foto.jpg', { type: blob.type || 'image/jpeg' });
};

export default function LibraryPicker({ onFiles, onClose }: { onFiles: (files: File[], projectId?: string | null) => void; onClose: () => void }) {
  const [projects, setProjects] = useState<ProjectData[] | null>(null);
  const [open, setOpen] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetchProjects().then(ps => setProjects(ps.length || process.env.NODE_ENV !== 'development' ? ps : FAKE_PROPERTIES));
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const pick = async (url: string, projectId?: string | null) => {
    setLoading(url); setErr(false);
    try { onFiles([await toFile(url)], projectId); onClose(); } catch { setErr(true); } finally { setLoading(null); }
  };
  const list = projects?.filter(p => photosOf(p).length) ?? [];

  return createPortal(
    <div className="blur-in fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex h-[min(640px,85vh)] w-full max-w-3xl flex-col rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2 pb-4">
          {open && <button onClick={() => setOpen(null)} aria-label="Indietro" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas"><ArrowLeft size={18} /></button>}
          {/* titolo e descrizione in un blocco: la descrizione sta subito sotto il titolo */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold leading-tight">{open ? open.titolo || open.nome : 'Scegli una foto'}</h2>
            {!open && <p className="pt-0.5 text-sm text-muted">Dalla tua vetrina: scegli l’immobile e poi la foto.</p>}
          </div>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full bg-canvas px-4 text-sm font-medium ease-smooth transition-colors hover:bg-line">
            <Monitor size={15} /> Dal computer
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) { onFiles(f); onClose(); } }} />
          </label>
          <button onClick={onClose} aria-label="Chiudi" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-canvas"><X size={18} /></button>
        </div>
        {err && <p className="pb-3 text-sm text-rose-600">Non riesco a scaricare questa foto, provane un&apos;altra.</p>}
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
          {projects === null ? (
            <div className="flex h-full items-center justify-center text-muted"><Loader2 size={20} className="animate-spin" /></div>
          ) : !open ? (
            list.length ? (
              <div key="case" className="blur-in grid grid-cols-2 gap-3 sm:grid-cols-3">
                {list.map(p => (
                  <button key={p.id} onClick={() => setOpen(p)} className="group rounded-2xl p-2 text-left ease-smooth transition-colors hover:bg-canvas">
                    <img src={photosOf(p)[0]} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                    <p className="truncate pt-2 text-sm font-medium">{p.titolo || p.nome}</p>
                    <p className="truncate text-xs text-muted">{p.addr} · {photosOf(p).length} foto</p>
                  </button>
                ))}
              </div>
            ) : <p className="flex h-full items-center justify-center text-sm text-muted">Nella vetrina non ci sono ancora immobili con foto.</p>
          ) : (
            <div key={open.id} className="blur-in grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photosOf(open).map(u => (
                <button key={u} onClick={() => pick(u, open.id)} disabled={!!loading} className="relative overflow-hidden rounded-2xl ease-smooth transition-opacity hover:opacity-90 disabled:opacity-60">
                  <img src={u} alt="" className="aspect-[4/3] w-full object-cover" />
                  {loading === u && <span className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 size={20} className="animate-spin" /></span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
