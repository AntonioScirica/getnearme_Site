// Video / Story / Stats template builders — client-side only.
//
// These templates exist ONLY in the dashboard preview (they have no server-side
// Puppeteer mirror yet — the video pipeline generate→render→publish is not
// wired, see the "video gap" note in the audit). They render as static HTML
// inside <iframe srcDoc> previews via TemplateFrame.
//
// Extracted verbatim from src/app/metrics/social/page.tsx so they can be found
// by name instead of by line number. CSS strings are kept 1:1 with the original
// to preserve pixel-identical output.

import { LOGO_SVG_PATH } from "../ped/builders/shared";

// ── Generic slide CSS (feed/story-cta/reels split) ───────────────────
export const TEMPLATE_CSS = `
@keyframes clip-reveal{0%,8%{clip-path:inset(0 0 0 5%)}45%,55%{clip-path:inset(0 0 0 95%)}92%,100%{clip-path:inset(0 0 0 5%)}}
@keyframes divider-slide{0%,8%{left:5%}45%,55%{left:95%}92%,100%{left:5%}}
@keyframes bounce-down{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
*{margin:0;padding:0;box-sizing:border-box}
.slide{position:relative;overflow:hidden;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.slide-1{background:#0f0f0f;width:100%;height:100%;position:relative}
.split-container{position:absolute;inset:0;overflow:hidden}
.split-half{position:absolute;inset:0;overflow:hidden}
.split-before img{filter:grayscale(60%) brightness(0.7);width:100%;height:100%;object-fit:cover}
.split-before::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1) 0%,rgba(0,0,0,.5) 100%)}
.split-after{clip-path:inset(0 0 0 50%);animation:clip-reveal 15s ease-in-out infinite}
.split-after img{width:100%;height:100%;object-fit:cover}
.split-after::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.3) 100%)}
.divider{position:absolute;left:5%;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-50%);z-index:10;box-shadow:0 0 16px rgba(255,255,255,.25);animation:divider-slide 15s ease-in-out infinite}
.divider-icon{position:absolute;left:5%;top:50%;transform:translate(-50%,-50%);width:68px;height:68px;background:#fff;border-radius:50%;z-index:11;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:divider-slide 15s ease-in-out infinite}
.divider-icon svg{width:34px;height:34px}
.top-badge{position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.5);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);padding:10px 32px;border-radius:40px;font-size:22px;font-weight:600;color:#fff;letter-spacing:2px;text-transform:uppercase}
.label-before,.label-after{position:absolute;top:60px;z-index:12;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase}
.label-before{left:60px;color:rgba(255,255,255,.85)}
.label-after{right:60px;color:#fff}
.bottom-bar-center{position:absolute;bottom:0;left:0;right:0;padding:36px 60px;background:linear-gradient(0deg,rgba(0,0,0,.7) 0%,transparent 100%);z-index:12;display:flex;justify-content:center}
.bottom-bar-center .badge{background:#3B83F6;color:#fff;font-size:26px;font-weight:800;padding:14px 40px;border-radius:12px;letter-spacing:1.5px;box-shadow:0 6px 20px rgba(59,131,246,0.30)}
.slide-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px;position:relative;width:100%;height:100%;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.slide-cta .deco-circle{position:absolute;top:-80px;right:-100px;width:280px;height:280px;background:#dbeafe;border-radius:50%;border:1px solid #93c5fd;opacity:.5}
.slide-cta .deco-square{position:absolute;bottom:120px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:1px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.slide-cta .deco-pink{position:absolute;bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:1px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.slide-cta .cta-badge{background:#eff6ff;border:1px solid #3B83F6;border-radius:20px;padding:10px 28px;font-size:22px;font-weight:700;color:#1d4ed8;margin-bottom:48px;box-shadow:0 4px 14px rgba(59,131,246,0.15);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.slide-cta h2{font-size:72px;font-weight:800;color:#1a1a2e;line-height:1.05;margin-bottom:28px;position:relative;z-index:1;letter-spacing:-2px}
.slide-cta .highlight{color:#3B83F6}
.slide-cta .cta-sub{font-size:30px;color:#555;line-height:1.55;margin-bottom:52px;max-width:820px;position:relative;z-index:1}
.slide-cta .feature-pills{display:flex;gap:16px;margin-bottom:52px;position:relative;z-index:1;flex-wrap:wrap;justify-content:center}
.slide-cta .pill{background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:12px;padding:14px 28px;font-size:22px;font-weight:700;color:#1a1a2e;box-shadow:0 4px 14px rgba(16,24,40,0.06);display:flex;align-items:center;gap:10px}
.slide-cta .pill svg{width:22px;height:22px}
.slide-cta .cta-btn{background:#3B83F6;color:#fff;font-size:36px;font-weight:800;padding:28px 72px;border-radius:14px;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:0 8px 28px rgba(59,131,246,0.25)}
.slide-cta .cta-btn svg{width:32px;height:32px;stroke-width:3}
.slide-cta .cta-footer{position:absolute;bottom:48px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.story-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;text-align:center;padding:280px 72px 300px;position:relative;width:100%;height:100%;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.story-cta .deco-circle{position:absolute;top:200px;right:-100px;width:280px;height:280px;background:#dbeafe;border-radius:50%;border:1px solid #93c5fd;opacity:.5}
.story-cta .deco-square{position:absolute;bottom:500px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:1px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.story-cta .deco-pink{position:absolute;bottom:300px;right:60px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:1px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.story-cta .cta-badge{background:#eff6ff;border:1px solid #3B83F6;border-radius:20px;padding:10px 28px;font-size:22px;font-weight:700;color:#1d4ed8;margin-bottom:40px;box-shadow:0 4px 14px rgba(59,131,246,0.15);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.story-cta .photo-card{position:relative;width:880px;height:560px;border-radius:20px;border:1px solid rgba(26,26,46,0.10);overflow:hidden;box-shadow:0 12px 40px rgba(16,24,40,0.10);margin-bottom:40px;z-index:1;display:flex}
.story-cta .pc-half{flex:1;position:relative;overflow:hidden}
.story-cta .pc-half img{width:100%;height:100%;object-fit:cover}
.story-cta .pc-before img{filter:grayscale(60%) brightness(.7)}
.story-cta .pc-after{position:absolute;top:0;right:0;bottom:0;width:35%}
.story-cta .pc-divider{position:absolute;left:65%;top:0;bottom:0;width:3px;background:#fff;transform:translateX(-50%);z-index:2}
.story-cta .pc-slider-icon{position:absolute;left:65%;top:50%;transform:translate(-50%,-50%);width:48px;height:48px;background:#fff;border-radius:50%;z-index:3;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(16,24,40,0.15)}
.story-cta .pc-slider-icon svg{width:24px;height:24px}
.story-cta .pc-label{position:absolute;bottom:16px;font-size:20px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:2px;z-index:3;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.story-cta .pc-label-before{left:24px}
.story-cta .pc-label-after{right:24px}
.story-cta h2{font-size:88px;font-weight:800;color:#1a1a2e;line-height:1.08;margin-bottom:32px;position:relative;z-index:1;letter-spacing:-2px}
.story-cta .highlight{color:#3B83F6}
.story-cta .cta-sub{font-size:36px;color:#555;line-height:1.5;margin-bottom:52px;max-width:860px;position:relative;z-index:1}
.story-cta .cta-btn{background:#3B83F6;color:#fff;font-size:38px;font-weight:800;padding:28px 72px;border-radius:14px;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:0 8px 28px rgba(59,131,246,0.25)}
.story-cta .cta-btn svg{width:32px;height:32px}
.story-cta .cta-footer{margin-top:24px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1;position:relative}
`;

