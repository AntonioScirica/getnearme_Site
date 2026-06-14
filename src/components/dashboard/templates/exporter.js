// HTML-to-PNG / Video export using html2canvas + MediaRecorder
// Adapted from extension exporter for Next.js site (no Chrome APIs)

export const ANIMATION_STYLES = [
  {
    id: 'slide-up',
    label: 'Scorrimento',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 3);
      return { alpha: e, x: 0, y: (1 - e) * 30 };
    },
  },
  {
    id: 'fade',
    label: 'Dissolvenza',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 2);
      return { alpha: e, x: 0, y: 0 };
    },
  },
  {
    id: 'scale',
    label: 'Espansione',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 3);
      return { alpha: e, x: 0, y: 0, scale: 0.8 + 0.2 * e };
    },
  },
  {
    id: 'slide-right',
    label: 'Laterale',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 3);
      return { alpha: e, x: (1 - e) * -40, y: 0 };
    },
  },
  {
    id: 'drop',
    label: 'Caduta',
    animate(p) {
      let e;
      if (p < 0.6) {
        e = p / 0.6;
        e = e * e * (3 - 2 * e);
      } else if (p < 0.85) {
        e = 1 + Math.sin((p - 0.6) / 0.25 * Math.PI) * 0.1;
      } else {
        e = 1;
      }
      return { alpha: Math.min(p * 2.5, 1), x: 0, y: (1 - e) * -50 };
    },
  },
  {
    id: 'zoom-out',
    label: 'Zoom',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 3);
      return { alpha: e, x: 0, y: 0, scale: 1.4 - 0.4 * e };
    },
  },
  {
    id: 'bounce',
    label: 'Rimbalzo',
    animate(p) {
      let e;
      if (p < 0.5) {
        e = p / 0.5;
        e = e * e * (3 - 2 * e);
      } else if (p < 0.75) {
        e = 1 + Math.sin((p - 0.5) / 0.25 * Math.PI) * -0.15;
      } else if (p < 0.9) {
        e = 1 + Math.sin((p - 0.75) / 0.15 * Math.PI) * 0.05;
      } else {
        e = 1;
      }
      return { alpha: Math.min(p * 3, 1), x: 0, y: (1 - e) * 60 };
    },
  },
  {
    id: 'diagonal',
    label: 'Diagonale',
    animate(p) {
      const e = 1 - Math.pow(1 - p, 3);
      return { alpha: e, x: (1 - e) * -30, y: (1 - e) * 30 };
    },
  },
];

function svgsToDataUriImgs(root) {
  root.querySelectorAll('svg').forEach(svg => {
    const parent = svg.parentElement;
    if (!parent) return;
    const w = svg.getAttribute('width') || svg.getBoundingClientRect?.()?.width || 36;
    const h = svg.getAttribute('height') || svg.getBoundingClientRect?.()?.height || 36;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('width')) clone.setAttribute('width', String(w));
    if (!clone.getAttribute('height')) clone.setAttribute('height', String(h));
    const cs = getComputedStyle(svg);
    const color = cs?.color || 'white';
    clone.querySelectorAll('[stroke="currentColor"]').forEach(el => el.setAttribute('stroke', color));
    clone.querySelectorAll('[fill="currentColor"]').forEach(el => el.setAttribute('fill', color));
    if (clone.getAttribute('stroke') === 'currentColor') clone.setAttribute('stroke', color);
    if (clone.getAttribute('fill') === 'currentColor') clone.setAttribute('fill', color);
    const serialized = new XMLSerializer().serializeToString(clone);
    const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
    const img = document.createElement('img');
    img.src = dataUri;
    img.width = parseInt(w);
    img.height = parseInt(h);
    img.style.cssText = svg.style.cssText;
    img.style.display = 'inline-block';
    img.style.flexShrink = '0';
    parent.replaceChild(img, svg);
  });
}

function stripNonTemplateCss(clonedDoc) {
  let tplCss = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const text = rule.cssText;
        if (text.includes('.tpl') || text.includes('@font-face')) {
          tplCss += text + '\n';
        }
      }
    } catch { /* cross-origin sheet (e.g. Google Fonts) — keep the <link> */ }
  }
  clonedDoc.querySelectorAll('style').forEach(el => el.remove());
  const style = clonedDoc.createElement('style');
  style.textContent = tplCss;
  clonedDoc.head.appendChild(style);
  svgsToDataUriImgs(clonedDoc);
  clonedDoc.querySelectorAll('*').forEach(el => {
    el.style.backdropFilter = 'none';
    el.style.setProperty('-webkit-backdrop-filter', 'none');
  });
}


function patchObjectFitImages(container) {
  const patches = [];
  container.querySelectorAll('img').forEach(img => {
    const cs = getComputedStyle(img);
    const fit = cs.objectFit;
    if (fit !== 'cover' && fit !== 'contain') return;
    const cw = img.offsetWidth;
    const ch = img.offsetHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih || !cw || !ch) return;

    const saved = img.getAttribute('style') || '';
    let scale;
    if (fit === 'cover') {
      scale = Math.max(cw / iw, ch / ih);
    } else {
      scale = Math.min(cw / iw, ch / ih);
    }
    const rw = Math.round(iw * scale);
    const rh = Math.round(ih * scale);
    const rx = Math.round((cw - rw) / 2);
    const ry = Math.round((ch - rh) / 2);

    img.style.objectFit = 'none';
    img.style.width = rw + 'px';
    img.style.height = rh + 'px';
    img.style.marginLeft = rx + 'px';
    img.style.marginTop = ry + 'px';
    patches.push({ img, saved });
  });
  return () => {
    patches.forEach(({ img, saved }) => {
      if (saved) img.setAttribute('style', saved);
      else img.removeAttribute('style');
    });
  };
}

