// Post Template Registry
// Central registry for all HTML/CSS-based post templates

import { renderGradient } from './renderers/gradient.js';
import { renderBlue } from './renderers/blue.js';
import { renderDiagonal } from './renderers/diagonal.js';
import { renderCentered } from './renderers/centered.js';
import { renderCard } from './renderers/card.js';
import { renderElegant } from './renderers/elegant.js';
import { renderTopbar } from './renderers/topbar.js';
import { renderClean } from './renderers/clean.js';
import { renderTopbarAlt } from './renderers/topbar-alt.js';
import { renderSplit } from './renderers/split.js';
import { renderMagazine } from './renderers/magazine.js';
import { renderSpotlight } from './renderers/spotlight.js';
import { renderFrame } from './renderers/frame.js';
import { renderFade } from './renderers/fade.js';
import { renderGallery } from './renderers/gallery.js';
import { renderBeforeAfter } from './renderers/before-after.js';
import { renderTips } from './renderers/tips.js';
import { renderArch } from './renderers/arch.js';
import { createLogoOverlay } from './components.js';
const i18n = { t: (k) => ({ pwSquare: 'Quadrato', pwProperty: 'Immobile' }[k] || k) };

export const TEMPLATE_CATEGORIES = [
  {
    id: 'instagram', label: 'Instagram',
    sizes: [
      { id: 'ig-post', name: 'Post', dims: '1080 \u00D7 1350', w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
      { id: 'ig-quadrato', get name() { return i18n.t('pwSquare'); }, dims: '1080 \u00D7 1080', w: 1080, h: 1080, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
      { id: 'ig-story', name: 'Story', dims: '1080 \u00D7 1920', w: 1080, h: 1920, safe: { top: 100, bottom: 200, left: 0, right: 0 } },
      { id: 'ig-reel', name: 'Reel', dims: '1080 \u00D7 1920', w: 1080, h: 1920, safe: { top: 250, bottom: 340, left: 84, right: 84 } },
    ],
  },
  {
    id: 'facebook', label: 'Facebook',
    sizes: [
      { id: 'fb-post', name: 'Post', dims: '1080 \u00D7 1350', w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
      { id: 'fb-quadrato', get name() { return i18n.t('pwSquare'); }, dims: '1080 \u00D7 1080', w: 1080, h: 1080, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
      { id: 'fb-story', name: 'Story', dims: '1080 \u00D7 1920', w: 1080, h: 1920, safe: { top: 225, bottom: 275, left: 0, right: 0 } },
    ],
  },
  {
    id: 'tiktok', label: 'TikTok',
    sizes: [
      { id: 'tt-video', name: 'Video', dims: '1080 \u00D7 1920', w: 1080, h: 1920, safe: { top: 108, bottom: 320, left: 120, right: 120 } },
    ],
  },
  {
    id: 'linkedin', label: 'LinkedIn',
    sizes: [
      { id: 'li-post', name: 'Post', dims: '1080 \u00D7 1350', w: 1080, h: 1350 },
      { id: 'li-quadrato', get name() { return i18n.t('pwSquare'); }, dims: '1080 \u00D7 1080', w: 1080, h: 1080 },
    ],
  },
];

export const TEMPLATES = [
  { id: 'gradient', label: 'Vetrina', render: renderGradient, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'blue', label: 'Oceano', render: renderBlue, hasBtn: true, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge', 'cta'] },
  { id: 'diagonal', label: 'Dinamico', render: renderDiagonal, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'centered', label: 'Classico', render: renderCentered, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'card', label: 'Scheda', render: renderCard, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'elegant', label: 'Elegante', render: renderElegant, fields: ['price', 'title', 'metrics', 'badge'] },
  { id: 'topbar', label: 'Fascia', render: renderTopbar, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'clean', label: 'Minimal', render: renderClean, fields: ['title', 'address', 'metrics', 'badge'] },
  { id: 'topbar-alt', label: 'Fascia Alt', render: renderTopbarAlt, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'split', label: 'Doppio', render: renderSplit, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'magazine', label: 'Magazine', render: renderMagazine, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'spotlight', label: 'Spotlight', render: renderSpotlight, fields: ['price', 'title', 'address', 'metrics', 'badge', 'cta'] },
  { id: 'frame', label: 'Cornice', render: renderFrame, fields: ['price', 'title', 'address', 'metrics', 'badge'] },
  { id: 'fade', label: 'Sfumato', render: renderFade, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'gallery', label: 'Galleria', render: renderGallery, multiPhoto: 3, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
  { id: 'before-after', label: 'Prima e Dopo', render: renderBeforeAfter, multiPhoto: 2, fields: ['price', 'title', 'address', 'description', 'badge'] },
  { id: 'tips', label: 'Consigli', render: renderTips, multiPhoto: 2, fields: ['title', 'description', 'metrics', 'badge'] },
  { id: 'arch', label: 'Arco', render: renderArch, fields: ['price', 'title', 'address', 'description', 'metrics', 'badge'] },
];

/**
 * Apply safe area padding to a rendered template.
 * Platform UI overlays clip the top/bottom/sides of 9:16 frames.
 * @param {HTMLElement} el
 * @param {string} templateId
 * @param {{top: number, bottom: number, left?: number, right?: number}} margins
 */
function applySafeArea(el, templateId, margins) {
  const ST = margins.top;
  const SB = margins.bottom;
  const SL = margins.left || 0;
  const SR = margins.right || 0;

  // Helper: ensure padding is at least the safe margin
  const maxPx = (cur, safe) => Math.max(parseInt(cur) || 0, safe) + 'px';

  // Gradient, Blue, Diagonal, Centered, Magazine, Ribbon — .tpl-content with inline padding
  const content = el.querySelector('.tpl-content');
  if (content) {
    content.style.paddingTop = maxPx(content.style.paddingTop, ST);
    content.style.paddingBottom = maxPx(content.style.paddingBottom, SB);
    if (SL) content.style.paddingLeft = maxPx(content.style.paddingLeft, SL);
    if (SR) content.style.paddingRight = maxPx(content.style.paddingRight, SR);
  }

  // Blue: badge is absolute on container (outside .tpl-content)
  if (templateId === 'blue') {
    const badge = el.querySelector('.tpl-badge');
    if (badge && badge.style.position === 'absolute') {
      badge.style.top = maxPx(badge.style.top, ST);
      if (SR) badge.style.right = maxPx(badge.style.right, SR);
    }
  }

  // Card, Elegant: absolute-positioned content wrapper
  if (templateId === 'card' || templateId === 'elegant') {
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.zIndex === '2') {
        child.style.top = maxPx(child.style.top, ST);
        child.style.bottom = maxPx(child.style.bottom, SB);
        if (SL) child.style.left = maxPx(child.style.left, SL);
        if (SR) child.style.right = maxPx(child.style.right, SR);
        break;
      }
    }
  }

  // Clean: bar (top) and bottomSection (bottom) are separate z-index:2 elements
  if (templateId === 'clean') {
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.zIndex === '2') {
        if (child.style.top) child.style.top = maxPx(child.style.top, ST);
        if (child.style.bottom) child.style.bottom = maxPx(child.style.bottom, SB);
        if (SL && child.style.left) child.style.left = maxPx(child.style.left, SL);
        if (SR && child.style.right) child.style.right = maxPx(child.style.right, SR);
      }
    }
  }

  // Topbar, Topbar-Alt: percentage panel — adjust bottom and sides
  if (templateId === 'topbar' || templateId === 'topbar-alt') {
    for (const child of el.children) {
      if (child.style.top === '14.4%') {
        child.style.bottom = SB + 'px';
        if (SL) child.style.left = maxPx(child.style.left, SL);
        if (SR) child.style.right = maxPx(child.style.right, SR);
      }
    }
  }

  // Polaroid, Spotlight: flexbox layout — increase container padding
  if (['polaroid', 'spotlight'].includes(templateId)) {
    el.style.paddingTop = maxPx(el.style.paddingTop, ST);
    el.style.paddingBottom = maxPx(el.style.paddingBottom, SB);
    if (SL) el.style.paddingLeft = maxPx(el.style.paddingLeft, SL);
    if (SR) el.style.paddingRight = maxPx(el.style.paddingRight, SR);
  }

  // Gallery: adjust topSection padding and photoBox padding
  if (templateId === 'gallery') {
    const firstChild = el.children[0]; // topSection
    const lastChild = el.children[el.children.length - 1]; // photoBox
    if (firstChild) {
      firstChild.style.paddingTop = maxPx(firstChild.style.paddingTop, ST);
      if (SL) firstChild.style.paddingLeft = maxPx(firstChild.style.paddingLeft, SL);
      if (SR) firstChild.style.paddingRight = maxPx(firstChild.style.paddingRight, SR);
    }
    if (lastChild) {
      lastChild.style.paddingBottom = maxPx(lastChild.style.paddingBottom, SB);
      if (SL) lastChild.style.paddingLeft = maxPx(lastChild.style.paddingLeft, SL);
      if (SR) lastChild.style.paddingRight = maxPx(lastChild.style.paddingRight, SR);
    }
  }

  // Frame: adjust photoArea inset to keep content in safe zone
  if (templateId === 'frame') {
    for (const child of el.children) {
      if (child.style.borderRadius === '16px' && child.style.overflow === 'hidden') {
        child.style.top = maxPx(child.style.top, ST);
        child.style.bottom = maxPx(child.style.bottom, SB);
        if (SL) child.style.left = maxPx(child.style.left, SL);
        if (SR) child.style.right = maxPx(child.style.right, SR);
      }
    }
    // Keep glass panel and badge inside the safe area too
    const panel = el.querySelector('.tpl-glass-panel');
    if (panel) {
      panel.style.bottom = maxPx(panel.style.bottom, SB + 32);
      panel.style.left = maxPx(panel.style.left, SL + 32);
      panel.style.right = maxPx(panel.style.right, SR + 32);
    }
    const fbadge = el.querySelector('.tpl-badge');
    if (fbadge && fbadge.style.position === 'absolute') {
      fbadge.style.top = maxPx(fbadge.style.top, ST + 32);
      fbadge.style.right = maxPx(fbadge.style.right, SR + 32);
    }
  }

  // Minimal: badge (zIndex 3) at top + card (zIndex 2) at bottom
  if (templateId === 'minimal') {
    for (const child of el.children) {
      if (child.style.position === 'absolute') {
        if (child.style.zIndex === '3') {
          if (child.style.top) child.style.top = maxPx(child.style.top, ST);
          if (SL && child.style.left) child.style.left = maxPx(child.style.left, SL);
        }
        if (child.style.zIndex === '2') {
          if (child.style.bottom) child.style.bottom = maxPx(child.style.bottom, SB);
          if (SR && child.style.right) child.style.right = maxPx(child.style.right, SR);
        }
      }
    }
  }

  // Fade: badge + content padding
  if (templateId === 'fade') {
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.zIndex === '3' && child.style.top) {
        child.style.top = maxPx(child.style.top, ST);
        if (SL && child.style.left) child.style.left = maxPx(child.style.left, SL);
      }
    }
  }

  // Sidebar: adjust bottom panel
  if (templateId === 'sidebar') {
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.bottom === '0px') {
        child.style.paddingBottom = maxPx(child.style.paddingBottom, SB);
        if (SR) child.style.paddingRight = maxPx(child.style.paddingRight, SR);
      }
    }
  }

  // Split: adjust left panel padding
  if (templateId === 'split') {
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.left === '0px' && child.style.width === '540px') {
        child.style.paddingTop = maxPx(child.style.paddingTop, ST);
        child.style.paddingBottom = maxPx(child.style.paddingBottom, SB);
        if (SL) child.style.paddingLeft = maxPx(child.style.paddingLeft, SL);
      }
    }
  }

  // Ribbon: center band extends full width — handled by .tpl-content above

  // Before After: badge (top-right) + info section (bottom-left flex)
  if (templateId === 'before-after') {
    const badge = el.querySelector('.tpl-badge');
    if (badge) {
      badge.style.top = maxPx(badge.style.top, ST);
      if (SR) badge.style.right = maxPx(badge.style.right, SR);
    }
    for (const child of el.children) {
      if (child.style.position === 'absolute' && child.style.bottom && child.style.display === 'flex') {
        child.style.bottom = maxPx(child.style.bottom, SB);
        if (SL) child.style.left = maxPx(child.style.left, SL);
      }
    }
  }

  if (templateId === 'tips') {
    for (const child of el.children) {
      // Left column (flex, z2)
      if (child.style.position === 'absolute' && child.style.display === 'flex' && child.style.zIndex === '2') {
        child.style.top = maxPx(child.style.top, ST);
        if (SL) child.style.left = maxPx(child.style.left, SL);
      }
      // Photos (z1 and z3) — adjust bottom + right
      if (child.style.position === 'absolute' && (child.style.zIndex === '1' || child.style.zIndex === '3')) {
        if (child.style.bottom) child.style.bottom = maxPx(child.style.bottom, SB);
        if (SR && child.style.right) child.style.right = maxPx(child.style.right, SR);
      }
    }
  }

  // Arch: top text section
  if (templateId === 'arch') {
    const topSection = el.querySelector('.tpl-arch-top');
    if (topSection) {
      topSection.style.top = maxPx(topSection.style.top, ST);
      if (SL) topSection.style.left = maxPx(topSection.style.left, SL);
      if (SR) topSection.style.right = maxPx(topSection.style.right, SR);
    }
  }
}

