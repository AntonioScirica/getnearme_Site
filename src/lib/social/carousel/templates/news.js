import { MASCOT_DATA_URL } from '../assets/mascot.js';

const MASCOT_IMG = MASCOT_DATA_URL
  ? `<img src="${MASCOT_DATA_URL}" style="width:100%;height:100%;object-fit:contain;" />`
  : `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="M60 100V55" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M60 55c-15-2-28-14-28-30s13-20 28-20" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M60 55c15-2 28-14 28-30S75 5 60 5" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M38 40c-10 5-18 15-18 28s10 22 20 22" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M82 40c10 5 18 15 18 28s-10 22-20 22" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="45" cy="35" r="4" fill="#fff"/><circle cx="75" cy="35" r="4" fill="#fff"/><circle cx="35" cy="60" r="3" fill="#fff"/><circle cx="85" cy="60" r="3" fill="#fff"/></svg>`;

function newsStyles() {
  return `
    /* Fonts loaded inline - no @import to avoid network timeout on serverless */

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1350px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: #FAFAFA;
      color: #0f172a;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .slide {
      width: 1080px;
      height: 1350px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Decorative background elements */
    .bg-decor {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .bg-blob-1 {
      position: absolute;
      top: -120px;
      right: -80px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);
    }

    .bg-blob-2 {
      position: absolute;
      bottom: -100px;
      left: -60px;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%);
    }

    .bg-dots {
      position: absolute;
      top: 80px;
      right: 60px;
      width: 120px;
      height: 120px;
      background-image: radial-gradient(circle, rgba(124,58,237,0.12) 1.5px, transparent 1.5px);
      background-size: 16px 16px;
    }

    .bg-ring {
      position: absolute;
      bottom: 160px;
      left: 40px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(124,58,237,0.1);
    }

    .bg-line {
      position: absolute;
      top: 0;
      left: 72px;
      width: 3px;
      height: 100%;
      background: linear-gradient(to bottom, transparent 0%, rgba(124,58,237,0.06) 30%, rgba(124,58,237,0.06) 70%, transparent 100%);
    }

    .top-bar {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 52px 72px 0;
    }

    .brand {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: rgba(15,23,42,0.25);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .news-badge {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      background: #EF4444;
      padding: 8px 24px;
      border-radius: 100px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .news-badge::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fff;
    }

    .main-content {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 72px;
      gap: 48px;
    }

    .tweet-card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 48px;
      color: #0f172a;
      max-width: 100%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.06);
    }

    .tweet-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .tweet-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tweet-avatar-icon {
      width: 28px;
      height: 28px;
      color: #fff;
    }

    .tweet-author-name {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
    }

    .tweet-author-handle {
      font-size: 18px;
      color: #94a3b8;
    }

    .tweet-body {
      font-size: 32px;
      line-height: 1.5;
      color: #0f172a;
      font-weight: 400;
    }

    .tweet-body strong {
      color: #0f172a;
      font-weight: 700;
    }

    .tweet-meta {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #f1f5f9;
      font-size: 16px;
      color: #94a3b8;
    }

    .comment-section {
      background: #FFFFFF;
      border-radius: 20px;
      padding: 36px 40px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.06);
      border-left: 4px solid #7C3AED;
    }

    .comment-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #A78BFA);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }

    .comment-bubble {
      flex: 1;
    }

    .comment-author {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .comment-text {
      font-size: 28px;
      line-height: 1.5;
      color: #64748b;
      font-style: italic;
    }

    .comment-text strong {
      color: #7C3AED;
      font-weight: 700;
      font-style: normal;
    }

    .bottom-bar {
      position: relative;
      z-index: 2;
      padding: 0 72px 52px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .swipe-hint {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(15,23,42,0.2);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .slide-num {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(15,23,42,0.15);
    }

    strong { color: #7C3AED; font-weight: 700; }
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SVG icons (28x28, white fill for dark avatars, dark fill specified)
const ICON = {
  x: '<svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  openai: '<svg viewBox="0 0 24 24" fill="#fff" width="26" height="26"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>',
  anthropic: '<svg viewBox="0 0 24 24" fill="#fff" width="24" height="24"><path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0l6.57-16.96zm4.063 10.972L8.344 8.283 6.056 14.49h4.576z"/></svg>',
  google: '<svg viewBox="0 0 24 24" fill="#fff" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
  nvidia: '<svg viewBox="0 0 24 24" fill="#fff" width="26" height="26"><path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.772 3.39 6.772 3.39s-3.058 3.839-6.35 3.839a4.37 4.37 0 0 1-.846-.08v-4.588c1.338.16 1.604.672 2.406 1.828l1.806-1.51s-1.665-1.96-3.924-1.96c-.096 0-.192.01-.288.018v-.489zm0-4.154v1.86l.424-.024c5.406-.17 9.312 4.616 9.312 4.616s-4.476 5.144-8.726 5.144a5.18 5.18 0 0 1-1.01-.098v1.264c.282.04.568.064.858.064 3.702 0 6.442-1.878 9.076-4.116.436.348 2.222 1.198 2.59 1.57-2.548 2.024-8.478 3.636-11.58 3.636-.318 0-.624-.018-.944-.052v1.636H20.16V4.644H8.948zM3.84 15.086c-1.268-.52-1.548-1.632-1.548-1.632s1.078 1.2 3.202 1.482v-1.264c-1.246-.394-2.442-1.648-2.442-3.376 0-2.746 2.442-3.794 2.442-3.794v-.144s-2.536.06-4.05 2.346C.49 10.24.414 12.656 1.136 14.28c.736 1.45 1.814 2.216 2.704 2.62v-1.814z"/></svg>',
  hf: '<svg viewBox="0 0 24 24" fill="#000" width="26" height="26"><path d="M8.5 4C6.015 4 4 6.015 4 8.5c0 1.215.482 2.318 1.266 3.127A5.48 5.48 0 0 0 4 14.5C4 16.985 6.015 19 8.5 19c.96 0 1.854-.3 2.588-.812a4.99 4.99 0 0 0 1.912.379 4.99 4.99 0 0 0 1.912-.379A4.48 4.48 0 0 0 17.5 19c2.485 0 4.5-2.015 4.5-4.5 0-1.215-.482-2.318-1.266-3.127A4.48 4.48 0 0 0 22 8.5C22 6.015 19.985 4 17.5 4c-.96 0-1.854.3-2.588.812A4.99 4.99 0 0 0 13 4.433a4.99 4.99 0 0 0-1.912.379A4.48 4.48 0 0 0 8.5 4zm1 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-6.5 5h6s-.5 3-3 3-3-3-3-3z"/></svg>',
  rss: '<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22" stroke="#fff" stroke-width="0"><circle cx="6.18" cy="17.82" r="2.18"/><path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" fill="#fff"/></svg>',
  verge: '<svg viewBox="0 0 24 24" fill="#fff" width="26" height="26"><polygon points="12,2 2,22 12,17 22,22"/></svg>',
  tc: '<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><path d="M21 4H3v4h6.5v12h5V8H21z"/></svg>',
  wired: '<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><rect x="3" y="8" width="3" height="8"/><rect x="8" y="8" width="3" height="8"/><path d="M13 8h3l2 8h-3z"/><rect x="19" y="8" width="3" height="8"/></svg>',
  ieee: '<svg viewBox="0 0 24 24" fill="#fff" width="22" height="22"><rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="#fff" stroke-width="2"/><line x1="8" y1="8" x2="16" y2="8" stroke="#fff" stroke-width="2"/><line x1="8" y1="12" x2="16" y2="12" stroke="#fff" stroke-width="2"/><line x1="8" y1="16" x2="13" y2="16" stroke="#fff" stroke-width="2"/></svg>',
};

const SOURCE_BRANDS = {
  'TechCrunch AI':    { color: '#0A9E01', icon: ICON.tc },
  'TechCrunch':       { color: '#0A9E01', icon: ICON.tc },
  'The Verge AI':     { color: '#000', icon: ICON.verge },
  'The Verge':        { color: '#000', icon: ICON.verge },
  'Wired AI':         { color: '#000', icon: ICON.wired },
  'Wired':            { color: '#000', icon: ICON.wired },
  'Hugging Face Blog':{ color: '#FFD21E', icon: ICON.hf },
  'Towards AI':       { color: '#3B82F6', icon: ICON.rss },
  'OpenAI Blog':      { color: '#000', icon: ICON.openai },
  'Google AI Blog':   { color: '#4285F4', icon: ICON.google },
  'NVIDIA AI Blog':   { color: '#76B900', icon: ICON.nvidia },
  'Anthropic Blog':   { color: '#D97757', icon: ICON.anthropic },
  'IEEE Spectrum':    { color: '#00629B', icon: ICON.ieee },
  'IEEE Spectrum Robotics': { color: '#00629B', icon: ICON.ieee },
  'The Robot Report':  { color: '#E53E3E', icon: ICON.rss },
  'VentureBeat AI':   { color: '#E8453C', icon: ICON.rss },
  'MIT Tech Review':  { color: '#E2231A', icon: ICON.rss },
  'The Rundown AI':   { color: '#6366F1', icon: ICON.rss },
  'AI News':          { color: '#8B5CF6', icon: ICON.rss },
};

function getSourceBrand(source) {
  const brand = SOURCE_BRANDS[source];
  if (brand) return brand;
  return { color: '#6B7280', label: (source || 'AI')[0].toUpperCase() };
}

function renderSourceAvatarSmall(source) {
  const b = getSourceBrand(source);
  const tc = b.textColor || '#fff';
  if (b.icon) {
    return `<div style="width:32px;height:32px;border-radius:50%;background:${b.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${b.icon.replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"')}</div>`;
  }
  return `<div style="width:32px;height:32px;border-radius:50%;background:${b.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;font-weight:800;color:${tc};">${b.label}</div>`;
}