function patchGradientStops() {
  const original = CanvasGradient.prototype.addColorStop;
  CanvasGradient.prototype.addColorStop = function (offset, color) {
    if (!isFinite(offset)) offset = 0;
    return original.call(this, Math.max(0, Math.min(1, offset)), color);
  };
  return () => { CanvasGradient.prototype.addColorStop = original; };
}

export async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function imgCover(destCtx, img, dw, dh) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return;
  const iRatio = iw / ih, cRatio = dw / dh;
  let sx, sy, sw, sh;
  if (iRatio > cRatio) {
    sh = ih; sw = ih * cRatio; sx = (iw - sw) / 2; sy = 0;
  } else {
    sw = iw; sh = iw / cRatio; sx = 0; sy = (ih - sh) / 2;
  }
  destCtx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
}

function imgContain(destCtx, img, dw, dh) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.min(dw / iw, dh / ih);
  const rw = iw * scale, rh = ih * scale;
  destCtx.drawImage(img, (dw - rw) / 2, (dh - rh) / 2, rw, rh);
}

function fixClipPath(templateEl, w, h) {
  const restoreActions = [];
  const clipEl = templateEl.querySelector('.tpl-overlay--triangle');
  if (clipEl) {
    const cs = getComputedStyle(clipEl);
    const clipStr = clipEl.style.clipPath || cs.clipPath || '';
    const polyMatch = clipStr.match(/polygon\(([^)]+)\)/);
    if (polyMatch) {
      const parseVal = (v, max) => {
        v = v.trim();
        if (v.endsWith('%')) return parseFloat(v) / 100 * max;
        return parseFloat(v);
      };
      const points = polyMatch[1].split(',').map(pt => {
        const [xStr, yStr] = pt.trim().split(/\s+/);
        return { x: parseVal(xStr, w), y: parseVal(yStr, h) };
      });
      const color = cs.backgroundColor || '#2967EC';

      const polyCanvas = document.createElement('canvas');
      polyCanvas.width = w;
      polyCanvas.height = h;
      polyCanvas.style.position = 'absolute';
      polyCanvas.style.inset = '0';
      polyCanvas.style.zIndex = '1';
      polyCanvas.style.pointerEvents = 'none';
      const polyCtx = polyCanvas.getContext('2d');
      polyCtx.fillStyle = color;
      polyCtx.beginPath();
      polyCtx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        polyCtx.lineTo(points[i].x, points[i].y);
      }
      polyCtx.closePath();
      polyCtx.fill();

      clipEl.style.visibility = 'hidden';
      clipEl.parentNode.insertBefore(polyCanvas, clipEl);
      restoreActions.push(() => {
        clipEl.style.visibility = '';
        polyCanvas.remove();
      });
    }
  }
  return restoreActions;
}

function collectGlassPanels(templateEl, tplRect, textElsSet) {
  const panels = [];
  templateEl.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (!bf || bf === 'none') return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const blurMatch = bf.match(/blur\((\d+)px\)/);
    let isTextChild = false;
    if (textElsSet) {
      let p = el;
      while (p && p !== templateEl) {
        if (textElsSet.has(p)) { isTextChild = true; break; }
        p = p.parentElement;
      }
    }
    panels.push({
      x: Math.round(r.left - tplRect.left),
      y: Math.round(r.top - tplRect.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      radius: parseInt(cs.borderRadius) || 0,
      blurRadius: blurMatch ? parseInt(blurMatch[1]) : 16,
      bg: cs.backgroundColor || 'transparent',
      borderColor: cs.borderColor || 'transparent',
      borderWidth: parseFloat(cs.borderWidth) || 0,
      isTextChild,
    });
  });
  return panels;
}

function buildBlurCanvasMap(glassPanels, sourceCanvas, w, h) {
  const radii = [...new Set(glassPanels.map(p => p.blurRadius))];
  const map = new Map();
  for (const radius of radii) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const bCtx = c.getContext('2d');
    bCtx.filter = `blur(${radius}px)`;
    bCtx.drawImage(sourceCanvas, 0, 0);
    map.set(radius, c);
  }
  return map;
}