/**
 * Renders a template by ID, returning a DOM element.
 * @param {string} templateId
 * @param {Object} data - Extracted post data
 * @param {string} photoUrl - Data URL or blob URL of cover media
 * @param {Object} [opts]
 * @param {boolean} [opts.isVideo] - If true, swap cover imgs for video elements
 * @param {string} [opts.blurredUrl] - Pre-blurred image URL for bg layer
 * @param {Object} [opts.size] - { w, h } format dimensions; triggers safe area for h >= 1920
 * @param {string[]} [opts.photos] - Additional photo URLs for multi-photo templates
 * @returns {HTMLElement} - Template container at native size
 */
export function renderTemplate(templateId, data, photoUrl, opts = {}) {
  const tmpl = TEMPLATES.find(t => t.id === templateId);
  if (!tmpl) throw new Error('Unknown template: ' + templateId);
  const el = tmpl.render(data, photoUrl, opts);

  // Apply safe area for formats that need it (Reels, TikTok, FB Story)
  if (opts.size && opts.size.safe) {
    applySafeArea(el, templateId, opts.size.safe);
  }

  // Diagonal: scale blue triangle clip-path for tall formats
  // CSS uses percentages (25%/55%) which balloon on 1920px; convert to fixed px
  if (templateId === 'diagonal' && opts.size && opts.size.h > 1350) {
    const triangle = el.querySelector('.tpl-overlay--triangle');
    if (triangle) {
      const h = opts.size.h;
      const rightPx = 1350 * 0.25; // 337px on base 1350
      const leftPx = 1350 * 0.55;  // 742px on base 1350
      const safeOffset = opts.size.safe ? Math.max(opts.size.safe.top - 40, 0) : 0;
      const rPct = ((rightPx + safeOffset) / h * 100).toFixed(1);
      const lPct = ((leftPx + safeOffset) / h * 100).toFixed(1);
      triangle.style.clipPath = `polygon(0 0, 100% 0, 100% ${rPct}%, 0 ${lPct}%)`;
    }
  }

  // Set pre-blurred background image (for image covers)
  if (opts.blurredUrl) {
    const bg = el.querySelector('.tpl-cover-bg');
    if (bg) bg.src = opts.blurredUrl;
  }

  // Fit mode: cover (fullscreen) or contain (show full photo + blur bg)
  const fgEl = el.querySelector('.tpl-cover-fg');
  if (fgEl) fgEl.style.objectFit = opts.fitCover ? 'cover' : 'contain';

  // Swap cover images for video elements if needed
  if (opts.isVideo) {
    const cover = el.querySelector('.tpl-cover');
    const targets = cover
      ? cover.querySelectorAll('img')
      : el.querySelectorAll('img[src="' + CSS.escape(photoUrl) + '"]');
    targets.forEach(img => {
      const video = document.createElement('video');
      video.className = img.className;
      video.src = photoUrl;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      // Copy sizing styles from the img
      for (const prop of ['width', 'height', 'objectFit', 'display', 'position', 'top', 'left', 'right', 'bottom', 'borderRadius']) {
        if (img.style[prop]) video.style[prop] = img.style[prop];
      }
      img.replaceWith(video);
    });
  }

  // Add logo overlay if provided (template-specific placement)
  // Pick the best variant for dark-bg templates (white preferred) or light-bg (colored/black preferred)
  const _pickLogo = (mode) => {
    if (mode === 'light') return opts.logoColored || opts.logoBlack || opts.logoWhite;
    if (mode === 'black') return opts.logoBlack || opts.logoColored || opts.logoWhite;
    return opts.logoWhite || opts.logoColored || opts.logoBlack; // dark bg
  };
  const _lightBgTemplates = ['card', 'topbar', 'before-after'];
  const _blackLogoTemplates = ['fade', 'frame', 'split', 'tips', 'spotlight'];
  let _logoMode = 'dark';
  if (_lightBgTemplates.includes(templateId)) _logoMode = 'light';
  else if (_blackLogoTemplates.includes(templateId)) _logoMode = 'black';
  const _logoUrl = _pickLogo(_logoMode);

  if (_logoUrl) {
    const safe = opts.size?.safe;
    const pos = opts.logoPosition || 'top-right';
    const logoOri = opts.logoOrientation || 'horizontal';
    const _logoOpts = { inline: true, orientation: logoOri };
    // Use same max() logic as applySafeArea so logo aligns with content
    const st = safe?.top || 0;
    const sl = safe?.left || 0;
    const sr = safe?.right || 0;
    const maxPx = (base, s) => Math.max(base, s) + 'px';

    // Inline alignment based on position
    const inlineAlign = pos === 'top-left' ? 'flex-start' : 'flex-end';

    switch (templateId) {
      // ── Gradient: inside glass panel ──
      case 'gradient': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.top = '32px';
        logo.style.zIndex = '5';
        if (pos === 'top-left') logo.style.left = '32px';
        else logo.style.right = '32px';
        const panel = el.querySelector('.gradient-top-panel');
        if (panel) panel.appendChild(logo);
        break;
      }

      // ── Blue: always left, aligned with content padding ──
      case 'blue': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        if (logoOri === 'horizontal') { logo.style.width = '360px'; logo.style.height = '100px'; logo.style.objectPosition = 'left'; }
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.top = maxPx(64, st);
        logo.style.left = maxPx(64, sl);
        el.appendChild(logo);
        break;
      }

      // ── Diagonal: aligned with content padding ──
      case 'diagonal': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.top = maxPx(60, st);
        if (pos === 'top-left') logo.style.left = maxPx(64, sl);
        else logo.style.right = maxPx(64, sr);
        el.appendChild(logo);
        break;
      }

      // ── Centered: above price, centered ──
      case 'centered': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.alignSelf = 'center';
        logo.style.marginBottom = '40px';
        const price = el.querySelector('.tpl-price');
        if (price?.parentElement) price.parentElement.insertBefore(logo, price);
        break;
      }

      // ── Card: centered above title in white panel (uses light variant) ──
      case 'card': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.alignSelf = 'center';
        logo.style.marginTop = '24px';
        logo.style.marginBottom = '24px';
        const panel = el.querySelector('.tpl-panel');
        if (panel) {
          const title = panel.querySelector('.tpl-title');
          if (title) panel.insertBefore(logo, title);
        }
        break;
      }

      // ── Elegant: aligned with content padding ──
      case 'elegant': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.top = maxPx(60, st);
        if (pos === 'top-left') logo.style.left = maxPx(64, sl);
        else logo.style.right = maxPx(64, sr);
        el.appendChild(logo);
        break;
      }

      // ── Top Bar: centered above price in white panel (uses light variant) ──
      case 'topbar': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.alignSelf = 'center';
        logo.style.marginTop = '24px';
        logo.style.marginBottom = '24px';
        const panel = el.querySelector('.tpl-panel');
        if (panel) panel.prepend(logo);
        break;
      }

      // ── Clean: above info boxes, always left ──
      case 'clean': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.alignSelf = 'flex-start';
        logo.style.marginBottom = '48px';
        const bottom = el.querySelector('.tpl-bottom');
        if (bottom) bottom.prepend(logo);
        break;
      }

      // ── Top Bar Alt: centered above price in glass panel ──
      case 'topbar-alt': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.alignSelf = 'center';
        logo.style.marginTop = '24px';
        logo.style.marginBottom = '24px';
        const panel = el.querySelector('.tpl-panel');
        if (panel) panel.prepend(logo);
        break;
      }

      // ── Before/After: above price in info section ──
      case 'before-after': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.objectPosition = 'left';
        logo.style.marginBottom = '16px';
        const bottom = el.querySelector('.tpl-bottom');
        if (bottom) {
          const price = bottom.querySelector('.tpl-price');
          if (price) bottom.insertBefore(logo, price);
          else bottom.prepend(logo);
        }
        break;
      }

      // ── Spotlight: inside photo frame, matching badge margins (24px) ──
      case 'spotlight': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '2';
        logo.style.top = '24px';
        logo.style.right = '24px';
        const frame = el.querySelector('.tpl-photo-frame');
        if (frame) frame.appendChild(logo);
        break;
      }

      // ── Frame: inside photo area, matching badge margins (32px), always left ──
      case 'frame': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.objectPosition = 'left';
        logo.style.position = 'absolute';
        logo.style.zIndex = '2';
        logo.style.top = '32px';
        logo.style.left = '32px';
        const frame = el.querySelector('.tpl-photo-frame');
        if (frame) frame.appendChild(logo);
        break;
      }



      // ── Tips: bottom-left on white shape ──
      case 'tips': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.bottom = maxPx(64, safe?.bottom || 0);
        logo.style.left = maxPx(64, safe?.left || 0);
        logo.style.objectPosition = 'left center';
        el.appendChild(logo);
        break;
      }

      // ── Arch: bottom-center on accent band ──
      case 'arch': {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.bottom = maxPx(100, safe?.bottom || 0);
        logo.style.left = '50%';
        logo.style.transform = 'translateX(-50%)';
        el.appendChild(logo);
        break;
      }

      // ── Default: aligned with safe area ──
      default: {
        const logo = createLogoOverlay(_logoUrl, _logoOpts);
        logo.style.position = 'absolute';
        logo.style.zIndex = '10';
        logo.style.top = maxPx(40, st);
        if (pos === 'top-left') logo.style.left = maxPx(40, sl);
        else logo.style.right = maxPx(40, sr);
        el.appendChild(logo);
        break;
      }
    }
  }

  return el;
}