function renderSourceAvatar(source) {
  const b = getSourceBrand(source);
  const tc = b.textColor || '#fff';
  if (b.icon) {
    return `<div class="tweet-avatar" style="background:${b.color};">${b.icon}</div>`;
  }
  return `<div class="tweet-avatar" style="background:${b.color};font-size:20px;font-weight:800;color:${tc};">${b.label}</div>`;
}

function renderBoldText(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function renderMediumText(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:600;color:#334155;">$1</span>');
}

function bgDecor() {
  return `
    <div class="bg-decor">
      <div class="bg-blob-1"></div>
      <div class="bg-blob-2"></div>
      <div class="bg-dots"></div>
      <div class="bg-ring"></div>
      <div class="bg-line"></div>
    </div>
  `;
}

function newsCoverHTML(slide) {
  return `
    <div class="slide" style="background:#FAFAFA;">
      ${bgDecor()}
      <!-- Large decorative purple circle, top-right -->
      <div style="position:absolute;top:-180px;right:-140px;width:480px;height:480px;border-radius:50%;background:linear-gradient(135deg,rgba(124,58,237,0.07),rgba(167,139,250,0.04));z-index:0;"></div>

      <div class="top-bar">
        <div class="brand">@getnearme_app</div>
        <div class="news-badge">Breaking</div>
      </div>

      <div class="main-content" style="gap:0;justify-content:center;">
        <!-- Source pill -->
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px;">
          ${renderSourceAvatar(slide.source)}
          <div>
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;">${escapeHtml(slide.source || 'AI News')}</div>
            <div style="font-size:15px;color:#94a3b8;">${slide.date || 'oggi'}</div>
          </div>
        </div>

        <!-- HERO headline -->
        <h1 style="
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:64px;
          font-weight:800;
          line-height:1.15;
          letter-spacing:-0.03em;
          color:#0f172a;
          max-width:900px;
          margin-bottom:48px;
        ">${renderBoldText(slide.headline)}</h1>

        <!-- Separator -->
        <div style="width:56px;height:4px;background:#7C3AED;border-radius:2px;margin-bottom:40px;"></div>

        <!-- Comment card - purple tinted -->
        <div style="
          background:linear-gradient(135deg,#7C3AED,#6D28D9);
          border-radius:20px;
          padding:36px 40px;
          display:flex;
          gap:20px;
          align-items:flex-start;
        ">
          <div class="comment-avatar" style="background:#fff;width:52px;height:52px;padding:4px;">${MASCOT_IMG}</div>
          <div style="flex:1;">
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:8px;">@getnearme_app</div>
            <div style="font-size:28px;line-height:1.5;color:#fff;">${renderBoldText(slide.subtitle).replace(/<strong>/g, '<strong style="color:#fff !important;">')}</div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="swipe-hint" style="display:flex;align-items:center;gap:10px;">
          Scorri per leggere
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div style="display:flex;gap:6px;">
          <div style="width:24px;height:4px;border-radius:2px;background:#7C3AED;"></div>
          <div style="width:12px;height:4px;border-radius:2px;background:rgba(15,23,42,0.1);"></div>
          <div style="width:12px;height:4px;border-radius:2px;background:rgba(15,23,42,0.1);"></div>
          <div style="width:12px;height:4px;border-radius:2px;background:rgba(15,23,42,0.1);"></div>
          <div style="width:12px;height:4px;border-radius:2px;background:rgba(15,23,42,0.1);"></div>
        </div>
      </div>
    </div>
  `;
}

function formatDate() {
  const d = new Date();
  const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function newsContentHTML(slide, slideNum, totalSlides) {
  const hasImage = !!slide.image_base64;

  const imageBlock = hasImage ? `
    <!-- Article image -->
    <div style="
      width:100%;
      height:540px;
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 4px 24px rgba(0,0,0,0.08);
      flex-shrink:0;
    ">
      <img src="${slide.image_base64}" style="
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      " />
    </div>
  ` : '';

  const sourceBlock = '';

  // With image: smaller text, tighter gaps. Without: original spacious layout.
  const titleSize = hasImage ? '48px' : '58px';
  const bodySize = hasImage ? '32px' : '36px';
  const contentGap = hasImage ? '24px' : '36px';

  const commentBlock = slide.comment ? `
    <!-- Our take -->
    <div style="
      display:flex;
      gap:14px;
      align-items:center;
      margin-top:8px;
      padding-top:20px;
      border-top:2px solid rgba(124,58,237,0.1);
      flex-shrink:0;
    ">
      <div style="
        width:40px;
        height:40px;
        flex-shrink:0;
        overflow:hidden;
      ">${MASCOT_IMG}</div>
      <div style="
        font-size:24px;
        line-height:1.45;
        color:#7C3AED;
        font-weight:500;
      ">${renderBoldText(slide.comment)}</div>
    </div>
  ` : '';

  return `
    <div class="slide">
      ${bgDecor()}
      <div class="top-bar">
        <div class="brand">@getnearme_app</div>
        <div class="slide-num">${formatDate()}</div>
      </div>

      <div class="main-content" style="gap:${contentGap};overflow:hidden;${hasImage ? 'justify-content:flex-start;padding-top:40px;' : ''}">
        ${imageBlock}
        ${sourceBlock}
        <div style="
          width: 56px;
          height: 4px;
          background: #7C3AED;
          border-radius: 2px;
          flex-shrink:0;
        "></div>
        <h2 style="
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: ${titleSize};
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #0f172a;
        ">${renderBoldText(slide.title)}</h2>
        <div style="
          font-size: ${bodySize};
          line-height: 1.6;
          color: #64748b;
        ">${renderMediumText(slide.body)}</div>
        ${commentBlock}
      </div>

      <div class="bottom-bar" style="justify-content:space-between;">
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;color:rgba(15,23,42,0.25);">${slide.source ? escapeHtml(slide.source) : ''}</div>
        <div class="slide-num">${slideNum} / ${totalSlides}</div>
      </div>
    </div>
  `;
}

function newsCtaHTML(slide) {
  return `
    <div class="slide" style="
      background:linear-gradient(160deg,#0f0620 0%,#1a0a3a 40%,#2d1466 100%);
      justify-content:center;
      align-items:center;
      text-align:center;
    ">
      <!-- Decorative elements on dark -->
      <div style="position:absolute;top:-160px;left:-100px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%);"></div>
      <div style="position:absolute;bottom:-120px;right:-80px;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.08) 0%,transparent 70%);"></div>
      <div style="position:absolute;top:100px;right:80px;width:100px;height:100px;background-image:radial-gradient(circle,rgba(167,139,250,0.12) 1.5px,transparent 1.5px);background-size:16px 16px;"></div>
      <div style="position:absolute;bottom:140px;left:60px;width:64px;height:64px;border-radius:50%;border:2px solid rgba(167,139,250,0.1);"></div>

      <div style="
        position:relative;
        z-index:2;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:36px;
        padding:0 80px;
      ">
        <!-- Avatar with glow -->
        <div style="position:relative;margin-bottom:8px;">
          <div style="position:absolute;inset:-20px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%);"></div>
          <div style="
            width:160px;
            height:160px;
            position:relative;
            filter:drop-shadow(0 0 24px rgba(124,58,237,0.5));
          ">${MASCOT_IMG}</div>
        </div>

        <div style="width:48px;height:4px;background:#A78BFA;border-radius:2px;"></div>

        <h2 style="
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:68px;
          font-weight:800;
          line-height:1.15;
          letter-spacing:-0.03em;
          color:#fff;
        ">${renderBoldText(slide.headline)}</h2>

        <p style="
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:28px;
          color:rgba(255,255,255,0.45);
          line-height:1.5;
          max-width:700px;
        ">${renderBoldText(slide.subtitle)}</p>

        <!-- CTA Button -->
        <div style="
          margin-top:12px;
          background:#fff;
          color:#7C3AED;
          padding:28px 80px;
          border-radius:100px;
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:30px;
          font-weight:700;
          box-shadow:0 0 40px rgba(255,255,255,0.1);
        ">Segui @getnearme_app</div>

        <span style="
          font-family:'Helvetica Neue',Arial,sans-serif;
          font-size:15px;
          color:rgba(255,255,255,0.2);
          letter-spacing:0.1em;
          text-transform:uppercase;
          font-weight:600;
          margin-top:8px;
        ">Ogni giorno, news AI spiegate semplice</span>
      </div>
    </div>
  `;
}

export function buildNewsSlideHTML(slide, slideIndex = 0, totalSlides = 6) {
  let content;
  switch (slide.type) {
    case 'cover':
      content = newsCoverHTML(slide);
      break;
    case 'cta':
      content = newsCtaHTML(slide);
      break;
    default:
      content = newsContentHTML(slide, slideIndex, totalSlides);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${newsStyles()}</style>
</head>
<body>${content}</body>
</html>`;
}
