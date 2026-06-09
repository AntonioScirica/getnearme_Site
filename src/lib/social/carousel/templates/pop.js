import { MASCOT_DATA_URL } from '../assets/mascot.js';

const MASCOT_IMG = MASCOT_DATA_URL
  ? `<img src="${MASCOT_DATA_URL}" style="width:100%;height:100%;object-fit:contain;" />`
  : '';

const RUBRIC_PALETTES = {
  news:      { dark: '#4C1D95', mid: '#7C3AED', light: '#C4B5FD', accent: '#A78BFA', name: 'News Flash', icon: 'news' },
  education: { dark: '#1E3A8A', mid: '#3B82F6', light: '#93C5FD', accent: '#60A5FA', name: 'AI per Tutti', icon: 'education' },
  people:    { dark: '#9A3412', mid: '#EA580C', light: '#FDBA74', accent: '#FB923C', name: 'Chi c\'e dietro', icon: 'people' },
  myths:     { dark: '#14532D', mid: '#16A34A', light: '#86EFAC', accent: '#4ADE80', name: 'Miti & Realta', icon: 'myths' },
  tools:     { dark: '#831843', mid: '#DB2777', light: '#F9A8D4', accent: '#F472B6', name: 'Tool del Giorno', icon: 'tools' },
  world:     { dark: '#78350F', mid: '#D97706', light: '#FDE68A', accent: '#FBBF24', name: 'AI & Mondo', icon: 'world' },
  question:  { dark: '#134E4A', mid: '#0D9488', light: '#99F6E4', accent: '#2DD4BF', name: 'Domanda', icon: 'question' },
  prompt:    { dark: '#78350F', mid: '#D97706', light: '#FDE68A', accent: '#F59E0B', name: 'Prompt del Giorno', icon: 'prompt' },
  default:   { dark: '#4C1D95', mid: '#7C3AED', light: '#C4B5FD', accent: '#A78BFA', name: '', icon: 'brain' },
};

const RUBRIC_ICONS = {
  news: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="20" width="90" height="80" rx="8" stroke="currentColor" stroke-width="3"/>
    <line x1="30" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="55" x2="90" y2="55" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="70" x2="90" y2="70" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="30" y1="85" x2="60" y2="85" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="85" cy="38" r="8" stroke="currentColor" stroke-width="2.5"/>
    <path d="M82 38l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  education: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 25L15 50l45 25 45-25L60 25z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 62v25l30 16 30-16V62" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <line x1="105" y1="50" x2="105" y2="90" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="105" cy="93" r="4" fill="currentColor"/>
  </svg>`,
  people: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="38" r="18" stroke="currentColor" stroke-width="3"/>
    <path d="M25 95c0-19.33 15.67-35 35-35s35 15.67 35 35" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="92" cy="45" r="12" stroke="currentColor" stroke-width="2.5"/>
    <path d="M75 100c0-12 7-22 17-26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  myths: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 15l8 25h26l-21 15 8 25-21-15-21 15 8-25-21-15h26l8-25z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <line x1="40" y1="95" x2="80" y2="95" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="48" y1="105" x2="72" y2="105" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  tools: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="35" y="15" width="50" height="90" rx="12" stroke="currentColor" stroke-width="3"/>
    <line x1="35" y1="30" x2="85" y2="30" stroke="currentColor" stroke-width="2.5"/>
    <line x1="35" y1="85" x2="85" y2="85" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="60" cy="93" r="4" fill="currentColor"/>
    <rect x="45" y="42" width="30" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
    <rect x="45" y="56" width="20" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
    <rect x="45" y="70" width="25" height="8" rx="2" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  world: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="3"/>
    <ellipse cx="60" cy="60" rx="20" ry="42" stroke="currentColor" stroke-width="2.5"/>
    <line x1="18" y1="45" x2="102" y2="45" stroke="currentColor" stroke-width="2"/>
    <line x1="18" y1="75" x2="102" y2="75" stroke="currentColor" stroke-width="2"/>
    <line x1="60" y1="18" x2="60" y2="102" stroke="currentColor" stroke-width="2"/>
  </svg>`,
  question: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="55" r="38" stroke="currentColor" stroke-width="3"/>
    <path d="M48 42c0-8 5.5-14 12-14s12 6 12 14c0 8-7 10-12 16v4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="75" r="3.5" fill="currentColor"/>
    <path d="M35 93l-12 20h74l-12-20" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`,
  brain: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 100V55" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 55c-15-2-28-14-28-30s13-20 28-20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M60 55c15-2 28-14 28-30S75 5 60 5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 40c-10 5-18 15-18 28s10 22 20 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M82 40c10 5 18 15 18 28s-10 22-20 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="45" cy="35" r="4" fill="currentColor"/>
    <circle cx="75" cy="35" r="4" fill="currentColor"/>
    <circle cx="35" cy="60" r="3" fill="currentColor"/>
    <circle cx="85" cy="60" r="3" fill="currentColor"/>
  </svg>`,
};

function getPalette(rubric) {
  return RUBRIC_PALETTES[rubric] || RUBRIC_PALETTES.default;
}

