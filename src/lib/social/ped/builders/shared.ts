// Shared constants for PED template builders.
// Single source of truth — imported by both the client dashboard
// (src/app/metrics/social) and the server renderer (src/lib/social/ped).
//
// NOTE on CSS divergence: the client page.tsx PED_CSS and the server
// templates.js PED_CSS are intentionally *not* identical (the client uses
// neo-brutalist 4px box-shadows, the server uses softer shadows). To preserve
// pixel-identical output during this refactor, each CSS string is exported
// separately and the builder functions stay CSS-agnostic (they emit HTML
// class names only). The host picks which CSS to attach.

// ── GetNearMe logo path ──────────────────────────────────────────────
export const LOGO_SVG_PATH =
  "M224.816 4.98C217.966-1.72 207.036-1.65 200.274 5.13L51.253 154.306c-14.922 14.922-27.88 29.952-37.086 49.303-9.206 19.35-13.635 38.526-14.071 58.923-.567 26.135.975 49.699 17.468 70.838 13.962 17.889 31.458 32.876 46.576 49.739 16.601 18.521 34.14 36.475 51.178 54.691 4.56 4.887 58.465 62.021 83.051 88.418 6.698 7.177 17.976 7.439 25.001.567L379.138 374.925c55.018-53.971 58.334-133.379 15.969-196.448-16.885-25.153-40.882-45.812-63.483-66.471-6.85-6.261-17.409-6.043-24.019.48L167.856 250.403c-6.61 6.522-6.959 17.059-.785 23.997l33.508 37.784c6.61 7.461 18.129 7.875 25.262.894L320.193 220.69s41.885 40.773.349 93.152L225.427 408.782c-6.785 6.763-17.736 6.807-24.564.109L111.463 321.084s-61.759-46.619.658-109.491c49.521-49.106 119.483-118.479 147.778-146.512 6.915-6.85 6.871-18.063-.088-24.87L224.816 4.98z";

// Logo footer SVG used by all PED feed slides (deduplicated: was both
// LOGO_FOOTER and PED_LOGO_FOOTER in the original files — they are byte-identical).
export const LOGO_FOOTER = `<svg width="36" height="36" viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path fill="#3B83F6" d="${LOGO_SVG_PATH}"/></svg>getnearme.it`;
export const PED_LOGO_FOOTER = LOGO_FOOTER;

// All decorative SVGs carry explicit width/height so they never balloon to
// fill their frame if the stylesheet fails to load (e.g. iframe CSS issues in
// some browsers). CSS rules override these presentation attributes when the
// sheet is present, so the visual size stays driven by CSS in the normal case.
export const PED_SWIPE =
  '<span class="swipe">Scorri <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></span>';

export const PED_UP_ARROW =
  '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';

// Tip arrow (right-pointing) — used by tipD / pedTipHtml "Come fare" hint.
export const TIP_ARROW =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';

// Small pin icon — used in the story teaser footer.
export const GNM_ICON_SM = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

// ── Default data: referral steps + edu items ─────────────────────────
// Duplicated verbatim between page.tsx and templates.js — now a single source.
export const REF_STEPS: [string, string, string][] = [
  [
    "Segnala il contatto",
    "Conosci un titolare, un agente o un team? Basta una segnalazione. Non devi vendere nulla.",
    "Tu apri la conversazione, noi facciamo il resto.",
  ],
  [
    "Noi facciamo la demo",
    "Il nostro team contatta l'agenzia, organizza la demo e presenta GetNearMe nel dettaglio.",
    "Non devi seguire la trattativa.",
  ],
  [
    "L'agenzia decide",
    "Nessuna pressione. L'agenzia valuta in autonomia se attivare GetNearMe per il proprio lavoro.",
    "Tu non hai obblighi dopo la segnalazione.",
  ],
  [
    "Ricevi il payout",
    "Se l'agenzia diventa cliente, ricevi il compenso previsto dal programma ambassador.",
    "",
  ],
];

