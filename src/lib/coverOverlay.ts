// coverOverlay.ts
// Port 1:1 di sidepanel/cover-overlay-renderer.js dell'estensione.
// Disegna su un canvas l'overlay della cover del montaggio (dim + logo + titolo
// per i 9 stili). Lambda riceve il PNG renderizzato via R2 e lo sovrappone —
// nessuna logica drawtext per-stile lato FFmpeg.

export const COVER_OVERLAY_STYLES = ['classic', 'accent', 'highlight', 'address', 'block', 'minimal', 'glow', 'circle', 'underline'] as const;

const OVERLAY_ALPHA: Record<string, number> = {
  classic: 0.40, accent: 0.35, highlight: 0.35, address: 0.40,
  block: 0.30, minimal: 0.50, glow: 0.45, circle: 0.35, underline: 0.40,
};

export type CoverOverlayOpts = {
  style: string;
  title: string;
  address?: string;
  logoImg?: HTMLImageElement | null;
  brandColor?: string;
  isPortrait: boolean;
  W: number;
  H: number;
  dimAlpha?: number;
};

// Wrap title to max 3 lines based on canvas measureText.
export function wrapTitle(text: string, ctx: CanvasRenderingContext2D, font: string, maxWidth: number): string[] {
  ctx.font = font;
  const words = (text || '').trim().toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Renders dim overlay + logo + style-specific title onto ctx.
// Caller draws the background (video frame / image / transparent for export PNG).
export function drawCoverOverlay(ctx: CanvasRenderingContext2D, opts: CoverOverlayOpts) {
  const { style, title, address, logoImg, isPortrait, W, H } = opts;
  const brandColor = (opts.brandColor || '#3B82F6').replace('#', '');
  const brandHex = '#' + brandColor;

  const bgA = typeof opts.dimAlpha === 'number' ? opts.dimAlpha : (OVERLAY_ALPHA[style] || 0.40);
  ctx.fillStyle = `rgba(0,0,0,${bgA})`;
  ctx.fillRect(0, 0, W, H);

  const fontSize = Math.round(H * (isPortrait ? 0.030 : 0.100));
  const ls = Math.round(fontSize * (isPortrait ? 0.16 : 0.10)); // interlinea titolo (un po' più ariosa)
  const lineH = fontSize + ls;
  const bandH = Math.min(W, H);

  const logoH = Math.round(H * (isPortrait ? 0.05 : 0.11));
  const logoGap = Math.round(H * 0.022); // proporzionale: logo vicino al titolo (preview + export coerenti)

  const maxWidth = W * (isPortrait ? 0.80 : 0.84);
  const boldFont = `700 ${fontSize}px Poppins, sans-serif`;
  const lightFont = `300 ${fontSize}px Poppins, sans-serif`;
  const lines = wrapTitle(title, ctx, boldFont, maxWidth);
  const lineCount = Math.max(1, lines.length);
  const textH = lineCount * fontSize + Math.max(0, lineCount - 1) * ls;

  const stylePad = style === 'block' ? 47 : 0;
  const hasLogo = !!logoImg;
  const totalBlockH = (hasLogo ? logoH + logoGap : 0) + textH + stylePad * 2;
  const blockTopY = Math.round((H - totalBlockH) / 2);
  const textTopY = hasLogo ? blockTopY + logoH + logoGap + stylePad : blockTopY + stylePad;

  if (hasLogo && style !== 'address') {
    const aspect = logoImg!.width / logoImg!.height;
    const lw = logoH * aspect;
    ctx.drawImage(logoImg!, (W - lw) / 2, blockTopY, lw, logoH);
  }

  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = Math.round(H * 0.003);
  ctx.shadowOffsetY = Math.round(H * 0.003);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (style === 'highlight') {
    const hlLineH = Math.round(fontSize * 1.15);
    ctx.font = boldFont;
    if (lines.length > 1) {
      const lastIdx = lines.length - 1;
      const lastY = textTopY + lastIdx * hlLineH;
      const tw = ctx.measureText(lines[lastIdx]).width;
      const hlPad = Math.round(H * (isPortrait ? 0.0148 : 0.031));
      const hlBoxH = Math.round(fontSize * 1.15);
      const hlYOff = Math.round(H * (isPortrait ? -0.0039 : -0.011));
      const hlRadius = Math.round(H * (isPortrait ? 0.0094 : 0.019));
      ctx.fillStyle = brandHex;
      const bx = W / 2 - tw / 2 - hlPad;
      const by = lastY + fontSize / 2 - hlBoxH / 2 + hlYOff;
      roundRect(ctx, bx, by, tw + hlPad * 2, hlBoxH, hlRadius);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * hlLineH);
  } else if (style === 'address') {
    const addr = (address || '').trim().toUpperCase();
    const showAddr = addr.length > 0;
    const badgeFontSize = Math.round(fontSize * (isPortrait ? 0.45 : 0.25));
    const badgePadY = Math.round(H * (isPortrait ? 0.0047 : 0.011));
    const badgeBoxH = Math.round((badgeFontSize + badgePadY * 2) * 1.15);
    const badgeGapPx = Math.round(H * (isPortrait ? 0.03 : 0.04));
    const badgePadX = Math.round(H * (isPortrait ? 0.0109 : 0.025));
    const badgeRadius = Math.round(H * (isPortrait ? 0.0063 : 0.0125));
    const adrTotalH = (hasLogo ? logoH + logoGap : 0) + (showAddr ? badgeBoxH + badgeGapPx : 0) + textH;
    const adrTopY = Math.round((H - adrTotalH) / 2);
    let curY = adrTopY;
    if (hasLogo) {
      const aspect = logoImg!.width / logoImg!.height;
      const lw = logoH * aspect;
      ctx.drawImage(logoImg!, (W - lw) / 2, curY, lw, logoH);
      curY += logoH + logoGap;
    }
    if (showAddr) {
      const badgeFont = `600 ${badgeFontSize}px Poppins, sans-serif`;
      ctx.font = badgeFont;
      const aw = ctx.measureText(addr).width;
      ctx.fillStyle = brandHex;
      roundRect(ctx, W / 2 - aw / 2 - badgePadX, curY, aw + badgePadX * 2, badgeBoxH, badgeRadius);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText(addr, W / 2, curY + badgeBoxH / 2);
      ctx.textBaseline = 'top';
      curY += badgeBoxH + badgeGapPx;
    }
    ctx.font = boldFont;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, curY + i * lineH);
  } else if (style === 'block') {
    const padding = 47;
    ctx.font = boldFont;
    let maxLineW = 0;
    for (const ln of lines) { const w = ctx.measureText(ln).width; if (w > maxLineW) maxLineW = w; }
    const blockW = maxLineW + padding * 2;
    const blockH = textH + padding * 2;
    const blockX = (W - blockW) / 2;
    const blockY = textTopY - padding;
    ctx.fillStyle = '#' + brandColor + '80';
    roundRect(ctx, blockX, blockY, blockW, blockH, 24);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    const blockCenterY = blockY + blockH / 2;
    for (let i = 0; i < lines.length; i++) {
      const y = blockCenterY - (textH / 2) + i * lineH + fontSize / 2;
      ctx.fillText(lines[i], W / 2, y);
    }
    ctx.textBaseline = 'top';
  } else if (style === 'minimal') {
    const minSize = Math.round(fontSize * 0.9);
    const minFont = `400 ${minSize}px 'EB Garamond', serif`;
    ctx.font = minFont;
    const minMaxW = W * 0.85;
    const minLines = wrapTitle(title, ctx, minFont, minMaxW);
    const minLineCount = Math.max(1, minLines.length);
    const minGap = Math.round(minSize * (isPortrait ? 0.16 : 0.10)); // interlinea coerente con gli altri stili
    const minLineH = minSize + minGap;
    const minTextH = minLineCount * minSize + Math.max(0, minLineCount - 1) * minGap;
    const minBlockH = (hasLogo ? logoH + logoGap : 0) + minTextH;
    const minBlockTopY = Math.round((H - minBlockH) / 2);
    const minTopY = hasLogo ? minBlockTopY + logoH + logoGap : minBlockTopY;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < minLines.length; i++) ctx.fillText(minLines[i], W / 2, minTopY + i * minLineH);
  } else if (style === 'glow') {
    ctx.font = boldFont;
    ctx.save();
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = Math.round(H * 0.04);
    ctx.shadowColor = brandHex;
    ctx.fillStyle = brandHex;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * lineH);
    }
    ctx.restore();
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = Math.round(H * 0.003);
    ctx.shadowOffsetY = Math.round(H * 0.003);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * lineH);
  } else if (style === 'circle') {
    ctx.font = boldFont;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * lineH);
    const lastLine = lines[lines.length - 1] || '';
    const lastW = ctx.measureText(lastLine).width;
    const circPadX = Math.round(bandH * 0.028);
    const circPadY = Math.round(fontSize * 0.10);
    const circStroke = Math.max(2, Math.round(bandH * 0.0039));
    const ellipseRx = Math.round(lastW / 2) + circPadX;
    const ellipseRy = Math.round(fontSize / 2) + circPadY;
    const ellipseCY = textTopY + (lineCount - 1) * lineH + Math.round(fontSize / 2);
    ctx.shadowColor = 'transparent';
    ctx.save();
    ctx.translate(W / 2, ellipseCY);
    ctx.rotate(-4 * Math.PI / 180);
    ctx.beginPath();
    ctx.ellipse(0, 0, ellipseRx, ellipseRy, 0, 0, Math.PI * 2);
    ctx.lineWidth = circStroke;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
  } else if (style === 'underline') {
    ctx.font = boldFont;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * lineH);
    const ulThick = Math.max(3, Math.round(bandH * 0.0083));
    const ulGap = Math.round(bandH * 0.014);
    const ulPadX = Math.round(bandH * 0.014);
    const ulCurve = Math.round(bandH * -0.042);
    const lastLine = lines[lines.length - 1] || '';
    const lastW = ctx.measureText(lastLine).width;
    const ulTotalW = lastW + ulPadX * 2;
    const x1 = (W - ulTotalW) / 2;
    const x2 = (W + ulTotalW) / 2;
    const lastLineY = textTopY + (lineCount - 1) * lineH;
    const baseY = lastLineY + fontSize + ulGap;
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.moveTo(x1, baseY);
    ctx.quadraticCurveTo((x1 + x2) / 2, baseY + ulCurve, x2, baseY);
    ctx.strokeStyle = brandHex;
    ctx.lineWidth = ulThick;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else if (style === 'accent') {
    const isKeyword = (w: string) => w.length >= 4;
    for (let i = 0; i < lines.length; i++) {
      const words = lines[i].split(/\s+/);
      let totalW = 0;
      const parts = words.map(w => {
        ctx.font = isKeyword(w) ? boldFont : lightFont;
        const mw = ctx.measureText(w).width;
        totalW += mw;
        return { text: w, bold: isKeyword(w), w: mw };
      });
      ctx.font = boldFont;
      const spaceW = ctx.measureText(' ').width;
      totalW += (words.length - 1) * spaceW;
      let x = (W - totalW) / 2;
      const y = textTopY + i * lineH;
      ctx.textAlign = 'left';
      parts.forEach((p, pi) => {
        ctx.font = p.bold ? boldFont : lightFont;
        ctx.fillStyle = '#fff';
        ctx.fillText(p.text, x, y);
        x += p.w + (pi < parts.length - 1 ? spaceW : 0);
      });
      ctx.textAlign = 'center';
    }
  } else {
    // classic
    ctx.font = boldFont;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], W / 2, textTopY + i * lineH);
  }

  ctx.shadowColor = 'transparent';
}