export const ARROWS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/></svg>';

// ── Video Stories CSS (shared across all 5 story types) ──
export const ROOM_EMPTY_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 960'%3E%3Cdefs%3E%3ClinearGradient id='w' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8e4df'/%3E%3Cstop offset='1' stop-color='%23d5d0c9'/%3E%3C/linearGradient%3E%3ClinearGradient id='f' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c4a882'/%3E%3Cstop offset='1' stop-color='%23a8906e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='540' height='960' fill='url(%23w)'/%3E%3Crect y='620' width='540' height='340' fill='url(%23f)'/%3E%3Cline x1='0' y1='620' x2='540' y2='620' stroke='%23b8a080' stroke-width='2'/%3E%3Crect x='160' y='180' width='220' height='280' rx='4' fill='%23b8d4e8' stroke='%23999' stroke-width='3'/%3E%3Cline x1='270' y1='180' x2='270' y2='460' stroke='%23999' stroke-width='2'/%3E%3Cline x1='160' y1='320' x2='380' y2='320' stroke='%23999' stroke-width='2'/%3E%3Crect x='170' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='275' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='170' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='275' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='40' y='500' width='120' height='180' rx='3' fill='%23d5cfc6' stroke='%23b0a898' stroke-width='2'/%3E%3Crect x='48' y='508' width='104' height='164' rx='2' fill='%23c8c0b4'/%3E%3C/svg%3E")`;
export const ROOM_FULL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 960'%3E%3Cdefs%3E%3ClinearGradient id='w2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8e4df'/%3E%3Cstop offset='1' stop-color='%23d5d0c9'/%3E%3C/linearGradient%3E%3ClinearGradient id='f2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c4a882'/%3E%3Cstop offset='1' stop-color='%23a8906e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='540' height='960' fill='url(%23w2)'/%3E%3Crect y='620' width='540' height='340' fill='url(%23f2)'/%3E%3Cline x1='0' y1='620' x2='540' y2='620' stroke='%23b8a080' stroke-width='2'/%3E%3Crect x='160' y='180' width='220' height='280' rx='4' fill='%23b8d4e8' stroke='%23999' stroke-width='3'/%3E%3Cline x1='270' y1='180' x2='270' y2='460' stroke='%23999' stroke-width='2'/%3E%3Cline x1='160' y1='320' x2='380' y2='320' stroke='%23999' stroke-width='2'/%3E%3Crect x='170' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='275' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='170' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='275' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='80' y='520' width='380' height='160' rx='12' fill='%236b7f5e'/%3E%3Crect x='90' y='510' width='140' height='100' rx='8' fill='%237a9068'/%3E%3Crect x='250' y='510' width='140' height='100' rx='8' fill='%237a9068'/%3E%3Crect x='80' y='680' width='380' height='20' rx='4' fill='%23594a3a'/%3E%3Crect x='200' y='700' width='140' height='80' rx='4' fill='%23695842' stroke='%23594a3a' stroke-width='2'/%3E%3Crect x='40' y='500' width='120' height='180' rx='3' fill='%23d5cfc6' stroke='%23b0a898' stroke-width='2'/%3E%3Crect x='48' y='508' width='104' height='164' rx='2' fill='%23dab06a'/%3E%3Cellipse cx='430' cy='480' rx='40' ry='140' fill='%234a7a3a' opacity='.8'/%3E%3Crect x='425' y='480' width='10' height='200' fill='%23594a3a'/%3E%3Crect x='400' y='680' width='60' height='20' rx='10' fill='%236b5d4d'/%3E%3Cellipse cx='270' cy='720' rx='120' ry='60' fill='%23a0785a' opacity='.3'/%3E%3Ccircle cx='460' cy='200' r='60' fill='%23f5e6b8' opacity='.15'/%3E%3Crect x='440' y='280' width='6' height='200' fill='%23b0a898'/%3E%3Ccircle cx='443' cy='280' r='30' fill='%23f5e6b8' opacity='.5'/%3E%3C/svg%3E")`;

export const ARROW_ARC_SVG = '<svg viewBox="0 0 94 29" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M88.1266 9.57854C87.3044 12.6015 86.5639 15.5492 85.6513 18.882C87.7071 18.7237 88.9347 17.5167 89.4596 16.1269C91.0341 11.9575 92.5327 7.70694 93.6407 3.36357C94.285 0.882061 92.5236 -0.514612 90.0537 0.176354C85.913 1.27486 81.8422 2.61087 77.6956 3.86575C77.4565 3.93514 77.1386 4.00161 77.0541 4.15505C76.64 4.68771 76.3805 5.30441 76.0423 5.91819C76.5847 6.17328 77.1154 6.74114 77.5907 6.68055C79.2529 6.50758 80.8421 6.1753 82.4285 5.9212C83.3004 5.79708 84.0964 5.59185 85.3416 6.02972C84.4406 6.93572 83.5367 7.91991 82.6356 8.82591C63.2037 26.7368 34.95 29.5992 12.1136 16.1426C9.1829 14.3892 6.50002 12.3318 3.65385 10.425C2.65361 9.76135 1.65045 9.17589 0.65021 8.51225C0.408182 8.65983 0.241976 8.88853 -5.13402e-05 9.03611C0.209937 9.74861 0.25372 10.6898 0.787383 11.1795C2.45837 12.886 4.12935 14.5924 6.04528 16.0732C25.0471 30.8745 52.1899 32.4337 73.7129 19.7683C77.8245 17.3377 81.4899 14.1857 85.301 11.3524C86.1117 10.7562 86.7678 10.076 87.5026 9.3987C87.663 9.32638 87.8963 9.41336 88.1266 9.57854Z" fill="#3B83F6"/></svg>';
export const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><polygon points="8,5 20,12 8,19"/></svg>';
export const CHEVRONS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#3B83F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/></svg>';
export const LOGO_FOOTER = `<svg viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path fill="#3B83F6" d="${LOGO_SVG_PATH}"/></svg>getnearme.it`;

