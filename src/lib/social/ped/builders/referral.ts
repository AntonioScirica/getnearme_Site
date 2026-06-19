// "Referral / Ambassador" carousel (ped-carosello-referral) — cover + N steps + CTA.

import { PED_LOGO_FOOTER, PED_SWIPE, REF_STEPS } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function refCoverD(d: any): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Ambassador</div>
    <div class="cr-cover-title">${d.coverTitle || ""}<br><span class="hl-amber">${d.coverHL || ""}</span></div>
    <div class="cr-cover-sub">${d.coverSub || ""}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// Shared between client and server. NOTE: client file named it pedRefStepHtml,
// server named it pedRefStepD — same body. Both names re-exported from the
// registry/index for backward compatibility with consumers.
export function pedRefStepHtml(n: number, title: string, text: string, note: string): string {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Step ${n} di 4</div>
    <div class="cr-step-num">${n}</div>
    <div class="cr-step-title">${title}</div>
    <div class="cr-step-text">${text}</div>
    ${note ? `<div class="cr-step-highlight">${note}</div>` : ""}
    ${n === 4 ? `<div class="cr-payout"><div class="label">Risultato</div><div class="value">Payout per ogni agenzia attivata</div></div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// Alias for the server-side name used in templates.js.
export const pedRefStepD = pedRefStepHtml;

// ── Static sample slides (for the Templates gallery preview) ─────────
export function pedRefCoverHtml(): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Ambassador</div>
    <div class="cr-cover-title">I tuoi contatti nel settore<br><span class="hl-amber">valgono più di quanto pensi.</span></div>
    <div class="cr-cover-sub">Se conosci agenzie o agenti immobiliari, c'è un modo semplice per trasformare quella relazione in qualcosa di concreto.</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedRefCtaHtml(): string {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div>
    <div class="deco deco-p1"></div>
    <div class="pcta-kicker">Programma Ambassador</div>
    <div class="pcta-title">Una relazione può diventare <span class="hl-amber">valore</span></div>
    <div class="pcta-pill">Commenta "PARTNER"</div>
    <div class="pcta-sub">Ricevi in DM i dettagli del programma ambassador.</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}

export { REF_STEPS };