// Genera il PNG overlay (solo dim+logo+titolo, sfondo trasparente) a piena
// risoluzione e lo restituisce come Blob. Lambda lo sovrappone al frame cover.
export async function renderCoverOverlayBlob(opts: Omit<CoverOverlayOpts, 'W' | 'H'> & { logoUrl?: string }): Promise<Blob> {
  await Promise.race([preloadCoverFonts(), new Promise(r => setTimeout(r, 3000))]);
  let logoImg: HTMLImageElement | null = opts.logoImg ?? null;
  if (!logoImg && opts.logoUrl) {
    logoImg = await new Promise<HTMLImageElement | null>(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = opts.logoUrl!;
    });
  }
  const W = opts.isPortrait ? 1080 : 1920;
  const H = opts.isPortrait ? 1920 : 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  drawCoverOverlay(ctx, { ...opts, logoImg, W, H });
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('cover overlay toBlob failed')), 'image/png');
  });
}

let fontsInjected = false;
// Carica i font Poppins + EB Garamond (servono al canvas per il testo cover).
export async function preloadCoverFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (!fontsInjected) {
    fontsInjected = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400&family=Poppins:wght@300;600;700&display=swap';
    document.head.appendChild(link);
  }
  if (!(document as any).fonts?.load) return;
  try {
    await Promise.all([
      (document as any).fonts.load('700 48px Poppins'),
      (document as any).fonts.load('600 48px Poppins'),
      (document as any).fonts.load('300 48px Poppins'),
      (document as any).fonts.load('400 48px "EB Garamond"'),
    ]);
  } catch { /* fallback sans-serif */ }
}
