// PED template renderer — server-side mirror of the templates in
// src/app/metrics/social/page.tsx (buildSlidesForTopic & co).
// Plain JS so the Puppeteer cron can render slides from content_topics.slide_data.
// IMPORTANT: keep in sync with page.tsx when templates change.

const LOGO_SVG_PATH = 'M224.816 4.98C217.966-1.72 207.036-1.65 200.274 5.13L51.253 154.306c-14.922 14.922-27.88 29.952-37.086 49.303-9.206 19.35-13.635 38.526-14.071 58.923-.567 26.135.975 49.699 17.468 70.838 13.962 17.889 31.458 32.876 46.576 49.739 16.601 18.521 34.14 36.475 51.178 54.691 4.56 4.887 58.465 62.021 83.051 88.418 6.698 7.177 17.976 7.439 25.001.567L379.138 374.925c55.018-53.971 58.334-133.379 15.969-196.448-16.885-25.153-40.882-45.812-63.483-66.471-6.85-6.261-17.409-6.043-24.019.48L167.856 250.403c-6.61 6.522-6.959 17.059-.785 23.997l33.508 37.784c6.61 7.461 18.129 7.875 25.262.894L320.193 220.69s41.885 40.773.349 93.152L225.427 408.782c-6.785 6.763-17.736 6.807-24.564.109L111.463 321.084s-61.759-46.619.658-109.491c49.521-49.106 119.483-118.479 147.778-146.512 6.915-6.85 6.871-18.063-.088-24.87L224.816 4.98z';