function getIcon(palette) {
  return RUBRIC_ICONS[palette.icon] || RUBRIC_ICONS.brain;
}

function baseStyles(palette) {
  return `
    /* Fonts: system fallback to avoid network timeout on serverless */

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1080px;
      height: 1350px;
      font-family: 'DM Sans', sans-serif;
      background: ${palette.dark};
      color: #FFFFFF;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .slide {
      width: 1080px;
      height: 1350px;
      position: relative;
      overflow: hidden;
    }

    .bg-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, ${palette.dark} 0%, ${palette.mid} 50%, ${palette.dark} 100%);
    }

    .bg-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: ${palette.accent};
      opacity: 0.12;
      filter: blur(120px);
    }

    .bg-glow-1 { top: -150px; right: -100px; }
    .bg-glow-2 { bottom: -150px; left: -100px; }


    .deco-dots {
      position: absolute;
      top: 180px;
      left: 80px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }

    .deco-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${palette.accent};
      opacity: 0.25;
    }

    .deco-line {
      position: absolute;
      width: 2px;
      height: 120px;
      background: linear-gradient(to bottom, ${palette.accent}, transparent);
      opacity: 0.2;
    }

    .deco-line-1 { top: 200px; right: 120px; }
    .deco-line-2 { bottom: 250px; left: 140px; }

    .deco-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid ${palette.accent};
      opacity: 0.08;
    }

    .deco-ring-1 { width: 200px; height: 200px; top: 100px; left: -60px; }
    .deco-ring-2 { width: 140px; height: 140px; bottom: 160px; right: -30px; }

    .content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 72px 80px;
    }

    .brand {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: rgba(255,255,255,0.3);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .rubric-tag {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: ${palette.dark};
      background: ${palette.light};
      padding: 10px 28px;
      border-radius: 100px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .slide-number {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: rgba(255,255,255,0.2);
    }

    .divider {
      width: 56px;
      height: 4px;
      background: ${palette.accent};
      border-radius: 2px;
    }

    .icon-inline {
      width: 48px;
      height: 48px;
      color: ${palette.light};
      flex-shrink: 0;
    }

    .icon-inline svg { width: 100%; height: 100%; }

    h1, h2 {
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -0.03em;
      color: #FFFFFF;
    }

    strong {
      color: ${palette.light};
      font-weight: 700;
    }
  `;
}

