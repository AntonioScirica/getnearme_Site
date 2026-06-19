// "Post singolo" single-slide template (ped-post-singolo).

import { PED_LOGO_FOOTER } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postSingoloD(d: any): string {
  const bc = d.badgeColor === "blue" ? "badge-blue" : "badge-amber";
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  return `<div class="ped ps">
    <div class="deco deco-c1"></div>
    <div class="deco deco-s1"></div>
    <div class="deco deco-p1"></div>
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

// ── Static sample slide (for the Templates gallery preview) ──────────
export function pedPostSingoloHtml(): string {
  return `<div class="ped ps">
    <div class="deco deco-c1"></div>
    <div class="deco deco-s1"></div>
    <div class="deco deco-p1"></div>
    <div class="ped-badge badge-amber">Per agenti</div>
    <div class="ps-kicker">Il valore che non si vede</div>
    <div class="ps-hook">Il lavoro che il proprietario <span class="hl-amber">non vede</span></div>
    <div class="ps-divider"></div>
    <div class="ps-body">Dietro ogni immobile ci sono attività invisibili: analisi, confronto, selezione foto, descrizioni, materiali per gli appuntamenti.<br><br><strong>GetNearMe trasforma quel lavoro in materiali chiari e presentabili.</strong> Così il cliente capisce cosa stai facendo per lui.</div>
    <div class="ps-cta">
      <span class="pill">Commenta "VALORE"</span>
      <span class="hint">Ricevi il link per provare GetNearMe</span>
    </div>
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}
