// "Tip" single-slide template (ped-tip).

import { PED_LOGO_FOOTER } from "./shared";

// Lightbulb mark — replaces the redundant "1" (the badge already says "Tip #N").
// Signals "consiglio" and reads as intentional rather than a stray number.
const TIP_BULB =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tipD(d: any): string {
  return `<div class="ped tip">
    <div class="deco deco-c1" style="background:#dbeafe"></div>
    <div class="deco deco-s1" style="background:#eff6ff"></div>
    <div class="deco deco-p1" style="background:#dbeafe"></div>
    <div class="ped-badge badge-blue">Tip #${d.tipNum || "1"}</div>
    <div class="tip-num">${TIP_BULB}</div>
    <div class="tip-scenario">${d.scenario || ""}</div>
    <div class="tip-title">${d.title || ""} <span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">${d.body || ""}</div>
    ${d.how ? `<div class="tip-how">${d.how}</div>` : ""}
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
    <div class="tip-num">${TIP_BULB}</div>
    <div class="tip-scenario">Open house</div>
    <div class="tip-title">Stampa il prima/dopo <span class="hl-blue">per i cartelloni</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">Hai una stanza vuota da mostrare? <strong>Genera il prima/dopo con lo staging AI</strong> e stampalo in A3 da esporre durante l'open house.</div>
    <div class="tip-how">Apri l'annuncio, vai su AI Foto, scegli lo stile e scarica.</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}
