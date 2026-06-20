// "Educativo" carousel (ped-carosello-edu) — cover + N item slides + CTA.

import { PED_EDU_ITEMS, PED_LOGO_FOOTER, PED_SWIPE } from "./shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function eduCoverD(d: any): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Educativo</div>
    <div class="ce-num">${d.num || "5"}</div>
    <div class="ped-title ce-title">${d.title || ""}<br><span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="ce-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Salva per dopo</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function eduItemD(n: number, item: { title: string; text: string; tip: string }): string {
  return `<div class="ped cei">
    <div class="deco deco-p1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">${n} di ${5}</div>
    <div class="cec-num">${n}</div>
    <div class="cec-title">${item.title}</div>
    <div class="cec-text">${item.text}</div>
    ${item.tip ? `<div class="cec-tip">${item.tip}</div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// ── Static sample slides (for the Templates gallery preview) ─────────
export function pedEduCoverHtml(): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div>
    <div class="deco deco-p1"></div>
    <div class="ped-badge badge-blue">Checklist</div>
    <div class="ce-num">5</div>
    <div class="ped-title ce-title">cose che un annuncio dovrebbe <span class="hl-blue">spiegare meglio</span></div>
    <div class="ce-save"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>Salva per il prossimo annuncio</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedEduItem(n: number, title: string, text: string, tip: string): string {
  return `<div class="ped cei">
    <div class="deco deco-s1"></div>
    <div class="cec-num">${n}</div>
    <div class="cec-title">${title}</div>
    <div class="cec-text">${text}</div>
    <div class="cec-tip">${tip}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedEduCtaHtml(): string {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div>
    <div class="deco deco-p1"></div>
    <div class="pcta-kicker">Tutti e 5 i punti, da un solo annuncio</div>
    <div class="pcta-title">GetNearMe trasforma l'annuncio in report, analisi zona e staging <span class="hl-blue">in pochi clic</span></div>
    <div class="pcta-pill">Commenta "DEMO"</div>
    <div class="pcta-sub">Ricevi in DM il link per prenotare una demo gratuita.</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}

export { PED_EDU_ITEMS };
