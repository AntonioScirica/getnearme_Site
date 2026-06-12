// Template: Tips
// Accent bg, white text, two overlapping photos, CTA button — 1080×1350
import { createMetricsInline, createPhotoPlaceholder } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @param {Object} [opts]
 * @param {string[]} [opts.photos] - Additional photo URLs
 * @returns {HTMLElement}
 */
export function renderTips(data, photoUrl, opts = {}) {
  const AC = data.accentColor || '#2563EB';
  const container = document.createElement('div');
  container.className = 'tpl tpl-tips';
  container.style.background = AC;
  container.style.overflow = 'hidden';

  const photos = [photoUrl, ...(opts.photos || [])];
  const h = (opts.size && opts.size.h) || 1350;
  const isSquare = h <= 1080;
  const isTall = h >= 1920;

  // ── Left column content (absolute, z2) ──
  const leftCol = document.createElement('div');
  leftCol.style.cssText = 'position:absolute;left:64px;top:80px;width:860px;display:flex;flex-direction:column;z-index:2';

  // Badge (above title, inline)
  if (data.contract) {
    const badge = document.createElement('div');
    badge.className = 'tpl-badge';
    badge.style.cssText = `display:inline-block;align-self:flex-start;background:#ffffff;border-radius:8px;padding:12px 24px;font-family:${FONT};font-size:31px;font-weight:600;color:${AC};margin-bottom:20px`;
    badge.textContent = data.contract.toUpperCase();
    leftCol.appendChild(badge);
  }

  // Title (large, white)
  if (data.title) {
    const title = document.createElement('h2');
    title.className = 'tpl-title';
    title.textContent = data.title;
    title.style.cssText = `margin:0;color:#ffffff;font-family:${FONT};font-size:62px;font-weight:700;line-height:72px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word`;
    leftCol.appendChild(title);
  }

  leftCol.appendChild(container.ownerDocument.createElement('div')).style.height = '24px';

  // ── Tips list (no background, white text) ──
  const tipLines = data.description ? data.description.split('\n').filter(l => l.trim()) : [];

  if (tipLines.length) {
    const tipsBlock = document.createElement('div');
    tipsBlock.className = 'tpl-desc';
    tipsBlock.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    tipLines.slice(0, 5).forEach(line => {
      const txt = document.createElement('div');
      txt.textContent = line.trim();
      txt.style.cssText = `color:rgba(255,255,255,0.85);font-family:${FONT};font-size:30px;font-weight:400;line-height:40px;word-break:break-word`;
      tipsBlock.appendChild(txt);
    });
    leftCol.appendChild(tipsBlock);
  } else {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `color:rgba(255,255,255,0.4);font-family:${FONT};font-size:26px;line-height:36px`;
    placeholder.textContent = 'Scrivi i tips nella descrizione (uno per riga)';
    leftCol.appendChild(placeholder);
  }

  // ── Inline metrics (camere, bagni, m²) ──
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 30,
  });
  if (inline) {
    inline.style.marginTop = '20px';
    leftCol.appendChild(inline);
  }

  container.appendChild(leftCol);

  // ── White diagonal shape (bottom) — SVG polygon (clip-path unsupported by html2canvas) ──
  const shapeTopL = isTall ? 48 : isSquare ? 58 : 62;
  const shapeTopR = isTall ? 40 : isSquare ? 50 : 55;
  const svgNS = 'http://www.w3.org/2000/svg';
  const shapeSvg = document.createElementNS(svgNS, 'svg');
  shapeSvg.setAttribute('width', '100%');
  shapeSvg.setAttribute('height', '100%');
  shapeSvg.setAttribute('viewBox', '0 0 100 100');
  shapeSvg.setAttribute('preserveAspectRatio', 'none');
  shapeSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
  const shapePoly = document.createElementNS(svgNS, 'polygon');
  shapePoly.setAttribute('points', `0,${shapeTopL} 100,${shapeTopR} 100,100 0,100`);
  shapePoly.setAttribute('fill', '#ffffff');
  shapeSvg.appendChild(shapePoly);
  container.appendChild(shapeSvg);

  // ── Photo sizes per format ──
  let p1W, p1H, p1Bot, p1Right, p2W, p2H, p2Right, p2Bot;
  const isReel = isTall && opts.size && opts.size.safe && opts.size.safe.left >= 80;
  if (isReel) {
    // Reel: smaller photos to fit within safe area
    p1W = 400; p1H = 580; p1Bot = 680; p1Right = 40;
    p2W = 380; p2H = 580; p2Bot = 360; p2Right = 260;
  } else if (isTall) {
    // Story: bigger, higher, more staggered
    p1W = 500; p1H = 720; p1Bot = 680; p1Right = 40;
    p2W = 480; p2H = 720; p2Bot = 360; p2Right = 340;
  } else if (isSquare) {
    p1W = 340; p1H = 470; p1Bot = 140; p1Right = 120;
    p2W = 320; p2H = 470; p2Bot = 16; p2Right = 320;
  } else {
    // Default 1080×1350
    p1W = 460; p1H = 640; p1Bot = 230; p1Right = 40;
    p2W = 440; p2H = 640; p2Bot = 64; p2Right = 280;
  }

  // ── Photo 1 (back, right, higher) — secondary photo ──
  const p1 = document.createElement('div');
  p1.className = 'tpl-photo';
  p1.style.cssText = `position:absolute;right:${p1Right}px;bottom:${p1Bot}px;width:${p1W}px;height:${p1H}px;border-radius:12px;overflow:hidden;z-index:1`;
  if (photos[1]) {
    const img1 = document.createElement('img');
    img1.src = photos[1];
    img1.alt = '';
    img1.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
    p1.appendChild(img1);
  } else {
    p1.appendChild(createPhotoPlaceholder());
  }
  container.appendChild(p1);

  // ── Photo 2 (front, overlapping, lower) — main photo ──
  const p2 = document.createElement('div');
  p2.className = 'tpl-photo';
  p2.style.cssText = `position:absolute;right:${p2Right}px;bottom:${p2Bot}px;width:${p2W}px;height:${p2H}px;border-radius:12px;overflow:hidden;z-index:3;box-shadow:0 8px 32px rgba(0,0,0,0.15)`;
  const img2 = document.createElement('img');
  img2.src = photos[0];
  img2.alt = '';
  img2.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
  p2.appendChild(img2);
  container.appendChild(p2);

  return container;
}
