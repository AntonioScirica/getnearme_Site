'use client';

// Foto AI (virtual staging) — port of the extension's unified photo wizard.
// 1 photo  → instant generation (replicate-staging, nano-banana)
// 2..30    → batch (create-batch-staging), results delivered by email.

import React from 'react';
import { s, Box, Icon } from './ui';
import {
  STAGING_STYLES, STAGING_ANGLES, MAX_BATCH_PHOTOS,
  fileToResizedDataUrl, generateStaging, createBatchStaging, downloadImage,
  fetchStagingQuota, type StagingQuota,
} from '@/lib/staging';
import { saveSingleGenerationToBatch } from '@/lib/stagingBatches';

type Photo = { id: string; dataUrl: string; name: string; w: number; h: number };

const GEN_SECONDS = 45; // countdown estimate, same ballpark as the extension

import type { Project } from './types';

export default function FotoAIScreen({ toast, routeKey, project, onBatchCreated }: {
  toast: (msg: string, icon?: string) => void;
  routeKey: number;
  project?: Project;
  onBatchCreated?: () => void;
}) {
  const [quota, setQuota] = React.useState<StagingQuota | null>(null);
  React.useEffect(() => { fetchStagingQuota().then(setQuota); }, []);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [selStyle, setSelStyle] = React.useState<string | null>(null);
  const [selAngle, setSelAngle] = React.useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [countdown, setCountdown] = React.useState(GEN_SECONDS);
  const [result, setResult] = React.useState<{ before: string; after: string } | null>(null);
  const [reprompt, setReprompt] = React.useState('');
  const [batchDone, setBatchDone] = React.useState<number | null>(null); // itemCount
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const dragDepth = React.useRef(0);
  const [dragOver, setDragOver] = React.useState(false);
  const [activePhotoId, setActivePhotoId] = React.useState<string | null>(null);

  // Reset when re-entering from sidebar
  React.useEffect(() => {
    setPhotos([]); setSelStyle(null); setSelAngle(null); setCustomPrompt(''); setActivePhotoId(null);
    setResult(null); setReprompt(''); setBatchDone(null); setError(null); setGenerating(false);
  }, [routeKey]);

  React.useEffect(() => {
    if (document.getElementById('foto-ai-gooey-css')) return;
    const st = document.createElement('style');
    st.id = 'foto-ai-gooey-css';
    st.textContent = `
@keyframes orb-blob{0%,100%{border-radius:45% 55% 60% 40%/50% 45% 55% 50%}33%{border-radius:60% 40% 50% 50%/55% 60% 40% 45%}66%{border-radius:50% 50% 40% 60%/45% 50% 60% 55%}}
@keyframes orb-glow{0%,100%{box-shadow:0 0 40px 8px rgba(59,131,246,.25),0 0 80px 20px rgba(139,92,246,.12)}50%{box-shadow:0 0 60px 16px rgba(59,131,246,.35),0 0 120px 40px rgba(139,92,246,.18)}}
@keyframes orb-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes orb-ring{0%{transform:scale(.8);opacity:.6}100%{transform:scale(2.4);opacity:0}}
@keyframes orb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes foto-reveal{0%{opacity:0}100%{opacity:1}}
`;
    document.head.appendChild(st);
  }, []);

  // Countdown during generation
  React.useEffect(() => {
    if (!generating) return;
    setCountdown(GEN_SECONDS);
    const t = setInterval(() => setCountdown(c => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [generating]);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    if (photos.length + list.length > MAX_BATCH_PHOTOS) {
      toast(`Massimo ${MAX_BATCH_PHOTOS} foto`, 'x');
      return;
    }
    try {
      const converted = await Promise.all(list.map(async f => {
        const dataUrl = await fileToResizedDataUrl(f);
        const dims = await new Promise<{w:number;h:number}>(res => {
          const img = new Image();
          img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => res({ w: 1, h: 1 });
          img.src = dataUrl;
        });
        return { id: `${Date.now()}-${Math.random()}`, dataUrl, name: f.name, ...dims };
      }));
      setPhotos(p => [...p, ...converted]);
      setError(null);
    } catch {
      toast('Errore lettura immagine', 'x');
    }
  };

  const pickStyle = (id: string) => { setSelStyle(v => v === id ? null : id); setSelAngle(null); setCustomPrompt(''); };
  const pickAngle = (id: string) => { setSelAngle(v => v === id ? null : id); setSelStyle(null); setCustomPrompt(''); };
  const onPrompt = (v: string) => { setCustomPrompt(v); if (v.trim()) { setSelStyle(null); setSelAngle(null); } };

  const canGenerate = photos.length > 0 && (selStyle || customPrompt.trim()) && !generating;
  const isBatch = photos.length > 1;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError(null);
    setGenerating(true);
    try {
      if (isBatch) {
        const res = await createBatchStaging({
          images: photos.map(p => p.dataUrl),
          style: selStyle,
          customPrompt: customPrompt.trim() || null,
          projectId: project?.id || null,
        });
        if (res.ok) {
          setBatchDone(res.itemCount);
          toast(`${res.itemCount} foto inviate per l'elaborazione`, 'sparkles');
          onBatchCreated?.();
        } else {
          setError(res.error);
        }
      } else {
        const res = await generateStaging({
          imageDataUrl: photos[0].dataUrl,
          style: selStyle,
          angle: selAngle,
          customPrompt: customPrompt.trim() || null,
        });
        if (res.ok) {
          setResult({ before: photos[0].dataUrl, after: res.outputUrl });
          await saveSingleGenerationToBatch({
            projectId: project?.id || null,
            style: selStyle,
            customPrompt: customPrompt.trim() || null,
            sourceUrl: '', // Non salviamo l'originale per risparmiare spazio e mostrare solo la foto AI
            resultUrl: res.outputUrl,
          });
          onBatchCreated?.();
        } else {
          setError(res.error);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione al server AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleReprompt = async () => {
    if (!result || !reprompt.trim() || generating) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await generateStaging({ imageDataUrl: result.after, customPrompt: reprompt.trim() });
      if (res.ok) {
        setResult({ before: result.before, after: res.outputUrl });
        setReprompt('');
        await saveSingleGenerationToBatch({
          projectId: project?.id || null,
          style: null,
          customPrompt: reprompt.trim(),
          sourceUrl: '',
          resultUrl: res.outputUrl,
        });
        onBatchCreated?.();
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione al server AI');
    } finally {
      setGenerating(false);
    }
  };

  const resetAll = () => {
    setPhotos([]); setSelStyle(null); setSelAngle(null); setCustomPrompt('');
    setResult(null); setReprompt(''); setBatchDone(null); setError(null);
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#fff', resize: 'vertical' };

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:1160px;margin:0 auto;padding:32px 32px 64px')}>
      <div className="max-md:!flex-col max-md:!items-start max-md:!gap-4" style={s('display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px')}>
        <div>
          <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Homestaging AI</h1>
          <div style={s('color:#8c867d;font-size:14px')}>Arreda, svuota o trasforma le foto dei tuoi immobili con l’AI.</div>
        </div>
        {quota && (
          <div style={s('display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #f0ede7;border-radius:99px;padding:8px 16px')}>
            <Icon name="image" size={15} color="#3B83F6" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{quota.remaining}/{quota.limit} foto</span>
          </div>
        )}
      </div>

      {/* ── GENERATING — AI Apple Intelligence Style ── */}
      {generating && (
        <div style={{ 
          position: 'relative', 
          borderRadius: 24, 
          padding: '80px 48px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 32,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }} className="aurora-bg">
          {/* Pulsing Core */}
          <div style={{ position: 'relative', width: 80, height: 80, animation: 'orb-float 6s ease-in-out infinite, slow-pulse 4s ease-in-out infinite' }}>
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', animation: 'orb-ring 3s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', animation: 'orb-ring 3s ease-out 1.5s infinite' }} />
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #ec4899, #8b5cf6, #3b82f6)',
              backgroundSize: '300% 300%',
              animation: 'aurora-gradient 4s ease infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(139,92,246,0.4), inset 0 0 20px rgba(255,255,255,0.5)',
            }}>
              <Icon name="sparkles" size={32} color="#fff" />
            </div>
          </div>

          <div style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div className="shimmer-text" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
              {isBatch && !result ? 'Elaborazione Magica...' : 'Creazione in corso...'}
            </div>
            {!isBatch && (
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, letterSpacing: '-0.01em' }}>
                {countdown > 0 ? `Circa ${countdown} secondi rimanenti` : 'Rifinitura dei dettagli...'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BATCH SUBMITTED ── */}
      {!generating && batchDone !== null && (
        <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:16px;padding:52px;text-align:center;max-width:560px;margin:0 auto')}>
          <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
            <Icon name="inbox" size={24} color="#3B83F6" />
          </div>
          <div style={s('font-size:17px;font-weight:800;margin-bottom:6px')}>{batchDone} foto in elaborazione</div>
          <div style={s('color:#8c867d;font-size:13.5px;max-width:400px;margin:0 auto 24px')}>
            Le tue foto sono in elaborazione nel server. Puoi controllare l'avanzamento nel tray <b>Lavori in corso</b> in alto a destra, o chiudere la pagina.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Box as="button" onClick={resetAll} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#2b6fe0')}>
              Elabora altre foto
            </Box>
          </div>
        </div>
      )}

      {/* ── RESULT (before/after) ── */}
      {!generating && result && batchDone === null && (
        <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <BeforeAfter before={result.before} after={result.after} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && <div style={s('background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:12px 14px;font-size:13px')}>{error}</div>}
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px')}>
              <div style={s('font-size:13px;font-weight:700;margin-bottom:8px')}>Modifica ancora</div>
              <div style={s('font-size:12px;color:#8c867d;margin-bottom:10px')}>Descrivi una modifica da applicare alla foto generata (1 credito).</div>
              <textarea value={reprompt} onChange={e => setReprompt(e.target.value)} maxLength={2000} rows={3} placeholder="Es. rendi il divano blu, aggiungi un tappeto chiaro..." style={inputStyle} />
              <Box as="button" onClick={handleReprompt} style={{ marginTop: 10, width: '100%', border: '1px solid #e4e1da', background: '#fff', fontSize: 13, fontWeight: 700, padding: '11px 16px', borderRadius: 10, cursor: reprompt.trim() ? 'pointer' : 'default', opacity: reprompt.trim() ? 1 : 0.4 }} hover={reprompt.trim() ? { background: '#f6f4f0' } : {}}>
                Applica modifica
              </Box>
            </div>
            <Box as="button" onClick={() => downloadImage(result.after)} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:13px 16px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
              <Icon name="download" size={16} color="#fff" />Scarica foto
            </Box>
            <Box as="button" onClick={resetAll} style={s('border:1.5px solid #d8d4cb;background:transparent;color:#57534c;font-size:14px;font-weight:700;padding:12px 16px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center') as React.CSSProperties} hover={s('background:#f6f4f0')}>
              Nuova foto
            </Box>
          </div>
        </div>
      )}

      {/* ── SETUP (upload + style/prompt) ── */}
      {!generating && !result && batchDone === null && (
        <div className="max-md:!grid-cols-1 max-md:!flex max-md:!flex-col-reverse" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* left: upload */}
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              onDragEnter={e => { e.preventDefault(); dragDepth.current++; setDragOver(true); }}
              onDragLeave={e => { e.preventDefault(); if (--dragDepth.current <= 0) { dragDepth.current = 0; setDragOver(false); } }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); dragDepth.current = 0; setDragOver(false); addFiles(e.dataTransfer.files); }}
            style={{
              flex: 1, minHeight: 400, borderRadius: photos.length === 0 ? 20 : 0, padding: photos.length === 0 ? 24 : 0,
              border: dragOver ? '2px dashed #3B83F6' : (photos.length === 0 ? '2px dashed #d8d4cb' : '2px solid transparent'),
              background: dragOver ? '#eff6ff' : (photos.length === 0 ? '#fff' : 'transparent'),
              display: 'flex', flexDirection: 'column', alignItems: photos.length === 0 ? 'center' : 'stretch', justifyContent: photos.length === 0 ? 'center' : 'flex-start',
              textAlign: 'center', transition: 'all .2s', position: 'relative'
            }}
          >
              {photos.length === 0 ? (
                <>
                  <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
                    <Icon name="image-plus" size={24} color="#3B83F6" />
                  </div>
                  <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>Carica le foto da trasformare</div>
                  <div style={s('color:#8c867d;font-size:13px')}>Trascina qui o clicca per scegliere. 1 foto = risultato subito, fino a {MAX_BATCH_PHOTOS} foto = consegna via email.</div>
                </>
              ) : (
                <div>
                  {(() => {
                    const ap = photos.find(p => p.id === activePhotoId) || photos[0];
                    const isVertical = ap.h > ap.w;
                    return (
                      <div key={ap.id} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', ...(isVertical ? { aspectRatio: '4/3' } : {}), animation: 'foto-reveal .45s cubic-bezier(.22,1,.36,1) both' }}>
                        {isVertical && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ap.dataUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px) brightness(.85)', transform: 'scale(1.15)' }} />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ap.dataUrl} alt="" style={{ position: 'relative', width: '100%', height: isVertical ? '100%' : 'auto', objectFit: isVertical ? 'contain' : 'cover', display: 'block', borderRadius: isVertical ? 0 : 12 }} />
                        <button
                          onClick={e => { e.stopPropagation(); setPhotos(ph => ph.filter(x => x.id !== ap.id)); if (activePhotoId === ap.id) setActivePhotoId(null); }}
                          style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(33,31,28,.72)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                        ><Icon name="x" size={13} color="#fff" /></button>
                      </div>
                    );
                  })()}
                  {/* thumbnail strip */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBottom: 10 }}>
                    {photos.map(p => (
                      <div key={p.id} className="group" onClick={e => { e.stopPropagation(); setActivePhotoId(p.id); }} style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: (activePhotoId || photos[0].id) === p.id ? '2px solid #3B83F6' : '2px solid transparent', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={e => { e.stopPropagation(); setPhotos(ph => ph.filter(x => x.id !== p.id)); if (activePhotoId === p.id) setActivePhotoId(null); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(33,31,28,.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                        ><Icon name="x" size={10} color="#fff" /></button>
                      </div>
                    ))}
                    <div style={{ width: 56, height: 56, borderRadius: 8, border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="plus" size={16} color="#b3aca1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ position: 'absolute', opacity: 0, width: 1, height: 1, top: -9999, pointerEvents: 'none' }} onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* right: style / angle / prompt */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div style={s('background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:12px 14px;font-size:13px')}>{error}</div>}

            <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Stile</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {STAGING_STYLES.map(st => {
                  const sel = selStyle === st.id;
                  return (
                    <div key={st.id} className="group" onClick={() => pickStyle(st.id)} title={st.desc} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px',
                      borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      border: sel ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                      background: sel ? '#eff6ff' : '#f8f7f5', 
                      boxShadow: sel ? '0 4px 12px rgba(59,131,246,0.12)' : 'none',
                      transition: 'all .2s cubic-bezier(.4,0,.2,1)',
                      position: 'relative'
                    }}>
                      <span className="transition-transform duration-300 group-hover:-translate-y-0.5" style={{ width: 24, height: 24, display: 'flex', color: sel ? '#1d5fd0' : '#57534c' }} dangerouslySetInnerHTML={{ __html: st.icon }} />
                      <span className="transition-transform duration-300 group-hover:-translate-y-0.5" style={{ fontSize: 11, fontWeight: 600, color: sel ? '#1d5fd0' : '#57534c' }}>{st.label}</span>
                      {sel && (
                        <div style={{ position: 'absolute', top: -6, right: -6, background: '#3B83F6', borderRadius: '50%', padding: 2, display: 'flex', border: '2px solid #fff' }}>
                          <Icon name="check" size={10} color="#fff" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 10px' }}>Oppure scrivi cosa vuoi</div>
              <textarea value={customPrompt} onChange={e => onPrompt(e.target.value)} maxLength={2000} rows={3} placeholder="Es. trasforma in soggiorno moderno con divano color crema e parquet chiaro" style={inputStyle} />
            </div>

            <button onClick={handleGenerate} className="group" style={{
              border: 'none', 
              background: canGenerate ? 'linear-gradient(135deg, #3B83F6 0%, #6366f1 100%)' : '#e5e7eb',
              color: canGenerate ? '#fff' : '#9ca3af',
              fontSize: 15, fontWeight: 600,
              padding: '16px 20px', borderRadius: 14, cursor: canGenerate ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canGenerate ? '0 8px 24px rgba(99,102,241,0.25)' : 'none',
              transition: 'all .2s cubic-bezier(.4,0,.2,1)',
            }}>
              <span className={canGenerate ? "group-hover:rotate-12 transition-transform duration-300" : ""} style={{ display: 'flex' }}>
                <Icon name="sparkles" size={18} color={canGenerate ? "#fff" : "#9ca3af"} />
              </span>
              {isBatch ? `Genera ${photos.length} foto` : 'Genera foto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Before/After comparison slider ──────────────────────────────────────────
function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = React.useState(50); // percent
  const boxRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const updateFromEvent = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };

  React.useEffect(() => {
    const move = (e: MouseEvent) => { if (dragging.current) updateFromEvent(e.clientX); };
    const up = () => { dragging.current = false; };
    const tmove = (e: TouchEvent) => { if (dragging.current && e.touches[0]) updateFromEvent(e.touches[0].clientX); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', tmove);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', tmove);
      window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      onMouseDown={e => { dragging.current = true; updateFromEvent(e.clientX); }}
      onTouchStart={e => { dragging.current = true; if (e.touches[0]) updateFromEvent(e.touches[0].clientX); }}
      style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'col-resize', userSelect: 'none', background: '#211f1c', boxShadow: '0 12px 36px rgba(33,31,28,.14)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="Dopo" draggable={false} style={{ width: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Prima" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      {/* divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#fff', transform: 'translateX(-1px)', boxShadow: '0 0 8px rgba(0,0,0,.35)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.25)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#211f1c" strokeWidth="2.5"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
        </div>
      </div>
      <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99 }}>Prima</span>
      <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '5px 12px', borderRadius: 99 }}>Dopo</span>
    </div>
  );
}