export const VIDEO_STORIES_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.vs{width:1080px;height:1920px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.vs-bottom{position:absolute;bottom:120px;left:32px;right:32px;padding:48px 56px 52px;background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:20px;z-index:20;text-align:center;box-shadow:0 8px 32px rgba(16,24,40,0.08)}
.vs-title{font-size:84px;font-weight:800;color:#1a1a2e;line-height:1.08;margin-bottom:24px;letter-spacing:-2px}
.vs-desc{font-size:34px;color:#555;line-height:1.5;margin-bottom:44px}
.vs-btn{display:inline-flex;align-items:center;gap:16px;background:#3B83F6;color:#fff;font-size:36px;font-weight:800;padding:26px 64px;border-radius:14px;box-shadow:0 8px 28px rgba(59,131,246,0.25)}
.vs-footer{margin-top:36px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase}
.vs-footer svg{width:36px;height:36px}
.hl-amber{color:#3B83F6}.hl-blue{color:#3B83F6}.hl-violet{color:#8b5cf6}.hl-emerald{color:#10b981}.hl-cyan{color:#06b6d4}.hl-red{color:#ef4444}

/* AI Staging */
.vs-staging{background:#fafaf8}
.ba-photo{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:700px;aspect-ratio:9/16;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(16,24,40,0.10)}
.ba-layer{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center}
.ba-after{clip-path:inset(0 0 0 65%)}
.ba-slider-line{position:absolute;left:65%;top:0;bottom:0;width:3px;background:#fff;transform:translateX(-50%);z-index:5;box-shadow:0 0 12px rgba(0,0,0,0.15)}
.ba-slider-handle{position:absolute;left:65%;top:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 16px rgba(16,24,40,0.12)}
.ba-slider-handle svg{width:28px;height:28px}
.ba-label{position:absolute;top:24px;font-size:22px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:3px;z-index:7;background:#fff;padding:10px 24px;border-radius:10px;box-shadow:0 2px 10px rgba(16,24,40,0.06)}
.ba-label-l{left:32px}.ba-label-r{right:32px}

/* Cards (Stop Motion) */
.vs-cards{background:#fafaf8}
.card-photo{position:absolute;width:440px;aspect-ratio:9/16;border-radius:24px;background-size:cover;background-position:center;box-shadow:0 12px 40px rgba(16,24,40,0.12);border:1px solid rgba(26,26,46,0.08)}
.card-before{top:140px;left:80px;transform:rotate(-4deg);z-index:2}
.card-after{top:380px;right:80px;left:auto;transform:rotate(3deg);z-index:3}
.card-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.card-play svg{width:36px;height:36px;margin-left:4px}
.card-label{position:absolute;bottom:28px;left:32px;font-size:26px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:3px;background:#fff;padding:10px 24px;border-radius:10px;z-index:4;box-shadow:0 2px 10px rgba(16,24,40,0.06)}
.card-arrow{position:absolute;top:975px;left:435px;transform:translateX(-50%) scale(0.7) rotate(20deg);z-index:5}
.card-arrow svg{width:200px;height:62px}

/* Dust (diagonal split) */
.vs-dust{background:#fafaf8}
.dust-photos{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:700px;aspect-ratio:9/16;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(16,24,40,0.10);border:1px solid rgba(26,26,46,0.08)}
.dust-ph{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center}
.dust-before{clip-path:polygon(0 0,100% 0,0 100%);z-index:2}
.dust-after{clip-path:polygon(100% 0,100% 100%,0 100%);z-index:2}
.dust-diag{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;overflow:hidden;pointer-events:none}
.dust-diag::after{content:'';position:absolute;top:-2px;left:-2px;right:-2px;bottom:-2px;background:linear-gradient(to bottom right,transparent calc(50% - 2px),#fff calc(50% - 2px),#fff calc(50% + 2px),transparent calc(50% + 2px))}
.dust-label{position:absolute;font-size:26px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:3px;background:#fff;padding:10px 24px;border-radius:10px;z-index:5;box-shadow:0 2px 10px rgba(16,24,40,0.06)}
.dust-label-before{top:32px;left:32px}.dust-label-after{bottom:100px;right:32px}
.dust-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.dust-play svg{width:36px;height:36px;margin-left:4px}

/* Split (Day/Night + Timelapse shared) */
.vs-split{display:flex}
.sp-left,.sp-right{flex:1;position:relative;background:#fafaf8}
.sp-mid-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(26,26,46,0.10);z-index:3}
.sp-ph{position:absolute;top:280px;left:40px;right:40px;height:800px;border-radius:16px;background-size:cover;background-position:center;box-shadow:0 8px 32px rgba(16,24,40,0.10)}
.sp-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.sp-play svg{width:36px;height:36px;margin-left:4px}
.sp-arrow{position:absolute;left:50%;top:1120px;transform:translateX(-50%) translateY(-30px) scale(0.6) rotate(7deg);z-index:15}
.sp-arrow svg{width:280px;height:86px}

/* Day/Night overrides */
.vs-dn .sp-ph{top:0;left:0;right:0;bottom:0;height:auto;border-radius:0;box-shadow:none}
.vs-dn .sp-mid-line{background:#fff;width:3px}
.vs-dn .sp-divider{position:absolute;left:50%;top:0;bottom:0;width:3px;background:#fff;z-index:10;transform:translateX(-50%)}
.vs-dn .sp-swap{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:12;width:68px;height:68px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(16,24,40,0.15)}
.vs-dn .sp-swap svg{width:34px;height:34px}
`;

// ── Timelapse Reel CSS ──
export const TIMELAPSE_REEL_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
.tl-reel{width:1080px;height:1920px;background:#0a0a0a;position:relative;display:flex;flex-direction:column;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.tl-half{flex:1;position:relative;overflow:hidden}
.tl-half img{width:100%;height:100%;object-fit:cover}
.tl-label{position:absolute;left:50%;transform:translateX(-50%);font-size:26px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:4px;background:rgba(0,0,0,0.45);backdrop-filter:blur(12px);padding:14px 32px;border-radius:12px;z-index:5}
.tl-label-top{top:280px}
.tl-label-bottom{bottom:32px}
.tl-divider{position:absolute;left:0;right:0;top:50%;height:4px;background:#fff;z-index:10;transform:translateY(-50%)}
.tl-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:20}
.tl-center-box{background:#fff;border-radius:20px;padding:32px 56px;display:flex;align-items:center;gap:24px;box-shadow:0 8px 40px rgba(0,0,0,0.3)}
.tl-center-box span{font-size:32px;font-weight:600;color:#1a1a2e;white-space:nowrap}
.tl-center-box img{height:52px;width:auto}
`;

// ── Timelapse Story CSS ──
export const TIMELAPSE_STORY_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
.tl-story{width:1080px;height:1920px;background:#fafaf8;position:relative;display:flex;flex-direction:column;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.tl-story-photos{flex:0 0 65%;position:relative;overflow:hidden;display:flex}
.tl-story-ph{flex:1;position:relative;overflow:hidden}
.tl-story-ph img{width:100%;height:100%;object-fit:cover}
.tl-story-ph-divider{position:absolute;left:50%;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-50%);z-index:5;box-shadow:0 0 12px rgba(0,0,0,0.2)}
.tl-story-lbl{position:absolute;top:50%;transform:translateY(-50%);font-size:26px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:4px;background:rgba(0,0,0,0.45);backdrop-filter:blur(12px);padding:14px 32px;border-radius:12px;z-index:6}
.tl-story-lbl-l{left:32px}
.tl-story-lbl-r{right:32px}
.tl-story-divider{width:100%;height:4px;background:#e5e7eb;flex-shrink:0}
.tl-story-card{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 72px}
.tl-story-card h2{font-size:72px;font-weight:800;color:#1a1a2e;line-height:1.08;margin-bottom:24px;letter-spacing:-2px}
.tl-story-card .accent{color:#10b981}
.tl-story-card .desc{font-size:32px;color:#666;line-height:1.5;margin-bottom:32px}
.tl-story-card .cta-btn{background:#3B83F6;color:#fff;font-size:32px;font-weight:700;padding:20px 56px;border-radius:14px;display:inline-block;box-shadow:0 6px 24px rgba(59,131,246,0.25)}
.tl-story-card .brand{margin-top:24px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase}
`;

// ── Stats CSS + icons ──
export const STATS_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
.neo-deco-circle{position:absolute;top:-80px;right:-100px;width:280px;height:280px;background:#dbeafe;border-radius:50%;border:1px solid #93c5fd;opacity:.5}
.neo-deco-square{position:absolute;bottom:120px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:1px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.neo-deco-dots{position:absolute;top:180px;right:60px;width:100px;height:100px;background-image:radial-gradient(circle,rgba(59,131,246,.12) 2px,transparent 2px);background-size:18px 18px;opacity:.6}
.neo-deco-pink{position:absolute;bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:1px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.stat-hero{background:#fafaf8;display:flex;flex-direction:column;padding:60px 64px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-hero .source-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;position:relative;z-index:1}
.stat-hero .source-tag{background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:12px;padding:10px 24px;font-size:20px;font-weight:700;color:#1a1a2e;box-shadow:0 4px 14px rgba(16,24,40,0.06);display:flex;align-items:center;gap:10px}
.stat-hero .source-tag svg{width:20px;height:20px}
.stat-hero .date-tag{font-size:20px;font-weight:600;color:#999;letter-spacing:1px}
.stat-hero .hero-content{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1}
.stat-hero .category-badge{background:#eff6ff;border:1px solid #3B83F6;border-radius:20px;padding:10px 28px;font-size:22px;font-weight:700;color:#1d4ed8;box-shadow:0 4px 14px rgba(59,131,246,0.15);display:inline-flex;align-items:center;gap:10px;align-self:flex-start;margin-bottom:40px}
.stat-hero .category-badge svg{width:22px;height:22px}
.stat-hero .big-number{font-size:160px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-6px;margin-bottom:16px}
.stat-hero .big-number .unit{font-size:72px;font-weight:800;letter-spacing:-2px;color:#3B83F6}
.stat-hero .trend-row{display:flex;align-items:center;gap:16px;margin-bottom:32px}
.stat-hero .trend-pill{display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:10px;font-size:28px;font-weight:700;border:1px solid}
.stat-hero .trend-pill.up{background:#dcfce7;border-color:rgba(34,197,94,0.25);color:#16a34a}
.stat-hero .trend-pill.down{background:#fee2e2;border-color:rgba(239,68,68,0.25);color:#dc2626}
.stat-hero .trend-pill svg{width:24px;height:24px}
.stat-hero .trend-label{font-size:24px;color:#888;font-weight:500}
.stat-hero .stat-title{font-size:52px;font-weight:800;color:#1a1a2e;line-height:1.15;letter-spacing:-1px;margin-bottom:20px}
.stat-hero .stat-title .highlight{color:#3B83F6}
.stat-hero .stat-desc{font-size:28px;color:#666;line-height:1.55;max-width:880px}
.stat-hero .bottom-brand{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:40px;position:relative;z-index:1}
.stat-hero .brand-name{font-size:24px;font-weight:700;color:#ccc;letter-spacing:3px;text-transform:uppercase}
.stat-hero .swipe-hint{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:600;color:#bbb;letter-spacing:1px;text-transform:uppercase}
.stat-hero .swipe-hint svg{width:18px;height:18px}
.stat-breakdown{background:#fafaf8;display:flex;flex-direction:column;padding:60px 64px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-breakdown .section-title{font-size:36px;font-weight:800;color:#1a1a2e;margin-bottom:40px;position:relative;z-index:1;display:flex;align-items:center;gap:16px}
.stat-breakdown .section-title::before{content:'';width:4px;height:36px;background:#3B83F6;border-radius:2px;flex-shrink:0}
.stat-breakdown .stat-cards{display:flex;flex-direction:column;gap:16px;flex:1;justify-content:center;position:relative;z-index:1}
.stat-breakdown .stat-card{background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:16px;padding:32px 36px;box-shadow:0 4px 16px rgba(16,24,40,0.06);display:flex;align-items:center;gap:24px}
.stat-breakdown .card-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid}
.stat-breakdown .card-icon svg{width:28px;height:28px}
.stat-breakdown .card-icon.amber{background:#eff6ff;border-color:rgba(59,131,246,0.25)}
.stat-breakdown .card-icon.blue{background:#eff6ff;border-color:rgba(59,131,246,0.25)}
.stat-breakdown .card-icon.green{background:#f0fdf4;border-color:rgba(34,197,94,0.25)}
.stat-breakdown .card-icon.purple{background:#faf5ff;border-color:rgba(168,85,247,0.25)}
.stat-breakdown .card-body{flex:1}
.stat-breakdown .card-value{font-size:42px;font-weight:800;color:#1a1a2e;line-height:1.1}
.stat-breakdown .card-label{font-size:22px;font-weight:600;color:#888;margin-top:4px}
.stat-breakdown .card-trend{font-size:24px;font-weight:700;padding:6px 14px;border-radius:8px;flex-shrink:0}
.stat-breakdown .card-trend.up{background:#dcfce7;color:#16a34a}
.stat-breakdown .card-trend.down{background:#fee2e2;color:#dc2626}
.stat-breakdown .source-note{font-size:18px;color:#aaa;margin-top:auto;padding-top:24px;position:relative;z-index:1;display:flex;align-items:center;gap:8px}
.stat-breakdown .source-note svg{width:16px;height:16px}
.stat-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-cta .cta-badge{background:#eff6ff;border:1px solid #3B83F6;border-radius:20px;padding:10px 28px;font-size:24px;font-weight:700;color:#1d4ed8;margin-bottom:48px;box-shadow:0 4px 14px rgba(59,131,246,0.15);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.stat-cta .cta-badge svg{width:24px;height:24px}
.stat-cta h2{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.05;margin-bottom:28px;position:relative;z-index:1;letter-spacing:-2px}
.stat-cta .highlight{color:#3B83F6}
.stat-cta .cta-sub{font-size:30px;color:#555;line-height:1.55;margin-bottom:52px;max-width:820px;position:relative;z-index:1}
.stat-cta .feature-pills{display:flex;gap:16px;margin-bottom:52px;position:relative;z-index:1;flex-wrap:wrap;justify-content:center}
.stat-cta .pill{background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:12px;padding:14px 28px;font-size:22px;font-weight:700;color:#1a1a2e;box-shadow:0 4px 14px rgba(16,24,40,0.06);display:flex;align-items:center;gap:10px}
.stat-cta .pill svg{width:22px;height:22px}
.stat-cta .cta-btn{background:#3B83F6;color:#fff;font-size:36px;font-weight:800;padding:28px 72px;border-radius:16px;border:none;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:0 8px 28px rgba(59,131,246,0.25)}
.stat-cta .cta-btn svg{width:32px;height:32px;stroke-width:3}
.stat-cta .cta-footer{position:absolute;bottom:48px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.stat-story{background:#fafaf8;display:flex;flex-direction:column;align-items:center;text-align:center;padding:280px 72px 300px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-story .category-badge{background:#eff6ff;border:1px solid #3B83F6;border-radius:20px;padding:10px 28px;font-size:24px;font-weight:700;color:#1d4ed8;box-shadow:0 4px 14px rgba(59,131,246,0.15);position:relative;z-index:1;display:flex;align-items:center;gap:10px;margin-bottom:40px;white-space:nowrap}
.stat-story .category-badge svg{width:24px;height:24px}
.stat-story .stat-card-big{width:880px;background:#fff;border:1px solid rgba(26,26,46,0.10);border-radius:24px;padding:56px 48px;box-shadow:0 6px 20px rgba(16,24,40,0.06);margin-bottom:48px;position:relative;z-index:1;text-align:center}
.stat-story .big-number{font-size:140px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-4px}
.stat-story .big-number .unit{font-size:64px;font-weight:800;color:#3B83F6;letter-spacing:-1px}
.stat-story .stat-label{font-size:32px;font-weight:700;color:#666;margin-top:16px}
.stat-story .trend-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px}
.stat-story .trend-pill{display:flex;align-items:center;gap:6px;padding:6px 16px;border-radius:10px;font-size:24px;font-weight:700;border:1px solid}
.stat-story .trend-pill.up{background:#dcfce7;border-color:rgba(34,197,94,0.25);color:#16a34a}
.stat-story .trend-pill svg{width:20px;height:20px}
.stat-story .source{font-size:18px;color:#bbb;margin-top:16px;font-weight:500}
.stat-story h2{font-size:80px;font-weight:900;color:#1a1a2e;line-height:1.08;margin-bottom:32px;position:relative;z-index:1;letter-spacing:-2px}
.stat-story .highlight{color:#3B83F6}
.stat-story .cta-sub{font-size:34px;color:#555;line-height:1.5;margin-bottom:48px;max-width:860px;position:relative;z-index:1}
.stat-story .cta-btn{background:#3B83F6;color:#fff;font-size:38px;font-weight:800;padding:28px 72px;border-radius:16px;border:none;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:0 8px 28px rgba(59,131,246,0.25)}
.stat-story .cta-btn svg{width:32px;height:32px}
.stat-story .cta-footer{margin-top:24px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1;position:relative}
@keyframes counter-reveal{0%{opacity:0;transform:scale(.5) translateY(40px)}60%{opacity:1;transform:scale(1.05) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes trend-slide{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.stat-reel{background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.stat-reel .reel-bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(59,131,246,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,131,246,.05) 1px,transparent 1px);background-size:60px 60px}
.stat-reel .reel-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(59,131,246,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
.stat-reel .reel-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:24px;padding:0 80px}
.stat-reel .reel-category{background:rgba(59,131,246,.12);border:1px solid rgba(59,131,246,.3);border-radius:20px;padding:10px 28px;font-size:22px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:2px}
.stat-reel .reel-number{font-size:200px;font-weight:900;color:#fff;line-height:1;letter-spacing:-8px;animation:counter-reveal 3s ease-out forwards}
.stat-reel .reel-number .reel-unit{font-size:80px;font-weight:800;color:#3B83F6;letter-spacing:-2px}
.stat-reel .reel-trend{display:flex;align-items:center;gap:10px;padding:10px 28px;border-radius:14px;font-size:32px;font-weight:800;animation:trend-slide 3s ease-out forwards;animation-delay:.5s;opacity:0}
.stat-reel .reel-trend.up{background:rgba(34,197,94,.2);color:#4ade80}
.stat-reel .reel-trend svg{width:28px;height:28px}
.stat-reel .reel-title{font-size:52px;font-weight:800;color:#fff;line-height:1.2;max-width:800px;animation:trend-slide 3s ease-out forwards;animation-delay:.8s;opacity:0}
.stat-reel .reel-desc{font-size:28px;color:rgba(255,255,255,.5);line-height:1.5;max-width:700px;animation:trend-slide 3s ease-out forwards;animation-delay:1.1s;opacity:0}
.stat-reel .reel-source{font-size:18px;color:rgba(255,255,255,.25);margin-top:16px;animation:trend-slide 3s ease-out forwards;animation-delay:1.4s;opacity:0}
.stat-reel .reel-brand{position:absolute;bottom:280px;display:flex;align-items:center;gap:12px;font-size:22px;font-weight:700;color:rgba(255,255,255,.2);letter-spacing:3px;text-transform:uppercase;z-index:2;animation:trend-slide 3s ease-out forwards;animation-delay:1.6s;opacity:0}
.logo-icon{width:28px;height:28px;flex-shrink:0}
.bottom-brand .logo-icon{width:36px;height:36px}
.cta-footer{display:flex;align-items:center;gap:10px}
.cta-footer .logo-icon{width:36px;height:36px}
.stat-reel .reel-brand .logo-icon{width:32px;height:32px;opacity:.5}
`;

export const HOUSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
export const TREND_UP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
export const ARROW_RIGHT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';
export const CHART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
export const PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z"/></svg>';
export const DL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
export const FLAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
export const INFO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
export const LOGO_BLUE = '<svg class="logo-icon" viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path d="M224.816 4.98C217.966-1.72 207.036-1.65 200.274 5.13L51.253 154.306c-14.922 14.922-27.88 29.952-37.086 49.303-9.206 19.35-13.635 38.526-14.071 58.923-.567 26.135.975 49.699 17.468 70.838 13.962 17.889 31.458 32.876 46.576 49.739 16.601 18.521 34.14 36.475 51.178 54.691 4.56 4.887 58.465 62.021 83.051 88.418 6.698 7.177 17.976 7.439 25.001.567L379.138 374.925c55.018-53.971 58.334-133.379 15.969-196.448-16.885-25.153-40.882-45.812-63.483-66.471-6.85-6.261-17.409-6.043-24.019.48L167.856 250.403c-6.61 6.522-6.959 17.059-.785 23.997l33.508 37.784c6.61 7.461 18.129 7.875 25.262.894L320.193 220.69s41.885 40.773.349 93.152L225.427 408.782c-6.785 6.763-17.736 6.807-24.564.109L111.463 321.084s-61.759-46.619.658-109.491c49.521-49.106 119.483-118.479 147.778-146.512 6.915-6.85 6.871-18.063-.088-24.87L224.816 4.98z" fill="#3B83F6"/></svg>';
export const LOGO_WHITE = LOGO_BLUE.replace('fill="#3B83F6"', 'fill="rgba(255,255,255,0.35)"');

// ── Story / video HTML builders ──────────────────────────────────────

export function storyStopMotionHtml(beforeUrl?: string, afterUrl?: string): string {
  const beforeBg = beforeUrl ? `url(${beforeUrl})` : ROOM_EMPTY_SVG;
  const afterBg = afterUrl ? `url(${afterUrl})` : ROOM_FULL_SVG;
  return `<div class="vs vs-cards">
    <div class="card-photo card-before" style="background-image:${beforeBg}"><div class="card-label">PRIMA</div></div>
    <div class="card-arrow">${ARROW_ARC_SVG}</div>
    <div class="card-photo card-after" style="background-image:${afterBg}"><div class="card-label">DOPO</div><div class="card-play">${PLAY_SVG}</div></div>
    <div class="vs-bottom">
      <div class="vs-title">Stop <span class="hl-blue">Motion</span></div>
      <div class="vs-desc">Guarda i mobili apparire uno alla volta.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function storyParticleDustHtml(beforeUrl?: string, afterUrl?: string): string {
  const beforeBg = beforeUrl ? `url(${beforeUrl})` : ROOM_EMPTY_SVG;
  const afterBg = afterUrl ? `url(${afterUrl})` : ROOM_FULL_SVG;
  return `<div class="vs vs-dust">
    <div class="dust-photos">
      <div class="dust-ph dust-before" style="background-image:${beforeBg}"></div>
      <div class="dust-ph dust-after" style="background-image:${afterBg}"></div>
      <div class="dust-diag"></div>
      <div class="dust-label dust-label-before">PRIMA</div>
      <div class="dust-label dust-label-after">DOPO</div>
      <div class="dust-play">${PLAY_SVG}</div>
    </div>
    <div class="vs-bottom">
      <div class="vs-title">Effetto <span class="hl-blue">Polvere</span></div>
      <div class="vs-desc">I mobili si dissolvono in particelle e si riformano.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function storyDayNightHtml(dayUrl?: string, nightUrl?: string): string {
  const leftBg = dayUrl ? `url(${dayUrl})` : ROOM_EMPTY_SVG;
  const rightBg = nightUrl ? `url(${nightUrl})` : ROOM_FULL_SVG;
  return `<div class="vs vs-split vs-dn">
    <div class="sp-left"><div class="sp-ph" style="background-image:${leftBg}"></div></div>
    <div class="sp-right"><div class="sp-ph" style="background-image:${rightBg}"></div></div>
    <div class="sp-mid-line"></div>
    <div class="sp-divider"></div>
    <div class="sp-swap"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
    <div class="vs-bottom">
      <div class="vs-title">Da Giorno a <span class="hl-blue">Notte</span></div>
      <div class="vs-desc">La stessa villa, due atmosfere diverse.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function storyTimelapseHtml(leftUrl?: string, rightUrl?: string): string {
  const leftBg = leftUrl ? `url(${leftUrl})` : ROOM_EMPTY_SVG;
  const rightBg = rightUrl ? `url(${rightUrl})` : ROOM_FULL_SVG;
  return `<div class="vs vs-split">
    <div class="sp-left"><div class="sp-ph" style="background-image:${leftBg}"></div></div>
    <div class="sp-right"><div class="sp-ph" style="background-image:${rightBg}"><div class="sp-play">${PLAY_SVG}</div></div></div>
    <div class="sp-mid-line"></div>
    <div class="sp-arrow">${ARROW_ARC_SVG}</div>
    <div class="vs-bottom">
      <div class="vs-title">AI <span class="hl-amber">Timelapse</span></div>
      <div class="vs-desc">Ristrutturazione completa in un timelapse AI.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function reelTimelapseHtml(photoUrl: string, videoUrl: string): string {
  return `<div class="tl-reel">
    <div class="tl-half">
      <img src="${photoUrl}" alt="Prima">
      <div class="tl-label tl-label-top">PRIMA</div>
    </div>
    <div class="tl-divider"></div>
    <div class="tl-half">
      <video src="${videoUrl}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover"></video>
      <div class="tl-label tl-label-bottom">DOPO</div>
    </div>
    <div class="tl-center">
      <div class="tl-center-box">
        <span>Realizzato con</span>
        <img src="/logo_blu_nero.svg" alt="GetNearMe">
      </div>
    </div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function storyTimelapseNewHtml(beforeUrl: string, afterUrl: string, sd: Record<string, any>): string {
  const card = sd.story?.bottom_card || {};
  const title = card.title || "Ricostruzione AI";
  const accent = card.titleAccent || "#10b981";
  const desc = (card.description || "Dal cantiere fino all'immobile finito.\nFondamenta, struttura, risultato finale.").replace(/\n/g, "<br>");
  const cta = card.cta || "Post sul profilo";
  const brand = card.brand || "GETNEARME.IT";
  const titleParts = title.split(" ");
  const lastWord = titleParts.pop();
  const firstWords = titleParts.join(" ");
  return `<div class="tl-story">
    <div class="tl-story-photos">
      <div class="tl-story-ph">
        <img src="${beforeUrl}" alt="Prima">
        <div class="tl-story-lbl tl-story-lbl-l">PRIMA</div>
      </div>
      <div class="tl-story-ph">
        <img src="${afterUrl}" alt="Dopo">
        <div class="tl-story-lbl tl-story-lbl-r">DOPO</div>
      </div>
      <div class="tl-story-ph-divider"></div>
    </div>
    <div class="tl-story-divider"></div>
    <div class="tl-story-card">
      <h2>${firstWords} <span class="accent" style="color:${accent}">${lastWord}</span></h2>
      <div class="desc">${desc}</div>
      <div class="cta-btn">${cta}</div>
      <div class="brand">${brand}</div>
    </div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function storyDayNightNewHtml(dayUrl: string, nightUrl: string, sd: Record<string, any>): string {
  const card = sd.story?.bottom_card || {};
  const title = card.title || "Day / Night";
  const accent = card.titleAccent || "#f59e0b";
  const desc = (card.description || "Stessa villa, luce diversa.\nDal sole al tramonto.").replace(/\n/g, "<br>");
  const cta = card.cta || "Scopri di piu";
  const brand = card.brand || "GETNEARME.IT";
  const titleParts = title.split(" ");
  const lastWord = titleParts.pop();
  const firstWords = titleParts.join(" ");
  return `<div class="tl-story">
    <div class="tl-story-photos">
      <div class="tl-story-ph">
        <img src="${dayUrl}" alt="Giorno">
        <div class="tl-story-lbl tl-story-lbl-l">GIORNO</div>
      </div>
      <div class="tl-story-ph">
        <img src="${nightUrl}" alt="Notte">
        <div class="tl-story-lbl tl-story-lbl-r">NOTTE</div>
      </div>
      <div class="tl-story-ph-divider"></div>
    </div>
    <div class="tl-story-divider"></div>
    <div class="tl-story-card">
      <h2>${firstWords} <span class="accent" style="color:${accent}">${lastWord}</span></h2>
      <div class="desc">${desc}</div>
      <div class="cta-btn">${cta}</div>
      <div class="brand">${brand}</div>
    </div>
  </div>`;
}

export function storyStagingHtmlDynamic(beforeUrl: string, afterUrl: string): string {
  return `<div class="vs vs-staging">
    <div class="ba-photo">
      <div class="ba-layer ba-before" style="background-image:url(${beforeUrl});background-size:cover;background-position:center"></div>
      <div class="ba-layer ba-after" style="background-image:url(${afterUrl});background-size:cover;background-position:center"></div>
      <div class="ba-slider-line"></div>
      <div class="ba-slider-handle">${CHEVRONS_SVG}</div>
      <div class="ba-label ba-label-l">PRIMA</div>
      <div class="ba-label ba-label-r">DOPO</div>
    </div>
    <div class="vs-bottom">
      <div class="vs-title">AI <span class="hl-blue">Staging</span></div>
      <div class="vs-desc">Trasforma le tue foto con l'AI.<br>Scegli lo stile e vedi il risultato.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function storyStagingHtml(): string {
  return `<div class="vs vs-staging">
    <div class="ba-photo">
      <div class="ba-layer ba-before" style="background-image:url(/staging/1.jpg);background-size:cover;background-position:center"></div>
      <div class="ba-layer ba-after" style="background-image:url(/staging/2.jpg);background-size:cover;background-position:center"></div>
      <div class="ba-slider-line"></div>
      <div class="ba-slider-handle">${CHEVRONS_SVG}</div>
      <div class="ba-label ba-label-l">PRIMA</div>
      <div class="ba-label ba-label-r">DOPO</div>
    </div>
    <div class="vs-bottom">
      <div class="vs-title">AI <span class="hl-blue">Staging</span></div>
      <div class="vs-desc">Trasforma le tue foto con l'AI.<br>Scegli lo stile e vedi il risultato.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

export function feedSlide1Html(): string {
  return `<div class="slide-1" style="width:1080px;height:1350px">
    <div class="top-badge">AI Staging</div>
    <div class="split-container">
      <div class="split-half split-before"><img src="/staging/1.jpg"></div>
      <div class="split-half split-after"><img src="/staging/2.jpg"></div>
    </div>
    <div class="divider"></div>
    <div class="divider-icon">${ARROWS_SVG}</div>
    <div class="label-before">Prima</div>
    <div class="label-after">Dopo</div>
    <div class="bottom-bar-center"><div class="badge">GetNearMe</div></div>
  </div>`;
}

export function feedSlide2Html(): string {
  return `<div class="slide-cta" style="width:1080px;height:1350px">
    <div class="deco-circle"></div><div class="deco-square"></div><div class="deco-pink"></div>
    <div class="cta-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>AI Staging</div>
    <h2>Trasforma i tuoi<br>annunci in <span class="highlight">30 secondi</span></h2>
    <div class="cta-sub">Staging AI, analisi di zona, template social e video pronti per i tuoi annunci. Tutto in un&apos;estensione Chrome gratuita.</div>
    <div class="feature-pills">
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>Staging AI</div>
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Post Social</div>
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Video AI</div>
    </div>
    <div class="cta-btn">Link in bio<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg></div>
    <div class="cta-footer">getnearme.it</div>
  </div>`;
}

export function storyCtaHtml(): string {
  return `<div class="story-cta" style="width:1080px;height:1920px">
    <div class="deco-circle"></div><div class="deco-square"></div><div class="deco-pink"></div>
    <div class="cta-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>AI Staging</div>
    <div class="photo-card">
      <div class="pc-half pc-before"><img src="/staging/1.jpg"><div class="pc-label pc-label-before">Prima</div></div>
      <div class="pc-half pc-after"><img src="/staging/2.jpg"><div class="pc-label pc-label-after">Dopo</div></div>
      <div class="pc-divider"></div>
      <div class="pc-slider-icon">${ARROWS_SVG}</div>
    </div>
    <h2>Vedi il risultato<br><span class="highlight">completo</span></h2>
    <div class="cta-sub">Staging AI per trasformare i tuoi annunci immobiliari in pochi secondi.</div>
    <div class="cta-btn">Guarda nel profilo<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></div>
    <div class="cta-footer">getnearme.it</div>
  </div>`;
}

export function reelsSlideHtml(): string {
  return `<div class="slide-1" style="width:1080px;height:1920px">
    <div class="top-badge" style="top:270px">AI Staging</div>
    <div class="split-container">
      <div class="split-half split-before"><img src="/staging/1.jpg"></div>
      <div class="split-half split-after"><img src="/staging/2.jpg"></div>
    </div>
    <div class="divider"></div>
    <div class="divider-icon">${ARROWS_SVG}</div>
    <div class="label-before" style="top:278px">Prima</div>
    <div class="label-after" style="top:278px">Dopo</div>
    <div class="bottom-bar-center" style="padding:0 60px 280px"><div class="badge">GetNearMe</div></div>
  </div>`;
}

// ── Stats template HTML builders ─────────────────────────────────────

export function statsHeroHtml(): string {
  return `<div class="stat-hero" style="width:1080px;height:1350px">
    <div class="neo-deco-circle"></div><div class="neo-deco-square"></div><div class="neo-deco-dots"></div>
    <div class="source-bar">
      <div class="source-tag">${LOGO_BLUE}ISTAT</div>
      <div class="date-tag">Q1 2026</div>
    </div>
    <div class="hero-content">
      <div class="category-badge"><span style="display:flex">${HOUSE_SVG.replace('stroke="currentColor"', 'stroke="#1d4ed8"')}</span>Mercato Immobiliare</div>
      <div class="big-number">+3,2<span class="unit">%</span></div>
      <div class="trend-row">
        <div class="trend-pill up">${TREND_UP_SVG}+3,2% YoY</div>
        <span class="trend-label">vs Q1 2025</span>
      </div>
      <div class="stat-title">Compravendite in <span class="highlight">crescita</span> nel primo trimestre</div>
      <div class="stat-desc">Il mercato residenziale italiano registra un aumento delle transazioni rispetto allo stesso periodo dell&apos;anno precedente.</div>
    </div>
    <div class="bottom-brand">
      <span class="brand-name" style="display:flex;align-items:center;gap:10px">${LOGO_BLUE}getnearme.it</span>
      <span class="swipe-hint">Scorri${ARROW_RIGHT_SVG}</span>
    </div>
  </div>`;
}

export function statsBreakdownHtml(): string {
  const card = (city: string, color: string, stroke: string, trend: string, dir: string) =>
    `<div class="stat-card"><div class="card-icon ${color}">${HOUSE_SVG.replace('stroke="currentColor"', `stroke="${stroke}"`)}</div><div class="card-body"><div class="card-value">${city}</div><div class="card-label">Prezzo medio al mq</div></div><div class="card-trend ${dir}">${trend}</div></div>`;
  return `<div class="stat-breakdown" style="width:1080px;height:1350px">
    <div class="neo-deco-circle" style="top:auto;bottom:-80px;right:-60px"></div><div class="neo-deco-dots" style="top:60px;right:40px"></div>
    <div class="section-title">Dettaglio per zona</div>
    <div class="stat-cards">
      ${card("Milano", "amber", "#3B83F6", "+4,1%", "up")}
      ${card("Roma", "blue", "#3b82f6", "+2,8%", "up")}
      ${card("Napoli", "green", "#22c55e", "+1,5%", "up")}
      ${card("Torino", "purple", "#a855f7", "-0,3%", "down")}
    </div>
    <div class="source-note">${INFO_SVG}Fonte: ISTAT, Nomisma — Q1 2026</div>
  </div>`;
}

export function statsCtaHtml(): string {
  return `<div class="stat-cta" style="width:1080px;height:1350px">
    <div class="neo-deco-circle"></div><div class="neo-deco-square"></div><div class="neo-deco-pink"></div>
    <div class="cta-badge">${CHART_SVG.replace('stroke="currentColor"', 'stroke="#1d4ed8"')}Dati Mercato</div>
    <h2>Conosci il tuo<br><span class="highlight">mercato</span> locale</h2>
    <div class="cta-sub">Analisi di zona, prezzi medi, trend e confronti per i tuoi annunci. Tutto aggiornato, tutto gratis.</div>
    <div class="feature-pills">
      <div class="pill">${CHART_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Trend prezzi</div>
      <div class="pill">${PIN_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Analisi zona</div>
      <div class="pill">${DL_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Report PDF</div>
    </div>
    <div class="cta-btn">Link in bio<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg></div>
    <div class="cta-footer">${LOGO_BLUE}getnearme.it</div>
  </div>`;
}

export function statsStoryHtml(): string {
  return `<div class="stat-story" style="width:1080px;height:1920px">
    <div class="neo-deco-circle" style="top:200px"></div><div class="neo-deco-square" style="bottom:500px"></div><div class="neo-deco-dots" style="top:320px;right:40px"></div>
    <div class="category-badge"><span style="display:flex">${HOUSE_SVG.replace('stroke="currentColor"', 'stroke="#1d4ed8"')}</span>Mercato Immobiliare</div>
    <div class="stat-card-big">
      <div class="big-number">+3,2<span class="unit">%</span></div>
      <div class="stat-label">Compravendite Q1 2026</div>
      <div class="trend-row"><div class="trend-pill up">${TREND_UP_SVG}vs anno scorso</div></div>
      <div class="source">Fonte: ISTAT</div>
    </div>
    <h2>Il mercato<br><span class="highlight">cresce</span></h2>
    <div class="cta-sub">Scopri i dati della tua zona con l&apos;analisi gratuita di GetNearMe.</div>
    <div class="cta-btn">Guarda nel profilo<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></div>
    <div class="cta-footer">${LOGO_BLUE}getnearme.it</div>
  </div>`;
}

export function statsReelHtml(): string {
  return `<div class="stat-reel" style="width:1080px;height:1920px">
    <div class="reel-bg-grid"></div><div class="reel-glow"></div>
    <div class="reel-content">
      <div class="reel-category">Mercato Immobiliare</div>
      <div class="reel-number">+3,2<span class="reel-unit">%</span></div>
      <div class="reel-trend up">${TREND_UP_SVG}+3,2% YoY</div>
      <div class="reel-title">Compravendite in crescita nel primo trimestre 2026</div>
      <div class="reel-desc">Il mercato residenziale italiano registra segnali positivi, soprattutto nelle grandi citta.</div>
      <div class="reel-source">Fonte: ISTAT, Q1 2026</div>
    </div>
    <div class="reel-brand">${LOGO_WHITE}getnearme.it</div>
  </div>`;
}
