'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { s, Box, Icon } from './ui';
import { fetchUserBatches, fetchBatchPhotos, deleteBatchPhoto, BatchInfo, BatchPhoto } from '@/lib/stagingBatches';
import { downloadImage } from '@/lib/staging';
import type { Project } from './types';
import Image from 'next/image';

// We import JSZip dynamically when needed for bulk export
const loadJSZip = () => import('jszip').then(m => m.default);

export default function MediaScreen({
  toast,
  routeKey,
  project,
  batches,
  loadingBatches
}: {
  toast: (msg: string, icon?: string) => void;
  routeKey: number;
  project?: Project;
  batches: BatchInfo[];
  loadingBatches: boolean;
}) {
  const [photosByBatch, setPhotosByBatch] = useState<Record<string, BatchPhoto[]>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'staging' | 'video'>('all');
  const [lightbox, setLightbox] = useState<{ resultUrl: string; sourceUrl: string | null } | null>(null);
  const [localSourceUrls, setLocalSourceUrls] = useState<Record<string, string>>({});

  // Filter batches by current project if project is passed
  // Currently project filtering is visual-only since backend is returning all user batches
  // until projects are fully wired.
  const projectBatches = useMemo(() => {
    if (!project) return batches;
    return batches.filter(b => !b.projectId || b.projectId === project.id);
  }, [batches, project]);

  // Fetch photos for completed/processing batches that we haven't fetched yet
  useEffect(() => {
    projectBatches.forEach(batch => {
      if (batch.status === 'failed') return;
      if (batch.completedItems === 0) return;
      if (photosByBatch[batch.id] || loadingPhotos[batch.id]) return;

      setLoadingPhotos(prev => ({ ...prev, [batch.id]: true }));
      fetchBatchPhotos(batch.id).then(photos => {
        console.log(`[Media] batch ${batch.id} photos:`, photos.map(p => ({ idx: p.index, url: p.resultUrl?.slice(0, 80), status: p.status })));
        setPhotosByBatch(prev => ({ ...prev, [batch.id]: photos }));
      }).finally(() => {
        setLoadingPhotos(prev => ({ ...prev, [batch.id]: false }));
      });
    });
  }, [projectBatches, photosByBatch, loadingPhotos]);

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
    toast('Download avviato...', 'download');
    downloadImage(url, 'foto-ai.png');
  };

  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [selectDay, setSelectDay] = useState<string | null>(null);       // giorno in modalità selezione
  const [selected, setSelected] = useState<Set<string>>(new Set());      // chiavi `${batchId}_${index}`

  const toggleSelect = (key: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const exitSelect = () => { setSelectDay(null); setSelected(new Set()); };

  // Elimina una lista di foto (bulk), poi aggiorna lo stato locale.
  const handleDeletePhotos = async (list: (BatchPhoto & { batchId: string })[]) => {
    if (!list.length) return;
    if (!window.confirm(`Eliminare ${list.length} ${list.length === 1 ? 'foto' : 'foto'}? L'azione è irreversibile.`)) return;
    await Promise.all(list.map(p => deleteBatchPhoto(p.batchId, p.index)));
    setPhotosByBatch(prev => {
      const next = { ...prev };
      for (const p of list) next[p.batchId] = (next[p.batchId] || []).filter(x => x.index !== p.index);
      return next;
    });
    exitSelect();
    toast('Foto eliminate', 'trash');
  };

  // Scarica come ZIP una lista di foto (solo riuscite con URL valido).
  const handleDownloadPhotos = async (list: (BatchPhoto & { batchId: string })[], zipName: string) => {
    const photos = list.filter(p => p.resultUrl && p.status !== 'failed');
    if (!photos.length) {
      toast('Nessuna foto scaricabile', 'x');
      return;
    }
    toast('Preparazione archivio in corso...', 'loader');
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      let downloadedCount = 0;
      await Promise.all(photos.map(async (p, idx) => {
        try {
          const res = await fetch(p.resultUrl);
          const blob = await res.blob();
          zip.file(`foto_${idx + 1}.png`, blob);
          downloadedCount++;
        } catch (e) {
          console.error('Failed to download photo for zip', e);
        }
      }));
      if (downloadedCount === 0) throw new Error('Nessuna foto scaricata');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Archivio ZIP scaricato', 'download');
    } catch (e) {
      toast('Errore durante la creazione dello ZIP', 'x');
    }
  };

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const validBatches = projectBatches.filter(b => b.completedItems > 0 && b.status !== 'failed');

  // Raggruppa TUTTE le foto per giorno (una sezione al giorno, non per batch).
  const days = useMemo(() => {
    const map = new Map<string, { key: string; label: string; ts: number; photos: (BatchPhoto & { batchId: string })[] }>();
    for (const batch of validBatches) {
      if (filter === 'staging' && batch.type !== 'staging') continue;
      if (filter === 'video' && batch.type !== 'video') continue;
      
      const photos = photosByBatch[batch.id];
      if (!photos || photos.length === 0) continue;
      const d = new Date(batch.createdAt);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
          ts: d.getTime(),
          photos: [],
        });
      }
      for (const p of photos) map.get(key)!.photos.push({ ...p, batchId: batch.id });
    }
    return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
  }, [validBatches, photosByBatch, filter]);

  const anyPhotosLoading = validBatches.some(b => loadingPhotos[b.id] || (!photosByBatch[b.id] && b.completedItems > 0));

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:1160px;margin:0 auto;padding:32px 32px 64px')}>
      <div className="max-md:!flex-col max-md:!items-start max-md:!gap-4" style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:24px')}>
        <div>
          <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Libreria Media</h1>
          <div style={s('color:#8c867d;font-size:14px')}>Le foto e i video generati per questo immobile. I file non scadono mai.</div>
        </div>
        
        <div style={s('display:flex;background:#f6f4f0;border-radius:10px;padding:4px')}>
          {(['all', 'staging', 'video'] as const).map(f => (
            <div
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
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

      {loadingBatches && projectBatches.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ animation: 'export-spin 1s linear infinite', width: 24, height: 24, border: '2px solid #e4e1da', borderTopColor: '#3B83F6', borderRadius: '50%', margin: '0 auto 16px' }} />
          <div style={{ color: '#8c867d', fontSize: 14 }}>Caricamento media...</div>
        </div>
      ) : days.length === 0 && anyPhotosLoading ? (
        <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', borderRadius: 12, background: '#f4f2ee', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: '80px 40px', textAlign: 'center', marginTop: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="image" size={28} color="#b3aca1" />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Nessun media disponibile</h3>
          <p style={{ margin: '0 0 24px', color: '#8c867d', fontSize: 14, maxWidth: 360, marginInline: 'auto' }}>
            Le foto generate in Foto AI e i video creati appariranno qui automaticamente.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {days.map(day => {
            const downloadable = day.photos.filter(p => p.resultUrl && p.status !== 'failed');
            const inSelect = selectDay === day.key;
            const selectedPhotos = day.photos.filter(p => selected.has(`${p.batchId}_${p.index}`));
            return (
              <div key={day.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f0ede7', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="sparkles" size={16} color="#3B83F6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#211f1c', textTransform: 'capitalize' }}>{day.label}</div>
                      <div style={{ fontSize: 12.5, color: '#8c867d' }}>{inSelect ? `${selectedPhotos.length} selezionate` : `${downloadable.length} foto`}</div>
                    </div>
                  </div>
                  {inSelect ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Box as="button" onClick={() => handleDeletePhotos(selectedPhotos)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: selectedPhotos.length ? '#dc2626' : '#f3d4d4', color: '#fff', border: 'none', cursor: selectedPhotos.length ? 'pointer' : 'default' } as React.CSSProperties} hover={selectedPhotos.length ? { background: '#b91c1c' } : undefined}>
                        <Icon name="trash" size={14} color="#fff" />
                        Elimina{selectedPhotos.length ? ` (${selectedPhotos.length})` : ''}
                      </Box>
                      <Box as="button" onClick={exitSelect} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' } as React.CSSProperties} hover={{ background: '#f6f4f0' }}>
                        Annulla
                      </Box>
                    </div>
                  ) : downloadable.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <Box as="button" onClick={() => setActionsOpen(actionsOpen === day.key ? null : day.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' }} hover={{ background: '#f6f4f0' }}>
                        Azioni
                        <Icon name="chevron-down" size={14} />
                      </Box>
                      {actionsOpen === day.key && (
                        <>
                          <div onClick={() => setActionsOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, background: '#fff', border: '1px solid #f0ede7', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4, minWidth: 200 }}>
                            <Box as="button" onClick={() => { setActionsOpen(null); handleDownloadPhotos(day.photos, `getnearme_foto_${day.key}`); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#211f1c', textAlign: 'left' }} hover={{ background: '#f6f4f0' }}>
                              <Icon name="download" size={15} color="#57534c" />
                              Scarica tutte
                            </Box>
                            <Box as="button" onClick={() => { setActionsOpen(null); setSelected(new Set()); setSelectDay(day.key); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#211f1c', textAlign: 'left' }} hover={{ background: '#f6f4f0' }}>
                              <Icon name="check" size={15} color="#57534c" />
                              Seleziona
                            </Box>
                            <Box as="button" onClick={() => { setActionsOpen(null); handleDeletePhotos(day.photos); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', textAlign: 'left' }} hover={{ background: '#fef2f2' }}>
                              <Icon name="trash" size={15} color="#dc2626" />
                              Elimina tutte
                            </Box>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {day.photos.slice(0, visibleCounts[day.key] || 20).map((photo, pi) => {
                    if (photo.status === 'failed') {
                      return (
                        <div key={`${photo.batchId}_${photo.index}`} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, border: '1px solid #fca5a5', background: '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${pi * 60}ms` }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <Icon name="alert-triangle" size={20} color="#dc2626" />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Generazione fallita</div>
                          <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 14 }}>
                            {photo.error === 'generation_failed' ? "L'AI non è riuscita a processare questa foto. Riprova con un'angolazione diversa." : photo.error || "Errore sconosciuto."}
                          </div>
                          <Box as="button" onClick={async () => {
                            await deleteBatchPhoto(photo.batchId, photo.index);
                            setPhotosByBatch(prev => ({ ...prev, [photo.batchId]: (prev[photo.batchId] || []).filter(x => x.index !== photo.index) }));
                          }} style={{ border: 'none', background: '#dc2626', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '8px 20px', borderRadius: 8, cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#b91c1c' }}>
                            Capito
                          </Box>
                        </div>
                      );
                    }
                    const selKey = `${photo.batchId}_${photo.index}`;
                    const isSel = selected.has(selKey);
                    return (
                      <div
                        key={selKey}
                        onClick={() => inSelect ? toggleSelect(selKey) : setLightbox({ ...photo, sourceUrl: photo.sourceUrl || localSourceUrls[selKey] || null })}
                        style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: isSel ? '2px solid #3B83F6' : '1px solid #f0ede7', background: '#f4f2ee', animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${pi * 60}ms` }}
                      >
                        <Image src={photo.resultUrl} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" style={{ objectFit: 'cover', ...(isSel ? { opacity: .85 } : {}) }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        {inSelect ? (
                          <div style={{ position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: '50%', background: isSel ? '#3B83F6' : 'rgba(255,255,255,0.85)', border: isSel ? 'none' : '1px solid #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSel && <Icon name="check" size={14} color="#fff" />}
                          </div>
                        ) : (
                          <>
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                            >
                              <div style={{ background: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="maximize-2" size={20} color="#211f1c" />
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDownloadSingle(photo.resultUrl, e)}
                              title="Scarica"
                              style={{ position: 'absolute', bottom: 12, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(20,30,55,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Icon name="download" size={16} color="#fff" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {day.photos.length > (visibleCounts[day.key] || 20) && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <Box as="button" onClick={() => setVisibleCounts(prev => ({ ...prev, [day.key]: (prev[day.key] || 20) + 20 }))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' } as React.CSSProperties} hover={{ background: '#f6f4f0' }}>
                      Mostra altro ({day.photos.length - (visibleCounts[day.key] || 20)})
                      <Icon name="chevron-down" size={16} />
                    </Box>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox for viewing photo details */}
      {lightbox && (
        <div 
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
        >
          <div onClick={e => e.stopPropagation()} className="max-md:!flex-col max-md:!gap-4" style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', gap: 20 }}>
            {lightbox.sourceUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 99 }}>Originale</span>
                <img src={lightbox.sourceUrl} alt="Source" className="max-md:!max-w-[80vw] max-md:!max-h-[35vh]" style={{ maxHeight: '80vh', maxWidth: '40vw', objectFit: 'contain', borderRadius: 12 }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, background: '#3B83F6', padding: '4px 12px', borderRadius: 99 }}>Generata con AI</span>
              <img src={lightbox.resultUrl} alt="Result" className="max-md:!max-w-[80vw] max-md:!max-h-[35vh]" style={{ maxHeight: '80vh', maxWidth: '40vw', objectFit: 'contain', borderRadius: 12 }} />
            </div>
            
            <button
              onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: -30, right: -30, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
            >
              <Icon name="x" size={24} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
