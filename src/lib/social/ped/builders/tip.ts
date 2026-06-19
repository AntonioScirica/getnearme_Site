// "Tip" single-slide template (ped-tip).

import { PED_LOGO_FOOTER, TIP_ARROW } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tipD(d: any): string {
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

// ── Static sample slide (for the Templates gallery preview) ──────────
export function pedTipHtml(): string {
  return `<div class="ped tip">
    <div class="deco deco-c1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="deco deco-s1" style="background:#eff6ff;border-color:#3B83F6"></div>
    <div class="deco deco-p1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="ped-badge badge-blue">Tip #1</div>
    <div class="tip-num">1</div>
    <div class="tip-scenario">Open house</div>
    <div class="tip-title">Stampa il prima/dopo <span class="hl-blue">per i cartelloni</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">Hai una stanza vuota da mostrare? <strong>Genera il prima/dopo con lo staging AI</strong> e stampalo in A3 da esporre durante l'open house.</div>
    <div class="tip-how">${TIP_ARROW} Apri l'annuncio, vai su AI Foto, scegli lo stile e scarica.</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}