function drawGlassPanels(ctx, glassPanels, blurCanvasMap) {
  for (const p of glassPanels) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
    ctx.clip();
    const blurCanvas = blurCanvasMap.get(p.blurRadius);
    if (blurCanvas) ctx.drawImage(blurCanvas, 0, 0);
    ctx.fillStyle = p.bg;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
    if (p.borderWidth > 0 && p.borderColor !== 'transparent' && p.borderColor !== 'rgba(0, 0, 0, 0)') {
      ctx.save();
      ctx.strokeStyle = p.borderColor;
      ctx.lineWidth = p.borderWidth;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Convert blob URLs to data URLs in all <img> elements inside the template.
// html2canvas foreignObjectRendering can fail with blob URLs in cloned documents.
async function convertBlobImgs(element) {
  const imgs = element.querySelectorAll('img');
  const restores = [];
  await Promise.all(Array.from(imgs).map(async (img) => {
    if (!img.src || !img.src.startsWith('blob:')) return;
    try {
      const resp = await fetch(img.src);
      const blob = await resp.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const saved = img.src;
      img.src = dataUrl;
      await img.decode();
      restores.push(() => { img.src = saved; });
    } catch (err) {
      console.warn('convertBlobImgs failed for', img.src, err);
    }
  }));
  return () => restores.forEach(fn => fn());
}

export async function exportToPng(element, size, opts = {}) {
  const html2canvas = (await import('html2canvas')).default;
  const { photoSrc, fitCover = false } = opts;
  const w = size?.w || element.offsetWidth || 1080;
  const h = size?.h || element.offsetHeight || 1350;

  const cover = element.querySelector('.tpl-cover');
  const hasCover = !!cover;
  if (cover) cover.style.visibility = 'hidden';

  // Convert blob URLs to data URLs so html2canvas can handle them
  const restoreBlobImgs = await convertBlobImgs(element);

  const tplRect = element.getBoundingClientRect();
  const glassPanels = collectGlassPanels(element, tplRect);
  const restoreActions = fixClipPath(element, w, h);

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const h2cOpts = {
    width: w, height: h, scale: 1,
    allowTaint: true, backgroundColor: null, logging: false,
    foreignObjectRendering: true,
    onclone: (doc) => stripNonTemplateCss(doc),
  };
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Non-cover templates with glass panels (e.g. frame) need a two-pass capture
  // to reproduce backdrop-filter: a background pass (glass hidden) to blur from,
  // and a foreground pass (photos hidden) for the glass bg + text on top.
  const isNonCoverGlass = !hasCover && glassPanels.length > 0;

  // NB: no patchObjectFitImages — foreignObjectRendering renders object-fit natively
  const restoreGradient = patchGradientStops();
  let overlayCanvas, bgCanvas, fgCanvas;
  try {
    if (isNonCoverGlass) {
      const glassEls = Array.from(element.querySelectorAll('.tpl-glass-panel, .tpl-metric-card, .tpl-metric-pill'));
      const savedGlassVis = glassEls.map(el => el.style.visibility);
      const photoEls = Array.from(element.querySelectorAll('img')).filter(im => !im.closest('.tpl-logo-overlay') && !im.classList.contains('tpl-logo-overlay'));
      const savedPhotoVis = photoEls.map(el => el.style.visibility);

      // PASS 1 — background scene (photos + gradients), glass hidden
      glassEls.forEach(el => { el.style.visibility = 'hidden'; });
      await raf2();
      bgCanvas = await html2canvas(element, h2cOpts);
      glassEls.forEach((el, i) => { el.style.visibility = savedGlassVis[i]; });

      // PASS 2 — foreground (glass bg + border + text + badge), photos hidden.
      // Also make the root background transparent so the opaque template bg
      // (e.g. frame's colored border) does not cover the photo from pass 1.
      const savedRootBg = element.style.background;
      const savedRootBgColor = element.style.backgroundColor;
      photoEls.forEach(el => { el.style.visibility = 'hidden'; });
      element.style.background = 'transparent';
      element.style.backgroundColor = 'transparent';
      await raf2();
      fgCanvas = await html2canvas(element, h2cOpts);
      photoEls.forEach((el, i) => { el.style.visibility = savedPhotoVis[i]; });
      element.style.background = savedRootBg;
      element.style.backgroundColor = savedRootBgColor;
    } else {
      overlayCanvas = await html2canvas(element, h2cOpts);
    }
  } finally {
    restoreGradient();
    restoreActions.forEach(fn => fn());
    restoreBlobImgs();
  }

  if (cover) cover.style.visibility = '';

  let fgImg = null;
  if (photoSrc) {
    fgImg = await new Promise((resolve) => {
      const img = new Image();
      if (!photoSrc.startsWith('blob:')) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = photoSrc;
    });
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (hasCover && fgImg) {
    const preBlurCanvas = document.createElement('canvas');
    preBlurCanvas.width = w;
    preBlurCanvas.height = h;
    const preBlurCtx = preBlurCanvas.getContext('2d');
    preBlurCtx.filter = 'blur(30px)';
    imgCover(preBlurCtx, fgImg, w, h);
    preBlurCtx.filter = 'none';

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1.15, 1.15);
    ctx.translate(-w / 2, -h / 2);
    ctx.drawImage(preBlurCanvas, 0, 0);
    ctx.restore();

    if (fitCover) imgCover(ctx, fgImg, w, h);
    else imgContain(ctx, fgImg, w, h);

    if (glassPanels.length > 0) {
      const compCanvas = document.createElement('canvas');
      compCanvas.width = w;
      compCanvas.height = h;
      const compCtx = compCanvas.getContext('2d');
      compCtx.drawImage(preBlurCanvas, 0, 0);
      if (fitCover) imgCover(compCtx, fgImg, w, h);
      else imgContain(compCtx, fgImg, w, h);
      const blurMap = buildBlurCanvasMap(glassPanels, compCanvas, w, h);
      drawGlassPanels(ctx, glassPanels, blurMap);
    }
  }

  if (isNonCoverGlass) {
    // 1. photo/background scene
    ctx.drawImage(bgCanvas, -1, -1, w + 2, h + 2);
    // 2. blur the background inside each glass panel region
    const blurMap = buildBlurCanvasMap(glassPanels, bgCanvas, w, h);
    for (const p of glassPanels) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
      ctx.clip();
      const bc = blurMap.get(p.blurRadius);
      if (bc) ctx.drawImage(bc, 0, 0);
      ctx.restore();
    }
    // 3. glass bg + border + text + badge on top (photos hidden in this pass)
    ctx.drawImage(fgCanvas, 0, 0);
  } else {
    // Slight 1px overdraw to cover sub-pixel gap at top/left edges where
    // html2canvas can leave the composited photo peeking through the overlay.
    ctx.drawImage(overlayCanvas, -1, -1, w + 2, h + 2);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob'));
    }, 'image/png');
  });
}

