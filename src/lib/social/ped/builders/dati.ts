// "Dati di Mercato" carousel (ped-carosello-dati) — 4 feed slides.
// Cover (big stat) → Insight → Value (3 actions) → CTA.

import { PED_LOGO_FOOTER, PED_SWIPE, PED_UP_ARROW } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function datiCoverD(d: any): string {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function datiInsightD(d: any): string {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cdc-kicker">${d.kicker || ""}</div>
    <div class="cdc-text">${d.insight || ""}</div>
    ${d.cardLabel ? `<div class="cdc-card"><div class="label">${d.cardLabel}</div><div class="value">${d.cardValue || ""}</div></div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function datiValueD(d: any): string {
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  const items = d.actions || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">${d.valueTitle || ""} <span class="${hlc}">${d.valueHL || ""}</span></div>
    <div class="pva-list">${items
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any, i: number) =>
          `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${a.text}<small>${a.sub}</small></div></div>`
      )
      .join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// Shared CTA slide (used by dati, edu, feature, referral carousels).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pedCtaD(d: any): string {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div><div class="deco deco-p1"></div>
    <div class="pcta-kicker">${d.ctaKicker || ""}</div>
    <div class="pcta-title">${d.ctaTitle || ""} <span class="${d.badgeColor === "blue" ? "hl-blue" : "hl-amber"}">${d.ctaHL || ""}</span></div>
    <div class="pcta-pill">Commenta "${d.ctaPill || "DEMO"}"</div>
    <div class="pcta-sub">${d.ctaSub || "Ricevi il link per provare GetNearMe."}</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}

// ── Static sample slides (for the Templates gallery preview) ─────────
export function pedDatiCoverHtml(): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Mercato</div>
    <div class="cd-stat">
      <div class="cd-num">767<span class="unit">mila</span></div>
      <div class="cd-delta">${PED_UP_ARROW}+6,4%</div>
      <div class="cd-statlabel">Compravendite residenziali in Italia, 2025</div>
    </div>
    <div class="ped-title cd-title">Il mercato casa è ripartito.<br><span class="hl-amber">E ora?</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedDatiContentHtml(): string {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cdc-kicker">Cosa significa per chi vende</div>
    <div class="cdc-text">Più compravendite significa più clienti in movimento, ma anche <strong>più annunci in concorrenza tra loro</strong>.<br><br>Il cliente oggi confronta tutto. Vince chi spiega meglio prezzo, zona e potenziale.</div>
    <div class="cdc-card">
      <div class="label">Il dato da ricordare</div>
      <div class="value">+6,4% = più confronto, <span>non più facilità</span></div>
    </div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedDatiValueHtml(): string {
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">3 cose da fare <span class="hl-amber">questa settimana</span></div>
    <div class="pva-list">
      <div class="pva-item"><div class="n">1</div><div class="tx">Aggiorna i comparabili di zona<small>Il cliente li ha già visti online. Arrivaci prima tu.</small></div></div>
      <div class="pva-item"><div class="n">2</div><div class="tx">Aggiungi l'analisi di zona ai tuoi annunci<small>Trasporti, servizi e punti di interesse: il contesto vende quanto le foto.</small></div></div>
      <div class="pva-item"><div class="n">3</div><div class="tx">Porta un report all'appuntamento con il proprietario<small>Un proprietario informato si fida di chi è più informato di lui.</small></div></div>
    </div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedDatiCtaHtml(): string {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div>
    <div class="deco deco-p1"></div>
    <div class="pcta-kicker">Vuoi lavorare così ogni giorno?</div>
    <div class="pcta-title">Trasforma ogni annuncio in report, post e analisi <span class="hl-amber">in pochi clic</span></div>
    <div class="pcta-pill">Commenta "MERCATO"</div>
    <div class="pcta-sub">Ricevi in DM il link all'estensione GetNearMe e provala sul tuo prossimo annuncio.</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}
