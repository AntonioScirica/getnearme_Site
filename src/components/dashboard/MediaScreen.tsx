'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { s, Box, Icon } from './ui';
import { fetchUserBatches, fetchBatchPhotos, BatchInfo, BatchPhoto } from '@/lib/stagingBatches';
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

  const handleDownloadBatch = async (batch: BatchInfo) => {
    const photos = photosByBatch[batch.id] || [];
    if (!photos.length) {
      toast('Nessuna foto scaricabile in questo batch', 'x');
      return;
    }
    
    toast('Preparazione archivio in corso...', 'loader');
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      
      const folder = zip.folder(`Batch_${batch.style || 'Custom'}_${new Date(batch.createdAt).toISOString().split('T')[0]}`);
      
      let downloadedCount = 0;
      await Promise.all(photos.map(async (p, idx) => {
        try {
          const res = await fetch(p.resultUrl);
          const blob = await res.blob();
          folder?.file(`foto_${idx + 1}.png`, blob);
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
      a.download = `getnearme_foto_${batch.style || 'ai'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      toast('Archivio ZIP scaricato', 'download');
    } catch (e) {
      toast('Errore durante la creazione dello ZIP', 'x');
    }
  };

  const validBatches = projectBatches.filter(b => b.completedItems > 0 && b.status !== 'failed');

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
      ) : validBatches.length === 0 ? (
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
          {validBatches.map(batch => {
            const photos = photosByBatch[batch.id];
            const loading = loadingPhotos[batch.id];
            const dateStr = new Date(batch.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
            
            if (filter === 'video') return null; // We only have staging batches for now
            if (batch.status === 'failed' || batch.completedItems === 0) return null;

            return (
              <div key={batch.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #f0ede7', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="sparkles" size={16} color="#3B83F6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#211f1c' }}>
                        Batch Foto AI · {batch.style || 'Stile Custom'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#8c867d' }}>
                        {dateStr} · {batch.completedItems} / {batch.totalItems} foto
                      </div>
                    </div>
                  </div>
                  
                  {photos && photos.length > 0 && (
                    <Box as="button" onClick={() => handleDownloadBatch(batch)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#211f1c' }} hover={{ background: '#f6f4f0' }}>
                      <Icon name="download" size={14} />
                      Scarica ZIP
                    </Box>
                  )}
                </div>

                {loading ? (
                  <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ width: 280, height: 200, borderRadius: 12, background: '#f4f2ee', flexShrink: 0, animation: 'pulse 1.5s infinite ease-in-out' }} />
                    ))}
                  </div>
                ) : !photos || photos.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#8c867d', fontStyle: 'italic' }}>Nessuna foto disponibile.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                    {photos.map(photo => {
                      if (photo.status === 'failed') {
                        return (
                          <div
                            key={photo.index}
                            style={{ position: 'relative', width: 280, height: 200, borderRadius: 12, flexShrink: 0, border: '1px solid #fca5a5', background: '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}
                          >
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                              <Icon name="alert-triangle" size={20} color="#dc2626" />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Generazione fallita</div>
                            <div style={{ fontSize: 12, color: '#b91c1c' }}>
                              {photo.error === 'generation_failed' ? "L'AI non è riuscita a processare questa foto. Riprova con un'angolazione diversa." : photo.error || "Errore sconosciuto."}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div 
                          key={photo.index} 
                          onClick={() => setLightbox({ ...photo, sourceUrl: photo.sourceUrl || localSourceUrls[`${batch.id}_${photo.index}`] || null })}
                          style={{ position: 'relative', width: 280, height: 200, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', border: '1px solid #f0ede7' }}
                        >
                          <Image src={photo.resultUrl} alt="" width={400} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized={false} />
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
                            style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                          >
                            <Icon name="download" size={16} color="#211f1c" />
                          </button>
                        </div>
                      );
                    })}
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
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