export const PED_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.ped{width:1080px;height:1350px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;padding:180px 72px;display:flex;flex-direction:column;justify-content:center}
.ped-badge{position:absolute;top:80px;left:72px;display:inline-flex;align-items:center;gap:10px;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;box-shadow:4px 4px 0 rgba(0,0,0,0.15);text-transform:uppercase;letter-spacing:2px;z-index:1}
.badge-amber{background:#fffbeb;border:3px solid #f59e0b;color:#b45309}
.badge-blue{background:#eff6ff;border:3px solid #3B83F6;color:#1d4ed8}
.ped-title{font-size:76px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px}
.hl-amber{color:#f59e0b}.hl-blue{color:#3B83F6}.hl-violet{color:#8b5cf6}.hl-emerald{color:#10b981}.hl-cyan{color:#06b6d4}.hl-red{color:#ef4444}
.ped-footer{position:absolute;bottom:80px;left:72px;right:72px;display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.ped-footer svg{width:36px;height:36px}
.ped-footer .swipe{margin-left:auto;display:flex;align-items:center;gap:8px;color:#1a1a2e;font-size:20px;letter-spacing:1px}
.ped-footer .swipe svg{width:28px;height:28px}
.deco{position:absolute;z-index:0}
.deco-c1{top:-80px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;border:4px solid #fcd34d;opacity:.5}
.deco-s1{bottom:200px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:4px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.deco-p1{bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:4px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.cd-stat{margin:0 0 20px;position:relative;z-index:1}
.cd-num{font-size:200px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-6px}
.cd-num .unit{font-size:100px;letter-spacing:-2px}
.cd-delta{display:inline-flex;align-items:center;gap:10px;background:#ecfdf5;border:3px solid #10b981;color:#047857;font-size:36px;font-weight:900;padding:12px 32px;border-radius:16px;margin-top:24px;box-shadow:4px 4px 0 rgba(16,185,129,0.25)}
.cd-delta svg{width:32px;height:32px}
.cd-statlabel{font-size:30px;color:#888;font-weight:700;margin-top:16px;letter-spacing:.5px}
.cd-title{margin-top:70px;position:relative;z-index:1}
.cdc-kicker{font-size:24px;font-weight:800;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
.cdc-text{font-size:44px;color:#1a1a2e;line-height:1.45;font-weight:500;position:relative;z-index:1}
.cdc-text strong{font-weight:900}
.cdc-card{margin-top:56px;background:#fff;border:4px solid #1a1a2e;border-radius:24px;padding:40px 48px;box-shadow:8px 8px 0 #1a1a2e;position:relative;z-index:1}
.cdc-card .label{font-size:24px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.cdc-card .value{font-size:64px;font-weight:900;color:#1a1a2e;letter-spacing:-1px}
.cdc-card .value span{color:#f59e0b}
.pva-title{font-size:56px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin:0 0 48px;position:relative;z-index:1}
.pva-list{display:flex;flex-direction:column;gap:24px;position:relative;z-index:1}
.pva-item{display:flex;align-items:flex-start;gap:24px;background:#fff;border:4px solid #1a1a2e;border-radius:20px;padding:32px 36px;box-shadow:6px 6px 0 #1a1a2e}
.pva-item .n{width:64px;height:64px;flex-shrink:0;background:#f59e0b;color:#1a1a2e;border:3px solid #1a1a2e;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900}
.pva-item .tx{font-size:33px;font-weight:700;color:#1a1a2e;line-height:1.35}
.pva-item .tx small{display:block;font-size:26px;font-weight:500;color:#777;margin-top:6px}
.ce-num{font-size:260px;font-weight:900;color:#3B83F6;line-height:.9;letter-spacing:-8px;position:relative;z-index:1;text-shadow:10px 10px 0 rgba(59,131,246,0.15);margin-bottom:16px}
.ce-title{margin-top:0;position:relative;z-index:1}
.ce-save{margin-top:48px;align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:#fff;border:3px solid #1a1a2e;border-radius:14px;padding:16px 32px;font-size:26px;font-weight:800;color:#1a1a2e;box-shadow:5px 5px 0 #1a1a2e;position:relative;z-index:1}
.ce-save svg{width:28px;height:28px}
.cec-num{width:130px;height:130px;background:#3B83F6;color:#fff;border:4px solid #1a1a2e;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:72px;font-weight:900;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:48px;position:relative;z-index:1}
.cec-title{font-size:64px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:32px;position:relative;z-index:1}
.cec-text{font-size:38px;color:#555;line-height:1.5;position:relative;z-index:1}
.cec-tip{margin-top:48px;background:#eff6ff;border:3px solid #3B83F6;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:700;color:#1d4ed8;line-height:1.4;position:relative;z-index:1}
.cf-visual{width:100%;height:500px;background:#fff;border:4px solid #1a1a2e;border-radius:28px;box-shadow:10px 10px 0 #1a1a2e;position:relative;z-index:1;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:56px}
.cf-visual .mock{width:85%;height:78%;background:#f5f5f3;border:3px solid #e5e5e5;border-radius:18px;position:relative;overflow:hidden}
.cf-visual .mock .bar{height:56px;background:#1a1a2e;display:flex;align-items:center;gap:8px;padding:0 20px}
.cf-visual .mock .bar i{width:16px;height:16px;border-radius:50%;display:block}
.cf-visual .mock .body{padding:24px;display:flex;gap:20px}
.cf-visual .mock .panel{flex:1;background:#fff;border:2px solid #e5e5e5;border-radius:12px;height:220px}
.cf-visual .mock .panel.acc{background:#eff6ff;border-color:#93c5fd}
.cf-no{display:flex;align-items:flex-start;gap:20px;background:#fef2f2;border:3px solid #ef4444;border-radius:18px;padding:28px 36px;margin-bottom:24px;position:relative;z-index:1}
.cf-yes{display:flex;align-items:flex-start;gap:20px;background:#ecfdf5;border:3px solid #10b981;border-radius:18px;padding:28px 36px;position:relative;z-index:1}
.cf-no .ic,.cf-yes .ic{width:48px;height:48px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900}
.cf-no .ic{background:#ef4444;color:#fff}
.cf-yes .ic{background:#10b981;color:#fff}
.cf-no .tx,.cf-yes .tx{font-size:34px;font-weight:700;line-height:1.4;color:#1a1a2e}
.cf-no .tx small,.cf-yes .tx small{display:block;font-size:27px;font-weight:500;color:#777;margin-top:6px}
.pcta{display:flex;flex-direction:column;align-items:center;text-align:center}
.pcta-kicker{font-size:26px;font-weight:800;color:#888;letter-spacing:3px;text-transform:uppercase;margin:0 0 36px;position:relative;z-index:1}
.pcta-title{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;max-width:880px;position:relative;z-index:1}
.pcta-pill{margin-top:56px;display:inline-flex;align-items:center;gap:14px;background:#3B83F6;color:#fff;font-size:42px;font-weight:900;padding:30px 72px;border-radius:18px;border:4px solid #1a1a2e;box-shadow:8px 8px 0 #1a1a2e;position:relative;z-index:1}
.pcta-sub{margin-top:36px;font-size:32px;color:#777;line-height:1.5;max-width:760px;position:relative;z-index:1}
.ps{padding:160px 72px 200px}
.ps-kicker{font-size:24px;font-weight:800;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;position:relative;z-index:1}
.ps-hook{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.ps-divider{width:80px;height:6px;background:#f59e0b;border-radius:3px;margin:48px 0;position:relative;z-index:1}
.ps-body{font-size:38px;color:#555;line-height:1.55;position:relative;z-index:1}
.ps-body strong{color:#1a1a2e;font-weight:800}
.ps-cta{margin-top:56px;display:flex;flex-direction:column;align-items:flex-start;gap:20px;position:relative;z-index:1}
.ps-cta .pill{background:#3B83F6;color:#fff;font-size:32px;font-weight:900;padding:20px 48px;border-radius:14px;border:3px solid #1a1a2e;box-shadow:6px 6px 0 #1a1a2e}
.ps-cta .hint{font-size:26px;color:#888;font-weight:600}
.tip{padding:100px 72px 180px}
.tip-num{width:96px;height:96px;background:#3B83F6;color:#fff;border:4px solid #1a1a2e;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;box-shadow:6px 6px 0 #1a1a2e;position:relative;z-index:1;margin-bottom:40px}
.tip-scenario{font-size:26px;font-weight:800;color:#3B83F6;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px;position:relative;z-index:1}
.tip-title{font-size:64px;font-weight:900;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;position:relative;z-index:1}
.tip-divider{width:80px;height:6px;background:#3B83F6;border-radius:3px;margin:40px 0;position:relative;z-index:1}
.tip-body{font-size:36px;color:#555;line-height:1.55;position:relative;z-index:1}
.tip-body strong{color:#1a1a2e;font-weight:800}
.tip-how{margin-top:40px;background:#eff6ff;border:3px solid #3B83F6;border-radius:18px;padding:24px 32px;font-size:28px;font-weight:700;color:#1d4ed8;line-height:1.45;position:relative;z-index:1}
.tip-how svg{width:24px;height:24px;display:inline;vertical-align:middle;margin-right:8px}
.cr-cover-title{font-size:68px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.cr-cover-sub{font-size:36px;color:#555;line-height:1.5;margin-top:32px;position:relative;z-index:1}
.cr-step-num{width:120px;height:120px;background:#f59e0b;color:#1a1a2e;border:4px solid #1a1a2e;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:900;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:40px;position:relative;z-index:1}
.cr-step-title{font-size:56px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:28px;position:relative;z-index:1}
.cr-step-text{font-size:36px;color:#555;line-height:1.5;position:relative;z-index:1}
.cr-step-highlight{margin-top:40px;background:#fffbeb;border:3px solid #f59e0b;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:700;color:#b45309;line-height:1.4;position:relative;z-index:1}
.cr-payout{margin-top:48px;background:#ecfdf5;border:4px solid #10b981;border-radius:20px;padding:36px 44px;position:relative;z-index:1;box-shadow:6px 6px 0 rgba(16,185,129,0.25)}
.cr-payout .label{font-size:24px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.cr-payout .value{font-size:52px;font-weight:900;color:#047857}
`;

export const STORY_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.story{width:1080px;height:1920px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:160px 90px}
.st-shape{position:absolute;opacity:0.08}
.st-shape.sh-circle{width:600px;height:600px;border-radius:50%;top:-120px;right:-160px}
.st-shape.sh-square{width:400px;height:400px;border-radius:32px;bottom:180px;left:-100px;transform:rotate(15deg)}
.st-shape.sh-pill{width:240px;height:560px;border-radius:120px;top:200px;right:-60px}
.st-shape.sh-diamond{width:360px;height:360px;border-radius:32px;transform:rotate(45deg);bottom:-80px;right:120px}
.st-shape.sh-bar{width:120px;height:100%;border-radius:0;top:0;right:80px}
.st-shape.sh-ring{width:500px;height:500px;border-radius:50%;border:60px solid;background:transparent !important;top:-60px;left:-120px}
.st-badge{border-radius:12px;padding:16px 36px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:4px;margin-bottom:72px;position:relative;z-index:1}
.st-hook{font-size:96px;font-weight:900;color:#1a1a2e;line-height:1.08;letter-spacing:-3px;max-width:920px;position:relative;z-index:1}
.st-hook .hl-amber{color:#f59e0b}
.st-hook .hl-blue{color:#3B83F6}
.st-hook .hl-emerald{color:#10b981}
.st-hook .hl-cyan{color:#06b6d4}
.st-hook .hl-lime{color:#84cc16}
.st-hook .hl-red{color:#ef4444}
.st-hook .hl-violet{color:#8b5cf6}
.st-sub{font-size:32px;font-weight:500;color:#64748b;line-height:1.5;margin-top:48px;max-width:740px;position:relative;z-index:1}
.st-cta{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:72px;position:relative;z-index:1}
.st-cta-pill{display:inline-flex;align-items:center;gap:12px;border-radius:60px;padding:22px 44px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#fff}
.st-cta-pill svg{width:22px;height:22px}
.st-footer{position:absolute;bottom:48px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:8px;font-size:18px;font-weight:600;color:#ccc;letter-spacing:3px;text-transform:uppercase}
.st-footer svg{width:18px;height:18px}
`;

const PED_LOGO_FOOTER = `<svg viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path fill="#3B83F6" d="${LOGO_SVG_PATH}"/></svg>getnearme.it`;
const PED_SWIPE = '<span class="swipe">Scorri <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></span>';
const PED_UP_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
const TIP_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';
const GNM_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

const REF_STEPS = [
  ["Segnala il contatto", "Conosci un titolare, un agente o un team? Basta una segnalazione. Non devi vendere nulla.", "Tu apri la conversazione, noi facciamo il resto."],
  ["Noi facciamo la demo", "Il nostro team contatta l'agenzia, organizza la demo e presenta GetNearMe nel dettaglio.", "Non devi seguire la trattativa."],
  ["L'agenzia decide", "Nessuna pressione. L'agenzia valuta in autonomia se attivare GetNearMe per il proprio lavoro.", "Tu non hai obblighi dopo la segnalazione."],
  ["Ricevi il payout", "Se l'agenzia diventa cliente, ricevi il compenso previsto dal programma ambassador.", ""],
];

const RUBRIC_STORY = {
  mercato:       { hex: "#10b981", hl: "hl-emerald", shape: "sh-circle" },
  "roma-milano": { hex: "#06b6d4", hl: "hl-cyan",    shape: "sh-pill" },
  feature:       { hex: "#3B83F6", hl: "hl-blue",    shape: "sh-square" },
  educativo:     { hex: "#3B83F6", hl: "hl-blue",    shape: "sh-ring" },
  agenti:        { hex: "#f59e0b", hl: "hl-amber",   shape: "sh-diamond" },
  ambassador:    { hex: "#f59e0b", hl: "hl-amber",   shape: "sh-bar" },
  video:         { hex: "#ef4444", hl: "hl-red",     shape: "sh-circle" },
  tip:           { hex: "#8b5cf6", hl: "hl-violet",  shape: "sh-pill" },
};

// ── Slide builders (mirror of page.tsx D-functions) ──────────────────

function datiCoverD(d) {
  const bc = d.badgeColor === "blue" ? "badge-blue" : "badge-amber";
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge ${bc}">${d.badge || "Mercato"}</div>
    <div class="cd-stat">
      <div class="cd-num">${d.stat || "767"}<span class="unit">${d.unit || "mila"}</span></div>
      <div class="cd-delta">${PED_UP_ARROW}${d.delta || "+6,4%"}</div>
      <div class="cd-statlabel">${d.statLabel || ""}</div>
    </div>
    <div class="ped-title cd-title">${d.title || ""}<br><span class="${hlc}">${d.titleHL || ""}</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function datiInsightD(d) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cdc-kicker">${d.kicker || ""}</div>
    <div class="cdc-text">${d.insight || ""}</div>
    ${d.cardLabel ? `<div class="cdc-card"><div class="label">${d.cardLabel}</div><div class="value">${d.cardValue || ""}</div></div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function datiValueD(d) {
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  const items = d.actions || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">${d.valueTitle || ""} <span class="${hlc}">${d.valueHL || ""}</span></div>
    <div class="pva-list">${items.map((a, i) =>
    `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${a.text}<small>${a.sub}</small></div></div>`
  ).join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function pedCtaD(d) {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div><div class="deco deco-p1"></div>
    <div class="pcta-kicker">${d.ctaKicker || ""}</div>
    <div class="pcta-title">${d.ctaTitle || ""} <span class="${d.badgeColor === "blue" ? "hl-blue" : "hl-amber"}">${d.ctaHL || ""}</span></div>
    <div class="pcta-pill">Commenta "${d.ctaPill || "DEMO"}"</div>
    <div class="pcta-sub">${d.ctaSub || "Ricevi il link per provare GetNearMe."}</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}

function eduCoverD(d) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Educativo</div>
    <div class="ce-num">${d.num || "5"}</div>
    <div class="ped-title ce-title">${d.title || ""}<br><span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="ce-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Salva per dopo</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function eduItemD(n, item) {
  return `<div class="ped">
    <div class="deco deco-p1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">${n} di ${5}</div>
    <div class="cec-num">${n}</div>
    <div class="cec-title">${item.title}</div>
    <div class="cec-text">${item.text}</div>
    ${item.tip ? `<div class="cec-tip">${item.tip}</div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function featCoverD(d) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Feature</div>
    <div class="cf-visual"><div class="mock"><div class="bar"><i style="background:#ef4444"></i><i style="background:#fbbf24"></i><i style="background:#22c55e"></i></div><div class="body"><div class="panel"></div><div class="panel acc"></div></div></div></div>
    <div class="ped-title">${d.coverTitle || ""}<br><span class="hl-blue">${d.coverHL || ""}</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function featInsightD(d) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cf-no"><div class="ic">✕</div><div class="tx">${d.noText || ""}<small>${d.noSub || ""}</small></div></div>
    <div class="cf-yes"><div class="ic">✓</div><div class="tx">${d.yesText || ""}<small>${d.yesSub || ""}</small></div></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function featCasesD(d) {
  const cases = d.cases || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">Quando ha senso <span class="hl-blue">usarlo</span></div>
    <div class="pva-list">${cases.map((c, i) =>
    `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${c.title}<small>${c.text}</small></div></div>`
  ).join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function postSingoloD(d) {
  const bc = d.badgeColor === "blue" ? "badge-blue" : "badge-amber";
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  return `<div class="ped ps">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div><div class="deco deco-p1"></div>
    <div class="ped-badge ${bc}">${d.badge || "Per agenti"}</div>
    <div class="ps-kicker">${d.kicker || ""}</div>
    <div class="ps-hook">${d.hook || ""} <span class="${hlc}">${d.hookHL || ""}</span></div>
    <div class="ps-divider"></div>
    <div class="ps-body">${d.body || ""}</div>
    <div class="ps-cta">
      <span class="pill">Commenta "${d.ctaPill || "DEMO"}"</span>
      <span class="hint">${d.ctaHint || "Ricevi il link per provare GetNearMe"}</span>
    </div>
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}

function tipD(d) {
  return `<div class="ped tip">
    <div class="deco deco-c1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="deco deco-s1" style="background:#eff6ff;border-color:#3B83F6"></div>
    <div class="deco deco-p1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="ped-badge badge-blue">Tip #${d.tipNum || "1"}</div>
    <div class="tip-num">${d.tipNum || "1"}</div>
    <div class="tip-scenario">${d.scenario || ""}</div>
    <div class="tip-title">${d.title || ""} <span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">${d.body || ""}</div>
    ${d.how ? `<div class="tip-how">${TIP_ARROW} ${d.how}</div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}

function refCoverD(d) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Ambassador</div>
    <div class="cr-cover-title">${d.coverTitle || ""}<br><span class="hl-amber">${d.coverHL || ""}</span></div>
    <div class="cr-cover-sub">${d.coverSub || ""}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function pedRefStepD(n, title, text, note) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Step ${n} di 4</div>
    <div class="cr-step-num">${n}</div>
    <div class="cr-step-title">${title}</div>
    <div class="cr-step-text">${text}</div>
    ${note ? `<div class="cr-step-highlight">${note}</div>` : ''}
    ${n === 4 ? `<div class="cr-payout"><div class="label">Risultato</div><div class="value">Payout per ogni agenzia attivata</div></div>` : ''}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function storyTeaserD(d, rubric) {
  const r = RUBRIC_STORY[rubric] || RUBRIC_STORY.mercato;
  const borderStyle = r.shape === "sh-ring" ? `border-color:${r.hex}` : "";
  return `<div class="story">
    <div class="st-shape ${r.shape}" style="background:${r.hex};${borderStyle}"></div>
    <div class="st-badge" style="background:${r.hex}22;color:${r.hex};border:2px solid ${r.hex}44">${d.storyBadge || "NUOVO POST"}</div>
    <div class="st-hook">${d.storyHook || ""}<br><span class="${r.hl}">${d.storyHookHL || ""}</span></div>
    ${d.storySub ? `<div class="st-sub">${d.storySub}</div>` : ""}
    <div class="st-cta">
      <div class="st-cta-pill" style="background:${r.hex}">Post fuori ora!</div>
    </div>
    <div class="st-footer">${GNM_ICON_SM} GETNEARME.IT</div>
  </div>`;
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Build the FEED slides (1080×1350) for a PED topic from its slide_data.
 * Returns array of { label, html } or null if template unknown / no data.
 * Story slide is NOT included — use buildStoryForTopic.
 */
export function buildSlidesForTopic(topic) {
  const d = topic.slide_data;
  if (!d) return null;

  switch (topic.template) {
    case "ped-carosello-dati": return [
      { label: "cover", html: datiCoverD(d) },
      { label: "insight", html: datiInsightD(d) },
      { label: "value", html: datiValueD(d) },
      { label: "cta", html: pedCtaD(d) },
    ];
    case "ped-carosello-edu": return [
      { label: "cover", html: eduCoverD(d) },
      ...(d.items || []).map((item, i) => ({ label: `item${i + 1}`, html: eduItemD(i + 1, item) })),
      { label: "cta", html: pedCtaD(d) },
    ];
    case "ped-carosello-feature": return [
      { label: "cover", html: featCoverD(d) },
      { label: "insight", html: featInsightD(d) },
      { label: "cases", html: featCasesD(d) },
      { label: "cta", html: pedCtaD(d) },
    ];
    case "ped-post-singolo": return [
      { label: "post", html: postSingoloD(d) },
    ];
    case "ped-tip": return [
      { label: "tip", html: tipD(d) },
    ];
    case "ped-carosello-referral": return [
      { label: "cover", html: refCoverD(d) },
      ...(d.steps || REF_STEPS).map((s, i) => {
        const arr = Array.isArray(s) ? { title: s[0], text: s[1], note: s[2] } : s;
        return { label: `step${i + 1}`, html: pedRefStepD(i + 1, arr.title, arr.text, arr.note) };
      }),
      { label: "cta", html: pedCtaD(d) },
    ];
    default: return null;
  }
}

/**
 * Build the STORY teaser (1080×1920) HTML for a PED topic, or null.
 */
export function buildStoryForTopic(topic) {
  const d = topic.slide_data;
  if (!d?.storyHook) return null;
  return storyTeaserD(d, topic.rubric);
}

/**
 * Build a deterministic IG caption from slide_data (no AI).
 */
export function buildCaptionForTopic(topic) {
  const d = topic.slide_data || {};
  const strip = (s) => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();

  const parts = [];

  // Hook line
  if (topic.template === "ped-post-singolo") {
    parts.push(`${strip(d.hook)} ${strip(d.hookHL)}`.trim());
    if (d.body) parts.push(strip(d.body));
  } else if (topic.template === "ped-tip") {
    parts.push(`Tip #${d.tipNum}: ${strip(d.title)} ${strip(d.titleHL)}`.trim());
    if (d.body) parts.push(strip(d.body));
    if (d.how) parts.push(`Come fare: ${strip(d.how)}`);
  } else if (topic.template === "ped-carosello-dati") {
    parts.push(`${strip(d.title)} ${strip(d.titleHL)}`.trim());
    if (d.insight) parts.push(strip(d.insight));
  } else if (topic.template === "ped-carosello-edu") {
    parts.push(`${strip(d.title)} ${strip(d.titleHL)}`.trim());
    const items = (d.items || []).map((it, i) => `${i + 1}. ${strip(it.title)}`);
    if (items.length) parts.push(items.join("\n"));
  } else if (topic.template === "ped-carosello-feature") {
    parts.push(`${strip(d.coverTitle)} ${strip(d.coverHL)}`.trim());
    if (d.yesText) parts.push(strip(d.yesText));
  } else if (topic.template === "ped-carosello-referral") {
    parts.push(`${strip(d.coverTitle)} ${strip(d.coverHL)}`.trim());
    if (d.coverSub) parts.push(strip(d.coverSub));
  } else {
    parts.push(topic.title || "");
  }

  // CTA
  const pill = d.ctaPill;
  if (pill) {
    const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
    parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
  }

  const hashtags = "#immobiliare #agenteimmobiliare #agenziaimmobiliare #realestateitalia #getnearme";
  parts.push(hashtags);

  return parts.filter(Boolean).join("\n\n").slice(0, 2200);
}

/**
 * Wrap slide HTML in a full document for Puppeteer.
 */
export function wrapHtml(innerHtml, css) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${innerHtml}</body></html>`;
}
