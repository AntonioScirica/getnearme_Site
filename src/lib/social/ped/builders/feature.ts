// "Feature" carousel (ped-carosello-feature) — cover + insight + cases + CTA.

import { PED_LOGO_FOOTER, PED_SWIPE } from "./shared";
import { FEATURE_ART } from "./feature-art";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featCoverD(d: any): string {
  // Cover visual priority:
  //  1. d.coverArt  → illustrated, brand-accurate SVG mockup of the platform
  //  2. d.coverImage → real screenshot URL
  //  3. fallback     → generic browser mockup
  const art = d.coverArt ? FEATURE_ART[d.coverArt] : null;
  let visual: string;
  let shotClass = "";
  if (art) {
    visual = art;
    shotClass = " cf-visual-shot";
  } else if (d.coverImage) {
    visual = `<img class="cf-shot" src="${d.coverImage}" alt="">`;
    shotClass = " cf-visual-shot";
  } else {
    visual = `<div class="mock"><div class="bar"><i style="background:#ef4444"></i><i style="background:#f59e0b"></i><i style="background:#10b981"></i></div><div class="body"><div class="panel"></div><div class="panel acc"></div></div></div>`;
  }
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Feature</div>
    <div class="cf-visual${shotClass}">${visual}</div>
    <div class="ped-title">${d.coverTitle || ""}<br><span class="hl-blue">${d.coverHL || ""}</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featInsightD(d: any): string {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cf-no"><div class="ic">✕</div><div class="tx">${d.noText || ""}<small>${d.noSub || ""}</small></div></div>
    <div class="cf-yes"><div class="ic">✓</div><div class="tx">${d.yesText || ""}<small>${d.yesSub || ""}</small></div></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featCasesD(d: any): string {
  const cases = d.cases || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">Quando ha senso <span class="hl-blue">usarlo</span></div>
    <div class="pva-list">${cases
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any, i: number) =>
          `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${c.title}<small>${c.text}</small></div></div>`
      )
      .join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// ── Static sample slides (for the Templates gallery preview) ─────────
export function pedFeatCoverHtml(): string {
  return `<div class="ped">
    <div class="deco deco-c1"></div>
    <div class="ped-badge badge-blue">Feature</div>
    <div class="cf-visual">
      <div class="mock">
        <div class="bar"><i style="background:#ef4444"></i><i style="background:#f59e0b"></i><i style="background:#10b981"></i></div>
        <div class="body"><div class="panel"></div><div class="panel acc"></div></div>
      </div>
    </div>
    <div class="ped-title">Home staging AI: <span class="hl-blue">quando ha senso usarlo</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedFeatInsightHtml(): string {
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="cdc-kicker">Prima di tutto, cosa non è</div>
    <div class="cf-no"><div class="ic">✕</div><div class="tx">Non serve a nascondere i difetti di un immobile<small>Il cliente li vedrà comunque in visita. E perderesti credibilità.</small></div></div>
    <div class="cf-yes"><div class="ic">✓</div><div class="tx">Serve quando lo spazio non si spiega da solo<small>Una stanza vuota, fredda o poco leggibile non fa capire il suo potenziale.</small></div></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedFeatCasesHtml(): string {
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">I 3 casi in cui <span class="hl-blue">fa la differenza</span></div>
    <div class="pva-list">
      <div class="pva-item"><div class="n" style="background:#3B83F6;color:#fff">1</div><div class="tx">Immobili vuoti<small>Una stanza arredata si capisce. Una vuota si deve immaginare.</small></div></div>
      <div class="pva-item"><div class="n" style="background:#3B83F6;color:#fff">2</div><div class="tx">Ambienti datati ma recuperabili<small>Mostra cosa può diventare, senza ristrutturare davvero.</small></div></div>
      <div class="pva-item"><div class="n" style="background:#3B83F6;color:#fff">3</div><div class="tx">Spazi difficili da immaginare<small>Mansarde, open space, metrature irregolari: lo staging li rende leggibili.</small></div></div>
    </div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

export function pedFeatCtaHtml(): string {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div>
    <div class="deco deco-p1"></div>
    <div class="pcta-kicker">Direttamente dal tuo annuncio</div>
    <div class="pcta-title">Scegli lo stile e vedi il risultato <span class="hl-blue">in pochi secondi</span></div>
    <div class="pcta-pill">Commenta "STAGING"</div>
    <div class="pcta-sub">Ricevi il link per provare GetNearMe sulle tue foto.</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}