/**
 * Extracts post data from a property object.
 * @param {Object} prop
 * @returns {Object}
 */
export function extractPostData(prop) {
  const fmt = (v) => {
    if (v == null || v === '' || v === 'undefined' || v === 'null') return '';
    return String(v);
  };
  const price = prop.price
    ? (typeof prop.price === 'number' ? ('\u20AC ' + prop.price.toLocaleString('it-IT')) : fmt(prop.price))
    : '';
  const surface = prop.surface
    ? (typeof prop.surface === 'number' ? (prop.surface + ' m\u00B2') : fmt(prop.surface))
    : '';
  let surfaceNum = '';
  if (surface) {
    const m = surface.match(/[\d.,]+/);
    if (m) surfaceNum = m[0];
  }
  const type = fmt(prop.type);
  const title = type || i18n.t('pwProperty');
  return {
    price,
    address: fmt(prop.address),
    surface,
    surfaceNum,
    surfaceLabel: fmt(prop.surfaceLabel),
    rooms: fmt(prop.rooms),
    roomsLabel: fmt(prop.roomsLabel),
    bedrooms: fmt(prop.bedrooms),
    bathrooms: fmt(prop.bathrooms),
    bathroomsLabel: fmt(prop.bathroomsLabel),
    type,
    title,
    contract: fmt(prop.contract),
    energyClass: fmt(prop.energyClass),
    floor: fmt(prop.floor),
    description: fmt(prop.description),
    ctaText: fmt(prop.ctaText),
    accentColor: prop.accentColor || '#2967EC',
    _icons: prop._icons || null,
  };
}
