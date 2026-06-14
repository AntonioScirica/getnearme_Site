'use client';

// Video AI — port of the extension's AI video wizard (all 8 templates).
// Steps: 0 template gallery → 1 avatar (classic/split) → 2 media upload →
//        3 options (script / music / style) → 4 render + download.

import React from 'react';
import { s, Box, Icon } from './ui';
import { getTokenFast } from '@/lib/staging';
import type { BrandSettings } from '@/lib/brand';
import {
  DEFAULT_VIDEO_TEMPLATES, MONTAGGIO_TEMPLATE, NO_AVATAR_LAYOUTS, ROOM_TYPES,
  AI_STAGING_STYLES, AI_STAGING_ANIMATION_STYLES, DAY_NIGHT_DIRECTIONS,
  SUBTITLE_STYLES, COVER_STYLES, MOOD_LABELS,
  fetchVideoConfig, fetchVideoQuota, getMusicLibrary, resolvePreviewUrl,
  getUploadUrls, uploadToPresigned, generateScript, renderAvatar, checkAvatar,
  animatePhotoStart, animatePhotoPoll, transcribeAudio, startRender, pollRenderProgress, detectRooms,
  createImageThumbnail, createVideoThumbnail, extractFrames, aspectFromDims,
  type VideoTemplate, type VideoAvatar, type VideoQuota, type ScriptSection, type MusicTrack,
  AIVideoError,
} from '@/lib/aiVideo';
import { drawCoverOverlay, preloadCoverFonts, renderCoverOverlayBlob } from '@/lib/coverOverlay';
import { createServerVideoJob } from '@/lib/videoJobs';

type Clip = {
  id: string; file: File; thumb: string; duration: number;
  width: number; height: number; room: string; isPhoto: boolean;
  uploadedUrl?: string;
  sourceStart: number; sourceEnd: number;
  roomManual?: boolean; // l'utente ha scelto l'ambiente a mano: non sovrascrivere
  frames?: string[];    // mini-anteprima: N frame estratti lungo la clip
};

// Riconoscimento ambiente → riordino clip per ordine di visita (come l'estensione).
const ROOM_VISIT_ORDER: Record<string, number> = {
  vista: 0, giardino: 0, ingresso: 1, soggiorno: 2, cucina: 3,
  camera: 4, bagno: 5, studio: 6, terrazzo: 7, cantina: 8, altro: 9,
};
function detectRoomFromFilename(filename?: string): string | null {
  const n = (filename || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const MAP: [string, string[]][] = [
    ['bagno', ['bagno', 'bathroom', 'bath', 'wc', 'toilet']],
    ['cucina', ['cucina', 'kitchen', 'cottura']],
    ['soggiorno', ['soggiorno', 'sala', 'salone', 'living', 'salotto', 'lounge']],
    ['camera', ['camera', 'bedroom', 'letto', 'notte', 'matrimoniale', 'singola']],
    ['ingresso', ['ingresso', 'entrata', 'corridoio', 'hallway', 'hall', 'foyer']],
    ['studio', ['studio', 'ufficio', 'office', 'lavoro']],
    ['terrazzo', ['terrazzo', 'balcone', 'balcony', 'terrace', 'loggia']],
    ['giardino', ['giardino', 'garden', 'yard', 'piscina']],
    ['vista', ['vista', 'esterno', 'facade', 'exterior', 'outside']],
    ['cantina', ['cantina', 'garage', 'box', 'cellar', 'basement', 'magazzino']],
  ];
  for (const [id, keys] of MAP) if (keys.some(k => n.includes(k))) return id;
  return null;
}
type Pair = { id: string; before: { file: File; thumb: string; uploadedUrl?: string } | null; after: { file: File; thumb: string; uploadedUrl?: string } | null; room: string };

const MAX_CLIPS = 6;
const MAX_CLIPS_MONTAGGIO = 30;
const MAX_PAIRS = 1;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Carica un'immagine (crossOrigin per poter usare il canvas → toBlob).
function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    if (!src) { res(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

// Durata massima della porzione tenuta da ogni clip nel montaggio.
const CLIP_WINDOW_SEC = 6;
const CLIP_MIN_SEC = 1;
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// Slider a doppio handle, finestra MAX 6s (puoi anche meno). Track full-width con
// striscia di frame sotto. onPreview(t) aggiorna l'anteprima mentre trascini.
function TrimRange({ duration, start, end, frames, onChange, onPreview }: {
  duration: number; start: number; end: number; frames?: string[];
  onChange: (s: number, e: number) => void; onPreview?: (t: number) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Resize da un lato (handle) — clamp max 6s, min 1s.
  const startDrag = (which: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const el = ref.current; if (!el) return;
    const apply = (clientX: number) => {
      const r = el.getBoundingClientRect();
      let t = ((clientX - r.left) / r.width) * duration;
      t = Math.max(0, Math.min(duration, t));
      if (which === 'start') {
        const s = Math.min(t, end - CLIP_MIN_SEC);
        const e2 = Math.min(end, s + CLIP_WINDOW_SEC);
        onChange(Math.max(0, s), e2); onPreview?.(Math.max(0, s));
      } else {
        const e2 = Math.max(t, start + CLIP_MIN_SEC);
        const s = Math.max(start, e2 - CLIP_WINDOW_SEC);
        onChange(s, Math.min(duration, e2)); onPreview?.(Math.min(duration, e2));
      }
    };
    apply(e.clientX);
    const onMove = (ev: PointerEvent) => apply(ev.clientX);
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  // Sposta tutta la finestra (mantiene la durata) afferrando il centro.
  const moveWindow = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const win = end - start;
    const grab = (e.clientX - r.left) - (start / duration) * r.width;
    const apply = (clientX: number) => {
      let s = (((clientX - r.left) - grab) / r.width) * duration;
      s = Math.max(0, Math.min(duration - win, s));
      onChange(s, s + win); onPreview?.(s);
    };
    const onMove = (ev: PointerEvent) => apply(ev.clientX);
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const sp = duration ? (start / duration) * 100 : 0;
  const ep = duration ? (end / duration) * 100 : 100;
  const thumb: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 26, borderRadius: 4, background: '#fff', border: '2px solid #3B83F6', boxShadow: '0 1px 4px rgba(0,0,0,.3)', cursor: 'ew-resize', touchAction: 'none', zIndex: 3 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name="scissors" size={13} color="#b3aca1" />
      <div ref={ref} style={{ position: 'relative', flex: 1, height: 30, display: 'flex', alignItems: 'center' }}>
        {/* striscia di frame + stroke grigio */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', background: '#e4e1da', display: 'flex', border: '1px solid #b3aca1' }}>
          {frames && frames.length > 0
            ? frames.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={f} alt="" style={{ flex: 1, minWidth: 0, height: '100%', objectFit: 'cover' }} />
              ))
            : null}
        </div>
        {/* zone fuori dalla selezione schiarite */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${sp}%`, background: 'rgba(255,255,255,.62)', borderRadius: '6px 0 0 6px' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: `${ep}%`, background: 'rgba(255,255,255,.62)', borderRadius: '0 6px 6px 0' }} />
        {/* finestra selezione: afferra il CENTRO per spostarla */}
        <div onPointerDown={moveWindow} title="Trascina per spostare la selezione" style={{ position: 'absolute', top: 0, bottom: 0, left: `${sp}%`, right: `${100 - ep}%`, border: '2px solid #3B83F6', borderRadius: 6, boxSizing: 'border-box', cursor: 'grab', touchAction: 'none', zIndex: 2 }} />
        <div onPointerDown={startDrag('start')} title="Inizio" style={{ ...thumb, left: `${sp}%` }} />
        <div onPointerDown={startDrag('end')} title="Fine" style={{ ...thumb, left: `${ep}%` }} />
      </div>
      <span style={{ fontSize: 10.5, color: '#8c867d', fontWeight: 700, minWidth: 92, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(start)} - {fmtTime(end)}</span>
    </div>
  );
}

// Barra azioni (Indietro/Avanti) FISSA in fondo all'area contenuti, full-width.
// `left` = larghezza sidebar via CSS var `--gnm-content-left` (settata in
// DashboardApp, 0 su mobile via media query in globals.css). Il contenuto
// interno resta allineato alla colonna (max 1160 + padding 32).
function StickyNav({ children, align }: { children: React.ReactNode; align?: 'center'; bleed?: number }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 'var(--gnm-content-left, 252px)', right: 0, zIndex: 30,
      background: 'rgba(252,252,251,0.97)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      borderTop: '1.5px solid #e4e1da',
    }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '14px 32px',
        display: 'flex', alignItems: align === 'center' ? 'center' : undefined,
        justifyContent: 'space-between', gap: 12,
      }}>
        {children}
      </div>
    </div>
  );
}

// Griglia anteprima cover: 9 canvas (primo frame + dim + logo + titolo per stile),
// identica all'estensione. Clic per selezionare.
function CoverStylesGrid({ thumbUrl, logoUrl, title, address, brandColor, isPortrait, selected, onSelect, styles }: {
  thumbUrl: string; logoUrl: string; title: string; address: string; brandColor: string;
  isPortrait: boolean; selected: string; onSelect: (id: string) => void;
  styles: { id: string; label: string }[];
}) {
  const refs = React.useRef<Record<string, HTMLCanvasElement | null>>({});
  React.useEffect(() => {
    let alive = true;
    (async () => {
      await preloadCoverFonts();
      const [frame, logo] = await Promise.all([loadImg(thumbUrl), logoUrl ? loadImg(logoUrl) : Promise.resolve(null)]);
      if (!alive) return;
      // Mezza risoluzione (scalata via CSS): wrapping/spazi sono scale-invariant
      // → identici all'export 1080×1920, ma più leggera (niente lag in digitazione).
      // Prima era 270×480: a quel font (~14px) l'hinting falsava wrapping e spazi.
      const W = isPortrait ? 540 : 960;
      const H = isPortrait ? 960 : 540;
      for (const st of styles) {
        const canvas = refs.current[st.id];
        if (!canvas) continue;
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        if (frame && frame.width > 0) {
          const scale = Math.max(W / frame.width, H / frame.height);
          const sw = W / scale, sh = H / scale;
          ctx.drawImage(frame, (frame.width - sw) / 2, (frame.height - sh) / 2, sw, sh, 0, 0, W, H);
        }
        drawCoverOverlay(ctx, { style: st.id, title: title.trim() || 'Inserisci qui il titolo del video', address, logoImg: logo, brandColor, isPortrait, W, H });
      }
    })();
    return () => { alive = false; };
  }, [thumbUrl, logoUrl, title, address, brandColor, isPortrait, styles]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isPortrait ? 4 : 3}, 1fr)`, gap: 10 }}>
      {styles.map(st => (
        <Box key={st.id} onClick={() => onSelect(st.id)} style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: selected === st.id ? '2px solid #3B83F6' : '2px solid transparent', boxShadow: selected === st.id ? '0 4px 12px rgba(59,131,246,.18)' : '0 1px 3px rgba(0,0,0,.06)', transition: 'transform .15s, box-shadow .15s', transform: 'translateY(0)' } as React.CSSProperties} hover={selected === st.id ? undefined : { transform: 'translateY(-3px)', boxShadow: '0 8px 20px rgba(0,0,0,.12)' }}>
          <canvas ref={el => { refs.current[st.id] = el; }} style={{ width: '100%', aspectRatio: isPortrait ? '9 / 16' : '16 / 9', display: 'block', background: '#000' }} />
          <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '6px 4px', color: selected === st.id ? '#1d5fd0' : '#57534c', background: selected === st.id ? '#eff6ff' : '#fff' }}>{st.label}</div>
        </Box>
      ))}
    </div>
  );
}

import type { Project } from './types';

// Max render video in corso contemporaneamente. Cap conservativo per non
// superare i rate-limit di fal Kling / HeyGen (avatar/walkthrough).
const MAX_CONCURRENT_RENDERS = 2;

// Meta per le card Animazione (ai_staging): icona + descrizione breve.
const ANIM_META: Record<string, { desc: string; icon: string }> = {
  stop_motion: {
    desc: 'I mobili compaiono a scatti, pezzo dopo pezzo',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4"/></svg>',
  },
  particle_dust: {
    desc: 'Gli arredi si formano da particelle di polvere',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><circle cx="6" cy="7" r="1.4"/><circle cx="12" cy="5" r="1.1"/><circle cx="18" cy="8" r="1.4"/><circle cx="9" cy="12" r="1.1"/><circle cx="15" cy="13" r="1.4"/><circle cx="5" cy="16" r="1.1"/><circle cx="12" cy="18" r="1.4"/><circle cx="19" cy="17" r="1.1"/></svg>',
  },
};

// Pacchetti video extra. Prezzi provvisori (da finalizzare con i Payment Link
// Stripe dei nuovi tagli 10/30/50). Il link 10 è quello reale; 30/50 da generare.
const VIDEO_PACKS = [
  { id: 'ai-video-10', name: 'Video Pack 10', videos: 10, price: 39, popular: false, link: 'https://buy.stripe.com/7sYdR93GreU336UaFOak00D' },
  { id: 'ai-video-30', name: 'Video Pack 30', videos: 30, price: 99, popular: true, link: 'https://buy.stripe.com/bJe6oHa4PdPZgXKaFOak00E' },
  { id: 'ai-video-50', name: 'Video Pack 50', videos: 50, price: 149, popular: false, link: 'https://buy.stripe.com/8x29AT7WH4fpbDqdS0ak00F' },
];