function renderBoldText(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function bgLayers(palette) {
  const icon = getIcon(palette);
  return `
    <div class="bg-gradient"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <div class="deco-ring deco-ring-1"></div>
    <div class="deco-ring deco-ring-2"></div>
    <div class="deco-line deco-line-1"></div>
    <div class="deco-line deco-line-2"></div>
    <div class="deco-dots">${'<span></span>'.repeat(15)}</div>
  `;
}

function coverHTML(slide, palette) {
  const icon = getIcon(palette);
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="brand">@getnearme_app</div>
          ${palette.name ? `<div class="rubric-tag">${escapeHtml(palette.name)}</div>` : ''}
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 36px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div class="divider"></div>
            <div class="icon-inline">${icon}</div>
          </div>
          <h1 style="
            font-size: 96px;
            font-weight: 800;
            line-height: 1.0;
          ">${renderBoldText(slide.headline)}</h1>
          ${slide.subtitle ? `<p style="
            font-size: 36px;
            font-weight: 400;
            line-height: 1.5;
            color: rgba(255,255,255,0.5);
            max-width: 800px;
          ">${renderBoldText(slide.subtitle)}</p>` : ''}
        </div>

        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="
            font-family: 'Space Grotesk', sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: rgba(255,255,255,0.25);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 12px;
          ">Scorri per leggere <span style="font-size: 24px;">&rarr;</span></div>
        </div>
      </div>
    </div>
  `;
}

function contentHTML(slide, palette, slideNum, totalSlides) {
  const icon = getIcon(palette);
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="brand">@getnearme_app</div>
          <div class="slide-number">${slideNum} / ${totalSlides}</div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 40px;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div class="divider"></div>
          </div>
          <h2 style="
            font-size: 62px;
            font-weight: 700;
            line-height: 1.1;
            max-width: 820px;
          ">${renderBoldText(slide.title)}</h2>
          <div style="
            font-size: 36px;
            line-height: 1.6;
            font-weight: 400;
            color: rgba(255,255,255,0.55);
            max-width: 800px;
          ">${renderBoldText(slide.body)}</div>
        </div>
      </div>
    </div>
  `;
}

function ctaHTML(slide, palette) {
  const icon = getIcon(palette);
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content" style="justify-content: center; align-items: center; text-align: center;">
        <div style="position: absolute; top: 72px; left: 0; right: 0; text-align: center;">
          <div class="brand">@getnearme_app</div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 32px;">
          <div style="width: 140px; height: 140px; margin-bottom: 8px; filter: drop-shadow(0 0 24px ${palette.accent}88);">${MASCOT_IMG || `<div class="icon-inline" style="width:100%;height:100%;">${icon}</div>`}</div>
          <div class="divider" style="margin: 0 auto;"></div>
          <h2 style="
            font-size: 80px;
            font-weight: 800;
            line-height: 1.1;
          ">${renderBoldText(slide.headline)}</h2>
          <p style="
            font-size: 34px;
            font-weight: 400;
            color: rgba(255,255,255,0.45);
            line-height: 1.5;
            max-width: 700px;
          ">${renderBoldText(slide.subtitle)}</p>
          <div style="
            margin-top: 24px;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: ${palette.light};
            color: ${palette.dark};
            padding: 24px 64px;
            border-radius: 100px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.01em;
          ">@getnearme_app</div>
        </div>
      </div>
    </div>
  `;
}

function promptHTML(slide, palette, slideNum, totalSlides) {
  const promptLines = escapeHtml(slide.prompt_text || '').replace(/\n/g, '<br>');
  const tip = slide.tip ? `<div style="font-size:28px;line-height:1.5;color:rgba(255,255,255,0.5);margin-top:32px;">${escapeHtml(slide.tip)}</div>` : '';
  const label = slide.label ? `<div style="
    display:inline-block;
    background:${palette.accent};
    color:${palette.dark};
    font-size:22px;
    font-weight:800;
    letter-spacing:0.06em;
    text-transform:uppercase;
    padding:8px 24px;
    border-radius:100px;
    margin-bottom:8px;
  ">${escapeHtml(slide.label)}</div>` : '';
  const header = slide.label
    ? `<div style="font-size:26px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">${escapeHtml(slide.context || '')}</div>`
    : `<div style="font-size:30px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${palette.accent};">Copia il prompt →</div>`;
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="brand">@getnearme_app</div>
          <div class="slide-number">${slideNum} / ${totalSlides}</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;">
          ${label}
          ${header}
          <div style="
            background:rgba(0,0,0,0.35);
            border:1.5px solid ${palette.accent};
            border-radius:20px;
            padding:44px 48px;
            font-size:30px;
            line-height:1.7;
            font-family:monospace;
            color:#fff;
            white-space:pre-wrap;
            word-break:break-word;
          ">${promptLines}</div>
          ${tip}
        </div>
      </div>
    </div>
  `;
}

function explanationHTML(slide, palette, slideNum, totalSlides) {
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="brand">@getnearme_app</div>
          <div class="slide-number">${slideNum} / ${totalSlides}</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:36px;">
          <div style="display:flex;align-items:center;gap:20px;">
            <div class="divider"></div>
            <div style="font-size:30px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">Perché funziona ↓</div>
          </div>
          <div style="
            background:rgba(0,0,0,0.3);
            border:1.5px solid ${palette.accent};
            border-radius:20px;
            padding:52px 56px;
          ">
            <div style="
              font-size:36px;
              line-height:1.65;
              font-weight:400;
              color:rgba(255,255,255,0.85);
            ">${renderBoldText(slide.body)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function exampleHTML(slide, palette, slideNum, totalSlides) {
  const inputText = escapeHtml(slide.input || '').replace(/\n/g, '<br>');
  const outputText = escapeHtml(slide.output || '').replace(/\n/g, '<br>');
  return `
    <div class="slide">
      ${bgLayers(palette)}
      <div class="content">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="brand">@getnearme_app</div>
          <div class="slide-number">${slideNum} / ${totalSlides}</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;">
          <h2 style="font-size:52px;font-weight:800;line-height:1.1;">${escapeHtml(slide.title || 'Esempio')}</h2>
          <div style="display:flex;flex-direction:column;gap:20px;">
            <div style="background:rgba(0,0,0,0.3);border-left:4px solid rgba(255,255,255,0.25);border-radius:8px;padding:28px 32px;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:12px;">Input</div>
              <div style="font-size:26px;line-height:1.55;color:rgba(255,255,255,0.7);">${inputText}</div>
            </div>
            <div style="font-size:40px;text-align:center;color:${palette.accent};">↓</div>
            <div style="background:rgba(0,0,0,0.3);border-left:4px solid ${palette.accent};border-radius:8px;padding:28px 32px;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};margin-bottom:12px;">Output</div>
              <div style="font-size:28px;line-height:1.6;color:#fff;">${outputText}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

export function buildSlideHTML(slide, slideIndex = 0, totalSlides = 5, rubric = 'default') {
  const palette = getPalette(rubric);

  let content;
  switch (slide.type) {
    case 'cover':
      content = coverHTML(slide, palette);
      break;
    case 'cta':
      content = ctaHTML(slide, palette);
      break;
    case 'prompt':
      content = promptHTML(slide, palette, slideIndex, totalSlides);
      break;
    case 'example':
      content = exampleHTML(slide, palette, slideIndex, totalSlides);
      break;
    case 'explanation':
      content = explanationHTML(slide, palette, slideIndex, totalSlides);
      break;
    case 'variant':
      content = promptHTML(slide, palette, slideIndex, totalSlides);
      break;
    default:
      content = contentHTML(slide, palette, slideIndex, totalSlides);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${baseStyles(palette)}</style>
</head>
<body>${content}</body>
</html>`;
}
