'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { s, Box, Icon } from './ui';
import { fetchRecentPhotos, deleteBatchPhoto, BatchInfo, BatchPhoto } from '@/lib/stagingBatches';
import type { Project } from './types';
import WatermarkDownloadModal from './WatermarkDownloadModal';
import Image from 'next/image';


const DEMO_NEW_ITEM = { src: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=600&fit=crop', type: 'photo' as const };

function DemoMediaContent({ demoJobsDone, showSkeleton }: { demoJobsDone?: boolean; showSkeleton?: boolean }) {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showNewItem, setShowNewItem] = useState(false);

  useEffect(() => {
    const total = DEMO_DAYS.reduce((a, d) => a + d.items.length, 0);
    let i = 0;
    const id = setInterval(() => { i++; setVisibleItems(i); if (i >= total) clearInterval(id); }, 120);
    return () => clearInterval(id);
  }, []);

  const [newItemRevealed, setNewItemRevealed] = useState(false);
  useEffect(() => {
    if (showSkeleton) {
      setShowNewItem(true);
      setNewItemRevealed(false);
    }
  }, [showSkeleton]);

  useEffect(() => {
    if (demoJobsDone) {
      const t = setTimeout(() => setNewItemRevealed(true), 800);
      return () => clearTimeout(t);
    }
  }, [demoJobsDone]);

  let globalIdx = 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {DEMO_DAYS.map((day, di) => {
        const extraItem = di === 0 && showNewItem;
        const allItems = extraItem ? [DEMO_NEW_ITEM, ...day.items] : day.items;
        const nPhotos = allItems.filter(i => i.type === 'photo').length;
        const nVideos = allItems.filter(i => i.type === 'video').length;
        const countLabel = [nPhotos > 0 ? `${nPhotos} foto` : '', nVideos > 0 ? `${nVideos} video` : ''].filter(Boolean).join(' · ');
        return (
          <div key={di}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid #f0ede7', paddingBottom: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>{day.label}</span>
                <span style={{ fontSize: 11.5, color: '#b3aca1' }}>{countLabel}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(162px, 1fr))', gap: 9 }}>
              {allItems.map((item, i) => {
                const isNew = di === 0 && extraItem && i === 0;
                const idx = isNew ? -1 : globalIdx++;
                const show = isNew ? true : visibleItems > idx;
                return (
                  <div key={isNew ? 'new-ai' : i} style={{
                    position: 'relative', aspectRatio: '4/3', borderRadius: 11, overflow: 'hidden',
                    opacity: show ? 1 : 0, transform: show ? 'scale(1)' : 'scale(0.85)',
                    transition: 'opacity .45s cubic-bezier(.22,1,.36,1), transform .45s cubic-bezier(.22,1,.36,1)',
                    ...(isNew ? { boxShadow: '0 0 0 2px #3B83F6, 0 4px 16px rgba(59,131,246,0.25)' } : {}),
                  }}>
                    {isNew && !newItemRevealed ? (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(110deg, #f0ede7 30%, #e8e4dc 38%, #f0ede7 46%)', backgroundSize: '200% 100%', animation: 'demo-ai-shimmer 1.5s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'rgba(59,131,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B83F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M18 14l.7 2.1L21 17l-2.3.9L18 20l-.7-2.1L15 17l2.3-.9L18 14z"/></svg>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#3B83F6', letterSpacing: '.03em' }}>Generazione AI...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', ...(isNew ? { animation: 'demo-ai-reveal .6s ease-out both' } : {}) }} />
                      </>
                    )}
                    {isNew && (
                      <div style={{
                        position: 'absolute', top: 7, left: 7, background: '#3B83F6', color: '#fff',
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                      }}>AI</div>
                    )}
                    {item.type === 'video' && !isNew && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a1a1a"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DEMO_DAYS = [
  {
    label: 'Oggi',
    items: [
      { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=600&fit=crop', type: 'video' },
    ],
  },
  {
    label: 'Ieri',
    items: [
      { src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=600&h=600&fit=crop', type: 'video' },
      { src: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=600&fit=crop', type: 'photo' },
    ],
  },
  {
    label: '2 giorni fa',
    items: [
      { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&h=600&fit=crop', type: 'photo' },
      { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=600&fit=crop', type: 'photo' },
    ],
  },
];

export default function MediaScreen({
  toast,
  routeKey,
  project,
  batches,
  loadingBatches,
  activeVideoJobs = [],
  demoMode = false,
  demoJobsDone = false,
  demoShowSkeleton = false,
  go,
  lockBrand = false,
}: {
  toast: (msg: string, icon?: string) => void;
  routeKey: number;
  project?: Project;
  batches: BatchInfo[];
  loadingBatches: boolean;
  lockBrand?: boolean;
  activeVideoJobs?: { id: string; title?: string; createdAt: number; projectId?: string | null }[];
  demoMode?: boolean;
  demoJobsDone?: boolean;
  demoShowSkeleton?: boolean;
  go?: (r: string, params?: { photoUrl?: string }) => void;
}) {
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [photosByBatch, setPhotosByBatch] = useState<Record<string, BatchPhoto[]>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [vidLoaded, setVidLoaded] = useState<Record<string, boolean>>({}); // skeleton finche' il poster video non e' pronto
  const [filter, setFilter] = useState<'all' | 'staging' | 'video'>('all');
  const [lightbox, setLightbox] = useState<{ resultUrl: string; sourceUrl: string | null; isVideo?: boolean } | null>(null);
  const [localSourceUrls, setLocalSourceUrls] = useState<Record<string, string>>({});

  // Mostra TUTTI i batch (cross-progetto): la galleria è globale.
  const projectBatches = batches;

  // Fetch photos per i batch non ancora caricati in UNA sola richiesta bulk
  // (invece di 1 fetch per batch: con decine/centinaia di batch la galleria
  // impiegava un botto a caricare per via degli N round-trip separati).
  // Il gate "già in corso" vive in un ref (non in state) apposta: se fosse in
  // `loadingPhotos` e anche nelle dep dell'effect, il setLoadingPhotos qui sotto
  // farebbe ripartire l'effect all'infinito (loop "Maximum update depth exceeded").
  const fetchingIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const idsToFetch = projectBatches
      .filter(b => b.status !== 'failed' && b.completedItems > 0 && !photosByBatch[b.id] && !fetchingIdsRef.current.has(b.id))
      .map(b => b.id);
    if (!idsToFetch.length) return;
    idsToFetch.forEach(id => fetchingIdsRef.current.add(id));
    const idSet = new Set(idsToFetch);
    setLoadingPhotos(prev => { const next = { ...prev }; idsToFetch.forEach(id => { next[id] = true; }); return next; });
    fetchRecentPhotos(500).then(photos => {
      const grouped: Record<string, BatchPhoto[]> = {};
      idsToFetch.forEach(id => { grouped[id] = []; }); // ogni batch richiesto ottiene una entry anche se senza foto
      for (const p of photos) {
        if (idSet.has(p.batchId)) grouped[p.batchId].push(p);
      }
      setPhotosByBatch(prev => ({ ...prev, ...grouped }));
    }).finally(() => {
      idsToFetch.forEach(id => fetchingIdsRef.current.delete(id));
      setLoadingPhotos(prev => { const next = { ...prev }; idsToFetch.forEach(id => { delete next[id]; }); return next; });
    });
  }, [projectBatches, photosByBatch]);

  useEffect(() => {
    import('@/lib/localMediaCache').then(({ getOriginalMedia }) => {
      Object.entries(photosByBatch).forEach(([batchId, photos]) => {
        photos.forEach(photo => {
          if (!photo.sourceUrl && photo.index !== undefined) {
            const key = `${batchId}_${photo.index}`;
            if (!localSourceUrls[key]) {
              getOriginalMedia(batchId, photo.index).then(url => {
                if (url) {
                  setLocalSourceUrls(prev => ({ ...prev, [key]: url }));
                }
              });
            }
          }
        });
      });
    });
  }, [photosByBatch]); // Only depend on photosByBatch since localSourceUrls is updated functionally

  const handleDownloadSingle = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWmUrl(url); // apre il dialog "scarica con logo"
  };

  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [wmUrl, setWmUrl] = useState<string | null>(null); // download singolo con logo
  const [wmBatch, setWmBatch] = useState<{ images: string[]; zipName: string } | null>(null); // download tutte con logo
  const [confirmDlg, setConfirmDlg] = useState<{ title: string; sub: string; onYes: () => void } | null>(null);

  // Conferma a fine download batch: il modal salva lo zip cliccando un anchor
  // con download "*.zip", intercettiamo quel click (solo a modal aperto) per
  // il toast, così non scatta se l'utente annulla.
  useEffect(() => {
    if (!wmBatch) return;
    const onDocClick = (e: MouseEvent) => {
      if (e.target instanceof HTMLAnchorElement && e.target.download.endsWith('.zip')) toast('Download completato', 'check');
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [wmBatch, toast]);
  const [selectDay, setSelectDay] = useState<string | null>(null);       // giorno in modalità selezione
  const [selected, setSelected] = useState<Set<string>>(new Set());      // chiavi `${batchId}_${index}`

  const toggleSelect = (key: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const exitSelect = () => { setSelectDay(null); setSelected(new Set()); };

  // Elimina una lista di elementi (foto + video) in bulk, poi aggiorna lo stato.
  const handleDeletePhotos = async (list: (BatchPhoto & { batchId: string })[]) => {
    if (!list.length) return;
    const vids = list.filter(p => (p as MediaItem).isVideo);
    const pics = list.filter(p => !(p as MediaItem).isVideo);
    const n = list.length;
    const doDelete = async () => {
      const { deleteServerVideoJob } = await import('@/lib/videoJobs');
      await Promise.all([
        ...pics.map(p => deleteBatchPhoto(p.batchId, p.index)),
        ...vids.map(p => deleteServerVideoJob((p as MediaItem).videoId!)),
      ]);
      if (pics.length) setPhotosByBatch(prev => {
        const next = { ...prev };
        for (const p of pics) next[p.batchId] = (next[p.batchId] || []).filter(x => x.index !== p.index);
        return next;
      });
      if (vids.length) setVideos(prev => prev.filter(v => !vids.some(x => (x as MediaItem).videoId === v.id)));
      exitSelect();
      toast(n === 1 ? 'Elemento eliminato' : 'Elementi eliminati', 'trash');
    };
    setConfirmDlg({
      title: `Eliminare ${n} ${n === 1 ? 'elemento' : 'elementi'}?`,
      sub: "L'azione è irreversibile.",
      onYes: doDelete,
    });
  };

  // "Scarica tutte" → apre il dialog logo/posizione in modalità batch (compone
  // ogni foto col logo scelto e le zippa). Solo foto valide, no video.
  const handleDownloadPhotos = (list: (BatchPhoto & { batchId: string })[], zipName: string) => {
    const images = list
      .filter(p => p.resultUrl && p.status !== 'failed' && !(p as MediaItem).isVideo)
      .map(p => p.resultUrl);
    if (!images.length) { toast('Nessuna foto scaricabile', 'x'); return; }
    setWmBatch({ images, zipName });
  };

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const validBatches = projectBatches.filter(b => b.completedItems > 0 && b.status !== 'failed');

  // Video finiti (R2, scaricabili entro 30gg). Source of truth = tabella
  // ai_video_jobs (cross-device, sopravvive a browser chiuso); localStorage
  // fonde la sessione corrente. Ricaricati al mount + a ogni routeKey.
  const [videos, setVideos] = useState<{ id: string; url: string; title: string; template: string; ts: number }[]>([]);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const refreshVideos = useCallback(async () => {
    const { finishedVideos, fetchServerVideoJobs, mergeServerJobs } = await import('@/lib/videoJobs');
    const apply = () => {
      const seen = new Set<string>();
      const out = finishedVideos(undefined)
        .filter(v => v.outputUrl && !seen.has(v.outputUrl) && seen.add(v.outputUrl))
        .map(v => ({ id: v.id, url: v.outputUrl!, title: v.title, template: v.template, ts: v.createdAt }));
      setVideos(out);
    };
    apply(); // istantaneo da localStorage
    const server = await fetchServerVideoJobs();
    if (server.length) { mergeServerJobs(server); apply(); }
    setVideosLoaded(true);
  }, []);
  useEffect(() => { void refreshVideos(); }, [refreshVideos, routeKey]);

  type MediaItem = (BatchPhoto & { batchId: string }) & { isVideo?: boolean; title?: string; template?: string; videoId?: string; pending?: boolean; createdTs?: number };

  // Raggruppa foto + video per giorno (una sezione al giorno).
  const days = useMemo(() => {
    const map = new Map<string, { key: string; label: string; ts: number; photos: MediaItem[] }>();
    const ensure = (ts: number) => {
      const d = new Date(ts);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { key, label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }), ts, photos: [] });
      return map.get(key)!;
    };
    if (filter !== 'video') {
      for (const batch of validBatches) {
        // Tutti i batch_staging sono Foto AI; i video stanno in ai_video_jobs.
        const photos = photosByBatch[batch.id];
        if (!photos || photos.length === 0) continue;
        const batchTs = new Date(batch.createdAt).getTime();
        const day = ensure(batchTs);
        for (const p of photos) day.photos.push({ ...p, batchId: batch.id, createdTs: batchTs });
      }
    }
    if (filter !== 'staging') {
      videos.forEach((v, i) => {
        ensure(v.ts).photos.push({ index: -1 - i, resultUrl: v.url, sourceUrl: null, status: 'completed', batchId: 'video', isVideo: true, title: v.title, template: v.template, videoId: v.id, createdTs: v.ts } as MediaItem);
      });
    }
    // Skeleton dei processi FOTO in corso: una tile per ogni foto ancora da generare.
    if (filter !== 'video') {
      for (const batch of projectBatches) {
        if (batch.status !== 'processing' && batch.status !== 'pending') continue;
        const pendingN = Math.max(0, batch.totalItems - batch.completedItems);
        if (pendingN === 0) continue;
        const day = ensure(new Date(batch.createdAt).getTime());
        for (let k = 0; k < pendingN; k++) {
          day.photos.push({ index: -100000 - k, resultUrl: '', sourceUrl: null, status: 'processing', batchId: `pending_${batch.id}`, pending: true } as MediaItem);
        }
      }
    }
    // Skeleton dei VIDEO in corso (render): una tile per job attivo.
    if (filter !== 'staging') {
      activeVideoJobs
        .filter(() => true)
        .forEach((j, i) => {
          ensure(j.createdAt).photos.push({ index: -200000 - i, resultUrl: '', sourceUrl: null, status: 'processing', batchId: 'video-pending', pending: true, isVideo: true, title: j.title } as MediaItem);
        });
    }
    // Ordine cronologico (recenti prima), processi in corso in cima.
    map.forEach(d => d.photos.sort((a, b) => {
      const ap = a.pending ? 1 : 0, bp = b.pending ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return (b.createdTs || 0) - (a.createdTs || 0);
    }));
    return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
  }, [validBatches, projectBatches, photosByBatch, filter, videos, activeVideoJobs, project]);

  const anyPhotosLoading = validBatches.some(b => loadingPhotos[b.id] || (!photosByBatch[b.id] && b.completedItems > 0));

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:1160px;margin:0 auto;padding:29px 29px 58px')}>
      <div className="max-md:!flex-col max-md:!items-start max-md:!gap-4" style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:36px')}>
        <div>
          <h1 style={s('margin:0 0 4px;font-size:22.5px;font-weight:800;letter-spacing:-.5px')}>Libreria Media</h1>
          <div style={s('color:#8c867d;font-size:12.5px')}>Le foto e i video generati per questo immobile. Le foto restano sempre, i video sono disponibili per 30 giorni.</div>
        </div>

        <div style={s('display:flex;background:#f6f4f0;border-radius:9px;padding:4px')}>
          {(['all', 'staging', 'video'] as const).map(f => (
            <div
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 13px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                background: filter === f ? '#fff' : 'transparent',
                color: filter === f ? '#211f1c' : '#8c867d',
                boxShadow: filter === f ? '0 2px 8px rgba(33,31,28,.06)' : 'none',
              }}
            >
              {f === 'all' ? 'Tutti' : f === 'staging' ? 'Foto AI' : 'Video'}
            </div>
          ))}
        </div>
      </div>

      {demoMode ? (
        <DemoMediaContent demoJobsDone={demoJobsDone} showSkeleton={demoShowSkeleton} />
      ) : (loadingBatches || anyPhotosLoading || !videosLoaded) ? (
        <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14.5 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', borderRadius: 11, background: '#f4f2ee', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 14.5, padding: '72px 36px', textAlign: 'center', marginTop: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 14.5, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14.5px' }}>
            <Icon name="image" size={25} color="#b3aca1" />
          </div>
          <h3 style={{ margin: '0 0 7px', fontSize: 16, fontWeight: 800 }}>Nessun media disponibile</h3>
          <p style={{ margin: 0, color: '#8c867d', fontSize: 12.5, maxWidth: 324, marginInline: 'auto' }}>
            Le foto generate in Foto AI e i video creati appariranno qui automaticamente.
          </p>
          <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
            {filter !== 'staging' && (
              <Box as="button" onClick={() => go?.('video')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 11, cursor: 'pointer', transition: 'transform .2s',
                ...(filter === 'video'
                  ? { border: 'none', background: 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }
                  : { border: '1.5px solid #d8d4cb', background: '#fff', color: '#211f1c' }),
              } as React.CSSProperties} hover={{ transform: 'translateY(-1px)' }}>
                <Icon name="film" size={15} color={filter === 'video' ? '#fff' : '#3B83F6'} />Crea Video AI
              </Box>
            )}
            {filter !== 'video' && (
              <Box as="button" onClick={() => go?.('staging')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none',
                background: 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)', color: '#fff',
                fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 11, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99,102,241,0.25)', transition: 'transform .2s',
              } as React.CSSProperties} hover={{ transform: 'translateY(-1px)' }}>
                <Icon name="sparkles" size={15} color="#fff" />Crea Home Staging
              </Box>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {days.map(day => {
            const downloadable = day.photos.filter(p => p.resultUrl && p.status !== 'failed');
            const inSelect = selectDay === day.key;
            const selectedPhotos = day.photos.filter(p => selected.has(`${p.batchId}_${p.index}`));
            // Conteggio separato foto/video per l'etichetta (foto e video sono
            // invarianti al plurale in italiano: "1 foto", "2 video").
            const nVideos = downloadable.filter(p => (p as MediaItem).isVideo).length;
            const nPhotos = downloadable.length - nVideos;
            const nPending = day.photos.filter(p => (p as MediaItem).pending).length;
            const countLabel = [
              nPhotos > 0 ? `${nPhotos} foto` : '',
              nVideos > 0 ? `${nVideos} video` : '',
              nPending > 0 ? `${nPending} in elaborazione` : '',
            ].filter(Boolean).join(' · ') || '0 foto';
            return (
              <div key={day.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14.5, borderBottom: '1px solid #f0ede7', paddingBottom: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 29, height: 29, borderRadius: 7, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="calendar" size={14.5} color="#3B83F6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#211f1c', textTransform: 'capitalize' }}>{day.label}</div>
                      <div style={{ fontSize: 11.5, color: '#8c867d' }}>{inSelect ? `${selectedPhotos.length} selezionate` : countLabel}</div>
                    </div>
                  </div>
                  {inSelect ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Box as="button" onClick={() => handleDeletePhotos(selectedPhotos)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: selectedPhotos.length ? '#dc2626' : '#f3d4d4', color: '#fff', border: 'none', cursor: selectedPhotos.length ? 'pointer' : 'default' } as React.CSSProperties} hover={selectedPhotos.length ? { background: '#b91c1c' } : undefined}>
                        <Icon name="trash" size={12.5} color="#fff" />
                        Elimina{selectedPhotos.length ? ` (${selectedPhotos.length})` : ''}
                      </Box>
                      <Box as="button" onClick={exitSelect} style={{ padding: '7px 13px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' } as React.CSSProperties} hover={{ background: '#f6f4f0' }}>
                        Annulla
                      </Box>
                    </div>
                  ) : downloadable.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <Box as="button" onClick={() => setActionsOpen(actionsOpen === day.key ? null : day.key)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' }} hover={{ background: '#f6f4f0' }}>
                        Azioni
                        <Icon name="chevron-down" size={12.5} />
                      </Box>
                      {actionsOpen === day.key && (
                        <>
                          <div onClick={() => setActionsOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 41, background: '#fff', border: '1px solid #f0ede7', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4, minWidth: 180 }}>
                            <Box as="button" onClick={() => { setActionsOpen(null); handleDownloadPhotos(day.photos, `getnearme_foto_${day.key}`); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#211f1c', textAlign: 'left' }} hover={{ background: '#f6f4f0' }}>
                              <Icon name="download" size={13.5} color="#57534c" />
                              Scarica tutte
                            </Box>
                            <Box as="button" onClick={() => { setActionsOpen(null); setSelected(new Set()); setSelectDay(day.key); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#211f1c', textAlign: 'left' }} hover={{ background: '#f6f4f0' }}>
                              <Icon name="check" size={13.5} color="#57534c" />
                              Seleziona
                            </Box>
                            <Box as="button" onClick={() => { setActionsOpen(null); handleDeletePhotos(day.photos); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', textAlign: 'left' }} hover={{ background: '#fef2f2' }}>
                              <Icon name="trash" size={13.5} color="#dc2626" />
                              Elimina tutte
                            </Box>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14.5 }}>
                  {day.photos.slice(0, visibleCounts[day.key] || 20).map((photo, pi) => {
                    if ((photo as MediaItem).pending) {
                      const isVid = (photo as MediaItem).isVideo;
                      return (
                        <div key={`pending_${photo.batchId}_${photo.index}`} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 11, overflow: 'hidden', border: '1px solid #f0ede7', background: '#f4f2ee' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #efece7 0%, #f7f5f1 50%, #efece7 100%)', backgroundSize: '200% 100%', animation: 'demo-ai-shimmer 1.4s linear infinite' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid #d8d4cb', borderTopColor: '#3B83F6', animation: 'export-spin .8s linear infinite' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#57534c' }}>
                              <Icon name={isVid ? 'film' : 'sparkles'} size={11.5} color="#3B83F6" />
                              {isVid ? 'Video in elaborazione' : 'Generazione AI…'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (photo.status === 'failed') {
                      return (
                        <div key={`${photo.batchId}_${photo.index}`} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 11, border: '1px solid #fca5a5', background: '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 18, textAlign: 'center', animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${pi * 60}ms` }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}>
                            <Icon name="alert-triangle" size={18} color="#dc2626" />
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Generazione fallita</div>
                          <div style={{ fontSize: 11, color: '#b91c1c', marginBottom: 13 }}>
                            {photo.error === 'generation_failed' ? "L'AI non è riuscita a processare questa foto. Riprova con un'angolazione diversa." : photo.error || "Errore sconosciuto."}
                          </div>
                          <Box as="button" onClick={async () => {
                            await deleteBatchPhoto(photo.batchId, photo.index);
                            setPhotosByBatch(prev => ({ ...prev, [photo.batchId]: (prev[photo.batchId] || []).filter(x => x.index !== photo.index) }));
                          }} style={{ border: 'none', background: '#dc2626', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '7px 18px', borderRadius: 7, cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#b91c1c' }}>
                            Capito
                          </Box>
                        </div>
                      );
                    }
                    if ((photo as MediaItem).isVideo) {
                      const vSelKey = `${photo.batchId}_${photo.index}`;
                      const vSel = selected.has(vSelKey);
                      return (
                        <div key={`video_${photo.index}`} onClick={() => { if (menuKey === vSelKey) { setMenuKey(null); return; } inSelect ? toggleSelect(vSelKey) : setLightbox({ resultUrl: photo.resultUrl, sourceUrl: null, isVideo: true }); }} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 11, overflow: menuKey === vSelKey ? 'visible' : 'hidden', border: vSel ? '2px solid #3B83F6' : '1px solid #f0ede7', background: '#000', cursor: 'pointer', zIndex: menuKey === vSelKey ? 30 : undefined, animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${pi * 60}ms` }}>
                          {/* Cover: video blurrato dietro (riempie) + video contenuto davanti, come le foto verticali. */}
                          <video src={`${photo.resultUrl}#t=0.5`} playsInline preload="metadata" muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px) brightness(.85)', transform: 'scale(1.15)', pointerEvents: 'none' }} />
                          <video src={`${photo.resultUrl}#t=0.5`} playsInline preload="metadata" muted onLoadedData={() => setVidLoaded(m => m[photo.videoId!] ? m : { ...m, [photo.videoId!]: true })} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', ...(vSel ? { opacity: .85 } : {}) }} />
                          {!inSelect && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                              <div style={{ width: 49, height: 49, borderRadius: '50%', background: 'rgba(20,30,55,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="play-circle" size={23.5} color="#fff" />
                              </div>
                            </div>
                          )}
                          {inSelect && (
                            <div style={{ position: 'absolute', top: 9, left: 9, width: 22, height: 22, borderRadius: '50%', background: vSel ? '#3B83F6' : 'rgba(255,255,255,0.85)', border: vSel ? 'none' : '1px solid #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {vSel && <Icon name="check" size={12.5} color="#fff" />}
                            </div>
                          )}
                          {!inSelect && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuKey(k => k === vSelKey ? null : vSelKey); }}
                                title="Opzioni"
                                style={{ position: 'absolute', bottom: 11, right: 11, width: 31, height: 31, borderRadius: '50%', background: 'rgba(20,30,55,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}
                              >
                                <Icon name="more-vertical" size={14.5} color="#fff" />
                              </button>
                              {menuKey === vSelKey && (
                                <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 50, background: '#fff', border: '1px solid #f0ede7', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 4, minWidth: 153 }}>
                                  <Box as="button" aria-label="Scarica" onClick={() => { setMenuKey(null); const a = document.createElement('a'); a.href = photo.resultUrl; a.download = `video-ai.mp4`; a.click(); toast('Download avviato...', 'download'); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                    <Icon name="download" size={14.5} color="#57534c" />Scarica
                                  </Box>
                                  <Box as="button" aria-label="Elimina" onClick={async () => { setMenuKey(null); await handleDeletePhotos([photo]); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'left' } as React.CSSProperties} hover={{ background: '#fef2f2' }}>
                                    <Icon name="trash-2" size={14.5} color="#dc2626" />Elimina
                                  </Box>
                                </div>
                              )}
                            </>
                          )}
                          <span style={{ position: 'absolute', bottom: 7, left: 7, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '3px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, maxWidth: 'calc(100% - 54px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Icon name="film" size={10} color="#fff" style={{ flexShrink: 0 }} />Video{(photo as MediaItem).template ? ` · ${({ ai_staging: 'Da foto a video', walkthrough: 'Walkthrough', construction: 'Ristrutturazione', day_night: 'Giorno/Notte', classic: 'Classico', montaggio: 'Montaggio' } as Record<string,string>)[(photo as MediaItem).template!] || (photo as MediaItem).template}` : ''}</span>
                          {!vidLoaded[photo.videoId!] && (
                            <div style={{ position: 'absolute', inset: 0, background: '#f4f2ee', animation: 'pulse 1.5s infinite ease-in-out', zIndex: 5 }} />
                          )}
                          {/* Countdown scadenza: i video restano 30 giorni su R2. */}
                          {(() => {
                            const ts = (photo as MediaItem).createdTs || 0;
                            if (!ts) return null;
                            const left = Math.max(0, 30 - Math.floor((Date.now() - ts) / 86400000));
                            const urgent = left <= 3;
                            return (
                              <span title={left <= 0 ? 'Scade oggi: scaricalo per non perderlo' : `Disponibile ancora ${left} ${left === 1 ? 'giorno' : 'giorni'}, poi viene rimosso`} style={{ position: 'absolute', top: 7, right: 7, background: urgent ? 'rgba(220,38,38,.92)' : 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '3px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4, zIndex: 6, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
                                <Icon name="calendar" size={10} color="#fff" style={{ flexShrink: 0 }} />
                                {left <= 0 ? 'Scade oggi' : left === 1 ? 'Ultimo giorno' : `${left} giorni`}
                              </span>
                            );
                          })()}
                        </div>
                      );
                    }
                    const selKey = `${photo.batchId}_${photo.index}`;
                    const isSel = selected.has(selKey);
                    return (
                      <div
                        key={selKey}
                        onClick={() => { if (inSelect) { toggleSelect(selKey); return; } if (menuKey === selKey) { setMenuKey(null); return; } setLightbox({ ...photo, sourceUrl: photo.sourceUrl || localSourceUrls[selKey] || null }); }}
                        style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 11, cursor: 'pointer', border: isSel ? '2px solid #3B83F6' : '1px solid #f0ede7', background: '#f4f2ee', zIndex: menuKey === selKey ? 30 : undefined, animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${pi * 60}ms` }}
                      >
                        <Image src={photo.resultUrl} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" style={{ objectFit: 'cover', borderRadius: 11, ...(isSel ? { opacity: .85 } : {}) }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        {inSelect ? (
                          <div style={{ position: 'absolute', top: 9, left: 9, width: 22, height: 22, borderRadius: '50%', background: isSel ? '#3B83F6' : 'rgba(255,255,255,0.85)', border: isSel ? 'none' : '1px solid #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSel && <Icon name="check" size={12.5} color="#fff" />}
                          </div>
                        ) : (
                          <>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 11, background: 'rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                            >
                              <div style={{ background: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="maximize-2" size={18} color="#211f1c" />
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuKey(k => k === selKey ? null : selKey); }}
                              title="Opzioni"
                              style={{ position: 'absolute', bottom: 11, right: 11, width: 31, height: 31, borderRadius: '50%', background: 'rgba(20,30,55,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}
                            >
                              <Icon name="more-vertical" size={14.5} color="#fff" />
                            </button>
                            {menuKey === selKey && (
                              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 40, background: '#fff', border: '1px solid #f0ede7', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 4, minWidth: 153 }}>
                                {go && (
                                  <Box as="button" onClick={() => { setMenuKey(null); go('studio', { photoUrl: photo.resultUrl }); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                    <Icon name="megaphone" size={14.5} color="#3B83F6" />Crea post
                                  </Box>
                                )}
                                {go && (
                                  <Box as="button" onClick={() => { setMenuKey(null); go('video', { photoUrl: photo.resultUrl }); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                    <Icon name="film" size={14.5} color="#3B83F6" />Crea video
                                  </Box>
                                )}
                                <Box as="button" onClick={(e: React.MouseEvent) => { setMenuKey(null); handleDownloadSingle(photo.resultUrl, e); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                  <Icon name="download" size={14.5} color="#57534c" />Scarica
                                </Box>
                                <Box as="button" onClick={async () => { setMenuKey(null); await deleteBatchPhoto(photo.batchId, photo.index); setPhotosByBatch(prev => ({ ...prev, [photo.batchId]: (prev[photo.batchId] || []).filter(x => x.index !== photo.index) })); toast('Foto eliminata', 'check'); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'left' } as React.CSSProperties} hover={{ background: '#fef2f2' }}>
                                  <Icon name="trash-2" size={14.5} color="#dc2626" />Elimina
                                </Box>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {day.photos.length > (visibleCounts[day.key] || 20) && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
                    <Box as="button" onClick={() => setVisibleCounts(prev => ({ ...prev, [day.key]: (prev[day.key] || 20) + 20 }))} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' } as React.CSSProperties} hover={{ background: '#f6f4f0' }}>
                      Mostra altro ({day.photos.length - (visibleCounts[day.key] || 20)})
                      <Icon name="chevron-down" size={14.5} />
                    </Box>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDlg && (
        <div onClick={() => setConfirmDlg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,17,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 378, background: 'var(--bg-card, #fff)', borderRadius: 16, boxShadow: '0 32px 64px rgba(20,18,15,.2)', padding: 25, textAlign: 'center' }}>
            <div style={{ width: 47, height: 47, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14.5px' }}>
              <Icon name="alert-triangle" size={21.5} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 5px', fontSize: 15.5, fontWeight: 800 }}>{confirmDlg.title}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#8c867d', lineHeight: 1.5 }}>{confirmDlg.sub}</p>
            <div style={{ display: 'flex', gap: 9 }}>
              <Box as="button" onClick={() => setConfirmDlg(null)} style={{ flex: 1, border: '1px solid #d8d4cb', background: '#fff', color: '#8c867d', fontSize: 12.5, fontWeight: 700, padding: '10px 0', borderRadius: 9, cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#faf9f7' }}>Annulla</Box>
              <Box as="button" onClick={() => { const fn = confirmDlg.onYes; setConfirmDlg(null); fn(); }} style={{ flex: 1, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '10px 0', borderRadius: 9, cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#b91c1c' }}>Elimina</Box>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for viewing photo details */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 36 }}
        >
          <div onClick={e => e.stopPropagation()} className="max-md:!flex-col max-md:!gap-4" style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', gap: 18 }}>
            {lightbox.isVideo ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
                <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, background: '#3B83F6', padding: '4px 11px', borderRadius: 99 }}>Video AI</span>
                {/* controlsList nofullscreen: niente super-fullscreen nativo, resta contenuto nel modal */}
                <video src={lightbox.resultUrl} controls autoPlay playsInline controlsList="nofullscreen" disablePictureInPicture className="max-md:!max-w-[88vw] max-md:!max-h-[60vh]" style={{ maxHeight: '82vh', maxWidth: '46vw', objectFit: 'contain', borderRadius: 11, background: '#000' }} />
              </div>
            ) : (
              <>
                {lightbox.sourceUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
                    <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 11px', borderRadius: 99 }}>Originale</span>
                    <img src={lightbox.sourceUrl} alt="Source" className="max-md:!max-w-[80vw] max-md:!max-h-[35vh]" style={{ maxHeight: '80vh', maxWidth: '40vw', objectFit: 'contain', borderRadius: 11 }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
                  <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, background: '#3B83F6', padding: '4px 11px', borderRadius: 99 }}>Generata con AI</span>
                  <img src={lightbox.resultUrl} alt="Result" className="max-md:!max-w-[80vw] max-md:!max-h-[35vh]" style={{ maxHeight: '80vh', maxWidth: '40vw', objectFit: 'contain', borderRadius: 11 }} />
                </div>
              </>
            )}

            {/* Chiusura sempre dentro il viewport (fixed): su mobile il vecchio offset negativo finiva fuori schermo */}
            <button
              onClick={() => setLightbox(null)}
              aria-label="Chiudi"
              style={{ position: 'fixed', top: 11, right: 11, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <Icon name="x" size={20} color="#fff" />
            </button>
          </div>
        </div>
      )}
      {wmUrl && <WatermarkDownloadModal imageUrl={wmUrl} onClose={() => setWmUrl(null)} lockBrand={lockBrand} />}
      {wmBatch && <WatermarkDownloadModal images={wmBatch.images} zipName={wmBatch.zipName} onClose={() => setWmBatch(null)} lockBrand={lockBrand} />}
    </div>
  );
}