export async function exportStaticToVideo(templateEl, size, opts = {}) {
  const html2canvas = (await import('html2canvas')).default;
  const { duration = 15, animStyle = 'slide-up', photoSrc, videoSrc, blurredSrc, fitCover = false, onProgress, signal, onOverlayCaptured } = opts;
  const style = ANIMATION_STYLES.find(s => s.id === animStyle) || ANIMATION_STYLES[0];
  const w = size?.w || 1080;
  const h = size?.h || 1350;

  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');

  // Optional moving video background (user uploaded a video cover). The clip
  // loops to fill the animation duration; the cut point stays the same.
  let coverVideo = null;
  if (videoSrc) {
    coverVideo = document.createElement('video');
    coverVideo.src = videoSrc;
    coverVideo.muted = true;
    coverVideo.loop = true;
    coverVideo.playsInline = true;
    coverVideo.preload = 'auto';
    await new Promise((resolve) => {
      coverVideo.onloadeddata = resolve;
      coverVideo.onerror = resolve;
      coverVideo.load();
    });
    try { await coverVideo.play(); } catch { /* autoplay may need muted, already set */ }
  }

  const TEXT_SELS = '.tpl-badge, .tpl-price, .tpl-title, .tpl-address, .tpl-metrics, .tpl-metric-pills, .tpl-metrics-inline, .tpl-desc, .tpl-btn, .tpl-photo, .tpl-label, .tpl-logo-overlay, .tpl-bar';

  const cover = templateEl.querySelector('.tpl-cover');
  const hasCover = !!cover;
  if (cover) cover.style.visibility = 'hidden';

  // Convert blob URLs to data URLs for html2canvas compatibility
  const restoreBlobImgs = await convertBlobImgs(templateEl);

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const tplRect = templateEl.getBoundingClientRect();
  const layers = [];

  function addRect(el, type = 'text') {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const layer = {
      x: Math.round(r.left - tplRect.left),
      y: Math.round(r.top - tplRect.top),
      w: Math.round(r.width),
      h: Math.round(r.height),
      type,
    };
    if (type === 'photo') {
      const img = el.querySelector('img');
      layer.imgSrc = img ? img.src : null;
      const cs = getComputedStyle(el);
      layer.radii = [
        parseInt(cs.borderTopLeftRadius) || 0,
        parseInt(cs.borderTopRightRadius) || 0,
        parseInt(cs.borderBottomRightRadius) || 0,
        parseInt(cs.borderBottomLeftRadius) || 0,
      ];
    }
    layers.push(layer);
  }

  templateEl.querySelectorAll('.tpl-photo').forEach(el => addRect(el, 'photo'));
  templateEl.querySelectorAll('.tpl-label').forEach(el => addRect(el));
  addRect(templateEl.querySelector('.tpl-bar'));
  const badge = templateEl.querySelector('.tpl-badge');
  if (badge && !badge.closest('.tpl-bar')) addRect(badge);
  ['.tpl-price', '.tpl-title', '.tpl-address', '.tpl-metrics-inline']
    .forEach(sel => addRect(templateEl.querySelector(sel)));
  templateEl.querySelectorAll('.tpl-metric-card, .tpl-metric-pill')
    .forEach(el => addRect(el));
  ['.tpl-desc', '.tpl-btn']
    .forEach(sel => addRect(templateEl.querySelector(sel)));
  addRect(templateEl.querySelector('.tpl-logo-overlay'));

  const textEls = templateEl.querySelectorAll(TEXT_SELS);
  const textElsSet = new Set(textEls);
  const glassPanels = collectGlassPanels(templateEl, tplRect, textElsSet);
  // Use ALL glass panels (not just text descendants) so standalone panels like
  // frame's .tpl-glass-panel keep their backdrop blur in the video too.
  const textChildPanels = glassPanels;
  // Pannelli ANNIDATI dentro un altro pannello glass (es. metric card dentro il
  // pannello glass del topbar-alt): NON ridisegnano il blur, altrimenti la loro
  // area lo riceve due volte (pannello esterno + card) → "doppio blur". Disegnano
  // solo tint + bordo; lo sfondo sfocato lo fornisce gia' il pannello esterno.
  for (const p of textChildPanels) {
    p.nested = textChildPanels.some(q => q !== p && q.w * q.h > p.w * p.h &&
      p.x >= q.x - 2 && p.y >= q.y - 2 &&
      p.x + p.w <= q.x + q.w + 2 && p.y + p.h <= q.y + q.h + 2);
  }

  // Capture gradient layer (hide text, keep overlays)
  textEls.forEach(el => { el.style.visibility = 'hidden'; });

  // Nascondi le glass box (elementi con backdrop-filter) durante la cattura
  // dello sfondo: altrimenti html2canvas vi cuoce dentro bg+bordo STATICI e poi
  // le box animate ci finiscono sopra → ogni box appare DOPPIA. Lo sfondo deve
  // contenere solo cover + overlay; le box le disegnano solo le animate.
  const glassEls = [...templateEl.querySelectorAll('*')].filter(el => {
    const cs = getComputedStyle(el);
    const bf = cs.backdropFilter || cs.webkitBackdropFilter;
    return bf && bf !== 'none';
  });
  const glassVisSaved = glassEls.map(el => el.style.visibility);
  glassEls.forEach(el => { el.style.visibility = 'hidden'; });

  const clipPathEl = templateEl.querySelector('[style*="clip-path"], .tpl-overlay--triangle');
  let clipPathPoly = null;
  if (clipPathEl) {
    const clipStr = clipPathEl.style.clipPath || getComputedStyle(clipPathEl).clipPath || '';
    const polyMatch = clipStr.match(/polygon\(([^)]+)\)/);
    if (polyMatch) {
      clipPathEl.style.visibility = 'hidden';
      const parseVal = (v, max) => {
        v = v.trim();
        if (v.endsWith('%')) return parseFloat(v) / 100 * max;
        return parseFloat(v);
      };
      clipPathPoly = {
        color: getComputedStyle(clipPathEl).backgroundColor || '#2967EC',
        points: polyMatch[1].split(',').map(pt => {
          const [xStr, yStr] = pt.trim().split(/\s+/);
          return { x: parseVal(xStr, w), y: parseVal(yStr, h) };
        }),
      };
    }
  }

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const restoreGrad1 = patchGradientStops();
  let gradientCanvas;
  try {
    gradientCanvas = await html2canvas(templateEl, {
      width: w, height: h, scale: 1,
      allowTaint: false, backgroundColor: null, logging: false,
      foreignObjectRendering: true,
      onclone: (doc) => stripNonTemplateCss(doc),
    });
  } finally {
    restoreGrad1();
  }

  if (clipPathEl) clipPathEl.style.visibility = '';
  // Ripristina le glass box: nella fase textCanvas servono visibili (il loro
  // bg viene reso trasparente a parte) per catturarne il testo/icone interni.
  glassEls.forEach((el, i) => { el.style.visibility = glassVisSaved[i]; });

  if (clipPathPoly && clipPathPoly.points.length >= 3) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = clipPathPoly.color;
    tempCtx.beginPath();
    tempCtx.moveTo(clipPathPoly.points[0].x, clipPathPoly.points[0].y);
    for (let i = 1; i < clipPathPoly.points.length; i++) {
      tempCtx.lineTo(clipPathPoly.points[i].x, clipPathPoly.points[i].y);
    }
    tempCtx.closePath();
    tempCtx.fill();
    tempCtx.drawImage(gradientCanvas, 0, 0);
    gradientCanvas = tempCanvas;
  }

  // Capture text layer
  textEls.forEach(el => { el.style.visibility = ''; });
  const overlayEls = templateEl.querySelectorAll('.tpl-overlay');
  overlayEls.forEach(el => { el.style.visibility = 'hidden'; });

  const keepSet = new Set();
  textEls.forEach(el => {
    keepSet.add(el);
    el.querySelectorAll('*').forEach(child => keepSet.add(child));
    let parent = el.parentElement;
    while (parent && parent !== templateEl) {
      keepSet.add(parent);
      parent = parent.parentElement;
    }
  });
  overlayEls.forEach(el => {
    keepSet.add(el);
    el.querySelectorAll('*').forEach(child => keepSet.add(child));
  });
  if (cover) {
    keepSet.add(cover);
    cover.querySelectorAll('*').forEach(child => keepSet.add(child));
  }

  const photoEls = templateEl.querySelectorAll('.tpl-photo');
  photoEls.forEach(el => { el.style.visibility = 'hidden'; });

  const hiddenMedia = [];
  templateEl.querySelectorAll('img, video').forEach(el => {
    if (keepSet.has(el)) return;
    if (cover && cover.contains(el)) return;
    hiddenMedia.push({ el, saved: el.style.visibility });
    el.style.visibility = 'hidden';
  });

  const savedRootStyle = templateEl.getAttribute('style') || '';
  templateEl.style.setProperty('background', 'transparent', 'important');

  const allDescendants = [...templateEl.querySelectorAll('*')];
  const savedContainerStyles = allDescendants.map(el => {
    if (keepSet.has(el)) return null;
    const s = el.getAttribute('style') || '';
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('backdrop-filter', 'none', 'important');
    el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    el.style.setProperty('border-color', 'transparent', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    return s;
  });

  const strippedGlass = [];
  templateEl.querySelectorAll('.tpl-metric-card, .tpl-metrics, .tpl-metric-pills, .tpl-glass-panel').forEach(el => {
    if (!keepSet.has(el)) return;
    const s = el.getAttribute('style') || '';
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('backdrop-filter', 'none', 'important');
    el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('border-color', 'transparent', 'important');
    strippedGlass.push({ el, saved: s });
  });

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const restoreGrad2 = patchGradientStops();
  let textCanvas;
  try {
    textCanvas = await html2canvas(templateEl, {
      width: w, height: h, scale: 1,
      allowTaint: false, backgroundColor: null, logging: false,
      foreignObjectRendering: true,
      onclone: (doc) => stripNonTemplateCss(doc),
    });
  } finally {
    restoreGrad2();
  }

  // Restore all DOM state
  if (savedRootStyle) templateEl.setAttribute('style', savedRootStyle);
  else templateEl.removeAttribute('style');

  allDescendants.forEach((el, i) => {
    if (savedContainerStyles[i] === null) return;
    if (savedContainerStyles[i]) el.setAttribute('style', savedContainerStyles[i]);
    else el.removeAttribute('style');
  });

  hiddenMedia.forEach(({ el, saved }) => { el.style.visibility = saved || ''; });
  photoEls.forEach(el => { el.style.visibility = ''; });
  strippedGlass.forEach(({ el, saved }) => {
    if (saved) el.setAttribute('style', saved);
    else el.removeAttribute('style');
  });

  overlayEls.forEach(el => { el.style.visibility = ''; });
  if (cover) cover.style.visibility = '';
  restoreBlobImgs();

  if (onOverlayCaptured) onOverlayCaptured();
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');

  // Load photo images
  function loadImg(src) {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('No src'));
      const img = new Image();
      if (!src.startsWith('blob:')) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load'));
      img.src = src;
    });
  }

  for (const l of layers) {
    if (l.type === 'photo' && l.imgSrc) {
      try { l.loadedImg = await loadImg(l.imgSrc); } catch { l.loadedImg = null; }
    }
  }

  let fgImg = null;
  const preBlurCanvas = document.createElement('canvas');
  preBlurCanvas.width = w;
  preBlurCanvas.height = h;
  if (hasCover && photoSrc) {
    fgImg = await loadImg(photoSrc);
    const preBlurCtx = preBlurCanvas.getContext('2d');
    preBlurCtx.filter = 'blur(30px)';
    imgCover(preBlurCtx, fgImg, w, h);
    preBlurCtx.filter = 'none';
  }

  const isVideoCover = !!coverVideo;
  // Video-aware cover/contain draw (uses videoWidth/Height, not naturalWidth).
  function drawVideoFit(destCtx, vid, dw, dh, cover) {
    const vw = vid.videoWidth, vh = vid.videoHeight;
    if (!vw || !vh) return;
    const vR = vw / vh, cR = dw / dh;
    if (cover) {
      let sx, sy, sw, sh;
      if (vR > cR) { sh = vh; sw = vh * cR; sx = (vw - sw) / 2; sy = 0; }
      else { sw = vw; sh = vw / cR; sx = 0; sy = (vh - sh) / 2; }
      destCtx.drawImage(vid, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
      const scale = Math.min(dw / vw, dh / vh);
      const rw = vw * scale, rh = vh * scale;
      destCtx.drawImage(vid, (dw - rw) / 2, (dh - rh) / 2, rw, rh);
    }
  }

  let blurCanvasMap = null;
  if (textChildPanels.length > 0) {
    const compCanvas = document.createElement('canvas');
    compCanvas.width = w;
    compCanvas.height = h;
    const compCtx = compCanvas.getContext('2d');
    if (hasCover && fgImg) {
      compCtx.drawImage(preBlurCanvas, 0, 0);
      if (fitCover) imgCover(compCtx, fgImg, w, h);
      else imgContain(compCtx, fgImg, w, h);
      compCtx.drawImage(gradientCanvas, 0, 0);
    } else {
      // Cover video (e no-cover): sorgente blur = primo frame video + overlay scuro
      // catturato in gradientCanvas. Il box mostra blur(scena) = darkness corretta
      // (l'overlay e' gia' dentro). Statica → niente farfallamento.
      if (isVideoCover && coverVideo) {
        drawVideoFit(compCtx, coverVideo, w, h, fitCover);
      }
      compCtx.drawImage(gradientCanvas, 0, 0);
    }
    blurCanvasMap = buildBlurCanvasMap(textChildPanels, compCanvas, w, h);
  }
  // Small offscreen canvas to produce a cheap blurred video background frame.
  const vSmall = document.createElement('canvas');
  vSmall.width = Math.max(Math.round(w * 0.12), 1);
  vSmall.height = Math.max(Math.round(h * 0.12), 1);
  const vSmallCtx = vSmall.getContext('2d');

  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = w;
  blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext('2d');
  blurCtx.imageSmoothingEnabled = true;
  blurCtx.imageSmoothingQuality = 'high';

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // MediaRecorder
  const stream = canvas.captureStream(0);
  const videoTrack = stream.getVideoTracks()[0];

  let mimeType = 'video/mp4;codecs=avc1';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
  }

  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 16_000_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const ELEM_START = 0.4;
  const ELEM_STAGGER = 0.18;
  const ELEM_ANIM_DUR = 0.5;

  return new Promise((resolve, reject) => {
    let aborted = false;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    // Risoluzione garantita: `finish()` viene chiamato da onstop O dal watchdog
    // se onstop non scatta (alcuni browser non emettono onstop con captureStream
    // manuale). Il flag `settled` evita doppie risoluzioni → niente modal appeso.
    let settled = false;
    const finish = () => {
      if (settled) return; settled = true;
      if (coverVideo) { try { coverVideo.pause(); coverVideo.src = ''; } catch { /* noop */ } }
      if (aborted) {
        reject(new DOMException('Export cancelled', 'AbortError'));
      } else {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        resolve({ blob: new Blob(chunks, { type: mimeType }), ext });
      }
    };
    recorder.onstop = finish;
    recorder.onerror = (e) => {
      if (settled) return; settled = true;
      reject(e.error || new Error('Recording failed'));
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
        if (recorder.state !== 'inactive') recorder.stop();
      }, { once: true });
    }

    // Pre-draw initial scene
    if (isVideoCover) {
      vSmallCtx.drawImage(coverVideo, 0, 0, vSmall.width, vSmall.height);
      ctx.save(); ctx.filter = 'blur(8px)';
      ctx.drawImage(vSmall, 0, 0, w, h);
      ctx.filter = 'none'; ctx.restore();
      drawVideoFit(ctx, coverVideo, w, h, fitCover);
    } else if (hasCover) {
      blurCtx.clearRect(0, 0, w, h);
      blurCtx.save();
      blurCtx.translate(w / 2, h / 2);
      blurCtx.scale(1.15, 1.15);
      blurCtx.translate(-w / 2, -h / 2);
      blurCtx.drawImage(preBlurCanvas, 0, 0);
      blurCtx.restore();
      ctx.drawImage(blurCanvas, 0, 0);
      if (fitCover) imgCover(ctx, fgImg, w, h);
      else imgContain(ctx, fgImg, w, h);
    }
    // Frame 0 = solo scena (cover + overlay). Le box NON si disegnano qui:
    // entrano animate (alpha 0 → 1) nel loop, niente flash statico iniziale.
    ctx.drawImage(gradientCanvas, -1, -1, w + 2, h + 2);

    recorder.start(100);
    if (videoTrack.requestFrame) videoTrack.requestFrame();

    // Watchdog a tempo reale: se il loop requestAnimationFrame viene throttlato
    // (tab in background, frame pesanti), `recorder.stop()` potrebbe non essere
    // mai chiamato → modal appeso. Forza lo stop dopo la durata; se onstop non
    // scatta entro 1.2s, risolve comunque con i chunk raccolti (finish()).
    const watchdog = setTimeout(() => {
      if (onProgress) onProgress(1);
      if (!aborted && recorder.state !== 'inactive') { try { recorder.stop(); } catch { /* noop */ } }
      setTimeout(finish, 1200); // fallback se onstop non scatta
    }, durationMs + 1500);
    recorder.onstop = () => { clearTimeout(watchdog); finish(); };

    // Ogni layer appartiene al pannello glass che lo CONTIENE (centro dentro la
    // bbox del pannello, pannello piu' piccolo se annidati). Il pannello e tutti
    // i suoi layer animano come UN BLOCCO, con la tempistica del primo layer
    // contenuto (drive) → box + testo entrano insieme (titolo/badge, descrizione,
    // metric card). I pannelli senza layer dentro restano statici.
    const layerCenterIn = (l, p) => {
      const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
      return cx >= p.x - 2 && cx <= p.x + p.w + 2 && cy >= p.y - 2 && cy <= p.y + p.h + 2;
    };
    const panelOf = layers.map(l => {
      let best = null, bestArea = Infinity;
      for (const p of textChildPanels) {
        if (!layerCenterIn(l, p)) continue;
        const a = p.w * p.h;
        if (a < bestArea) { best = p; bestArea = a; }
      }
      return best;
    });
    const panelDrive = new Map();
    panelOf.forEach((p, i) => { if (p && !panelDrive.has(p)) panelDrive.set(p, i); });
    const animatedPanels = new Set(panelDrive.keys());
    const startTimeOf = (i) => ELEM_START + i * ELEM_STAGGER;

    function drawFrame() {
      if (aborted) return;
      const elapsed = performance.now() - startTime;
      if (elapsed >= durationMs) {
        if (recorder.state !== 'inactive') recorder.stop();
        return;
      }

      const t = elapsed / 1000;
      const progress = t / duration;
      ctx.clearRect(0, 0, w, h);

      // Per-frame glass blur source: for video covers it must follow the moving
      // background, so derive it live from the scene; for images use the static map.
      let frameBlurMap = blurCanvasMap;

      if (isVideoCover) {
        // Blurred moving video background + video foreground.
        vSmallCtx.drawImage(coverVideo, 0, 0, vSmall.width, vSmall.height);
        ctx.save(); ctx.filter = 'blur(8px)';
        ctx.drawImage(vSmall, 0, 0, w, h);
        ctx.filter = 'none'; ctx.restore();
        drawVideoFit(ctx, coverVideo, w, h, fitCover);
        // NB: niente ricalcolo per-frame del blur glass. Si usa la mappa STATICA
        // (primo frame), come per le foto → box stabili, niente farfallamento.
      } else if (hasCover) {
        const bgScale = 1.15 + 0.10 * progress;
        blurCtx.clearRect(0, 0, w, h);
        blurCtx.save();
        blurCtx.translate(w / 2, h / 2);
        blurCtx.scale(bgScale, bgScale);
        blurCtx.translate(-w / 2, -h / 2);
        blurCtx.drawImage(preBlurCanvas, 0, 0);
        blurCtx.restore();
        ctx.drawImage(blurCanvas, 0, 0);

        const fgScale = 1.0 + 0.04 * progress;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(fgScale, fgScale);
        ctx.translate(-w / 2, -h / 2);
        if (fitCover) imgCover(ctx, fgImg, w, h);
        else imgContain(ctx, fgImg, w, h);
        ctx.restore();
      }

      if (frameBlurMap) {
        // No Ken-Burns scale on the glass blur for video (blur already matches the scene).
        const fgScaleGlass = (hasCover && !isVideoCover) ? (1.0 + 0.04 * progress) : 1;
        for (const p of textChildPanels) {
          if (animatedPanels.has(p)) continue; // drawn (animated) in the layer loop
          const blurSrc = frameBlurMap.get(p.blurRadius);
          // Pannello annidato: niente blur (lo da' il pannello esterno) → solo tint+bordo.
          if (blurSrc && !p.nested) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
            ctx.clip();
            ctx.translate(w / 2, h / 2);
            ctx.scale(fgScaleGlass, fgScaleGlass);
            ctx.translate(-w / 2, -h / 2);
            ctx.drawImage(blurSrc, 0, 0);
            ctx.restore();
          }
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
          ctx.clip();
          ctx.fillStyle = p.bg;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.restore();
          if (p.borderWidth > 0 && p.borderColor !== 'transparent' && p.borderColor !== 'rgba(0, 0, 0, 0)') {
            ctx.save();
            ctx.strokeStyle = p.borderColor;
            ctx.lineWidth = p.borderWidth;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, p.radius);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Dark overlay is present from the first frame (no fade-in).
      ctx.drawImage(gradientCanvas, -1, -1, w + 2, h + 2);

      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        // I layer dentro un pannello condividono la tempistica del drive layer:
        // box + contenuto entrano come un blocco unico.
        const gp = panelOf[i];
        const driveIdx = gp ? panelDrive.get(gp) : i;
        const startT = startTimeOf(driveIdx);
        if (t <= startT) continue;

        const p = Math.min((t - startT) / ELEM_ANIM_DUR, 1);
        const { alpha = 1, x = 0, y = 0, scale: s } = style.animate(p);

        // Disegna la box del pannello UNA sola volta, sul suo drive layer, con
        // l'animazione condivisa. Gli altri layer dello stesso pannello usano la
        // stessa (alpha,x,y,s) → restano allineati alla box.
        if (gp && i === driveIdx && frameBlurMap) {
          const fgScaleGlass = (hasCover && !isVideoCover) ? (1.0 + 0.04 * progress) : 1;
          const blurSrc = frameBlurMap.get(gp.blurRadius);
          ctx.save();
          ctx.globalAlpha = alpha;
          // La box (blur + bg + bordo) si muove INSIEME al suo contenuto: stesso
          // offset di slide (x,y) e scale (s) del testo. Senza questo, durante
          // l'animazione la box resta ferma mentre il testo scorre → "farfalla".
          if (s != null && s !== 1) {
            const cx = gp.x + gp.w / 2, cy = gp.y + gp.h / 2;
            ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
          }
          ctx.translate(x, y);
          // Pannello annidato: niente blur (lo fornisce gia' il pannello esterno).
          if (blurSrc && !gp.nested) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(gp.x, gp.y, gp.w, gp.h, gp.radius);
            ctx.clip();
            ctx.translate(w / 2, h / 2);
            ctx.scale(fgScaleGlass, fgScaleGlass);
            ctx.translate(-w / 2, -h / 2);
            ctx.drawImage(blurSrc, 0, 0);
            ctx.restore();
          }
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(gp.x, gp.y, gp.w, gp.h, gp.radius);
          ctx.clip();
          ctx.fillStyle = gp.bg;
          ctx.fillRect(gp.x, gp.y, gp.w, gp.h);
          ctx.restore();
          if (gp.borderWidth > 0 && gp.borderColor !== 'transparent' && gp.borderColor !== 'rgba(0, 0, 0, 0)') {
            ctx.strokeStyle = gp.borderColor;
            ctx.lineWidth = gp.borderWidth;
            ctx.beginPath();
            ctx.roundRect(gp.x, gp.y, gp.w, gp.h, gp.radius);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        if (s != null && s !== 1) {
          const cx = l.x + l.w / 2;
          const cy = l.y + l.h / 2;
          ctx.translate(cx, cy);
          ctx.scale(s, s);
          ctx.translate(-cx, -cy);
        }

        if (l.type === 'photo' && l.loadedImg) {
          ctx.translate(l.x + x, l.y + y);
          const hasRadius = l.radii && l.radii.some(r => r > 0);
          if (hasRadius) {
            ctx.beginPath();
            ctx.roundRect(0, 0, l.w, l.h, l.radii);
            ctx.clip();
          }
          imgCover(ctx, l.loadedImg, l.w, l.h);
        } else {
          ctx.drawImage(textCanvas,
            l.x, l.y, l.w, l.h,
            l.x + x, l.y + y, l.w, l.h
          );
        }
        ctx.restore();
      }

      if (videoTrack.requestFrame) videoTrack.requestFrame();
      if (onProgress && !aborted) onProgress(Math.min(elapsed / durationMs, 1));
      requestAnimationFrame(drawFrame);
    }

    requestAnimationFrame(drawFrame);
  });
}
