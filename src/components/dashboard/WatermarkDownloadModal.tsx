'use client';

import { useEffect, useRef, useState } from 'react';
import { s, Box, Icon } from './ui';
import { fetchBrand } from '@/lib/brand';

type Pos = 'tl' | 'tr' | 'bl' | 'br' | 'center';
const SIZES: Record<string, number> = { S: 0.12, M: 0.18, L: 0.26 };
// Free / nessun logo agenzia → loghi GetNearMe di default tra cui scegliere.
const GNM_DEFAULTS = ['/assets/svg/logo_scritta_black_circle.svg', '/assets/svg/logo_scritta_white_circle.svg', '/dashboard/logo.svg'];

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

function drawLogo(ctx: CanvasRenderingContext2D, w: number, h: number, logo: HTMLImageElement, pos: Pos, sizePct: number) {
  const lw = w * sizePct;
  const lh = lw * (logo.naturalHeight / logo.naturalWidth || 1);
  const pad = w * 0.03;
  const [x, y] = place(pos, w, h, lw, lh, pad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logo, x, y, lw, lh);
}

// Compone immagine + logo → blob JPEG a piena risoluzione.
async function composeBlob(imgUrl: string, logo: HTMLImageElement | null, pos: Pos, sizePct: number): Promise<Blob> {
  const im = await loadViaBlob(imgUrl);
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(im, 0, 0);
  if (logo) drawLogo(ctx, c.width, c.height, logo, pos, sizePct);
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.92));
}

