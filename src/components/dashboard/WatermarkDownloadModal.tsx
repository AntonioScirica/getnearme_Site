'use client';

import { useEffect, useRef, useState } from 'react';
import { s, Box, Icon } from './ui';
import { fetchBrand } from '@/lib/brand';

type Pos = 'tl' | 'tr' | 'bl' | 'br' | 'center';
const SIZES: Record<string, number> = { S: 0.12, M: 0.18, L: 0.26 };

// Carica un'immagine via blob (object URL) → canvas non "tainted", toBlob ok.
async function loadViaBlob(url: string): Promise<HTMLImageElement> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const obj = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = obj;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(obj), 10000);
  }
}

function place(pos: Pos, w: number, h: number, lw: number, lh: number, pad: number) {
  switch (pos) {
    case 'tl': return [pad, pad];
    case 'tr': return [w - lw - pad, pad];
    case 'bl': return [pad, h - lh - pad];
    case 'br': return [w - lw - pad, h - lh - pad];
    default: return [(w - lw) / 2, (h - lh) / 2];
  }
}

async function compose(img: HTMLImageElement, logo: HTMLImageElement | null, pos: Pos, sizePct: number): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  if (logo) {
    const lw = c.width * sizePct;
    const lh = lw * (logo.naturalHeight / logo.naturalWidth || 1);
    const pad = c.width * 0.03;
    const [x, y] = place(pos, c.width, c.height, lw, lh, pad);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = c.width * 0.008;
    ctx.drawImage(logo, x, y, lw, lh);
    ctx.restore();
  }
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.92));
}

export default function WatermarkDownloadModal({
  imageUrl,
  filename = 'homestaging-ai.jpg',
  onClose,
}: {
  imageUrl: string;
  filename?: string;
  onClose: () => void;
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [withLogo, setWithLogo] = useState(true);
  const [pos, setPos] = useState<Pos>('br');
  const [size, setSize] = useState<keyof typeof SIZES>('M');
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // Carica brand (logo) + immagine all'apertura.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { settings } = await fetchBrand();
        const l = settings?.logos;
        const url = l?.logo_colored_h || l?.logo_black_h || l?.logo_colored_v || l?.logo_black_v || l?.logo_white_h || l?.logo_white_v || null;
        if (alive) { setLogoUrl(url); if (!url) setWithLogo(false); }
        if (url) logoRef.current = await loadViaBlob(url).catch(() => null);
      } catch { if (alive) { setWithLogo(false); } }
      try { imgRef.current = await loadViaBlob(imageUrl); } catch { /* preview off */ }
      if (alive) drawPreview();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Ridisegna l'anteprima al cambio opzioni.
  useEffect(() => { drawPreview(); /* eslint-disable-next-line */ }, [withLogo, pos, size, logoUrl]);

  function drawPreview() {
    const cv = previewRef.current, img = imgRef.current;
    if (!cv || !img) return;
    const maxW = 360;
    const scale = Math.min(1, maxW / img.naturalWidth);
    cv.width = Math.round(img.naturalWidth * scale);
    cv.height = Math.round(img.naturalHeight * scale);
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    const logo = logoRef.current;
    if (withLogo && logo) {
      const lw = cv.width * SIZES[size];
      const lh = lw * (logo.naturalHeight / logo.naturalWidth || 1);
      const pad = cv.width * 0.03;
      const [x, y] = place(pos, cv.width, cv.height, lw, lh, pad);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = cv.width * 0.012;
      ctx.drawImage(logo, x, y, lw, lh); ctx.restore();
    }
  }

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const img = imgRef.current || await loadViaBlob(imageUrl);
      const blob = await compose(img, withLogo ? logoRef.current : null, pos, SIZES[size]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      onClose();
    } finally { setBusy(false); }
  }

  const posBtns: { id: Pos; label: string }[] = [
    { id: 'tl', label: '↖' }, { id: 'tr', label: '↗' },
    { id: 'center', label: '◎' },
    { id: 'bl', label: '↙' }, { id: 'br', label: '↘' },
  ];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,18,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #f0ede7' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#211f1c' }}>Scarica foto</div>
          <Box as="button" onClick={onClose} aria-label="Chiudi" style={s('border:none;background:transparent;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="x" size={18} color="#57534c" /></Box>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e4e1da', background: '#faf9f7', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <canvas ref={previewRef} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
          </div>

          {logoUrl ? (
            <>
              <Box onClick={() => setWithLogo((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1px solid #e4e1da', cursor: 'pointer', marginBottom: withLogo ? 14 : 0 }} hover={{ background: '#faf9f7' }}>
                <Icon name="image" size={16} color={withLogo ? '#211f1c' : '#b3aca1'} />
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: withLogo ? '#211f1c' : '#8c867d' }}>Aggiungi il tuo logo</div>
                <div style={{ width: 36, height: 20, borderRadius: 99, background: withLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: withLogo ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: '#fff', transition: 'left .2s' }} />
                </div>
              </Box>

              {withLogo && (
                <>
                  <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 8px')}>Posizione</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
                    {posBtns.map((p) => (
                      <Box key={p.id} onClick={() => setPos(p.id)} style={{ textAlign: 'center', padding: '10px 0', borderRadius: 9, border: `1.5px solid ${pos === p.id ? '#3B83F6' : '#e4e1da'}`, background: pos === p.id ? '#eef4fe' : '#fff', color: pos === p.id ? '#1d5fd0' : '#8c867d', fontSize: 17, cursor: 'pointer' }} hover={{ borderColor: '#3B83F6' }}>{p.label}</Box>
                    ))}
                  </div>
                  <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 8px')}>Dimensione</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((k) => (
                      <Box key={k} onClick={() => setSize(k)} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 9, border: `1.5px solid ${size === k ? '#3B83F6' : '#e4e1da'}`, background: size === k ? '#eef4fe' : '#fff', color: size === k ? '#1d5fd0' : '#8c867d', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} hover={{ borderColor: '#3B83F6' }}>{k === 'S' ? 'Piccolo' : k === 'M' ? 'Medio' : 'Grande'}</Box>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: '#8c867d', background: '#faf9f7', border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 12px' }}>
              Nessun logo impostato. Caricane uno in <b>Brand</b> per applicarlo alle foto.
            </div>
          )}

          <Box as="button" onClick={download} disabled={busy} style={{ width: '100%', marginTop: 16, border: 'none', background: busy ? '#9bbef8' : '#3B83F6', color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 0', borderRadius: 11, cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} hover={busy ? {} : s('background:#2563EB')}>
            {busy ? 'Preparo…' : <><Icon name="download" size={16} color="#fff" />{withLogo && logoUrl ? 'Scarica con logo' : 'Scarica'}</>}
          </Box>
        </div>
      </div>
    </div>
  );
}
