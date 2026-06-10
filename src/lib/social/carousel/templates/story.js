/**
 * Instagram Story templates — 1080x1920
 * Centered, no brand tag, date top, pill above title, text-only CTA
 */

import { MASCOT_DATA_URL } from '../assets/mascot.js';

const MASCOT_IMG = MASCOT_DATA_URL
  ? `<img src="${MASCOT_DATA_URL}" style="width:100%;height:100%;object-fit:contain;" />`
  : '';

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate() {
  return new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
}

/**
 * Generate an inline SVG data URL for a vertical linear gradient.
 * SVG gradients render identically in headless Chromium (@sparticuz/chromium)
 * and local Chrome — CSS gradients render darker in headless mode.
 * @param {Array<{offset:string, color:string, opacity?:number}>} stops
 */
function svgGradientBg(stops) {
  const svgStops = stops.map(s => {
    const op = s.opacity != null ? ` stop-opacity="${s.opacity}"` : '';
    return `<stop offset="${s.offset}" stop-color="${s.color}"${op}/>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${svgStops}</linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Radial glow on dark background — matches original story design.
 * Ellipse centered at 50% x, 40% y. Subtle colored glow fading to near-black.
 */
function svgRadialGlowBg(color, glowOpacity = 0.35) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><radialGradient id="g" cx="540" cy="680" rx="750" ry="900" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${color}" stop-opacity="${glowOpacity}"/><stop offset="50%" stop-color="${color}" stop-opacity="${glowOpacity * 0.4}"/><stop offset="100%" stop-color="#050505" stop-opacity="1"/></radialGradient></defs><rect width="1080" height="1920" fill="#050505"/><rect width="1080" height="1920" fill="url(#g)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const BASE = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1920px; overflow:hidden;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    background-color: #000000;
  }
  .wrap {
    width:1080px; height:1920px;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    text-align:center;
    padding:80px 96px;
    gap:32px;
    position:relative;
  }
  .date-top {
    position:absolute; top:72px; left:0; right:0;
    text-align:center;
    color:rgba(255,255,255,0.25);
    font-size:20px; font-weight:600; letter-spacing:2px;
  }
  .pill {
    border-radius:60px; padding:14px 40px;
    font-size:24px; font-weight:800; letter-spacing:2px;
  }
  .cta-text {
    font-size:30px; font-weight:800; margin-top:32px;
    padding:22px 72px; border-radius:60px;
    display:inline-block;
  }
  .time-bottom {
    position:absolute; bottom:80px; left:0; right:0;
    text-align:center;
    color:rgba(255,255,255,0.35);
    font-size:28px; font-weight:500; letter-spacing:0.5px;
  }
`;

/* ══════════════════════════════
   STORY 1 & 5 — NEWS
══════════════════════════════ */
export function buildNewsStoryHTML(top5 = [], edition = 'morning') {
  const morning = edition === 'morning';
  const accent  = morning ? '#F59E0B' : '#818CF8';
  // Background always indigo: the amber glow renders washed-out beige in
  // headless Chromium. Reference look = indigo glow + amber pill (morning).
  const bg      = 'radial-gradient(ellipse at 50% 40%, #818CF844 0%, #050505 65%)';
  const emoji   = morning ? '☀️' : '🌙';
  const label   = morning ? 'MORNING BRIEF' : 'EVENING BRIEF';
  const timeStr = morning ? 'Ogni mattina alle 9:00, gratis' : 'Ogni sera alle 20:00, gratis';

  const companies = [...new Set((top5 || []).slice(0, 4).map(n => n.company).filter(Boolean))];
  const nameMap = { openai:'OpenAI', google:'Google', meta:'Meta', anthropic:'Anthropic', microsoft:'Microsoft', nvidia:'NVIDIA' };
  const companyStr = companies.slice(0, 2).map(c => nameMap[c] || c).join(' e ');

  const introLabel = morning ? 'Stamattina nell\'AI' : 'Stasera nell\'AI';
  const mainTitle = morning
    ? (companyStr ? `${companyStr} e tutto quello che devi sapere oggi` : 'Tutte le notizie AI che contano oggi')
    : (companyStr ? `${companyStr} e il recap completo di oggi` : 'Tutto quello che è successo nell\'AI oggi');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${BASE} body{background:${bg};}</style>
  </head><body>
  <div class="wrap">
    <div class="date-top">${formatDate()}</div>

    <!-- Pill as intro label -->
    <div class="pill" style="background:${accent}22;border:1.5px solid ${accent}66;color:${accent};">
      ${emoji} ${esc(introLabel)}
    </div>

    <!-- Title -->
    <div style="color:#fff;font-size:64px;font-weight:900;line-height:1.1;max-width:860px;text-shadow:0 2px 40px rgba(0,0,0,0.5);">${esc(mainTitle)}</div>

    <!-- CTA -->
    <span class="cta-text" style="background:#fff;color:#000;">Leggi ora</span>

    <div class="time-bottom">${timeStr}</div>
  </div>
  </body></html>`;
}

/* ══════════════════════════
   STORY 2 — RUBRICA 12:00
══════════════════════════ */
const RUBRIC_META = {
  education: { emoji:'🎓', label:'TIPS DEL GIORNO',  color:'#10B981' },
  people:    { emoji:'👤', label:'CHI C\'È DIETRO',   color:'#3B82F6' },
  myths:     { emoji:'🔍', label:'MITI & REALTÀ',    color:'#EF4444' },
  tools:     { emoji:'🛠️', label:'TOOL DEL GIORNO',   color:'#F59E0B' },
  world:     { emoji:'🌍', label:'AI NELLA VITA',     color:'#8B5CF6' },
  question:  { emoji:'❓', label:'LA DOMANDA',        color:'#EC4899' },
};

export function buildPostStoryHTML(topic = {}) {
  const m = RUBRIC_META[topic.rubric] || { emoji:'📱', label:'POST DEL GIORNO', color:'#7C3AED' };
  const title = esc(topic.title || 'Post del giorno');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${BASE} body{background:radial-gradient(ellipse at 50% 40%, ${m.color}44 0%, #050505 65%);}</style>
  </head><body>
  <div class="wrap">
    <div class="date-top">${formatDate()}</div>

    <!-- Category pill -->
    <div class="pill" style="background:${m.color}22;border:1.5px solid ${m.color}66;color:${m.color};">
      ${m.label}
    </div>

    <!-- Title -->
    <div style="color:#fff;font-size:72px;font-weight:900;line-height:1.15;max-width:880px;text-shadow:0 4px 20px rgba(0,0,0,0.4);">${title}</div>

    <span class="cta-text" style="background:#fff;color:#000;">Scopri ora</span>

  </div>
  </body></html>`;
}

/* ══════════════════════════
   STORY 3 — VIDEO 15:00
══════════════════════════ */
const VT_META = {
  pillola:   { label:'PILLOLA AI',   color:'#10B981', emoji:'💊' },
  tips:      { label:'TIPS RAPIDO',  color:'#3B82F6', emoji:'⚡' },
  mito:      { label:'MITO SFATATO', color:'#EF4444', emoji:'🔥' },
  tool:      { label:'TOOL IN 30s',  color:'#F59E0B', emoji:'🛠️' },
  fatto:     { label:'FATTO WOW',    color:'#8B5CF6', emoji:'🤯' },
  confronto: { label:'CONFRONTO',    color:'#EC4899', emoji:'⚔️' },
  domanda:   { label:'LA DOMANDA',   color:'#06B6D4', emoji:'❓' },
};

export function buildVideoStoryHTML(topic = {}) {
  const vtype = topic.slide_data?.video_type || topic.video_type;
  const m = VT_META[vtype] || { label:'VIDEO', color:'#7C3AED', emoji:'🎬' };
  const title = esc(topic.title || 'Video del giorno');
  const hook = esc(topic.slide_data?.hook || topic.summary || '');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${BASE} body{background:radial-gradient(ellipse at 50% 40%, ${m.color}44 0%, #050505 65%);}</style>
  </head><body>
  <div class="wrap">
    <div class="date-top">${formatDate()}</div>

    <!-- Mascot -->
    <div style="width:260px;height:260px;filter:drop-shadow(0 0 40px rgba(0,0,0,0.3));">${MASCOT_IMG}</div>

    <!-- Type pill -->
    <div class="pill" style="background:${m.color}22;border:1.5px solid ${m.color}66;color:#fff;display:flex;align-items:center;gap:12px;">
      ${m.label}
    </div>

    <!-- Title -->
    <div style="color:#fff;font-size:72px;font-weight:900;line-height:1.15;max-width:880px;text-shadow:0 4px 20px rgba(0,0,0,0.4);">${title}</div>

    ${hook ? `<div style="color:rgba(255,255,255,0.7);font-size:30px;line-height:1.5;font-style:italic;max-width:800px;">"${hook}"</div>` : ''}

    <span class="cta-text" style="background:#fff;color:#000;">▶ Guarda ora</span>
  </div>
  </body></html>`;
}

/* ══════════════════════════════
   STORY 4 — PROMPT 18:00
══════════════════════════════ */
const TOOL_META = {
  ChatGPT:    { color:'#10a37f', icon:'🤖' },
  Claude:     { color:'#D97706', icon:'🧡' },
  Gemini:     { color:'#4285F4', icon:'✨' },
  Perplexity: { color:'#20B2AA', icon:'🔍' },
};

export function buildPromptStoryHTML(topic = {}) {
  const sd = topic.slide_data || {};
  const tool = sd.tool || sd.slides?.find(s => s.type === 'prompt')?.tool || 'ChatGPT';
  const title = esc(topic.title || 'Prompt del giorno');
  const tm = TOOL_META[tool] || { color:'#7C3AED', icon:'💡' };

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${BASE} body{background:radial-gradient(ellipse at 50% 40%, ${tm.color}44 0%, #050505 65%);}</style>
  </head><body>
  <div class="wrap">
    <div class="date-top">${formatDate()}</div>

    <!-- Tool pill -->
    <div class="pill" style="background:${tm.color}22;border:1.5px solid ${tm.color}66;color:${tm.color};display:flex;align-items:center;gap:10px;">
      ${esc(tool)} · PROMPT DEL GIORNO
    </div>

    <!-- Title -->
    <div style="color:#fff;font-size:72px;font-weight:900;line-height:1.15;max-width:880px;text-shadow:0 4px 20px rgba(0,0,0,0.4);">${title}</div>

    <!-- Teaser -->
    <div style="color:rgba(255,255,255,0.6);font-size:30px;line-height:1.5;max-width:800px;">
      Prompt pronto da copiare, con esempio e varianti
    </div>

    <span class="cta-text" style="background:#fff;color:#000;">Salvalo ora</span>

    <div class="time-bottom">+2 varianti nel post completo</div>
  </div>
  </body></html>`;
}

/* ─── ROUTER ─── */
export function buildStoryHTML(type, data) {
  switch (type) {
    case 'news_morning': return buildNewsStoryHTML(data.top5, 'morning');
    case 'news_evening': return buildNewsStoryHTML(data.top5, 'evening');
    case 'post':         return buildPostStoryHTML(data.topic);
    case 'video':        return buildVideoStoryHTML(data.topic);
    case 'prompt':       return buildPromptStoryHTML(data.topic);
    default: throw new Error(`Unknown story type: ${type}`);
  }
}
