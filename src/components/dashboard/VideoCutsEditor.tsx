'use client';

// Editor "Taglia & Anima" (video_cuts) — pensato per utenti non tecnici.
// Niente trascinamenti né taglio frame: l'utente mette in pausa, preme un
// pulsante grande, poi SCEGLIE l'immagine migliore tra alcune proposte (tap su
// una foto). Ogni momento sceglie solo lo STILE d'arredo. L'AI fa il resto.

import React from 'react';
import { s, Box, Icon } from './ui';
import { AI_STAGING_STYLES, extractFramesAround, extractFrames, detectStaticEnd } from '@/lib/aiVideo';

export type CutSegment = {
  id: string;
  tStart: number;   // inizio del taglio (= frame "prima" passato all'AI)
  tEnd: number;     // fine del taglio (tutta questa parte viene rimossa)
  styleId: string;
  thumb: string;    // dataURL del fotogramma iniziale (per la card)
  thumbEnd: string; // dataURL del fotogramma finale (per la card)
};

const ACCENT = '#3B83F6';

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  const d = Math.floor((t % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${d}`;
}

export function VideoCutsEditor({
  file, duration, segments, onChange,
}: {
  file: File;
  duration: number;
  segments: CutSegment[];
  onChange: (segs: CutSegment[]) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playhead, setPlayhead] = React.useState(0);
  // Crea e revoca il blob URL nello STESSO effect: in React StrictMode (dev) il
  // doppio mount/unmount rigenera un URL valido, evitando il player nero che si
  // avrebbe con useMemo + effect di revoke separato (revoca l'unico URL).
  const [url, setUrl] = React.useState('');
  React.useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const [picking, setPicking] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [zoom, setZoom] = React.useState(1); // ingrandimento timeline (1x..8x)
  const trackRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const focusRef = React.useRef<{ a: number; b: number } | null>(null);
  // Zoom + scroll automatici sul taglio appena creato, così è grande e centrato.
  const focusRange = (a: number, b: number) => {
    if (!duration) return;
    const len = Math.max(0.5, b - a);
    const z = Math.max(1, Math.min(8, Math.round((duration * 0.5) / len)));
    focusRef.current = { a, b };
    setZoom(z);
  };
  React.useEffect(() => {
    const f = focusRef.current; const el = scrollRef.current;
    if (!f || !el || !duration) return;
    focusRef.current = null;
    // La larghezza del track cresce con una transizione (.12s): centriamo lo
    // scroll DOPO, altrimenti scrollLeft viene clampato alla larghezza vecchia.
    const doScroll = () => {
      const cont = scrollRef.current; if (!cont || !duration) return;
      const inner = cont.clientWidth * zoom;
      const center = ((f.a + f.b) / 2 / duration) * inner;
      cont.scrollTo({ left: Math.max(0, center - cont.clientWidth / 2), behavior: 'smooth' });
    };
    const id = setTimeout(doScroll, 160);
    return () => clearTimeout(id);
  }, [zoom, duration]);
  // Filmstrip stile iPhone: miniature dei frame lungo la timeline.
  const [strip, setStrip] = React.useState<string[]>([]);
  React.useEffect(() => { let on = true; extractFrames(file, 18).then(f => { if (on) setStrip(f); }); return () => { on = false; }; }, [file]);

  const segsSorted = [...segments].sort((a, b) => a.tStart - b.tStart);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };
  const seekFrom = (clientX: number) => {
    const el = trackRef.current, v = videoRef.current; if (!el || !v || !duration) return;
    const r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(duration, ((clientX - r.left) / r.width) * duration));
    v.currentTime = t; setPlayhead(t);
  };
  const scrub = (e: React.PointerEvent) => {
    e.preventDefault();
    seekFrom(e.clientX);
    const mv = (ev: PointerEvent) => seekFrom(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const clk = (t: number) => { const m = Math.floor(t / 60); const sec = Math.floor(t % 60); return `${m}:${String(sec).padStart(2, '0')}`; };

  // Usa direttamente il frame su cui sei in pausa: prende la miniatura, poi l'AI
  // propone in automatico la fine del taglio (quanto resta ferma la scena).
  const onTransform = async () => {
    if (picking || detecting) return;
    const t = videoRef.current?.currentTime ?? playhead;
    setPicking(true);
    let thumb = '';
    try { const fr = await extractFramesAround(file, t, 1, 0.1); thumb = fr[0]?.dataUrl || ''; } catch { /* best-effort */ }
    setPicking(false);
    setDetecting(true);
    let tEnd = Math.min(duration, t + 1.5);
    try { tEnd = await detectStaticEnd(file, t, 30); } catch { /* fallback */ }
    tEnd = Math.max(t + 0.8, Math.min(duration, tEnd));
    let thumbEnd = '';
    try { const fe = await extractFramesAround(file, tEnd, 1, 0.1); thumbEnd = fe[0]?.dataUrl || ''; } catch { /* best-effort */ }
    setDetecting(false);
    onChange([...segments, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tStart: t, tEnd, styleId: AI_STAGING_STYLES[0].id, thumb, thumbEnd,
    }]);
    focusRange(t, tEnd); // zoom + scroll sul taglio appena creato
  };

  const update = (id: string, patch: Partial<CutSegment>) => onChange(segments.map(x => x.id === id ? { ...x, ...patch } : x));
  const remove = (id: string) => onChange(segments.filter(x => x.id !== id));
  // Trascina un range (inizio | fine | tutto) direttamente sulla timeline.
  const dragSeg = (seg: CutSegment, mode: 'move' | 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const el = trackRef.current; const v = videoRef.current; if (!el || !duration) return;
    const r = el.getBoundingClientRect();
    const win = seg.tEnd - seg.tStart;
    const grabT = ((e.clientX - r.left) / r.width) * duration - seg.tStart;
    const apply = (clientX: number) => {
      let t = ((clientX - r.left) / r.width) * duration; t = Math.max(0, Math.min(duration, t));
      if (mode === 'start') { const ts = Math.max(0, Math.min(seg.tEnd - 0.5, t)); update(seg.id, { tStart: ts }); if (v) v.currentTime = ts; setPlayhead(ts); }
      else if (mode === 'end') { const te = Math.max(seg.tStart + 0.5, Math.min(duration, t)); update(seg.id, { tEnd: te }); if (v) v.currentTime = te; setPlayhead(te); }
      else { const ts = Math.max(0, Math.min(duration - win, t - grabT)); update(seg.id, { tStart: ts, tEnd: ts + win }); if (v) v.currentTime = ts; setPlayhead(ts); }
    };
    apply(e.clientX);
    const mv = (ev: PointerEvent) => apply(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const stepStyle = s('display:flex;align-items:center;gap:9px;font-size:12.5px;color:#57534c;line-height:1.4');
  const numBadge = (n: number) => (
    <span style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: ACCENT, color: '#fff', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
  );

  const TransformBtn = (
    <Box as="button" onClick={onTransform} disabled={picking || detecting} style={s(`width:100%;border:none;background:${ACCENT};color:#fff;font-size:14.5px;font-weight:800;padding:14px;border-radius:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;opacity:${picking || detecting ? 0.6 : 1}`)} hover={picking || detecting ? {} : s('background:#2563EB')}>
      <Icon name="sparkles" size={18} color="#fff" />{picking || detecting ? 'Un attimo…' : 'Trasforma questo momento'}
    </Box>
  );

  const Timeline = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, background: '#f6f4f0', border: '1px solid #ece9e2', borderRadius: 11, padding: '9px 11px' }}>
      {/* contenitore scrollabile per lo zoom */}
      <div ref={scrollRef} style={{ overflowX: zoom > 1 ? 'auto' : 'hidden', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div ref={trackRef} onPointerDown={scrub} style={{ position: 'relative', width: `${zoom * 100}%`, minWidth: '100%', height: 68, borderRadius: 7, overflow: 'hidden', cursor: 'pointer', touchAction: 'none', background: '#e4e1da', display: 'flex', border: '1px solid #d8d4cb', transition: 'width .12s ease', willChange: 'width' }}>
          {strip.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={f} alt="" draggable={false} style={{ flex: 1, minWidth: 0, height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          ))}
          {/* range tagliati: trascinabili (inizio | fine | tutto) */}
          {segsSorted.map((seg) => duration ? (
            <div key={seg.id} onPointerDown={dragSeg(seg, 'move')} title="Trascina per spostare" style={{ position: 'absolute', top: 0, bottom: 0, left: `${(seg.tStart / duration) * 100}%`, width: `${Math.max(1, ((seg.tEnd - seg.tStart) / duration) * 100)}%`, background: 'rgba(59,131,246,.30)', border: `2px solid ${ACCENT}`, boxSizing: 'border-box', cursor: 'grab', touchAction: 'none', zIndex: 2 }}>
              <div onPointerDown={dragSeg(seg, 'start')} title="Inizio" style={{ position: 'absolute', left: -8, top: -2, bottom: -2, width: 16, background: ACCENT, borderRadius: 5, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}><span style={{ width: 3, height: 25, background: '#fff', borderRadius: 2 }} /></div>
              <div onPointerDown={dragSeg(seg, 'end')} title="Fine" style={{ position: 'absolute', right: -8, top: -2, bottom: -2, width: 16, background: ACCENT, borderRadius: 5, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}><span style={{ width: 3, height: 25, background: '#fff', borderRadius: 2 }} /></div>
            </div>
          ) : null)}
          <div style={{ position: 'absolute', top: -1, bottom: -1, left: `${duration ? (playhead / duration) * 100 : 0}%`, transform: 'translateX(-50%)', width: 4, borderRadius: 3, background: '#211f1c', boxShadow: '0 0 0 1.5px #fff', zIndex: 3, pointerEvents: 'none' }} />
        </div>
      </div>
      {/* riga sotto: play + tempi + zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button onClick={togglePlay} aria-label={playing ? 'Pausa' : 'Play'} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flex: 'none', padding: 0 }}>
          {playing
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#211f1c"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="#211f1c" style={{ marginLeft: 2 }}><polygon points="6 3 20 12 6 21 6 3" /></svg>}
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#211f1c', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{clk(playhead)}</span>
        <div style={{ flex: 1 }} />
        {/* zoom con slider */}
        <Icon name="search" size={13} color="#8c867d" />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#57534c', flex: 'none' }}>Zoom</span>
        <input className="gnm-zoom-range" type="range" min={1} max={8} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} aria-label="Zoom timeline" style={{ flex: '0 1 225px', minWidth: 81 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#57534c', minWidth: 27, textAlign: 'center', flex: 'none' }}>{zoom.toFixed(1)}x</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8c867d', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>{clk(duration)}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Come funziona — in cima, su tutta la larghezza */}
      <div style={{ background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 13, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={s('font-size:13.5px;font-weight:800;color:#1d5fd0')}>Come funziona</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={stepStyle}>{numBadge(1)}<span>Guarda il video. Quando arrivi alla parte da togliere, mettilo in <b>pausa</b>.</span></div>
          <div style={stepStyle}>{numBadge(2)}<span>Premi <b>Trasforma questo momento</b>, poi sposta il fotogramma di fine in avanti finché non vedi iniziare la scena dopo: è lì che finisce il taglio.</span></div>
          <div style={stepStyle}>{numBadge(3)}<span>L&apos;AI <b>arreda</b> la stanza e mette l&apos;effetto al posto di quella parte. La tua <b>voce</b> continua a sentirsi.</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #cfe0fb', borderRadius: 9, padding: '9px 11px' }}>
          <Icon name="film" size={14.5} color="#1d5fd0" />
          <span style={s('font-size:11.5px;color:#1d5fd0;font-weight:600')}>Ogni taglio usa <b>1</b> dei tuoi crediti video.{segments.length > 0 ? ` Crediti video usati: ${segments.length}` : ''}</span>
        </div>
      </div>
      <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.72fr) minmax(0, 1.28fr)', gap: 18, alignItems: 'start' }}>
      {/* COLONNA SX: video grande (sticky) + pulsante + barra tagli */}
      <div className="max-md:!static" style={{ position: 'sticky', top: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ position: 'relative', borderRadius: 13, overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', aspectRatio: '9 / 16', maxHeight: '74vh' }}>
          {/* Sfondo: stesso video sfocato che riempie la cornice (come le altre preview) */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={url || undefined} muted playsInline preload="metadata"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(22px) brightness(.6)', transform: 'scale(1.15)', pointerEvents: 'none' }} />
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} src={url || undefined} playsInline onClick={togglePlay}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
            onTimeUpdate={e => setPlayhead((e.target as HTMLVideoElement).currentTime)}
            style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'pointer' }} />
        </div>
      </div>

      {/* COLONNA DX: timeline + azione + tagli */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Timeline}
      {TransformBtn}
      <span style={s('font-size:11.5px;color:#8c867d;text-align:center;display:block')}>Metti in pausa all&apos;inizio della parte da togliere, poi premi qui.</span>
      <div style={{ height: 1, background: '#ece9e2', margin: '4px 0' }} />

      {/* Rilevamento automatico durata */}
      {detecting && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 13, border: `1.5px solid #cfe0fb`, background: '#eef4fe', borderRadius: 11 }}>
          <span style={{ width: 16, height: 16, border: '3px solid #cfe0fb', borderTopColor: ACCENT, borderRadius: '50%', display: 'inline-block', animation: 'export-spin .8s linear infinite' }} />
          <span style={s('font-size:11.5px;font-weight:700;color:#1d5fd0')}>Sto calcolando quanto dura la parte da togliere…</span>
        </div>
      )}

      {/* Card per ogni taglio */}
      {segsSorted.length === 0 ? (
        <div style={s('text-align:center;padding:20px;border:1.5px dashed #d8d4cb;border-radius:11px;color:#8c867d;font-size:12.5px')}>
          Nessun taglio ancora. Guarda il video e premi <b>Trasforma questo momento</b>.
        </div>
      ) : [...segments].reverse().map((seg) => (
        <div key={seg.id} style={{ border: '1px solid #ece9e2', borderRadius: 13, padding: 13, background: '#fff', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 7 }}>
            <div style={s('font-size:12.5px;font-weight:800')}>Taglio {segments.indexOf(seg) + 1} <span style={{ color: '#b3aca1', fontWeight: 700 }}>· tolgo {(seg.tEnd - seg.tStart).toFixed(1)}s</span></div>
            <Box as="button" onClick={() => remove(seg.id)} style={s('flex:none;border:1px solid #f3d4d4;background:#fff;color:#dc2626;font-size:11.5px;font-weight:700;padding:7px 11px;border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;gap:5px')} hover={s('background:#fef2f2')}>
              <Icon name="trash-2" size={13.5} color="#dc2626" />Rimuovi
            </Box>
          </div>
          {/* Stile (stesso look di Foto AI) */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.06em' }}>Stile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 9 }}>
            {AI_STAGING_STYLES.map(st => {
              const sel = seg.styleId === st.id;
              return (
                <div key={st.id} onClick={() => update(seg.id, { styleId: st.id })} title={st.desc} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '13px 4px', borderRadius: 11, cursor: 'pointer', textAlign: 'center', border: sel ? '1.5px solid #3B83F6' : '1.5px solid transparent', background: sel ? '#eff6ff' : '#f8f7f5', boxShadow: sel ? '0 4px 12px rgba(59,131,246,0.12)' : 'none', transition: 'all .2s cubic-bezier(.4,0,.2,1)', position: 'relative' }}>
                  <span style={{ width: 22, height: 22, display: 'flex', color: sel ? '#1d5fd0' : '#57534c' }} dangerouslySetInnerHTML={{ __html: st.icon }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: sel ? '#1d5fd0' : '#57534c' }}>{st.label}</span>
                  {sel && (
                    <div style={{ position: 'absolute', top: -5, right: -5, background: '#3B83F6', borderRadius: '50%', padding: 2, display: 'flex', border: '2px solid #fff' }}>
                      <Icon name="check" size={9} color="#fff" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      </div>
      </div>
    </div>
  );
}