function userFromToken(): { id?: string; email?: string } {
  try { const t = getTokenFast(); const p = JSON.parse(atob(t.split('.')[1])); return { id: p.sub, email: p.email }; } catch { return {}; }
}

// Popup "Pacchetti AI Video" quando la quota mensile è esaurita (copia estensione).
function VideoPacksModal({ onClose }: { onClose: () => void }) {
  const buy = (link: string) => {
    const { id, email } = userFromToken();
    let url = link;
    try { const u = new URL(link); if (id) u.searchParams.set('client_reference_id', id); if (email) u.searchParams.set('prefilled_email', email); url = u.toString(); } catch { /* keep link */ }
    window.open(url, '_blank');
    onClose();
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,17,.55)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: 20, boxShadow: '0 28px 72px rgba(20,18,15,.3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0ede7' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-.3px' }}>Pacchetti AI Video</h3>
          <button onClick={onClose} aria-label="Chiudi" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8c867d' }}><Icon name="x" size={20} color="#8c867d" /></button>
        </div>
        <div style={{ padding: '22px 28px 26px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Hai esaurito i video di questo mese</div>
            <div style={{ fontSize: 13.5, color: '#57534c', lineHeight: 1.5 }}>Acquista un pacchetto extra per continuare a generare video AI. I crediti extra non scadono e si sommano al tuo piano attuale.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {VIDEO_PACKS.map(p => (
              <div key={p.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: p.popular ? '2px solid #3B83F6' : '1px solid #e4e1da', background: p.popular ? '#eff6ff' : '#fff' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: p.popular ? '#fff' : '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="film" size={19} color={p.popular ? '#1d5fd0' : '#57534c'} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>{p.name}{p.popular && <span style={{ fontSize: 10, fontWeight: 800, color: '#1d5fd0', background: '#dbeafe', padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '.04em' }}>Popolare</span>}</div>
                  <div style={{ fontSize: 12.5, color: '#8c867d', marginTop: 1 }}>{p.videos} video AI extra</div>
                </div>
                {/* Prezzo + CTA sulla stessa linea, allineati verticalmente */}
                <div style={{ fontSize: 19, fontWeight: 800, flex: 'none', minWidth: 64, textAlign: 'right' }}>€{p.price}</div>
                <Box as="button" onClick={() => buy(p.link)} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 10, cursor: 'pointer', flex: 'none' } as React.CSSProperties} hover={{ background: '#2b6fe0' }}>Scegli</Box>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview video di una card template, con skeleton (pulse) finche' il primo
// frame non e' pronto, poi fade-in. Come MediaScreen, evita il "pop" del video.
function TplPreview({ src }: { src: string | null }) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div style={{ aspectRatio: '3/4', background: 'linear-gradient(145deg, #2a2733, #1a1825)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...(src && !loaded ? { animation: 'pulse 1.5s infinite ease-in-out' } : {}) }}>
      {src ? (
        <video src={src} muted loop autoPlay playsInline onLoadedData={() => setLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity .3s' }} />
      ) : (
        <Icon name="film" size={32} color="rgba(255,255,255,.4)" />
      )}
    </div>
  );
}

const DEMO_CLIPS = [
  { id: '1', label: 'Video · 12s', room: 'Soggiorno', isPhoto: false, color: '#1d3a5c' },
  { id: '2', label: 'Video · 8s', room: 'Cucina', isPhoto: false, color: '#2563eb' },
  { id: '3', label: 'Foto', room: 'Camera', isPhoto: true, color: '#1e40af' },
  { id: '4', label: 'Video · 15s', room: 'Bagno', isPhoto: false, color: '#3B83F6' },
  { id: '5', label: 'Foto', room: 'Terrazzo', isPhoto: true, color: '#1e3a5f' },
];

function DemoMontaggioClips() {
  const [visible, setVisible] = React.useState(0);
  React.useEffect(() => {
    const timers = DEMO_CLIPS.map((_, i) => setTimeout(() => setVisible(i + 1), 200 + i * 250));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ borderRadius: 12, border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, color: '#57534c', fontSize: 13.5, fontWeight: 700, background: '#fcfcfb' }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B83F6" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        </span>
        Aggiungi clip o foto <span style={{ color: '#a8a299', fontWeight: 600 }}>· {DEMO_CLIPS.length}/15</span>
      </div>
      {DEMO_CLIPS.map((c, idx) => (
        <div key={c.id} style={{
          display: 'flex', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 12, padding: 10, border: '1px solid #e4e1da',
          opacity: visible > idx ? 1 : 0, transform: visible > idx ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity .4s ease, transform .4s ease',
        }}>
          <div style={{ flex: 'none', color: '#c4bfb6', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/><circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="4" cy="16" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
          </div>
          <div style={{ position: 'relative', width: 116, height: 78, flex: 'none', borderRadius: 8, overflow: 'hidden', background: c.color }}>
            <span style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(33,31,28,.78)', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#57534c', background: '#f3f1ec', padding: '3px 9px', borderRadius: 99 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#57534c" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>{!c.isPhoto && <polygon points="10 8 16 12 10 16 10 8" />}</svg>
              {c.label}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8c867d', background: '#f6f4f0', padding: '4px 10px', borderRadius: 8 }}>{c.room}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VideoAIScreen({ toast, routeKey, brand, preselect, project, onVideoJob, activeRenders, initialPhotoUrl, demoMode }: {
  toast: (msg: string, icon?: string) => void;
  routeKey: number;
  brand: BrandSettings;
  preselect?: string;
  project?: Project;
  onVideoJob?: (job: { id: string; title: string; template: string; stage: 'render' | 'done' | 'failed'; progress: number; ctx: Record<string, unknown>; outputUrl?: string; error?: string; projectId: string | null; aspect: string; replaceId?: string }) => void;
  activeRenders?: number;
  initialPhotoUrl?: string | null;
  demoMode?: boolean;
}) {
  const [templates, setTemplates] = React.useState<VideoTemplate[]>(DEFAULT_VIDEO_TEMPLATES);
  const [avatars, setAvatars] = React.useState<VideoAvatar[]>([]);
  const [quota, setQuota] = React.useState<VideoQuota | null>(null);
  const [packsOpen, setPacksOpen] = React.useState(false); // popup pacchetti video extra
  // Init dal preselect: montaggio entra direttamente al suo step (niente flash
  // del picker Video AI prima del passaggio).
  const [step, setStep] = React.useState(preselect === 'montaggio' ? 2 : 0);
  const [tpl, setTpl] = React.useState<VideoTemplate | null>(preselect === 'montaggio' ? MONTAGGIO_TEMPLATE : null);
  const [avatar, setAvatar] = React.useState<VideoAvatar | null>(null);
  const [clips, setClips] = React.useState<Clip[]>([]);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);
  const moveClip = (from: number, to: number) => setClips(cs => {
    if (to < 0 || to >= cs.length || from === to) return cs;
    const n = [...cs]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
  });
  const [pairs, setPairs] = React.useState<Pair[]>([]);
  // options
  const [sections, setSections] = React.useState<ScriptSection[]>([]);
  const [scriptLoading, setScriptLoading] = React.useState(false);
  const [musicUrl, setMusicUrl] = React.useState<string | null>(null);
  const [musicOpen, setMusicOpen] = React.useState(false);
  const [stagingStyle, setStagingStyle] = React.useState(AI_STAGING_STYLES[0].id);
  const [animStyle, setAnimStyle] = React.useState(AI_STAGING_ANIMATION_STYLES[0].id);
  const [dayNightDir, setDayNightDir] = React.useState(DAY_NIGHT_DIRECTIONS[0].id);
  const [subtitleStyle, setSubtitleStyle] = React.useState('bold');
  const [autoCut, setAutoCut] = React.useState(true);
  const [coverTitle, setCoverTitle] = React.useState('');
  const [coverAddress, setCoverAddress] = React.useState('');
  const [coverStyle, setCoverStyle] = React.useState(''); // nessuno di default: scelta obbligatoria
  const [propTitle, setPropTitle] = React.useState(project?.titolo ?? '');
  const [propAddress, setPropAddress] = React.useState(project?.addr ?? '');
  // sottotitoli transcription
  const [sottPhase, setSottPhase] = React.useState<'edit' | 'style'>('edit');
  const [transcription, setTranscription] = React.useState<{ wordTimestamps: { word: string; start: number; end: number }[]; keepSegments: { start: number; end: number }[]; audioDurationSeconds: number } | null>(null);
  const [transcribing, setTranscribing] = React.useState(false);
  const [editingWordIdx, setEditingWordIdx] = React.useState<number | null>(null);
  const videoPreviewRef = React.useRef<HTMLVideoElement>(null);
  const [videoTime, setVideoTime] = React.useState(0);
  const [videoPlaying, setVideoPlaying] = React.useState(false);
  const videoObjUrl = React.useRef<string | null>(null);
  // montaggio logo
  const [montaggioPhase, setMontaggioPhase] = React.useState<'cover' | 'logo'>('cover');
  const [coverLogoOn, setCoverLogoOn] = React.useState(false);
  const [coverLogoKey, setCoverLogoKey] = React.useState('auto'); // 'auto' | 'white_h' | 'black_v' | ...
  // Logo bianco auto (in base all'orientamento) + URL del logo scelto per la cover.
  const whiteLogoAuto = (brand.logoOrientation === 'vertical' ? (brand.logos.logo_white_v || brand.logos.logo_white_h) : (brand.logos.logo_white_h || brand.logos.logo_white_v)) || '';
  const coverLogoUrl = !coverLogoOn ? '' : (coverLogoKey === 'auto' ? whiteLogoAuto : ((brand.logos as Record<string, string | null>)['logo_' + coverLogoKey] || whiteLogoAuto));
  // Varianti logo disponibili (label come nei post), per il picker.
  const coverLogoItems = React.useMemo(() => {
    const labelMap: Record<string, string> = {
      white_h: 'Bianco + Payoff', white_v: 'Bianco', black_h: 'Nero + Payoff', black_v: 'Nero', colored_h: 'Colore + Payoff', colored_v: 'Colore',
    };
    const order = ['white_h', 'white_v', 'black_h', 'black_v', 'colored_h', 'colored_v'];
    const items = [{ key: 'auto', label: 'Auto', src: whiteLogoAuto, dark: true }];
    for (const k of order) {
      const src = (brand.logos as Record<string, string | null>)['logo_' + k];
      if (src) items.push({ key: k, label: labelMap[k] || k, src, dark: k.startsWith('white') });
    }
    return items;
  }, [brand.logos, whiteLogoAuto]);
  // Copertina finale (outro): fade su bianco + logo centrato, identico al
  // montaggio. Disponibile su TUTTI i template, ON di default. Su bianco serve
  // un logo scuro/colorato (non bianco), quindi l'auto preferisce colorato→nero.
  const [outroOn, setOutroOn] = React.useState(true);
  const [outroLogoKey, setOutroLogoKey] = React.useState('auto');
  const darkLogoAuto = (brand.logoOrientation === 'vertical'
    ? (brand.logos.logo_colored_v || brand.logos.logo_black_v || brand.logos.logo_colored_h || brand.logos.logo_black_h)
    : (brand.logos.logo_colored_h || brand.logos.logo_black_h || brand.logos.logo_colored_v || brand.logos.logo_black_v)) || '';
  const hasAnyLogo = Object.values(brand.logos || {}).some(Boolean);
  const outroLogoUrl = (!outroOn || !hasAnyLogo) ? '' : (outroLogoKey === 'auto' ? darkLogoAuto : ((brand.logos as Record<string, string | null>)['logo_' + outroLogoKey] || darkLogoAuto));
  const outroLogoItems = React.useMemo(() => {
    const labelMap: Record<string, string> = {
      colored_h: 'Colore + Payoff', colored_v: 'Colore', black_h: 'Nero + Payoff', black_v: 'Nero', white_h: 'Bianco + Payoff', white_v: 'Bianco',
    };
    const order = ['colored_h', 'colored_v', 'black_h', 'black_v', 'white_h', 'white_v'];
    const items = [{ key: 'auto', label: 'Auto', src: darkLogoAuto, white: false }];
    for (const k of order) {
      const src = (brand.logos as Record<string, string | null>)['logo_' + k];
      if (src) items.push({ key: k, label: labelMap[k] || k, src, white: k.startsWith('white') });
    }
    return items;
  }, [brand.logos, darkLogoAuto]);
  const [watermarkEnabled, setWatermarkEnabled] = React.useState(true);
  const [watermarkPosition, setWatermarkPosition] = React.useState('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = React.useState(100);
  // render
  const [renderStage, setRenderStage] = React.useState<string | null>(null); // uploading|avatar|render|done|failed
  const [renderProgress, setRenderProgress] = React.useState(0);
  const [outputUrl, setOutputUrl] = React.useState<string | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const abortRef = React.useRef(false);
  const prepJobRef = React.useRef<string | null>(null); // job tray temporaneo (prima del renderId)
  const uiOwnerRef = React.useRef<string | null>(null); // quale render possiede la UI foreground (evita hijack tra render concorrenti)
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pairRef = React.useRef<{ pairId: string; slot: 'before' | 'after' } | null>(null);
  const pairFileRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  // Ad ogni cambio step risali al contenitore scrollabile e torna in cima
  // (es. selezione avatar: deve partire dall'alto, non a metà pagina).
  React.useEffect(() => {
    let el = rootRef.current?.parentElement as HTMLElement | null;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') { el.scrollTop = 0; break; }
      el = el.parentElement;
    }
  }, [step]);

  const layout = tpl?.layout || tpl?.id || '';
  const usesAvatar = !!tpl && !NO_AVATAR_LAYOUTS.includes(layout);
  // Layout righe orizzontali (come montaggio): anche per gli avatar (classic/split),
  // così le clip stanno una sotto l'altra con anteprima larga, ambiente e trim.
  const rowLayout = layout === 'montaggio' || usesAvatar;
  const isPhotoTemplate = ['walkthrough', 'ai_staging', 'construction', 'day_night'].includes(layout);
  const singlePhoto = ['ai_staging', 'construction', 'day_night'].includes(layout);
  const maxClips = layout === 'montaggio' ? MAX_CLIPS_MONTAGGIO : layout === 'sottotitoli' || singlePhoto ? 1 : MAX_CLIPS;
  const minClips = layout === 'montaggio' ? 3 : layout === 'sottotitoli' || singlePhoto || isPhotoTemplate ? 1 : 3;
  const usesMusic = layout !== 'sottotitoli';
  const inlineStep3 = ['walkthrough', 'construction', 'before_after', 'ai_staging', 'day_night'].includes(layout);

  const musicLibrary = React.useMemo(() => getMusicLibrary(), []);

  React.useEffect(() => {
    fetchVideoConfig().then(c => { setTemplates(c.templates); setAvatars(c.avatars); });
    fetchVideoQuota().then(setQuota);
  }, []);

  const resetAll = React.useCallback(() => {
    setStep(0); setTpl(null); setAvatar(null); setClips([]); setPairs([]);
    setSections([]); setMusicUrl(null); setMusicOpen(false);
    setStagingStyle(AI_STAGING_STYLES[0].id); setAnimStyle(AI_STAGING_ANIMATION_STYLES[0].id);
    setDayNightDir(DAY_NIGHT_DIRECTIONS[0].id); setSubtitleStyle('bold'); setAutoCut(true);
    setCoverTitle(''); setCoverAddress(''); setCoverStyle('');
    setPropTitle(''); setPropAddress('');
    setRenderStage(null); setRenderProgress(0); setOutputUrl(null); setRenderError(null);
    setSottPhase('edit'); setTranscription(null); setTranscribing(false); setEditingWordIdx(null);
    setVideoTime(0); setVideoPlaying(false);
    setMontaggioPhase('cover'); setWatermarkEnabled(true); setWatermarkPosition('bottom-right'); setWatermarkOpacity(100);
    // NON abortire: un render in corso deve continuare in background (l'UI è
    // gated su step===4, quindi non viene dirottata dal vecchio render).
    if (videoObjUrl.current) { URL.revokeObjectURL(videoObjUrl.current); videoObjUrl.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingUrl(null); }
  }, []);
  // Riparte dall'entrata giusta: su montaggio torna al montaggio, non al
  // picker generale dei Video AI.
  const startNew = React.useCallback(() => {
    resetAll();
    if (preselect) {
      const found = [...DEFAULT_VIDEO_TEMPLATES, MONTAGGIO_TEMPLATE, ...templates].find(t => t.id === preselect);
      if (found) { setTpl(found); setStep(NO_AVATAR_LAYOUTS.includes(found.layout || found.id) ? 2 : 1); }
    }
  }, [resetAll, preselect, templates]);
  React.useEffect(() => { startNew(); }, [routeKey, startNew]);

  React.useEffect(() => {
    if (document.getElementById('foto-ai-spin-css')) return;
    const st = document.createElement('style');
    st.id = 'foto-ai-spin-css';
    st.textContent = '@keyframes export-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }, []);

  const loadedInitialPhotoRef = React.useRef(false);
  React.useEffect(() => { loadedInitialPhotoRef.current = false; }, [initialPhotoUrl]);
  React.useEffect(() => {
    if (initialPhotoUrl && tpl && !loadedInitialPhotoRef.current) {
      loadedInitialPhotoRef.current = true;
      fetch(initialPhotoUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'photo.jpg', { type: blob.type });
          addFiles([file]);
        })
        .catch(() => toast('Errore nel caricamento della foto iniziale', 'x'));
    }
  }, [initialPhotoUrl, tpl]);

  // ── media handling ─────────────────────────────────────────────────────────
  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const allowVideo = !isPhotoTemplate || layout === 'montaggio';
    const allowPhoto = isPhotoTemplate || layout === 'montaggio';
    const valid = list.filter(f =>
      (allowVideo && f.type.startsWith('video/')) || (allowPhoto && f.type.startsWith('image/'))
    );
    if (!valid.length) { toast(allowPhoto && !allowVideo ? 'Carica immagini' : 'Formato non supportato', 'x'); return; }
    if (clips.length + valid.length > maxClips) { toast(`Massimo ${maxClips} file`, 'x'); return; }
    try {
      const converted: Clip[] = [];
      for (const f of valid) {
        if (f.type.startsWith('image/')) {
          const thumb = await createImageThumbnail(f);
          const img = new Image();
          await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = thumb; });
          converted.push({ id: `${Date.now()}-${Math.random()}`, file: f, thumb, duration: 5, width: img.width, height: img.height, room: 'altro', isPhoto: true, sourceStart: 0, sourceEnd: 5 });
        } else {
          const { thumb, duration, width, height } = await createVideoThumbnail(f);
          if (layout === 'sottotitoli' && duration > 90) { toast('Video massimo 90 secondi', 'x'); continue; }
          // Montaggio: finestra di default 6s (lo slider scorre, non ridimensiona).
          const defEnd = layout === 'montaggio' ? Math.min(duration, CLIP_WINDOW_SEC) : duration;
          converted.push({ id: `${Date.now()}-${Math.random()}`, file: f, thumb, duration, width, height, room: layout === 'sottotitoli' ? 'video' : 'altro', isPhoto: false, sourceStart: 0, sourceEnd: defEnd });
        }
      }
      setClips(c => [...c, ...converted]);
      // Riconoscimento ambiente + riordino (montaggio/walkthrough), best-effort.
      void autoDetectRooms(converted);
      // Mini-anteprima a frame per la timeline di trim (montaggio + avatar, video).
      if (rowLayout) {
        for (const cl of converted) {
          if (cl.isPhoto) continue;
          void extractFrames(cl.file, 8).then(frames => {
            if (frames.length) setClips(cs => cs.map(x => x.id === cl.id ? { ...x, frames } : x));
          });
        }
      }
    } catch {
      toast('Errore lettura file', 'x');
    }
  };

  // Rileva l'ambiente delle clip video (nome file → Groq vision) e, per il
  // montaggio, riordina per ordine di visita. Non tocca le scelte manuali.
  const autoDetectRooms = async (added: Clip[]) => {
    // Montaggio, walkthrough e avatar (classic/split): le clip hanno un ambiente.
    if (layout !== 'montaggio' && layout !== 'walkthrough' && !usesAvatar) return;
    const targets = added.filter(c => !c.isPhoto && c.room === 'altro');
    if (!targets.length) return;
    const applyPatch = (patch: Record<string, string>) => {
      if (!Object.keys(patch).length) return;
      setClips(cs => cs.map(x => (patch[x.id] && !x.roomManual && x.room === 'altro') ? { ...x, room: patch[x.id] } : x));
    };
    const sortMontaggio = () => {
      if (layout !== 'montaggio') return;
      setClips(cs => [...cs].sort((a, b) => (ROOM_VISIT_ORDER[a.room] ?? 9) - (ROOM_VISIT_ORDER[b.room] ?? 9)));
    };
    // 1) nome file (istantaneo, gratis)
    const fnPatch: Record<string, string> = {};
    for (const c of targets) { const r = detectRoomFromFilename(c.file?.name); if (r) fnPatch[c.id] = r; }
    applyPatch(fnPatch);
    // 2) Groq vision per le clip ancora 'altro'
    const remaining = targets.filter(c => !fnPatch[c.id]);
    if (remaining.length) {
      const rooms = await detectRooms(remaining.map(c => c.thumb));
      const apiPatch: Record<string, string> = {};
      remaining.forEach((c, i) => { const r = rooms[i]; if (r && r !== 'altro') apiPatch[c.id] = r; });
      applyPatch(apiPatch);
    }
    sortMontaggio();
  };

  const addPairFile = async (file: File) => {
    const ctx = pairRef.current;
    if (!ctx || !file.type.startsWith('image/')) return;
    const thumb = await createImageThumbnail(file);
    setPairs(ps => ps.map(p => p.id === ctx.pairId ? { ...p, [ctx.slot]: { file, thumb } } : p));
  };

  // ── render orchestration ───────────────────────────────────────────────────
  const propertyData = (): Record<string, unknown> => ({
    ...(propTitle ? { type: propTitle } : {}),
    ...(propAddress ? { address: propAddress } : {}),
    brandName: brand.companyName || undefined,
    brandColor: brand.primaryColor || '#3B82F6',
  });
  const propertyLabel = () => propAddress || propTitle || '';

  const uploadClips = async (items: Clip[], mediaType: 'video' | 'photo'): Promise<Clip[]> => {
    console.log(`[Video] uploadClips: chiedo ${items.length} URL (${mediaType})…`);
    const urls = await getUploadUrls(items.length, mediaType, items.map(c => c.file.type));
    console.log(`[Video] uploadClips: ottenuti ${urls.length} URL, carico…`);
    const out: Clip[] = [];
    for (let i = 0; i < items.length; i++) {
      await uploadToPresigned(urls[i].uploadUrl, items[i].file, items[i].file.type);
      console.log(`[Video] uploadClips: caricata ${i + 1}/${items.length}`);
      out.push({ ...items[i], uploadedUrl: urls[i].readUrl });
    }
    return out;
  };

  const jobTitle = () => (coverTitle.trim() || propTitle.trim() || project?.titolo || (layout === 'montaggio' ? 'Montaggio video' : (tpl?.name || 'Video AI')));

  const finishRender = (res: { done?: boolean; outputUrl?: string; renderId?: string; error?: string; monthly_limit?: number } & Record<string, unknown>, aspect: string, owner?: string) => {
    const ownsUi = () => !owner || uiOwnerRef.current === owner; // aggiorna la UI solo se questo render la possiede ancora
    if (res?.done && res.outputUrl) {
      if (ownsUi()) { setOutputUrl(res.outputUrl); setRenderStage('done'); setRenderProgress(1); }
      fetchVideoQuota().then(setQuota);
      const doneId = `vid_${Date.now()}`;
      // replaceId = il prepId DI QUESTO render (owner), non prepJobRef.current
      // che un render concorrente puo' aver sovrascritto → prep orfano al 20%.
      onVideoJob?.({ id: doneId, title: jobTitle(), template: layout, stage: 'done', progress: 1, ctx: {}, outputUrl: res.outputUrl, projectId: project?.id || null, aspect, replaceId: owner || prepJobRef.current || undefined });
      if (prepJobRef.current === owner) prepJobRef.current = null;
      void createServerVideoJob({ id: doneId, title: jobTitle(), template: layout, status: 'done', progress: 1, ctx: {}, outputUrl: res.outputUrl, projectId: project?.id || null, aspect });
      return true;
    }
    if (res?.renderId) {
      const ctx: Record<string, unknown> = {
        renderId: res.renderId, bucketName: res.bucketName || 'ffmpeg', template: layout,
        aspectRatio: res.aspectRatio || aspect, propertyData: propertyData(),
        keepR2: true, // i Veo-template compongono su Lambda in fase progress: tieni R2
      };
      if (res.veoStatusUrl) ctx.veoStatusUrl = res.veoStatusUrl;
      if (res.veoResponseUrl) ctx.veoResponseUrl = res.veoResponseUrl;
      if (res.aiModel) ctx.aiModel = res.aiModel;
      if (res.pairs) ctx.pairs = res.pairs;
      if (res.constructionJobs) ctx.constructionJobs = res.constructionJobs;
      // Echo per i template async (Veo/Kling): la copertina finale viene
      // composta dal Lambda in fase progress, serve nel ctx dei poll.
      if (outroLogoUrl) ctx.outroLogoUrl = outroLogoUrl;
      // Hand off al tray "Lavori in corso": il polling vive a livello app,
      // sopravvive al cambio sezione. Niente polling locale qui.
      // Persisti la riga server: il cron la finalizza anche a browser chiuso.
      void createServerVideoJob({ id: res.renderId as string, title: jobTitle(), template: layout, status: 'rendering', progress: 0.25, ctx, projectId: project?.id || null, aspect: (res.aspectRatio as string) || aspect });
      if (onVideoJob) {
        onVideoJob({ id: res.renderId as string, title: jobTitle(), template: layout, stage: 'render', progress: 0.25, ctx, projectId: project?.id || null, aspect: (res.aspectRatio as string) || aspect, replaceId: owner || prepJobRef.current || undefined });
        if (prepJobRef.current === owner) prepJobRef.current = null;
        if (ownsUi()) setRenderStage('background');
        return true;
      }
      // fallback: polling locale (se nessun handoff)
      void (async () => {
        for (let i = 0; i < 90 && !abortRef.current; i++) {
          await sleep(20000);
          try {
            const p = await pollRenderProgress(ctx);
            if (p?.done && p.outputUrl) {
              setOutputUrl(p.outputUrl); setRenderStage('done'); setRenderProgress(1);
              fetchVideoQuota().then(setQuota);
              return;
            }
            if (p?.error) { setRenderStage('failed'); setRenderError(p.error); return; }
            setRenderProgress(pr => Math.min(0.95, pr + 0.04));
          } catch { /* transient, keep polling */ }
        }
        if (!abortRef.current) { setRenderStage('failed'); setRenderError('Timeout rendering'); }
      })();
      return true;
    }
    if (ownsUi()) {
      setRenderStage('failed');
      setRenderError(res?.error === 'quota_exceeded'
        ? `Quota mensile video esaurita (${res?.monthly_limit ?? '?'}/mese)`
        : res?.error || 'Avvio rendering non riuscito');
    }
    return false;
  };

  // Sezione "Copertina finale" (outro), riusabile nell'ultimo step di ogni
  // template. Switch ON di default + picker del logo (auto = scuro/colorato).
  const renderOutroSection = () => (
    <div style={{ margin: '4px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
        <div style={{ minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Copertina finale</div>
          <div style={{ fontSize: 12, color: '#8c867d', marginTop: 2 }}>Chiusura con dissolvenza su bianco e logo al centro</div>
        </div>
        <div onClick={() => { if (hasAnyLogo) setOutroOn(v => !v); }} title={hasAnyLogo ? '' : 'Carica un logo nella sezione Brand'} style={{ width: 40, height: 24, borderRadius: 99, background: outroOn && hasAnyLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: hasAnyLogo ? 'pointer' : 'not-allowed', opacity: hasAnyLogo ? 1 : .5, transition: 'background .2s', flex: 'none' }}>
          <span style={{ position: 'absolute', top: 3, left: outroOn && hasAnyLogo ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
        </div>
      </div>
      {outroOn && hasAnyLogo && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0 0' }}>
          {outroLogoItems.filter(i => i.src).map(it => {
            const sel = outroLogoKey === it.key;
            return (
              <Box key={it.key} onClick={() => setOutroLogoKey(it.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', borderRadius: 10, cursor: 'pointer', border: sel ? '2px solid #3B83F6' : '1px solid #e4e1da', background: sel ? '#eff6ff' : '#fff' } as React.CSSProperties} hover={sel ? undefined : { background: '#f6f4f0' }}>
                <span style={{ width: 38, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: it.white ? '#211f1c' : '#f1efe9', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt="" style={{ maxWidth: '82%', maxHeight: '74%', objectFit: 'contain' }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: sel ? 700 : 600, color: sel ? '#1d5fd0' : '#57534c' }}>{it.label}</span>
              </Box>
            );
          })}
        </div>
      )}
    </div>
  );

  const handleRender = async () => {
    if (!tpl) return;
    if ((activeRenders ?? 0) >= MAX_CONCURRENT_RENDERS) {
      toast(`Massimo ${MAX_CONCURRENT_RENDERS} video alla volta. Attendi che finiscano.`, 'x');
      return;
    }
    if (quota && quota.remaining <= 0) {
      setPacksOpen(true); // quota finita → mostra i pacchetti extra
      return;
    }
    abortRef.current = false;
    // Subito in background + job nel tray: l'utente non resta bloccato in
    // foreground e può navigare; la pipeline prosegue (sopravvive all'unmount).
    const prepId = `prep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    prepJobRef.current = prepId;
    uiOwnerRef.current = prepId; // questo render possiede la UI finché non se ne avvia un altro
    setStep(4); setRenderStage('background'); setRenderProgress(0.05); setRenderError(null); setOutputUrl(null);
    onVideoJob?.({ id: prepId, title: jobTitle(), template: layout, stage: 'render', progress: 0.05, ctx: {}, projectId: project?.id || null, aspect: clips[0] ? aspectFromDims(clips[0].width, clips[0].height) : 'portrait' });
    try {
      const aspect = clips[0] ? aspectFromDims(clips[0].width, clips[0].height) : 'portrait';

      if (layout === 'before_after') {
        // upload all pair photos
        const flat: { pairIdx: number; slot: 'before' | 'after'; file: File }[] = [];
        pairs.forEach((p, i) => {
          if (p.before) flat.push({ pairIdx: i, slot: 'before', file: p.before.file });
          if (p.after) flat.push({ pairIdx: i, slot: 'after', file: p.after.file });
        });
        const urls = await getUploadUrls(flat.length, 'photo', flat.map(f => f.file.type));
        const uploaded: Record<string, string> = {};
        for (let i = 0; i < flat.length; i++) {
          await uploadToPresigned(urls[i].uploadUrl, flat[i].file, flat[i].file.type);
          uploaded[`${flat[i].pairIdx}-${flat[i].slot}`] = urls[i].readUrl;
        }
        setRenderProgress(0.2);
        const validPairs = pairs.map((p, i) => ({
          beforeUrl: uploaded[`${i}-before`], afterUrl: uploaded[`${i}-after`], room: p.room || undefined,
        })).filter(p => p.beforeUrl && p.afterUrl);
        const res = await startRender({
          template: 'before_after', pairs: validPairs,
          audioDurationSeconds: validPairs.length * 5,
          musicUrl, clips: [], propertyData: propertyData(), propertyLabel: propertyLabel(),
          aspectRatio: 'portrait', outroLogoUrl,
        });
        finishRender(res, 'portrait', prepId);
        return;
      }

      if (singlePhoto) {
        const up = await uploadClips(clips.slice(0, 1), 'photo');
        setRenderProgress(0.2);
        const photoAspect = aspectFromDims(up[0].width, up[0].height);
        const base = {
          imageUrl: up[0].uploadedUrl, room: 'altro', aspectRatio: photoAspect,
          audioDurationSeconds: 15, musicUrl, clips: [],
          propertyData: propertyData(), propertyLabel: propertyLabel(),
          outroLogoUrl,
        };
        let res;
        if (layout === 'ai_staging') {
          const st = AI_STAGING_STYLES.find(x => x.id === stagingStyle)!;
          const an = AI_STAGING_ANIMATION_STYLES.find(x => x.id === animStyle);
          res = await startRender({ template: 'ai_staging', ...base, customPrompt: st.prompt, ...(an?.videoPrompt ? { customVideoPrompt: an.videoPrompt } : {}) });
        } else if (layout === 'day_night') {
          const dir = DAY_NIGHT_DIRECTIONS.find(x => x.id === dayNightDir)!;
          res = await startRender({ template: 'day_night', ...base, customPrompt: dir.prompt });
        } else {
          res = await startRender({ template: 'construction', ...base });
        }
        finishRender(res, photoAspect, prepId);
        return;
      }

      if (layout === 'walkthrough') {
        const up = await uploadClips(clips, 'photo');
        setRenderProgress(0.15);
        // animate each photo (fal Kling), poll until done
        const animated: { url: string; room: string }[] = [];
        for (const c of up) {
          const st = await animatePhotoStart({ photoUrl: c.uploadedUrl!, room: c.room, duration: '5', aspectRatio: aspect });
          if (!st.success) throw new AIVideoError(st.error || 'Animazione foto non riuscita');
          let done = false;
          for (let i = 0; i < 300 && !abortRef.current; i++) {
            await sleep(2000);
            const p = await animatePhotoPoll({ statusUrl: st.statusUrl, responseUrl: st.responseUrl, requestId: st.requestId, room: st.room });
            if (p.success && p.status === 'COMPLETED' && p.clip) { animated.push(p.clip); done = true; break; }
            if (p.error) throw new AIVideoError(p.error);
          }
          if (!done) throw new AIVideoError('Timeout animazione foto');
          setRenderProgress(pr => Math.min(0.5, pr + 0.3 / up.length));
        }
        // Salta i primi 0.3s di ogni clip: Kling genera un frame congelato
        // iniziale, così il movimento parte subito (come l'estensione).
        const AI_SKIP = 0.3;
        const trimmed = animated.map(c => ({
          ...c, sourceStart: AI_SKIP, sourceEnd: 5, targetDuration: Math.round((5 - AI_SKIP) * 10) / 10,
        }));
        const res = await startRender({
          template: 'walkthrough', clips: trimmed, musicUrl,
          aspectRatio: aspect, propertyData: propertyData(), propertyLabel: propertyLabel(),
          avatarDurationSeconds: trimmed.reduce((s, c) => s + c.targetDuration, 0),
          outroLogoUrl,
        });
        finishRender(res, aspect, prepId);
        return;
      }

      if (layout === 'sottotitoli') {
        const clip0 = clips[0];
        let audioUrl = clip0.uploadedUrl;
        if (!audioUrl) {
          const urls = await getUploadUrls(1, 'video', [clip0.file.type]);
          await uploadToPresigned(urls[0].uploadUrl, clip0.file, clip0.file.type);
          audioUrl = urls[0].readUrl;
        }
        setRenderProgress(0.2);
        const wt = transcription?.wordTimestamps || [];
        const ks = transcription?.keepSegments || [];
        const dur = transcription?.audioDurationSeconds || clip0.duration;
        const res = await startRender({
          template: 'sottotitoli',
          avatarDurationSeconds: dur,
          wordTimestamps: wt,
          subtitleStyle: subtitleStyle || 'bold',
          keepSegments: autoCut ? ks : undefined,
          clips: [{ url: audioUrl, room: 'video', sourceStart: 0, sourceEnd: clip0.duration || dur }],
          propertyData: propertyData(), propertyLabel: propertyLabel(),
          aspectRatio: aspectFromDims(clip0.width, clip0.height),
          outroLogoUrl,
        });
        finishRender(res, aspect, prepId);
        return;
      }

      if (layout === 'montaggio') {
        const photos = clips.filter(c => c.isPhoto);
        const videos = clips.filter(c => !c.isPhoto);
        const upPhotos = photos.length ? await uploadClips(photos, 'photo') : [];
        const upVideos = videos.length ? await uploadClips(videos, 'video') : [];
        const byId = new Map([...upPhotos, ...upVideos].map(c => [c.id, c]));
        const ordered = clips.map(c => byId.get(c.id)!).filter(Boolean);

        // Logo bianco brand (per cover/watermark)
        const whiteLogo = (brand.logoOrientation === 'vertical' ? (brand.logos.logo_white_v || brand.logos.logo_white_h) : (brand.logos.logo_white_h || brand.logos.logo_white_v)) || '';
        const isPortrait = aspect === 'portrait';

        // Genera e carica l'overlay PNG della cover (come l'estensione)
        let coverOverlayUrl = '';
        if (coverTitle.trim()) {
          try {
            const blob = await renderCoverOverlayBlob({
              style: coverStyle, title: coverTitle.trim(), address: coverAddress.trim(),
              logoUrl: coverLogoUrl, brandColor: brand.primaryColor || '#3B82F6', isPortrait,
            });
            const [slot] = await getUploadUrls(1, 'photo', ['image/png']);
            await uploadToPresigned(slot.uploadUrl, blob, 'image/png');
            coverOverlayUrl = slot.readUrl;
          } catch (e) { console.error('[montaggio] cover overlay upload failed (non-blocking):', e); }
        }

        setRenderProgress(0.25);
        console.log('[Montaggio] startRender…', { clips: ordered.length, coverOverlayUrl: !!coverOverlayUrl, musicUrl: !!musicUrl });
        const res = await startRender({
          template: 'montaggio',
          avatarDurationSeconds: ordered.reduce((acc, c) => acc + ((c.sourceEnd || c.duration) - (c.sourceStart || 0)), 0),
          musicUrl,
          ...(coverTitle.trim() ? { coverTitle: coverTitle.trim(), coverAddress: coverAddress.trim(), coverStyle } : {}),
          ...(coverOverlayUrl ? { coverOverlayUrl } : {}),
          ...(coverLogoUrl ? { coverLogo: coverLogoUrl } : {}),
          ...(watermarkEnabled ? { watermark: { logoUrl: whiteLogo || undefined, position: watermarkPosition, opacity: watermarkOpacity / 100, skipFirst: true } } : {}),
          outroLogoUrl,
          clips: ordered.map(c => ({
            url: c.uploadedUrl, room: c.room,
            sourceStart: c.sourceStart || 0, sourceEnd: c.sourceEnd || c.duration || 5,
            originalDuration: c.duration || 5, ...(c.isPhoto ? { isPhoto: true } : {}),
          })),
          propertyData: propertyData(), propertyLabel: propertyLabel(),
          aspectRatio: aspect,
        });
        console.log('[Montaggio] startRender result:', JSON.stringify(res).slice(0, 300));
        finishRender(res, aspect, prepId);
        return;
      }

      // classic / split — avatar pipeline
      if (!avatar) throw new AIVideoError('Seleziona un avatar');
      const script = sections.map(x => x.text).filter(Boolean).join(' ').trim();
      if (!script) throw new AIVideoError('Lo script è vuoto');
      const up = await uploadClips(clips, 'video');
      setRenderProgress(0.12);
      const av = await renderAvatar({
        script,
        avatarId: avatar.heygen_avatar_id,
        voiceId: avatar.elevenlabs_voice_id || avatar.heygen_voice_id || '',
        template: layout || null,
      });
      // poll HeyGen
      let avatarUrl: string | null = null;
      for (let i = 0; i < 75 && !abortRef.current; i++) {
        await sleep(20000);
        try {
          const c = await checkAvatar(av.jobId);
          if (c.done && c.avatarUrl) { avatarUrl = c.avatarUrl; break; }
          if (c.done && c.error) throw new AIVideoError('HeyGen: ' + c.error);
          setRenderProgress(pr => Math.min(0.45, pr + 0.01));
        } catch (e) {
          if (e instanceof AIVideoError && e.message.startsWith('HeyGen')) throw e;
          /* transient — keep polling */
        }
      }
      if (abortRef.current) return;
      if (!avatarUrl) throw new AIVideoError('Timeout sintesi avatar');
      setRenderProgress(0.5);
      const res = await startRender({
        avatarVideoUrl: avatarUrl,
        avatarDurationSeconds: av.audioDurationSeconds,
        clips: up.map(c => ({ url: c.uploadedUrl, room: c.room, sourceStart: c.sourceStart, sourceEnd: c.sourceEnd })),
        propertyData: propertyData(),
        wordTimestamps: av.wordTimestamps || [],
        template: layout || 'classic',
        aspectRatio: 'portrait',
        ...(musicUrl ? { musicUrl } : {}),
        ...(avatar.crop_pct != null ? { avatarCrop: { pct: avatar.crop_pct, xPct: avatar.crop_xPct ?? 0.5, yPct: avatar.crop_yPct ?? 0.45 } } : {}),
        outroLogoUrl,
      });
      finishRender(res, 'portrait', prepId);
    } catch (e) {
      const raw = e instanceof AIVideoError ? e.message : '';
      const msg = raw === 'quota_exceeded'
        ? `Quota video mensile esaurita${quota ? ` (${quota.limit}/mese)` : ''}`
        : (raw || 'Errore imprevisto durante il rendering');
      if (uiOwnerRef.current === prepId) {
        setRenderStage('failed');
        setRenderError(msg);
      }
      console.error('[video-ai] render failed:', e);
      onVideoJob?.({ id: prepId, title: jobTitle(), template: layout, stage: 'failed', progress: 0, ctx: {}, error: msg, projectId: project?.id || null, aspect: 'portrait' });
      if (prepJobRef.current === prepId) prepJobRef.current = null;
    }
  };

  const goToOptions = async () => {
    setStep(3);
    if (usesAvatar && sections.length === 0) {
      setScriptLoading(true);
      try {
        // Estrai frame per clip (come l'estensione): l'edge li usa con Groq
        // vision per descrivere ogni ambiente → script relativo a cosa si vede.
        const framesByClip = await Promise.all(
          clips.map(c => c.isPhoto ? Promise.resolve([] as string[]) : extractFrames(c.file, 4).catch(() => [] as string[]))
        );
        const res = await generateScript({
          propertyData: propertyData(),
          clips: clips.map((c, i) => ({ room: c.room, finalDuration: c.duration, captionFrames: framesByClip[i] || [] })),
          scriptTone: tpl?.script_tone || 'professional',
        });
        // maxWords = parole generate dall'AI: l'utente puo' editare ma non
        // sforare (mantiene la durata sincrona con l'avatar).
        const wc = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
        const withMax = (arr: ScriptSection[]) => arr.map(s => ({ ...s, maxWords: Math.max(wc(s.text), 4) }));
        setSections(res.sections.length ? withMax(res.sections) : [{ id: 'all', label: 'Script', text: res.script, maxWords: Math.max(wc(res.script), 4) }]);
      } catch (e) {
        toast(e instanceof AIVideoError ? e.message : 'Generazione script non riuscita', 'x');
        setSections([{ id: 'all', label: 'Script', text: '' }]);
      } finally {
        setScriptLoading(false);
      }
    }
    if (layout === 'sottotitoli' && !transcription) {
      setSottPhase('edit');
      setTranscribing(true);
      const clip = clips[0];
      if (clip) {
        if (videoObjUrl.current) URL.revokeObjectURL(videoObjUrl.current);
        videoObjUrl.current = URL.createObjectURL(clip.file);
      }
      try {
        const urls = await getUploadUrls(1, 'video', [clip.file.type]);
        await uploadToPresigned(urls[0].uploadUrl, clip.file, clip.file.type);
        const audioUrl = urls[0].readUrl;
        clips[0] = { ...clips[0], uploadedUrl: audioUrl };
        setClips([...clips]);
        const res = await transcribeAudio({ audioUrl, autoCut });
        if (!res.success) throw new AIVideoError(res.error || 'Trascrizione non riuscita');
        setTranscription({ wordTimestamps: res.wordTimestamps, keepSegments: res.keepSegments, audioDurationSeconds: res.audioDurationSeconds });
      } catch (e) {
        toast(e instanceof AIVideoError ? e.message : 'Trascrizione non riuscita', 'x');
      } finally {
        setTranscribing(false);
      }
    }
    if (layout === 'montaggio') {
      setMontaggioPhase('cover');
    }
  };

  // media step validity
  const mediaReady = layout === 'before_after'
    ? pairs.some(p => p.before && p.after)
    : clips.length >= minClips;

  const toggleMusicPlay = (track: MusicTrack) => {
    if (playingUrl === track.url) {
      audioRef.current?.pause(); setPlayingUrl(null); return;
    }
    audioRef.current?.pause();
    const a = new Audio(track.url);
    a.play().catch(() => toast('Anteprima non disponibile', 'x'));
    a.onended = () => setPlayingUrl(null);
    audioRef.current = a;
    setPlayingUrl(track.url);
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#fff' };
  // Select ambiente compatto con chevron custom staccata dal bordo destro.
  const roomSelectStyle: React.CSSProperties = {
    ...inputStyle, flex: 'none', width: 'auto', maxWidth: 180, padding: '7px 32px 7px 10px', fontSize: 12,
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2357534c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px',
  };
  const cardSel = (sel: boolean): React.CSSProperties => ({
    borderRadius: 12, cursor: 'pointer', border: sel ? '2px solid #3B83F6' : '2px solid transparent',
        background: sel ? '#eef4fe' : '#f6f4f0', transition: 'all .15s', padding: '12px',
  });

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className="max-md:!px-4 max-md:!py-6" style={s('max-width:1160px;margin:0 auto;padding:32px 32px 104px')}>
      {step === 0 && (
        <div className="max-md:!flex-col max-md:!items-start max-md:!gap-4" style={s('display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px')}>
          <div>
            <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>{preselect === 'montaggio' ? 'Montaggio Automatico' : 'Video AI'}</h1>
            <div style={s('color:#8c867d;font-size:14px')}>{preselect === 'montaggio' ? "Carica le clip della casa: l'AI monta tutto con musica e cover." : 'Trasforma foto e clip in video pronti per i social.'}</div>
          </div>
          {quota && (quota.remaining > 0 ? (
            <div style={s('display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #f0ede7;border-radius:99px;padding:8px 16px')}>
              <Icon name="film" size={15} color="#3B83F6" />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{quota.remaining}/{quota.limit} video</span>
            </div>
          ) : (
            <Box as="button" onClick={() => setPacksOpen(true)} style={s('display:flex;align-items:center;gap:8px;background:#3B83F6;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer') as React.CSSProperties} hover={s('background:#2b6fe0')}>
              <Icon name="zap" size={15} color="#fff" />Ottieni altri video
            </Box>
          ))}
        </div>
      )}

      {/* STEP 0 — template gallery */}
      {step === 0 && (
        <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {templates.filter(t => t.id !== 'montaggio').map(t => (
            <Box key={t.id} onClick={() => { if (quota && quota.remaining <= 0) { setPacksOpen(true); return; } setTpl(t); setStep(NO_AVATAR_LAYOUTS.includes(t.layout || t.id) ? 2 : 1); }} style={{
              background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
              transition: 'box-shadow .15s, transform .15s',
            }} hover={{ boxShadow: '0 12px 32px rgba(33,31,28,.10)', transform: 'translateY(-2px)' }}>
              <TplPreview src={resolvePreviewUrl(t.preview_video_url)} />
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12.5, color: '#8c867d', lineHeight: 1.45 }}>{t.description}</div>
              </div>
            </Box>
          ))}
        </div>
      )}

      {/* STEP 1 — avatar (classic/split) */}
      {step === 1 && (
        <div>
          <div style={s('font-size:16px;font-weight:800;margin-bottom:4px')}>Scegli il tuo avatar</div>
          <div style={s('color:#8c867d;font-size:13.5px;margin-bottom:16px')}>Seleziona la persona AI che presenterà il tuo immobile. Tutte le voci sono in italiano.</div>
          {avatars.length === 0 ? (
            <div style={s('background:#fff;border:1.5px dashed #d8d4cb;border-radius:12px;padding:40px;text-align:center;color:#8c867d;font-size:13.5px')}>
              Nessun avatar disponibile. Accedi con un account Agency per usare i template con presentatore.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {avatars.map(a => {
                const sel = avatar?.id === a.id;
                return (
                  <Box key={a.id} onClick={() => { setAvatar(a); setStep(2); }} style={{
                    display: 'flex', flexDirection: 'column' as const, border: sel ? '2px solid #3B82F6' : '2px solid #e4e1da',
                    borderRadius: 16, cursor: 'pointer', overflow: 'hidden', background: '#fff', position: 'relative' as const,
                    boxShadow: sel ? '0 0 0 1px #3B82F6, 0 4px 16px rgba(59,130,246,.15)' : 'none',
                    transition: 'all .25s cubic-bezier(.4,0,.2,1)',
                  }} hover={{ borderColor: sel ? '#3B82F6' : '#93C5FD', boxShadow: '0 4px 16px rgba(59,130,246,.1)', transform: 'translateY(-2px)' }}>
                    {a.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.thumbnail_url} alt={a.avatar_name || a.name || ''} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '3/4', background: '#e4e1da' }} />
                    )}
                    {a.voice_sample_url && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (playingUrl === a.voice_sample_url) { audioRef.current?.pause(); setPlayingUrl(null); return; }
                          audioRef.current?.pause();
                          const au = new Audio(a.voice_sample_url);
                          au.play().catch(() => {});
                          au.onended = () => setPlayingUrl(null);
                          audioRef.current = au;
                          setPlayingUrl(a.voice_sample_url!);
                        }}
                        style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', borderRadius: 16, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#1F2937', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,.12)', transition: 'all .2s' }}
                      >{playingUrl === a.voice_sample_url ? '■ Stop' : '▶ Voce'}</button>
                    )}
                    <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>{a.avatar_name || a.name}</div>
                      {(a.style || a.gender) && <div style={{ fontSize: 11, color: '#6B7280' }}>{a.style || a.gender}</div>}
                    </div>
                  </Box>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — media upload */}
      {step === 2 && tpl && (
        <div>
          <div style={s('font-size:16px;font-weight:800;margin-bottom:4px')}>
            {layout === 'before_after' ? 'Carica le coppie prima/dopo'
              : singlePhoto ? 'Carica la foto'
              : layout === 'sottotitoli' ? 'Carica il tuo video (max 90s)'
              : isPhotoTemplate ? `Carica da ${minClips} a ${maxClips} foto`
              : layout === 'montaggio' ? `Carica da ${minClips} a ${maxClips} tra clip e foto`
              : `Carica da ${minClips} a ${maxClips} clip video`}
          </div>
          <div style={s('color:#8c867d;font-size:13px;margin-bottom:16px')}>{tpl.description}{isPhotoTemplate && !singlePhoto && clips.length > 1 ? ' Trascina le foto per cambiarne l\'ordine.' : ''}</div>

          {layout === 'before_after' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pairs.map(p => (
                <div key={p.id} style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center')}>
                  {(['before', 'after'] as const).map(slot => (
                    <div key={slot} onClick={() => { pairRef.current = { pairId: p.id, slot }; pairFileRef.current?.click(); }} style={{
                      flex: 1, aspectRatio: '4/3', maxWidth: 220, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', position: 'relative',
                    }}>
                      {p[slot] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p[slot]!.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#b3aca1', fontSize: 12, fontWeight: 600 }}>
                          <Icon name="image-plus" size={18} color="#b3aca1" /><div>{slot === 'before' ? 'Prima' : 'Dopo'}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setPairs(ps => ps.filter(x => x.id !== p.id))} style={{ border: 'none', background: '#f6f4f0', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={13} color="#57534c" /></button>
                </div>
              ))}
              {pairs.length < MAX_PAIRS && (
                <Box as="button" onClick={() => setPairs(ps => [...ps, { id: `${Date.now()}`, before: null, after: null, room: 'soggiorno' }])} style={s('border:1.5px dashed #d8d4cb;background:transparent;color:#8c867d;font-size:13px;font-weight:600;padding:14px;border-radius:12px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>+ Aggiungi coppia</Box>
              )}
              <input ref={pairFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) addPairFile(f); e.target.value = ''; }} />
            </div>
          ) : (
            <div onClick={clips.length === 0 && !demoMode ? () => fileRef.current?.click() : undefined}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
              style={{ border: clips.length === 0 && !demoMode ? '2px dashed #d8d4cb' : '2px solid transparent', background: '#fff', borderRadius: 16, padding: (clips.length || demoMode) ? 20 : 56, cursor: clips.length === 0 && !demoMode ? 'pointer' : 'default', textAlign: 'center' }}>
              {clips.length === 0 && demoMode && layout === 'montaggio' ? (
                <DemoMontaggioClips />
              ) : clips.length === 0 ? (
                <>
                  <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
                    <Icon name={isPhotoTemplate && layout !== 'montaggio' ? 'image-plus' : 'film'} size={24} color="#3B83F6" />
                  </div>
                  <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>Trascina qui o clicca per scegliere</div>
                  <div style={s('color:#8c867d;font-size:13px')}>{isPhotoTemplate && layout !== 'montaggio' ? 'JPG, PNG, WebP' : layout === 'montaggio' ? 'Video e foto' : 'MP4, MOV, WebM'}</div>
                </>
              ) : (
                <div style={rowLayout ? { display: 'flex', flexDirection: 'column', gap: 12 } : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {rowLayout && clips.length < maxClips && (
                    <Box onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ borderRadius: 12, border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', cursor: 'pointer', color: '#57534c', fontSize: 13.5, fontWeight: 700, background: '#fcfcfb' } as React.CSSProperties} hover={{ background: '#f6f4f0', borderColor: '#3B83F6', color: '#3B83F6' }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={15} color="#3B83F6" /></span>
                      {layout === 'montaggio' ? 'Aggiungi clip o foto' : 'Aggiungi clip'} <span style={{ color: '#a8a299', fontWeight: 600 }}>· {clips.length}/{maxClips}</span>
                    </Box>
                  )}
                  {clips.map((c, idx) => {
                    const mont = rowLayout;
                    const trimmable = !c.isPhoto && !singlePhoto && layout !== 'sottotitoli' && c.duration > 3;
                    const showRoom = !isPhotoTemplate && layout !== 'sottotitoli' && !singlePhoto;
                    if (mont) {
                      // Riga compatta con drag-and-drop. Handle a sinistra, miniatura,
                      // tipo + ambiente, trim (solo video), rimuovi a destra.
                      const isDragging = dragIdx === idx;
                      const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                      // Anteprima = frame più vicino all'inizio della selezione.
                      const previewSrc = (!c.isPhoto && c.frames && c.frames.length)
                        ? c.frames[Math.min(c.frames.length - 1, Math.max(0, Math.round((c.sourceStart / (c.duration || 1)) * (c.frames.length - 1))))]
                        : c.thumb;
                      return (
                        <div key={c.id}
                          onClick={e => e.stopPropagation()}
                          onDragOver={e => { e.preventDefault(); if (overIdx !== idx) setOverIdx(idx); }}
                          onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragIdx !== null) moveClip(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
                          style={{
                            position: 'relative', display: 'flex', gap: 12, alignItems: 'center',
                            background: '#fff', borderRadius: 12, padding: 10,
                            border: isOver ? '2px solid #3B83F6' : '1px solid #e4e1da',
                            boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.12)' : 'none',
                            opacity: isDragging ? .45 : 1, transition: 'box-shadow .15s, opacity .15s',
                          }}>
                          <div
                            draggable
                            onDragStart={() => setDragIdx(idx)}
                            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                            title="Trascina per riordinare"
                            style={{ flex: 'none', cursor: 'grab', color: '#c4bfb6', display: 'flex', alignItems: 'center', padding: '0 2px', touchAction: 'none' }}>
                            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden><circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/><circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="4" cy="16" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                          </div>
                          <div style={{ position: 'relative', width: 116, height: 78, flex: 'none', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                            {c.isPhoto && c.height > c.width && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) brightness(.85)', transform: 'scale(1.15)' }} />
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: c.isPhoto && c.height > c.width ? 'contain' : 'cover', position: 'relative' }} />
                            <span style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(33,31,28,.78)', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#57534c', background: '#f3f1ec', padding: '3px 9px', borderRadius: 99 }}>
                                <Icon name={c.isPhoto ? 'image' : 'film'} size={12} color="#57534c" />
                                {c.isPhoto ? 'Foto' : `Video · ${Math.round(c.duration)}s`}
                              </span>
                              <div style={{ flex: 1 }} />
                              {showRoom && (
                                <select value={c.room} onChange={e => setClips(cs => cs.map(x => x.id === c.id ? { ...x, room: e.target.value, roomManual: true } : x))} style={roomSelectStyle}>
                                  {ROOM_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                              )}
                              <Box as="button" onClick={() => setClips(cs => cs.filter(x => x.id !== c.id))} title="Rimuovi" style={{ flex: 'none', width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #e4e1da', cursor: 'pointer', color: '#b3aca1', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties} hover={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#dc2626' }}><Icon name="trash" size={14} color="currentColor" /></Box>
                            </div>
                            {trimmable && (
                              <>
                                <div style={{ height: 1, background: '#f0ede7' }} />
                                <TrimRange duration={c.duration} start={c.sourceStart} end={c.sourceEnd} frames={c.frames}
                                  onChange={(st, en) => setClips(cs => cs.map(x => x.id === c.id ? { ...x, sourceStart: st, sourceEnd: en } : x))} />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    // Riordino drag-and-drop quando ci sono più foto (walkthrough).
                    const reorderable = clips.length > 1 && !singlePhoto && layout !== 'sottotitoli' && layout !== 'before_after';
                    const isDragging = dragIdx === idx;
                    const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                    return (
                    <div key={c.id} onClick={e => e.stopPropagation()}
                      onDragOver={reorderable ? (e => { e.preventDefault(); if (overIdx !== idx) setOverIdx(idx); }) : undefined}
                      onDrop={reorderable ? (e => { e.preventDefault(); e.stopPropagation(); if (dragIdx !== null) moveClip(dragIdx, idx); setDragIdx(null); setOverIdx(null); }) : undefined}
                      style={{ position: 'relative', opacity: isDragging ? .45 : 1, transition: 'opacity .15s' }}>
                      <div
                        draggable={reorderable}
                        onDragStart={reorderable ? (() => setDragIdx(idx)) : undefined}
                        onDragEnd={reorderable ? (() => { setDragIdx(null); setOverIdx(null); }) : undefined}
                        style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', cursor: reorderable ? 'grab' : 'default', outline: isOver ? '2px solid #3B83F6' : 'none', outlineOffset: 2 }}>
                        {c.isPhoto && c.height > c.width && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(.85)', transform: 'scale(1.15)' }} />
                        )}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: c.isPhoto && c.height > c.width ? 'contain' : 'cover', position: 'relative' }} />
                        <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(33,31,28,.72)', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99 }}>{idx + 1}{!c.isPhoto && ` · ${Math.round(c.duration)}s`}</span>
                        <button onClick={() => setClips(cs => cs.filter(x => x.id !== c.id))} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(33,31,28,.72)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={11} color="#fff" /></button>
                      </div>
                      {showRoom && (
                        <select value={c.room} onChange={e => setClips(cs => cs.map(x => x.id === c.id ? { ...x, room: e.target.value, roomManual: true } : x))} style={{ ...inputStyle, marginTop: 6, padding: '7px 10px', fontSize: 12 }}>
                          {ROOM_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      )}
                      {trimmable && (
                        <div style={{ marginTop: 6, background: '#f6f4f0', borderRadius: 8, padding: '8px 10px' }}>
                          <TrimRange duration={c.duration} start={c.sourceStart} end={c.sourceEnd}
                            onChange={(st, en) => setClips(cs => cs.map(x => x.id === c.id ? { ...x, sourceStart: st, sourceEnd: en } : x))} />
                        </div>
                      )}
                    </div>
                  ); })}
                  {clips.length < maxClips && !rowLayout && (
                    <div style={{ aspectRatio: '4/3', borderRadius: 10, border: '1.5px dashed #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="plus" size={20} color="#b3aca1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <input ref={fileRef} type="file" accept={isPhotoTemplate && layout !== 'montaggio' ? 'image/*' : layout === 'montaggio' ? 'image/*,video/*' : 'video/*'} multiple={maxClips > 1} style={{ display: 'none' }} onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />

          {/* ai_staging inline options */}
          {layout === 'ai_staging' && clips.length > 0 && (
            <>
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px;margin-top:16px')}>
                <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Stile arredamento</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {AI_STAGING_STYLES.map(st => {
                    const sel = stagingStyle === st.id;
                    return (
                      <div key={st.id} onClick={() => setStagingStyle(st.id)} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px',
                        borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                        border: sel ? '2px solid #3B83F6' : '2px solid transparent',
                        background: sel ? '#eef4fe' : '#f6f4f0', transition: 'all .15s',
                      }}>
                        <span style={{ width: 22, height: 22, display: 'flex', color: sel ? '#1d5fd0' : '#57534c' }} dangerouslySetInnerHTML={{ __html: st.icon }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: sel ? '#1d5fd0' : '#57534c' }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px;margin-top:12px')}>
                <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Animazione</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {AI_STAGING_ANIMATION_STYLES.map(an => {
                    const sel = animStyle === an.id;
                    const meta = ANIM_META[an.id] || { desc: '', icon: '' };
                    return (
                      <div key={an.id} onClick={() => setAnimStyle(an.id)} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, cursor: 'pointer',
                        border: sel ? '2px solid #3B83F6' : '2px solid transparent',
                        background: sel ? '#eef4fe' : '#f6f4f0', transition: 'all .15s',
                      }}>
                        <span style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sel ? '#3B83F6' : '#fff', color: sel ? '#fff' : '#57534c', border: sel ? 'none' : '1px solid #e4e1da' }} dangerouslySetInnerHTML={{ __html: meta.icon }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: sel ? '#1d5fd0' : '#211f1c' }}>{an.label}</div>
                          <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 2, lineHeight: 1.35 }}>{meta.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* day_night inline option (Direzione) */}
          {layout === 'day_night' && clips.length > 0 && (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px;margin-top:16px')}>
              <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Direzione</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {DAY_NIGHT_DIRECTIONS.map(d => (
                  <div key={d.id} onClick={() => setDayNightDir(d.id)} style={{ ...cardSel(dayNightDir === d.id), textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{d.label}</div>
                ))}
              </div>
            </div>
          )}

          {/* inline music for templates that skip step 3 */}
          {inlineStep3 && (layout === 'before_after' ? pairs.some(p => p.before && p.after) : clips.length > 0) && (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px;margin-top:16px')}>
              <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Musica <span style={s('font-weight:500;color:#b3aca1;font-size:12px')}>(opzionale)</span></div>
              <Box as="button" onClick={() => setMusicOpen(o => !o)} style={s('width:100%;border:1.5px solid #d6d2c9;background:#fff;font-size:13px;font-weight:600;padding:10px 14px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between') as React.CSSProperties} hover={s('background:#faf9f7;border-color:#bdb8ae')}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: musicUrl ? '#1F2937' : '#b3aca1', fontWeight: musicUrl ? 600 : 400 }}>
                  {musicUrl ? (musicLibrary.find(t => t.url === musicUrl)?.title || 'Traccia selezionata') : 'Seleziona la musica del video...'}
                </span>
                <Icon name="chevron-down" size={14} color="#8c867d" />
              </Box>
              {musicOpen && (
                <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto', border: '1px solid #f0ede7', borderRadius: 10 }}>
                  <div onClick={() => { setMusicUrl(null); setMusicOpen(false); }} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#8c867d' }}>Nessuna musica</div>
                  {Object.keys(MOOD_LABELS).map(mood => (
                    <div key={mood}>
                      <div style={{ padding: '8px 12px 4px', fontSize: 10.5, fontWeight: 800, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.05em' }}>{MOOD_LABELS[mood]}</div>
                      {musicLibrary.filter(t => t.mood === mood).slice(0, 12).map(t => (
                        <Box key={t.id} onClick={() => { setMusicUrl(t.url); setMusicOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: musicUrl === t.url ? '#DBEAFE' : 'transparent', borderRadius: 6, border: musicUrl === t.url ? '1.5px solid #3B83F6' : '1.5px solid transparent' }} hover={{ background: musicUrl === t.url ? '#DBEAFE' : '#f6f4f0' }}>
                          <button onClick={e => { e.stopPropagation(); toggleMusicPlay(t); }} style={{ border: 'none', background: musicUrl === t.url ? '#3B83F6' : '#f0ede7', color: musicUrl === t.url ? '#fff' : '#1F2937', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 10 }}>
                            {playingUrl === t.url ? '❚❚' : '►'}
                          </button>
                          <span style={{ fontSize: 12.5, fontWeight: musicUrl === t.url ? 700 : 500, color: musicUrl === t.url ? '#1D4ED8' : '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                          {musicUrl === t.url && <Icon name="check" size={14} color="#3B83F6" />}
                        </Box>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inlineStep3 && (layout === 'before_after' ? pairs.some(p => p.before && p.after) : clips.length > 0) && (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:6px 18px 14px;margin-top:16px')}>
              {renderOutroSection()}
            </div>
          )}

          <StickyNav>
            <Box as="button" onClick={() => setStep(usesAvatar ? 1 : 0)} style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>Indietro</Box>
            {inlineStep3 ? (
              <Box as="button" onClick={() => { if (mediaReady) handleRender(); }} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 10, cursor: mediaReady ? 'pointer' : 'default', opacity: mediaReady ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 8 }} hover={mediaReady ? { background: '#2b6fe0' } : {}}>
                <Icon name="sparkles" size={16} color="#fff" />Genera video
              </Box>
            ) : (
              <Box as="button" onClick={() => { if (mediaReady) goToOptions(); }} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 10, cursor: mediaReady ? 'pointer' : 'default', opacity: mediaReady ? 1 : 0.4 }} hover={mediaReady ? { background: '#2b6fe0' } : {}}>Continua</Box>
            )}
          </StickyNav>
        </div>
      )}

      {/* STEP 3 — options (sottotitoli has its own full-width layout) */}
      {step === 3 && tpl && layout === 'sottotitoli' && (
        <div>
          {transcribing ? (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:16px;padding:48px;text-align:center;max-width:540px;margin:0 auto')}>
              <div style={{ width: 40, height: 40, border: '4px solid #eef0f3', borderTopColor: '#3B83F6', borderRadius: '50%', animation: 'export-spin .8s linear infinite', margin: '0 auto 16px' }} />
              <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>Trascrizione in corso...</div>
              <div style={s('color:#8c867d;font-size:13px')}>Stiamo analizzando l'audio del video.</div>
            </div>
          ) : sottPhase === 'edit' ? (
        <div className="max-md:!grid-cols-1 max-md:!flex max-md:!flex-col-reverse" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
              {/* left: video preview */}
              <div style={{ position: 'sticky', top: 16 }}>
                <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
                  <video
                    ref={videoPreviewRef}
                    src={videoObjUrl.current || undefined}
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onTimeUpdate={e => setVideoTime((e.target as HTMLVideoElement).currentTime)}
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onEnded={() => setVideoPlaying(false)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => { const v = videoPreviewRef.current; if (!v) return; v.paused ? v.play() : v.pause(); }}
                    style={{ border: 'none', background: '#f0ede7', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                  >{videoPlaying ? '❚❚' : '▶'}</button>
                  <input
                    type="range" min={0} max={clips[0]?.duration || 1} step={0.1} value={videoTime}
                    onChange={e => { const v = videoPreviewRef.current; if (v) v.currentTime = Number(e.target.value); }}
                    style={{ flex: 1, height: 4, accentColor: '#3B83F6' }}
                  />
                  <span style={{ fontSize: 11, color: '#8c867d', fontWeight: 600, minWidth: 32 }}>
                    {Math.floor(videoTime / 60)}:{String(Math.floor(videoTime % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
              {/* right: transcript word editor */}
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:20px')}>
                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:14px')}>
                  <div style={s('font-size:14px;font-weight:800')}>Trascrizione</div>
                  <div style={s('display:flex;align-items:center;gap:10px')}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#57534c' }}>Taglia pause e silenzi</span>
                    <div onClick={() => setAutoCut(v => !v)} style={{ width: 40, height: 24, borderRadius: 99, background: autoCut ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                      <span style={{ position: 'absolute', top: 3, left: autoCut ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#b3aca1', marginBottom: 12 }}>Clicca una parola per cercare nel video. Doppio clic per modificarla.</div>
                {transcription ? (
                  <div style={{ lineHeight: 2.2, fontSize: 14 }}>
                    {transcription.wordTimestamps.map((w, i) => {
                      const isCurrent = videoTime >= w.start && videoTime < w.end;
                      const isCut = transcription.keepSegments.length > 0 && !transcription.keepSegments.some(seg => w.start >= seg.start - 0.01 && w.end <= seg.end + 0.01);
                      return (
                        <span key={i}>
                          {editingWordIdx === i ? (
                            <input
                              autoFocus
                              defaultValue={w.word}
                              onBlur={e => {
                                const val = e.target.value.trim();
                                if (!val) {
                                  setTranscription(prev => prev ? { ...prev, wordTimestamps: prev.wordTimestamps.filter((_, idx) => idx !== i) } : prev);
                                } else if (val !== w.word) {
                                  setTranscription(prev => prev ? { ...prev, wordTimestamps: prev.wordTimestamps.map((ww, idx) => idx === i ? { ...ww, word: val } : ww) } : prev);
                                }
                                setEditingWordIdx(null);
                              }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingWordIdx(null); }}
                              style={{ border: 'none', background: '#FEF3C7', outline: '1.5px solid #F59E0B', borderRadius: 3, padding: '1px 4px', fontSize: 14, fontFamily: 'inherit', width: Math.max(40, w.word.length * 9) }}
                            />
                          ) : (
                            <span
                              onClick={() => { const v = videoPreviewRef.current; if (v) v.currentTime = w.start; }}
                              onDoubleClick={() => setEditingWordIdx(i)}
                              style={{
                                padding: '1px 3px', borderRadius: 3, cursor: 'pointer', transition: 'background .1s, color .1s',
                                background: isCurrent ? '#3B83F6' : 'transparent',
                                color: isCut && autoCut ? '#9CA3AF' : isCurrent ? '#fff' : '#1F2937',
                                textDecoration: isCut && autoCut ? 'line-through' : 'none',
                                fontWeight: isCurrent ? 600 : 400,
                              }}
                            >{w.word}</span>
                          )}
                          {' '}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div style={s('color:#b3aca1;font-size:13px;padding:20px 0;text-align:center')}>Nessuna trascrizione disponibile.</div>
                )}
                <div style={s('display:flex;justify-content:flex-end;margin-top:20px')}>
                  <Box as="button" onClick={() => setSottPhase('style')} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '11px 22px', borderRadius: 10, cursor: transcription ? 'pointer' : 'default', opacity: transcription ? 1 : 0.4 }} hover={transcription ? { background: '#2b6fe0' } : {}}>
                    Stile sottotitoli &rarr;
                  </Box>
                </div>
              </div>
            </div>
          ) : (
            /* sottPhase === 'style' */
        <div className="max-md:!grid-cols-1 max-md:!flex max-md:!flex-col-reverse" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
              {/* left: video preview (sticky) */}
              <div style={{ position: 'sticky', top: 16 }}>
                <div style={{ position: 'relative', aspectRatio: '9/16', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
                  <video
                    ref={videoPreviewRef}
                    src={videoObjUrl.current || undefined}
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onTimeUpdate={e => setVideoTime((e.target as HTMLVideoElement).currentTime)}
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onEnded={() => setVideoPlaying(false)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => { const v = videoPreviewRef.current; if (!v) return; v.paused ? v.play() : v.pause(); }}
                    style={{ border: 'none', background: '#f0ede7', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                  >{videoPlaying ? '❚❚' : '▶'}</button>
                  <input
                    type="range" min={0} max={clips[0]?.duration || 1} step={0.1} value={videoTime}
                    onChange={e => { const v = videoPreviewRef.current; if (v) v.currentTime = Number(e.target.value); }}
                    style={{ flex: 1, height: 4, accentColor: '#3B83F6' }}
                  />
                  <span style={{ fontSize: 11, color: '#8c867d', fontWeight: 600, minWidth: 32 }}>
                    {Math.floor(videoTime / 60)}:{String(Math.floor(videoTime % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
              {/* right: style picker */}
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:20px')}>
                <div style={s('font-size:14px;font-weight:800;margin-bottom:14px')}>Stile sottotitoli</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                  {SUBTITLE_STYLES.map(st => (
                    <div key={st.id} onClick={() => setSubtitleStyle(st.id)} style={{ ...cardSel(subtitleStyle === st.id), textAlign: 'center', fontSize: 12.5, fontWeight: 700 }}>{st.label}</div>
                  ))}
                </div>
                {/* property info */}
                <div style={s('border-top:1px solid #f0ede7;padding-top:16px;margin-bottom:16px')}>
                  <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Immobile <span style={s('font-weight:500;color:#b3aca1;font-size:12px')}>(opzionale)</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input value={propTitle} onChange={e => setPropTitle(e.target.value)} placeholder="Tipologia (es. Trilocale)" style={inputStyle} />
                    <input value={propAddress} onChange={e => setPropAddress(e.target.value)} placeholder="Indirizzo" style={inputStyle} />
                  </div>
                </div>
                {renderOutroSection()}
                <div style={s('display:flex;justify-content:space-between;margin-top:16px')}>
                  <Box as="button" onClick={() => setSottPhase('edit')} style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>&larr; Modifica testo</Box>
                  <Box as="button" onClick={handleRender} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                    <Icon name="sparkles" size={16} color="#fff" />Genera video
                  </Box>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — options (montaggio: cover → logo → music phases) */}
      {step === 3 && tpl && layout === 'montaggio' && (
        <div>
          {montaggioPhase === 'cover' && (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px')}>
              <div style={s('font-size:16px;font-weight:800;margin-bottom:4px')}>Cover di apertura</div>
              <div style={s('color:#8c867d;font-size:13px;margin-bottom:16px')}>Inserisci il titolo che apparirà nella schermata iniziale del video.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={coverTitle} onChange={e => setCoverTitle(e.target.value)} maxLength={80} placeholder="Inserisci qui il titolo del video..." style={inputStyle} />
                <input value={coverAddress} onChange={e => setCoverAddress(e.target.value)} maxLength={100} placeholder="Scrivi qui l'indirizzo dell'immobile... (opzionale)" style={inputStyle} />
                {(() => {
                  const logoOpts = coverLogoItems.filter(i => i.src);
                  const hasAnyLogo = logoOpts.length > 0;
                  const toggleLogo = () => {
                    if (!hasAnyLogo) return;
                    setCoverLogoOn(v => {
                      const next = !v;
                      if (next && !coverLogoUrl) setCoverLogoKey(logoOpts[0].key); // assicura una scelta valida
                      return next;
                    });
                  };
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0ede7', borderBottom: coverLogoOn ? 'none' : '1px solid #f0ede7', padding: '14px 0', margin: '4px 0 0' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Aggiungi logo</span>
                        <div onClick={toggleLogo} title={hasAnyLogo ? '' : 'Carica un logo nella sezione Brand'} style={{ width: 40, height: 24, borderRadius: 99, background: coverLogoOn && hasAnyLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: hasAnyLogo ? 'pointer' : 'not-allowed', opacity: hasAnyLogo ? 1 : .5, transition: 'background .2s' }}>
                          <span style={{ position: 'absolute', top: 3, left: coverLogoOn && hasAnyLogo ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                        </div>
                      </div>
                      {/* Picker: quale logo usare (come nei post) */}
                      {coverLogoOn && hasAnyLogo && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 0', borderBottom: '1px solid #f0ede7', margin: '0 0 4px' }}>
                          {logoOpts.map(it => {
                            const sel = coverLogoKey === it.key;
                            return (
                              <Box key={it.key} onClick={() => setCoverLogoKey(it.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', borderRadius: 10, cursor: 'pointer', border: sel ? '2px solid #3B83F6' : '1px solid #e4e1da', background: sel ? '#eff6ff' : '#fff' } as React.CSSProperties} hover={sel ? undefined : { background: '#f6f4f0' }}>
                                <span style={{ width: 38, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: it.dark ? '#211f1c' : '#f1efe9', overflow: 'hidden' }}>
                                  {it.src
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={it.src} alt="" style={{ maxWidth: '82%', maxHeight: '74%', objectFit: 'contain' }} />
                                    : <Icon name="sparkles" size={13} color="#8c867d" />}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: sel ? 700 : 600, color: sel ? '#1d5fd0' : '#57534c' }}>{it.label}</span>
                              </Box>
                            );
                          })}
                        </div>
                      )}
                      <div style={s('font-size:12.5px;font-weight:700;color:#57534c;margin-top:8px')}>Scegli una copertina</div>
                      <CoverStylesGrid
                        thumbUrl={clips[0]?.thumb || ''}
                        logoUrl={coverLogoUrl}
                        title={coverTitle}
                        address={coverAddress}
                        brandColor={brand.primaryColor || '#3B82F6'}
                        isPortrait={clips.filter(c => c.height >= c.width).length >= clips.length / 2}
                        selected={coverStyle}
                        onSelect={setCoverStyle}
                        styles={COVER_STYLES}
                      />
                    </>
                  );
                })()}
              </div>
              <StickyNav bleed={24}>
                <Box as="button" onClick={() => setStep(2)} style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>Indietro</Box>
                {(() => {
                  const ok = !!coverTitle.trim() && !!coverStyle;
                  return (
                    <Box as="button" onClick={() => { if (ok) setMontaggioPhase('logo'); }} title={ok ? '' : (!coverTitle.trim() ? 'Inserisci un titolo per la copertina' : 'Scegli una copertina')} style={{ border: 'none', background: '#3B83F6', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '11px 22px', borderRadius: 10, cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.45 }} hover={ok ? { background: '#2b6fe0' } : {}}>Avanti</Box>
                  );
                })()}
              </StickyNav>
            </div>
          )}
          {montaggioPhase === 'logo' && (
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px')}>
              <div style={s('font-size:16px;font-weight:800;margin-bottom:4px')}>Logo e watermark</div>
              <div style={s('color:#8c867d;font-size:13px;margin-bottom:16px')}>Configura il logo sovrapposto alle clip del video.</div>
              {(() => {
                const whiteLogo = (brand.logoOrientation === 'vertical' ? (brand.logos.logo_white_v || brand.logos.logo_white_h) : (brand.logos.logo_white_h || brand.logos.logo_white_v)) || '';
                const posStyle: Record<string, React.CSSProperties> = {
                  'top-left': { top: 10, left: 10 }, 'top-right': { top: 10, right: 10 },
                  'bottom-left': { bottom: 10, left: 10 }, 'bottom-right': { bottom: 10, right: 10 },
                };
                return (
                  <>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;padding-bottom:14px')}>
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>Logo nelle clip</span>
                      <div onClick={() => { if (whiteLogo) setWatermarkEnabled(v => !v); }} title={whiteLogo ? '' : 'Carica un logo bianco in Brand'} style={{ width: 40, height: 24, borderRadius: 99, background: watermarkEnabled && whiteLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: whiteLogo ? 'pointer' : 'not-allowed', opacity: whiteLogo ? 1 : .5, transition: 'background .2s' }}>
                        <span style={{ position: 'absolute', top: 3, left: watermarkEnabled && whiteLogo ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                      </div>
                    </div>
                    <div style={{ height: 1, background: '#f0ede7', margin: '0 0 16px' }} />
                    {!whiteLogo && <div style={{ fontSize: 12.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>Nessun logo bianco configurato. Caricalo nella sezione Brand per usare il watermark.</div>}
                    {watermarkEnabled && whiteLogo && (
                      <div className="max-md:!flex-col" style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
                        {/* Sinistra: anteprima */}
                        <div className="max-md:!w-full" style={{ position: 'relative', width: 480, flex: 'none', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#211f1c' }}>
                          {clips[0]?.thumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={clips[0].thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          {/* logo piccolo: rispecchia la dimensione reale dell'export */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={whiteLogo} alt="" style={{ position: 'absolute', maxWidth: '15%', maxHeight: '12%', objectFit: 'contain', opacity: watermarkOpacity / 100, ...posStyle[watermarkPosition] }} />
                        </div>
                        {/* Destra: posizione + opacità, alta quanto la foto */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <div style={s('font-size:12.5px;font-weight:700;color:#57534c;margin-bottom:8px')}>Posizione</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 8, flex: 1, marginBottom: 18, minHeight: 120 }}>
                            {[{ id: 'top-left', arrow: '↖', text: 'Alto sinistra' }, { id: 'top-right', arrow: '↗', text: 'Alto destra' }, { id: 'bottom-left', arrow: '↙', text: 'Basso sinistra' }, { id: 'bottom-right', arrow: '↘', text: 'Basso destra' }].map(pos => (
                              <div key={pos.id} onClick={() => setWatermarkPosition(pos.id)} style={{ ...cardSel(watermarkPosition === pos.id), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                                <span style={{ fontSize: 15 }}>{pos.arrow}</span>
                                <span>{pos.text}</span>
                              </div>
                            ))}
                          </div>
                          <div style={s('font-size:12.5px;font-weight:700;color:#57534c;margin-bottom:8px')}>Opacità: {watermarkOpacity}%</div>
                          <input type="range" min={10} max={100} step={5} value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))} style={{ width: '100%', accentColor: '#3B83F6' }} />
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              {/* Musica (unita allo stesso step) */}
              <div style={s('border-top:1px solid #f0ede7;padding-top:18px;margin-top:18px')}>
                <div style={s('font-size:14px;font-weight:800;margin-bottom:4px')}>Musica <span style={s('font-weight:500;color:#b3aca1;font-size:12px')}>(opzionale)</span></div>
                <div style={s('color:#8c867d;font-size:13px;margin-bottom:12px')}>Scegli la colonna sonora del video.</div>
                <Box as="button" onClick={() => setMusicOpen(o => !o)} style={s('width:100%;border:1.5px solid #d6d2c9;background:#fff;font-size:13px;font-weight:600;padding:10px 14px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between') as React.CSSProperties} hover={s('background:#faf9f7;border-color:#bdb8ae')}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: musicUrl ? '#1F2937' : '#b3aca1', fontWeight: musicUrl ? 600 : 400 }}>
                    {musicUrl ? (musicLibrary.find(t => t.url === musicUrl)?.title || 'Traccia selezionata') : 'Seleziona la musica del video...'}
                  </span>
                  <Icon name="chevron-down" size={14} color="#8c867d" />
                </Box>
                {musicOpen && (
                  <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto', border: '1px solid #f0ede7', borderRadius: 10 }}>
                    <div onClick={() => { setMusicUrl(null); setMusicOpen(false); }} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#8c867d' }}>Nessuna musica</div>
                    {Object.keys(MOOD_LABELS).map(mood => (
                      <div key={mood}>
                        <div style={{ padding: '8px 12px 4px', fontSize: 10.5, fontWeight: 800, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.05em' }}>{MOOD_LABELS[mood]}</div>
                        {musicLibrary.filter(t => t.mood === mood).slice(0, 12).map(t => (
                          <Box key={t.id} onClick={() => { setMusicUrl(t.url); setMusicOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: musicUrl === t.url ? '#DBEAFE' : 'transparent', borderRadius: 6, border: musicUrl === t.url ? '1.5px solid #3B83F6' : '1.5px solid transparent' }} hover={{ background: musicUrl === t.url ? '#DBEAFE' : '#f6f4f0' }}>
                            <button onClick={e => { e.stopPropagation(); toggleMusicPlay(t); }} style={{ border: 'none', background: musicUrl === t.url ? '#3B83F6' : '#f0ede7', color: musicUrl === t.url ? '#fff' : '#1F2937', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 10 }}>
                              {playingUrl === t.url ? '❚❚' : '►'}
                            </button>
                            <span style={{ fontSize: 12.5, fontWeight: musicUrl === t.url ? 700 : 500, color: musicUrl === t.url ? '#1D4ED8' : '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                            {musicUrl === t.url && <Icon name="check" size={14} color="#3B83F6" />}
                          </Box>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:6px 18px 14px;margin-top:14px')}>
                {renderOutroSection()}
              </div>
              <StickyNav bleed={24}>
                <Box as="button" onClick={() => setMontaggioPhase('cover')} style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>Indietro</Box>
                <Box as="button" onClick={handleRender} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                  <Icon name="sparkles" size={16} color="#fff" />Genera video
                </Box>
              </StickyNav>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — options (avatar: tutto in colonna unica) */}
      {step === 3 && tpl && !inlineStep3 && layout !== 'sottotitoli' && layout !== 'montaggio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* script editor (classic/split) */}
            {usesAvatar && (
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:20px')}>
                <div style={s('font-size:14px;font-weight:800;margin-bottom:12px')}>Script del presentatore</div>
                {scriptLoading ? (
                  <div style={s('display:flex;align-items:center;gap:12px;color:#8c867d;font-size:13px;padding:20px 0')}>
                    <div style={{ width: 22, height: 22, border: '3px solid #eef0f3', borderTopColor: '#3B83F6', borderRadius: '50%', animation: 'export-spin .8s linear infinite' }} />
                    Generazione script con AI...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sections.map(sec => {
                      const wc = sec.text.trim() ? sec.text.trim().split(/\s+/).length : 0;
                      const over = sec.maxWords ? wc > sec.maxWords : false;
                      return (
                      <div key={sec.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <label style={s('font-size:12px;font-weight:700;color:#57534c')}>{sec.label}</label>
                          {sec.maxWords ? <span style={{ fontSize: 11, fontWeight: 600, color: over ? '#dc2626' : '#b3aca1' }}>{wc}/{sec.maxWords} parole</span> : null}
                        </div>
                        <textarea value={sec.text} onChange={e => {
                          let v = e.target.value;
                          if (sec.maxWords) {
                            const words = v.split(/\s+/);
                            // cap solo quando si supera (mantiene gli spazi durante la digitazione)
                            if (words.filter(Boolean).length > sec.maxWords) v = words.filter(Boolean).slice(0, sec.maxWords).join(' ');
                          }
                          setSections(ss => ss.map(x => x.id === sec.id ? { ...x, text: v } : x));
                        }} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* musica + copertina + CTA (impilati) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {usesMusic && (
              <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:18px')}>
                <div style={s('font-size:13px;font-weight:800;margin-bottom:10px')}>Musica</div>
                <Box as="button" onClick={() => setMusicOpen(o => !o)} style={s('width:100%;border:1.5px solid #d6d2c9;background:#fff;font-size:13px;font-weight:600;padding:10px 14px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between') as React.CSSProperties} hover={s('background:#faf9f7;border-color:#bdb8ae')}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: musicUrl ? '#1F2937' : '#b3aca1', fontWeight: musicUrl ? 600 : 400 }}>
                    {musicUrl ? (musicLibrary.find(t => t.url === musicUrl)?.title || 'Traccia selezionata') : 'Seleziona la musica del video...'}
                  </span>
                  <Icon name="chevron-down" size={14} color="#8c867d" />
                </Box>
                {musicOpen && (
                  <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto', border: '1px solid #f0ede7', borderRadius: 10 }}>
                    <div onClick={() => { setMusicUrl(null); setMusicOpen(false); }} style={{ padding: '9px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#8c867d' }}>Nessuna musica</div>
                    {Object.keys(MOOD_LABELS).map(mood => (
                      <div key={mood}>
                        <div style={{ padding: '8px 12px 4px', fontSize: 10.5, fontWeight: 800, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.05em' }}>{MOOD_LABELS[mood]}</div>
                        {musicLibrary.filter(t => t.mood === mood).slice(0, 12).map(t => (
                          <Box key={t.id} onClick={() => { setMusicUrl(t.url); setMusicOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: musicUrl === t.url ? '#DBEAFE' : 'transparent', borderRadius: 6, border: musicUrl === t.url ? '1.5px solid #3B83F6' : '1.5px solid transparent' }} hover={{ background: musicUrl === t.url ? '#DBEAFE' : '#f6f4f0' }}>
                            <button onClick={e => { e.stopPropagation(); toggleMusicPlay(t); }} style={{ border: 'none', background: musicUrl === t.url ? '#3B83F6' : '#f0ede7', color: musicUrl === t.url ? '#fff' : '#1F2937', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 10 }}>
                              {playingUrl === t.url ? '❚❚' : '►'}
                            </button>
                            <span style={{ fontSize: 12.5, fontWeight: musicUrl === t.url ? 700 : 500, color: musicUrl === t.url ? '#1D4ED8' : '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.title}</span>
                            {musicUrl === t.url && <Icon name="check" size={14} color="#3B83F6" />}
                          </Box>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:6px 18px 14px')}>
              {renderOutroSection()}
            </div>
            <StickyNav align="center">
              <Box as="button" onClick={() => setStep(2)} style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>Indietro</Box>
              <Box as="button" onClick={handleRender} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:14px 22px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                <Icon name="sparkles" size={16} color="#fff" />Genera video
              </Box>
            </StickyNav>
          </div>
        </div>
      )}

      {/* STEP 4 — render progress / result */}
      {step === 4 && (
        <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:16px;padding:48px;max-width:640px;margin:0 auto')}>
          {renderStage === 'done' && outputUrl ? (
            <div style={{ textAlign: 'center' }}>
              <div style={s('width:52px;height:52px;border-radius:16px;background:#e9f9f0;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
                <Icon name="check" size={24} color="#10b981" />
              </div>
              <div style={s('font-size:17px;font-weight:800;margin-bottom:14px')}>Il tuo video è pronto</div>
              <video src={outputUrl} controls playsInline style={{ width: '100%', maxHeight: 420, borderRadius: 12, background: '#000', marginBottom: 18 }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Box as="a" {...({ href: outputUrl, download: 'video-ai.mp4', target: '_blank', rel: 'noopener' } as Record<string, unknown>)} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px') as React.CSSProperties} hover={s('background:#2b6fe0')}>
                  <Icon name="download" size={15} color="#fff" />Scarica video
                </Box>
                <Box as="button" onClick={startNew} style={s('border:1px solid #e4e1da;background:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#f6f4f0')}>Nuovo video</Box>
              </div>
            </div>
          ) : renderStage === 'failed' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={s('width:52px;height:52px;border-radius:16px;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}>
                <Icon name="x" size={24} color="#dc2626" />
              </div>
              <div style={s('font-size:16px;font-weight:800;margin-bottom:8px')}>Generazione non riuscita</div>
              <div style={s('color:#8c867d;font-size:13.5px;margin-bottom:20px')}>{renderError}</div>
              <Box as="button" onClick={startNew} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#2b6fe0')}>Riprova</Box>
            </div>
          ) : renderStage === 'background' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Cerchi che pulsano dietro, molto fade */}
                <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite' }} />
                <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite', animationDelay: '1.4s' }} />
                {/* Blob blu che si muove dietro il logo */}
                <div style={{ position: 'absolute', width: 72, height: 72, background: 'radial-gradient(circle at 30% 26%, #AECBFF 0%, #3B83F6 46%, #5B6CF0 100%)', opacity: .95, boxShadow: '0 0 30px rgba(91,108,240,.45), 0 0 14px rgba(59,131,246,.55)', animation: 'organic-blob 8s ease-in-out infinite' }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dashboard/logo-mark-white.svg" alt="" style={{ position: 'relative', width: 56, height: 56, animation: 'aurora-pulse 4s ease-in-out infinite' }} />
              </div>
              <div style={s('font-size:17px;font-weight:800;margin-bottom:6px')}>Video in elaborazione</div>
              <div style={s('color:#8c867d;font-size:13.5px;max-width:420px;margin:0 auto 24px')}>
                Gira in background: puoi cambiare sezione o chiudere la pagina. Lo trovi nel tray <b>Lavori in corso</b> in alto a destra e poi in <b>Media</b>.
              </div>
              <Box as="button" onClick={startNew} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#2b6fe0')}>Nuovo video</Box>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Cerchi che pulsano dietro, molto fade */}
                <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite' }} />
                <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite', animationDelay: '1.4s' }} />
                {/* Blob blu che si muove dietro il logo */}
                <div style={{ position: 'absolute', width: 72, height: 72, background: 'radial-gradient(circle at 30% 26%, #AECBFF 0%, #3B83F6 46%, #5B6CF0 100%)', opacity: .95, boxShadow: '0 0 30px rgba(91,108,240,.45), 0 0 14px rgba(59,131,246,.55)', animation: 'organic-blob 8s ease-in-out infinite' }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dashboard/logo-mark-white.svg" alt="" style={{ position: 'relative', width: 56, height: 56, animation: 'aurora-pulse 4s ease-in-out infinite' }} />
              </div>
              <div style={s('font-size:16px;font-weight:800;margin-bottom:6px')}>
                {renderStage === 'uploading' ? 'Caricamento file...'
                  : renderStage === 'avatar' ? 'Sintesi avatar...'
                  : 'Montaggio video...'}
              </div>
              <div style={s('color:#8c867d;font-size:13px;margin-bottom:18px')}>
                {usesAvatar ? 'Può richiedere fino a 10-15 minuti. Non chiudere la pagina.' : 'Può richiedere qualche minuto. Non chiudere la pagina.'}
              </div>
              <div style={{ width: '100%', maxWidth: 360, height: 6, borderRadius: 3, background: '#f0ede7', overflow: 'hidden', margin: '0 auto' }}>
                <div style={{ height: '100%', borderRadius: 3, background: '#3B83F6', width: `${Math.round(renderProgress * 100)}%`, transition: 'width .4s' }} />
              </div>
            </div>
          )}
        </div>
      )}
      {packsOpen && <VideoPacksModal onClose={() => setPacksOpen(false)} />}
    </div>
  );
}