export const PED_EDU_ITEMS: [string, string, string][] = [
  [
    "Perché quel prezzo è coerente",
    "Il cliente non vuole solo sapere quanto costa. Vuole capire perché. Comparabili e andamento della zona rendono il numero credibile invece che arbitrario.",
    "In pratica: mostra sempre un confronto con 2-3 immobili simili in zona.",
  ],
  [
    "Cosa offre la zona",
    "Trasporti, scuole, servizi, aree verdi. Per molte case il contesto è una delle leve più forti, ma di solito finisce in una frase generica.",
    "In pratica: dedica una sezione alla zona, non una riga nella descrizione.",
  ],
  [
    "Quali immobili sono comparabili",
    "Il cliente confronta comunque, da solo e online. Meglio guidare tu il confronto con dati ordinati che lasciarlo a un portale.",
    "In pratica: porta tu i comparabili prima che li trovi lui.",
  ],
  [
    "Qual è il potenziale degli spazi",
    "Una stanza vuota o datata non si spiega da sola. Il cliente fatica a immaginare quello che tu invece vedi subito.",
    "In pratica: un prima/dopo con home staging rende visibile il potenziale.",
  ],
  [
    "Perché merita attenzione",
    "Tra decine di annunci simili, vince quello che spiega meglio. Non servono più foto: serve più chiarezza.",
    "In pratica: ogni annuncio dovrebbe avere materiali che lo raccontano, non solo immagini.",
  ],
];

// ── Story teaser rubric → color/shape map ────────────────────────────
// The server (templates.js) and client (page.tsx) historically diverged on a
// few rubric accent colors. Both variants are kept here so the refactor
// preserves pixel-identical output on each surface; the host picks which one
// to pass into storyTeaserD. SERVER_RUBRIC_STORY is the default export name
// RUBRIC_STORY (matches the server file's export).

// Server variant (from src/lib/social/ped/templates.js)
export const RUBRIC_STORY: Record<string, { hex: string; hl: string; shape: string }> = {
  mercato: { hex: "#10b981", hl: "hl-emerald", shape: "sh-circle" },
  "roma-milano": { hex: "#06b6d4", hl: "hl-cyan", shape: "sh-pill" },
  feature: { hex: "#3B83F6", hl: "hl-blue", shape: "sh-square" },
  educativo: { hex: "#3B83F6", hl: "hl-blue", shape: "sh-ring" },
  agenti: { hex: "#f59e0b", hl: "hl-amber", shape: "sh-diamond" },
  ambassador: { hex: "#f59e0b", hl: "hl-amber", shape: "sh-bar" },
  video: { hex: "#ef4444", hl: "hl-red", shape: "sh-circle" },
  tip: { hex: "#8b5cf6", hl: "hl-violet", shape: "sh-pill" },
};

// Client variant (from src/app/metrics/social/page.tsx) — agenti/ambassador
// use blue here instead of amber, feature/educativo already match.
export const CLIENT_RUBRIC_STORY: Record<string, { hex: string; hl: string; shape: string }> = {
  mercato: { hex: "#10b981", hl: "hl-emerald", shape: "sh-circle" },
  "roma-milano": { hex: "#06b6d4", hl: "hl-cyan", shape: "sh-pill" },
  feature: { hex: "#3B83F6", hl: "hl-blue", shape: "sh-square" },
  educativo: { hex: "#3B83F6", hl: "hl-blue", shape: "sh-ring" },
  agenti: { hex: "#3B83F6", hl: "hl-amber", shape: "sh-diamond" },
  ambassador: { hex: "#3B83F6", hl: "hl-amber", shape: "sh-bar" },
  video: { hex: "#ef4444", hl: "hl-red", shape: "sh-circle" },
  tip: { hex: "#8b5cf6", hl: "hl-violet", shape: "sh-pill" },
};