export default function WatermarkDownloadModal({
  imageUrl,
  images,
  filename = 'homestaging-ai.jpg',
  zipName = 'getnearme-foto',
  onClose,
  lockBrand = false,
}: {
  imageUrl?: string;
  images?: string[];
  filename?: string;
  zipName?: string;
  onClose: () => void;
  // Piano Free: il logo GetNearMe e' obbligatorio, non si puo' togliere.
  lockBrand?: boolean;
}) {
  const list = (images && images.length ? images : (imageUrl ? [imageUrl] : []));
  const isBatch = list.length > 1;
  const previewUrl = list[0];

  const [logoOpts, setLogoOpts] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [withLogo, setWithLogo] = useState(true);
  const [pos, setPos] = useState<Pos>('br');
  const [size, setSize] = useState<keyof typeof SIZES>('M');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false); // conferma breve prima di chiudere
  const [prog, setProg] = useState(0); // foto fatte (batch)
  const imgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (previewUrl) {
          imgRef.current = await loadViaBlob(previewUrl);
          if (alive) drawPreview(); // disegna appena l'immagine e' pronta (no race col logo)
        }
      } catch { /* */ }
      let opts = GNM_DEFAULTS;
      try {
        const { settings } = await fetchBrand();
        const l = settings?.logos;
        const custom = [l?.logo_colored_h, l?.logo_black_h, l?.logo_white_h, l?.logo_colored_v, l?.logo_black_v, l?.logo_white_v].filter(Boolean) as string[];
        if (custom.length) opts = custom;
      } catch { /* default */ }
      if (alive) { setLogoOpts(opts); setLogoUrl(opts[0]); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  useEffect(() => {
    let alive = true;
    (async () => {
      logoRef.current = logoUrl ? await loadViaBlob(logoUrl).catch(() => null) : null;
      if (alive) drawPreview();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoUrl]);

  useEffect(() => { drawPreview(); /* eslint-disable-next-line */ }, [withLogo, pos, size]);

  function drawPreview() {
    const cv = previewRef.current, img = imgRef.current;
    if (!cv || !img) return;
    const cap = 900;
    const scale = Math.min(1, cap / img.naturalWidth);
    cv.width = Math.round(img.naturalWidth * scale);
    cv.height = Math.round(img.naturalHeight * scale);
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (withLogo && logoRef.current) drawLogo(ctx, cv.width, cv.height, logoRef.current, pos, SIZES[size]);
  }

  function saveBlob(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  async function download() {
    if (busy || done || !list.length) return;
    setBusy(true); setProg(0);
    const logo = withLogo ? logoRef.current : null;
    try {
      if (isBatch) {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        let n = 0;
        for (let i = 0; i < list.length; i++) {
          try { zip.file(`foto_${i + 1}.jpg`, await composeBlob(list[i], logo, pos, SIZES[size])); n++; } catch { /* skip */ }
          setProg(i + 1);
        }
        if (!n) throw new Error('nessuna foto');
        saveBlob(await zip.generateAsync({ type: 'blob' }), `${zipName}.zip`);
      } else {
        saveBlob(await composeBlob(list[0], logo, pos, SIZES[size]), filename);
      }
      // Conferma visibile prima di chiudere (la singola è troppo veloce).
      setBusy(false); setDone(true);
      setTimeout(onClose, 1100);
    } catch { setBusy(false); }
  }

  const corner = (p: Pos): React.CSSProperties => {
    if (p === 'center') return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    return {
      top: p[0] === 't' ? 4.5 : undefined, bottom: p[0] === 'b' ? 4.5 : undefined,
      left: p[1] === 'l' ? 4.5 : undefined, right: p[1] === 'r' ? 4.5 : undefined,
    };
  };
  const posList: Pos[] = ['tl', 'tr', 'center', 'bl', 'br'];
  const spinner = <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.45)', borderTopColor: '#fff', animation: 'export-spin 1s linear infinite', display: 'inline-block' }} />;

  return (
    <div onClick={(busy || done) ? undefined : onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,18,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 396, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f0ede7' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#211f1c' }}>{isBatch ? `Scarica ${list.length} foto` : 'Scarica foto'}</div>
          <Box as="button" onClick={onClose} disabled={busy} aria-label="Chiudi" style={s('border:none;background:transparent;width:29px;height:29px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="x" size={16} color="#57534c" /></Box>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ borderRadius: 11, overflow: 'hidden', border: '1px solid #e4e1da', marginBottom: 14, lineHeight: 0 }}>
            <canvas ref={previewRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
          {isBatch && <div style={{ fontSize: 10.5, color: '#8c867d', marginTop: -7, marginBottom: 13 }}>Il logo scelto verrà applicato a tutte le {list.length} foto.</div>}

          <Box
            onClick={() => { if (lockBrand) return; setWithLogo((v) => !v); }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9, border: '1px solid #e4e1da', cursor: lockBrand ? 'not-allowed' : 'pointer', marginBottom: withLogo ? 13 : 0, opacity: lockBrand ? 0.85 : 1 }}
            hover={lockBrand ? {} : { background: '#faf9f7' }}
          >
            <Icon name={lockBrand ? 'lock' : 'image'} size={14} color={withLogo ? '#211f1c' : '#b3aca1'} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: withLogo ? '#211f1c' : '#8c867d' }}>{lockBrand ? 'Logo GetNearMe (piano Free)' : 'Aggiungi logo'}</div>
            <div style={{ width: 32, height: 18, borderRadius: 89, background: withLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: withLogo ? 16 : 2, width: 14, height: 14, borderRadius: 89, background: '#fff', transition: 'left .2s' }} />
            </div>
          </Box>

          {withLogo && (
            <>
              {logoOpts.length > 1 && (
                <>
                  <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:13px 0 7px')}>Logo</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 13 }}>
                    {logoOpts.map((u) => (
                      <Box key={u} onClick={() => setLogoUrl(u)} style={{ width: 79, height: 41, borderRadius: 8, border: `2px solid ${logoUrl === u ? '#3B83F6' : '#e4e1da'}`, background: '#e9e6df', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 5, cursor: 'pointer' }} hover={{ borderColor: '#3B83F6' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </Box>
                    ))}
                  </div>
                </>
              )}

              <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 7px')}>Posizione</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, marginBottom: 13 }}>
                {posList.map((p) => (
                  <Box key={p} onClick={() => setPos(p)} style={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 7, border: `1.5px solid ${pos === p ? '#3B83F6' : '#e4e1da'}`, background: pos === p ? '#eef4fe' : '#fff', cursor: 'pointer' }} hover={{ borderColor: '#3B83F6' }}>
                    <span style={{ position: 'absolute', width: 8, height: 8, borderRadius: 2, background: pos === p ? '#3B83F6' : '#b3aca1', ...corner(p) }} />
                  </Box>
                ))}
              </div>

              <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 7px')}>Dimensione</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((k) => (
                  <Box key={k} onClick={() => setSize(k)} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, border: `1.5px solid ${size === k ? '#3B83F6' : '#e4e1da'}`, background: size === k ? '#eef4fe' : '#fff', color: size === k ? '#1d5fd0' : '#8c867d', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }} hover={{ borderColor: '#3B83F6' }}>{k === 'S' ? 'Piccolo' : k === 'M' ? 'Medio' : 'Grande'}</Box>
                ))}
              </div>
            </>
          )}

          <Box as="button" onClick={download} disabled={busy || done} style={{ width: '100%', marginTop: 14, border: 'none', background: done ? '#16a34a' : busy ? '#9bbef8' : '#3B83F6', color: '#fff', fontSize: 13.5, fontWeight: 700, padding: '12px 0', borderRadius: 10, cursor: (busy || done) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background .2s' }} hover={(busy || done) ? {} : s('background:#2563EB')}>
            {done
              ? <><Icon name="check" size={15} color="#fff" />Scaricata!</>
              : busy
                ? <>{spinner}{isBatch ? `Preparo ${prog}/${list.length}…` : 'Preparo…'}</>
                : <><Icon name="download" size={14} color="#fff" />{isBatch ? `Scarica tutte (${list.length})` : (withLogo ? 'Scarica con logo' : 'Scarica')}</>}
          </Box>
        </div>
      </div>
    </div>
  );
}
