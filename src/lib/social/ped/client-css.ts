// Client-side PED / Story stylesheets.
// These intentionally differ from the server's PED_CSS / STORY_CSS in
// src/lib/social/ped/templates.js (softer shadows, different accent handling).
// Kept here rather than in the builder registry because the registry must
// stay CSS-agnostic — the same builders render with server CSS in the cron
// and with these client CSS in the dashboard iframe previews.

export const PED_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.ped{width:1080px;height:1350px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;padding:180px 72px;display:flex;flex-direction:column;justify-content:center}
.ped-badge{position:absolute;top:80px;left:72px;display:inline-flex;align-items:center;gap:10px;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:700;box-shadow:0 4px 14px rgba(16,24,40,0.05);text-transform:uppercase;letter-spacing:2px;z-index:1}
.badge-amber{background:#fffbeb;border:1px solid #fcd34d;color:#b45309}
.badge-blue{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}
.ped-title{font-size:76px;font-weight:800;color:#1a1a2e;line-height:1.1;letter-spacing:-2px}
.hl-amber{color:#f59e0b}.hl-blue{color:#3B83F6}.hl-violet{color:#8b5cf6}.hl-emerald{color:#10b981}.hl-cyan{color:#06b6d4}.hl-red{color:#ef4444}
.ped-footer{position:absolute;bottom:80px;left:72px;right:72px;display:flex;align-items:center;gap:10px;font-size:20px;font-weight:600;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.ped-footer svg{width:36px;height:36px}
.ped-footer .swipe{margin-left:auto;display:flex;align-items:center;gap:8px;color:#1a1a2e;font-size:20px;letter-spacing:1px}
.ped-footer .swipe svg{width:28px;height:28px}
.deco{position:absolute;z-index:0}
.deco-c1{top:-80px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;opacity:.35}
.deco-s1{bottom:200px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;opacity:.35;transform:rotate(12deg)}
.deco-p1{bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;opacity:.3;transform:rotate(-8deg)}
/* carosello dati cover */
.cd-stat{margin:0 0 20px;position:relative;z-index:1}
.cd-num{font-size:200px;font-weight:800;color:#1a1a2e;line-height:1;letter-spacing:-6px}
.cd-num .unit{font-size:100px;letter-spacing:-2px}
.cd-delta{display:inline-flex;align-items:center;gap:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:36px;font-weight:800;padding:12px 32px;border-radius:16px;margin-top:24px;box-shadow:0 6px 18px rgba(16,185,129,0.12)}
.cd-delta svg{width:32px;height:32px}
.cd-statlabel{font-size:30px;color:#888;font-weight:600;margin-top:16px;letter-spacing:.5px}
.cd-title{margin-top:70px;position:relative;z-index:1}
/* carosello dati content slide */
.cdc-kicker{font-size:24px;font-weight:700;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
.cdc-text{font-size:44px;color:#1a1a2e;line-height:1.45;font-weight:500;position:relative;z-index:1}
.cdc-text strong{font-weight:800}
.cdc-card{margin-top:56px;background:#fff;border:1px solid #e3e4e8;border-radius:24px;padding:40px 48px;box-shadow:0 10px 34px rgba(16,24,40,0.07);position:relative;z-index:1}
.cdc-card .label{font-size:24px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.cdc-card .value{font-size:64px;font-weight:800;color:#1a1a2e;letter-spacing:-1px}
.cdc-card .value span{color:#f59e0b}
/* slide valore — azioni concrete */
.pva-title{font-size:56px;font-weight:800;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin:0 0 48px;position:relative;z-index:1}
.pva-list{display:flex;flex-direction:column;gap:24px;position:relative;z-index:1}
.pva-item{display:flex;align-items:flex-start;gap:24px;background:#fff;border:1px solid #e3e4e8;border-radius:20px;padding:32px 36px;box-shadow:0 8px 28px rgba(16,24,40,0.06)}
.pva-item .n{width:64px;height:64px;flex-shrink:0;background:#f59e0b;color:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800}
.pva-item .tx{font-size:33px;font-weight:600;color:#1a1a2e;line-height:1.35}
.pva-item .tx small{display:block;font-size:26px;font-weight:500;color:#777;margin-top:6px}
/* carosello educativo */
.ce-num{font-size:260px;font-weight:800;color:#3B83F6;line-height:.9;letter-spacing:-8px;position:relative;z-index:1;margin-bottom:16px}
.ce-title{margin-top:0;position:relative;z-index:1}
.ce-save{margin-top:48px;align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:#fff;border:1px solid #e3e4e8;border-radius:14px;padding:16px 32px;font-size:26px;font-weight:700;color:#1a1a2e;box-shadow:0 6px 18px rgba(16,24,40,0.06);position:relative;z-index:1}
.ce-save svg{width:28px;height:28px}
.cei{justify-content:flex-start;padding-top:300px}
.cec-num{width:130px;height:130px;background:#3B83F6;color:#fff;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:72px;font-weight:800;box-shadow:0 12px 30px rgba(59,131,246,0.28);margin-bottom:48px;position:relative;z-index:1}
.cec-title{font-size:64px;font-weight:800;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:32px;position:relative;z-index:1}
.cec-text{font-size:38px;color:#555;line-height:1.5;position:relative;z-index:1}
.cec-tip{margin-top:48px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:600;color:#1d4ed8;line-height:1.4;position:relative;z-index:1}
/* carosello feature */
.cf-visual{width:100%;height:500px;background:#fff;border:1px solid #e3e4e8;border-radius:28px;box-shadow:0 14px 40px rgba(16,24,40,0.08);position:relative;z-index:1;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:56px}
.cf-visual-shot{padding:0}
.cf-shot{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.cf-art{width:100%;height:100%;display:block}
.cf-visual .mock{width:85%;height:78%;background:#f5f5f3;border:1px solid #e5e5e5;border-radius:18px;position:relative;overflow:hidden}
.cf-visual .mock .bar{height:56px;background:#1a1a2e;display:flex;align-items:center;gap:8px;padding:0 20px}
.cf-visual .mock .bar i{width:16px;height:16px;border-radius:50%;display:block}
.cf-visual .mock .body{padding:24px;display:flex;gap:20px}
.cf-visual .mock .panel{flex:1;background:#fff;border:1px solid #e5e5e5;border-radius:12px;height:220px}
.cf-visual .mock .panel.acc{background:#eff6ff;border-color:#bfdbfe}
.cf-no{display:flex;align-items:flex-start;gap:20px;background:#fef2f2;border:1px solid #fecaca;border-radius:18px;padding:28px 36px;margin-bottom:24px;position:relative;z-index:1}
.cf-yes{display:flex;align-items:flex-start;gap:20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:18px;padding:28px 36px;position:relative;z-index:1}
.cf-no .ic,.cf-yes .ic{width:48px;height:48px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800}
.cf-no .ic{background:#ef4444;color:#fff}
.cf-yes .ic{background:#10b981;color:#fff}
.cf-no .tx,.cf-yes .tx{font-size:34px;font-weight:600;line-height:1.4;color:#1a1a2e}
.cf-no .tx small,.cf-yes .tx small{display:block;font-size:27px;font-weight:500;color:#777;margin-top:6px}
/* slide CTA finale */
.pcta{display:flex;flex-direction:column;align-items:center;text-align:center}
.pcta-kicker{font-size:26px;font-weight:700;color:#888;letter-spacing:3px;text-transform:uppercase;margin:0 0 36px;position:relative;z-index:1}
.pcta-title{font-size:72px;font-weight:800;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;max-width:880px;position:relative;z-index:1}
.pcta-pill{margin-top:56px;display:inline-flex;align-items:center;gap:14px;background:#3B83F6;color:#fff;font-size:42px;font-weight:800;padding:30px 72px;border-radius:18px;box-shadow:0 14px 36px rgba(59,131,246,0.32);position:relative;z-index:1}
.pcta-sub{margin-top:36px;font-size:32px;color:#777;line-height:1.5;max-width:760px;position:relative;z-index:1}
/* post singolo */
.ps{padding:160px 72px 200px}
.ps-kicker{font-size:24px;font-weight:700;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;position:relative;z-index:1}
.ps-hook{font-size:72px;font-weight:800;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.ps-divider{width:80px;height:6px;background:#f59e0b;border-radius:3px;margin:48px 0;position:relative;z-index:1}
.ps-body{font-size:38px;color:#555;line-height:1.55;position:relative;z-index:1}
.ps-body strong{color:#1a1a2e;font-weight:700}
.ps-cta{margin-top:56px;display:flex;flex-direction:column;align-items:flex-start;gap:20px;position:relative;z-index:1}
.ps-cta .pill{background:#3B83F6;color:#fff;font-size:32px;font-weight:800;padding:20px 48px;border-radius:14px;box-shadow:0 10px 28px rgba(59,131,246,0.3)}
.ps-cta .hint{font-size:26px;color:#888;font-weight:500}
/* tip */
.tip{padding:100px 72px 180px}
.tip-num{width:96px;height:96px;background:#3B83F6;color:#fff;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:800;box-shadow:0 10px 28px rgba(59,131,246,0.28);position:relative;z-index:1;margin-bottom:40px}
.tip-num svg{width:54px;height:54px}
.tip-scenario{font-size:26px;font-weight:700;color:#3B83F6;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px;position:relative;z-index:1}
.tip-title{font-size:64px;font-weight:800;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;position:relative;z-index:1}
.tip-divider{width:80px;height:6px;background:#3B83F6;border-radius:3px;margin:40px 0;position:relative;z-index:1}
.tip-body{font-size:36px;color:#555;line-height:1.55;position:relative;z-index:1}
.tip-body strong{color:#1a1a2e;font-weight:700}
.tip-how{margin-top:40px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:24px 32px;font-size:28px;font-weight:600;color:#1d4ed8;line-height:1.45;position:relative;z-index:1}
.tip-how svg{width:24px;height:24px;display:inline;vertical-align:middle;margin-right:8px}
/* carosello referral */
.cr-cover-title{font-size:68px;font-weight:800;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.cr-cover-sub{font-size:36px;color:#555;line-height:1.5;margin-top:32px;position:relative;z-index:1}
.cr-step-num{width:120px;height:120px;background:#f59e0b;color:#fff;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:800;box-shadow:0 12px 30px rgba(245,158,11,0.28);margin-bottom:40px;position:relative;z-index:1}
.cr-step-title{font-size:56px;font-weight:800;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:28px;position:relative;z-index:1}
.cr-step-text{font-size:36px;color:#555;line-height:1.5;position:relative;z-index:1}
.cr-step-highlight{margin-top:40px;background:#fffbeb;border:1px solid #fcd34d;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:600;color:#b45309;line-height:1.4;position:relative;z-index:1}
.cr-payout{margin-top:48px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:20px;padding:36px 44px;position:relative;z-index:1;box-shadow:0 10px 30px rgba(16,185,129,0.14)}
.cr-payout .label{font-size:24px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.cr-payout .value{font-size:52px;font-weight:800;color:#047857}
`;

export const STORY_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.story{width:1080px;height:1920px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:160px 90px}
/* Big accent shape — different per rubric */
.st-shape{position:absolute;opacity:0.08}
.st-shape.sh-circle{width:600px;height:600px;border-radius:50%;top:-120px;right:-160px}
.st-shape.sh-square{width:400px;height:400px;border-radius:32px;bottom:180px;left:-100px;transform:rotate(15deg)}
.st-shape.sh-pill{width:240px;height:560px;border-radius:120px;top:200px;right:-60px}
.st-shape.sh-diamond{width:360px;height:360px;border-radius:32px;transform:rotate(45deg);bottom:-80px;right:120px}
.st-shape.sh-bar{width:120px;height:100%;border-radius:0;top:0;right:80px}
.st-shape.sh-ring{width:500px;height:500px;border-radius:50%;border:60px solid;background:transparent !important;top:-60px;left:-120px}
/* Badge — center top */
.st-badge{border-radius:12px;padding:16px 36px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:4px;margin-bottom:72px;position:relative;z-index:1}
/* Hook — big centered */
.st-hook{font-size:72px;font-weight:800;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;max-width:980px;position:relative;z-index:1}
.st-hook .hl-amber{color:#f59e0b}
.st-hook .hl-blue{color:#3B83F6}
.st-hook .hl-emerald{color:#10b981}
.st-hook .hl-cyan{color:#06b6d4}
.st-hook .hl-lime{color:#84cc16}
.st-hook .hl-red{color:#ef4444}
/* Sub */
.st-sub{font-size:32px;font-weight:500;color:#64748b;line-height:1.5;margin-top:48px;max-width:740px;position:relative;z-index:1}
/* CTA — inline below text */
.st-cta{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:72px;position:relative;z-index:1}
.st-cta-pill{display:inline-flex;align-items:center;gap:12px;border-radius:60px;padding:22px 44px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#fff}
.st-cta-pill svg{width:22px;height:22px}
/* Footer */
.st-footer{position:absolute;bottom:48px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:8px;font-size:18px;font-weight:600;color:#ccc;letter-spacing:3px;text-transform:uppercase}
.st-footer svg{width:18px;height:18px}
`;
