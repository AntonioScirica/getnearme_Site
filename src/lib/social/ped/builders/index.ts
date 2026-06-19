// PED template registry — the single source of truth.
//
// Both the client dashboard (src/app/metrics/social) and the server renderer
// (src/lib/social/ped/templates.js) import from here. This replaces the old
// "keep in sync with page.tsx" comment: there is nothing to sync anymore,
// the HTML builders live in one place.
//
// Two output shapes coexist because the two consumers need different things:
//   - buildSlides(d)      → { label, html: string }[]   (flat, for Puppeteer)
//   - previews(d)         → TplPreview[]                (thunks + layout, for the client iframe)
// Both are driven by the SAME underlying *D builder functions, so a change to
// datiCoverD shows up identically in the dashboard preview and the published PNG.

import {
  datiCoverD,
  datiInsightD,
  datiValueD,
  pedCtaD,
  pedDatiCoverHtml,
  pedDatiContentHtml,
  pedDatiCtaHtml,
  pedDatiValueHtml,
} from "./dati";
import {
  eduCoverD,
  eduItemD,
  pedEduCoverHtml,
  pedEduItem,
  pedEduCtaHtml,
  PED_EDU_ITEMS,
} from "./edu";
import {
  featCasesD,
  featCoverD,
  featInsightD,
  pedFeatCasesHtml,
  pedFeatCtaHtml,
  pedFeatCoverHtml,
  pedFeatInsightHtml,
} from "./feature";
import { postSingoloD, pedPostSingoloHtml } from "./post-singolo";
import { tipD, pedTipHtml } from "./tip";
import {
  pedRefStepHtml,
  pedRefStepD,
  pedRefCoverHtml,
  pedRefCtaHtml,
  refCoverD,
  REF_STEPS,
} from "./referral";
import { storyTeaserD, type RubricStoryMap } from "./story";
import { CLIENT_RUBRIC_STORY, RUBRIC_STORY } from "./shared";

// ── Types ────────────────────────────────────────────────────────────

// Minimal topic shape — only what the builders read. The full Topic interface
// lives in the dashboard; we accept a structural superset.
export interface PedTopic {
  template: string;
  rubric: string;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slide_data: Record<string, any> | null;
}

export type TplFormat = "feed" | "story" | "reels";

export interface TplPreview {
  label: string;
  format: TplFormat;
  platform: "instagram" | "linkedin";
  html: () => string;
  css?: string;
  w: number;
  h: number;
  scale: number;
  frameW: number;
  frameH: number;
}

// A slide produced for the server (flat HTML string, no layout metadata).
export interface ServerSlide {
  label: string;
  html: string;
}

export interface PedTemplateModule {
  id: string;
  name: string;
  /** Feed slides as flat {label, html} for Puppeteer rendering. Story NOT included. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => ServerSlide[];
  /** Story teaser HTML, or null when the topic has no storyHook. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildStory: (d: any, rubric: string, rubricMap?: RubricStoryMap) => string | null;
  /** Deterministic IG caption (no AI). */
  buildCaption: (topic: PedTopic) => string;
  /** Client preview slides (thunks + layout). Includes the story slide when present. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => TplPreview[];
}

// ── Layout bases (client only) ───────────────────────────────────────
// CSS strings come from the host modules (page.tsx keeps its own PED_CSS /
// STORY_CSS, templates.js keeps its own). To avoid forcing the CSS into the
// shared layer — where client and server variants diverge — the FEED_BASE /
// STORY_BASE here carry only the numeric/enum layout, and the css field is
// filled in by the host via `withCss()`. For the dashboard, page.tsx patches
// css onto each preview before rendering.

const FEED_LAYOUT = { format: "feed" as TplFormat, platform: "instagram" as const, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 };
const STORY_LAYOUT = { format: "story" as TplFormat, platform: "instagram" as const, w: 1080, h: 1920, scale: 0.14, frameW: 151, frameH: 269 };

// CSS to attach to previews. The client calls `setPreviewCss(PED_CSS, STORY_CSS)`
// at module init so previews render with the right stylesheet. Defaults to ""
// (the iframe falls back to its own TEMPLATE_CSS).
let feedCss = "";
let storyCss = "";
export function setPreviewCss(feed: string, story: string) {
  feedCss = feed;
  storyCss = story;
}

// ── Caption helper (shared) ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strip = (s: any) => String(s || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim();

const HASHTAGS = "#immobiliare #agenteimmobiliare #agenziaimmobiliare #realestateitalia #getnearme";

// ── Per-template modules ─────────────────────────────────────────────

const DATI: PedTemplateModule = {
  id: "ped-carosello-dati",
  name: "Carosello Dati di Mercato",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => [
    { label: "cover", html: datiCoverD(d) },
    { label: "insight", html: datiInsightD(d) },
    { label: "value", html: datiValueD(d) },
    { label: "cta", html: pedCtaD(d) },
  ],
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`${strip(d.title)} ${strip(d.titleHL)}`.trim()];
    if (d.insight) parts.push(strip(d.insight));
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: () => datiCoverD(d) },
      { label: "2 · Insight", ...FEED_LAYOUT, css: feedCss, html: () => datiInsightD(d) },
      { label: "3 · Valore", ...FEED_LAYOUT, css: feedCss, html: () => datiValueD(d) },
      { label: "4 · CTA", ...FEED_LAYOUT, css: feedCss, html: () => pedCtaD(d) },
      ...story,
    ];
  },
};

const EDU: PedTemplateModule = {
  id: "ped-carosello-edu",
  name: "Carosello Educativo",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => [
    { label: "cover", html: eduCoverD(d) },
    ...(d.items || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any, i: number) => ({ label: `item${i + 1}`, html: eduItemD(i + 1, item) })
    ),
    { label: "cta", html: pedCtaD(d) },
  ],
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`${strip(d.title)} ${strip(d.titleHL)}`.trim()];
    const items = (d.items || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (it: any, i: number) => `${i + 1}. ${strip(it.title)}`
    );
    if (items.length) parts.push(items.join("\n"));
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const items = d.items || PED_EDU_ITEMS.map(([title, text, tip]) => ({ title, text, tip }));
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: () => eduCoverD(d) },
      ...items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any, i: number) => ({
          label: `${i + 2} · Item ${i + 1}`,
          ...FEED_LAYOUT,
          css: feedCss,
          html: () => eduItemD(i + 1, item),
        })
      ),
      { label: `${items.length + 2} · CTA`, ...FEED_LAYOUT, css: feedCss, html: () => pedCtaD(d) },
      ...story,
    ];
  },
};

const FEATURE: PedTemplateModule = {
  id: "ped-carosello-feature",
  name: "Carosello Feature",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => [
    { label: "cover", html: featCoverD(d) },
    { label: "insight", html: featInsightD(d) },
    { label: "cases", html: featCasesD(d) },
    { label: "cta", html: pedCtaD(d) },
  ],
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`${strip(d.coverTitle)} ${strip(d.coverHL)}`.trim()];
    if (d.yesText) parts.push(strip(d.yesText));
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: () => featCoverD(d) },
      { label: "2 · Insight", ...FEED_LAYOUT, css: feedCss, html: () => featInsightD(d) },
      { label: "3 · Casi", ...FEED_LAYOUT, css: feedCss, html: () => featCasesD(d) },
      { label: "4 · CTA", ...FEED_LAYOUT, css: feedCss, html: () => pedCtaD(d) },
      ...story,
    ];
  },
};

const POST_SINGOLO: PedTemplateModule = {
  id: "ped-post-singolo",
  name: "Post Singolo",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => [{ label: "post", html: postSingoloD(d) }],
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`${strip(d.hook)} ${strip(d.hookHL)}`.trim()];
    if (d.body) parts.push(strip(d.body));
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || "Ricevi il link per provare GetNearMe");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "Post", ...FEED_LAYOUT, css: feedCss, html: () => postSingoloD(d) },
      ...story,
    ];
  },
};

const TIP: PedTemplateModule = {
  id: "ped-tip",
  name: "Tip",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => [{ label: "tip", html: tipD(d) }],
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`Tip #${d.tipNum}: ${strip(d.title)} ${strip(d.titleHL)}`.trim()];
    if (d.body) parts.push(strip(d.body));
    if (d.how) parts.push(`Come fare: ${strip(d.how)}`);
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "Tip", ...FEED_LAYOUT, css: feedCss, html: () => tipD(d) },
      ...story,
    ];
  },
};

const REFERRAL: PedTemplateModule = {
  id: "ped-carosello-referral",
  name: "Carosello Referral / Ambassador",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildSlides: (d: any) => {
    const steps = (d.steps || REF_STEPS).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any, i: number) => {
        const arr = Array.isArray(s) ? { title: s[0], text: s[1], note: s[2] } : s;
        return { label: `step${i + 1}`, html: pedRefStepHtml(i + 1, arr.title, arr.text, arr.note) };
      }
    );
    return [{ label: "cover", html: refCoverD(d) }, ...steps, { label: "cta", html: pedCtaD(d) }];
  },
  buildStory: (d, rubric, rubricMap = RUBRIC_STORY) => (d.storyHook ? storyTeaserD(d, rubric, rubricMap) : null),
  buildCaption: (topic) => {
    const d = topic.slide_data || {};
    const parts: string[] = [`${strip(d.coverTitle)} ${strip(d.coverHL)}`.trim()];
    if (d.coverSub) parts.push(strip(d.coverSub));
    const pill = d.ctaPill;
    if (pill) {
      const hint = strip(d.ctaHint || d.ctaSub || "Ricevi il link per provare GetNearMe.");
      parts.push(`Commenta "${pill}", ${hint.charAt(0).toLowerCase()}${hint.slice(1)}`);
    }
    parts.push(HASHTAGS);
    return parts.filter(Boolean).join("\n\n").slice(0, 2200);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previews: (d: any, rubric: string) => {
    const steps = d.steps || REF_STEPS;
    const story = d.storyHook
      ? [{ label: "Story", ...STORY_LAYOUT, css: storyCss, html: () => storyTeaserD(d, rubric, CLIENT_RUBRIC_STORY) }]
      : [];
    return [
      { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: () => refCoverD(d) },
      ...steps.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any, i: number) => {
          const arr = Array.isArray(s) ? { title: s[0], text: s[1], note: s[2] } : s;
          return {
            label: `${i + 2} · Step ${i + 1}`,
            ...FEED_LAYOUT,
            css: feedCss,
            html: () => pedRefStepHtml(i + 1, arr.title, arr.text, arr.note),
          };
        }
      ),
      { label: `${steps.length + 2} · CTA`, ...FEED_LAYOUT, css: feedCss, html: () => pedCtaD(d) },
      ...story,
    ];
  },
};

// ── Registry ─────────────────────────────────────────────────────────
export const PED_REGISTRY: Record<string, PedTemplateModule> = {
  "ped-carosello-dati": DATI,
  "ped-carosello-edu": EDU,
  "ped-carosello-feature": FEATURE,
  "ped-post-singolo": POST_SINGOLO,
  "ped-tip": TIP,
  "ped-carosello-referral": REFERRAL,
};

// ── Dispatchers (replace the old buildSlidesForTopic switches) ───────

/** Feed slides for a PED topic as flat {label, html} (server / Puppeteer). Story excluded. */
export function buildSlidesForTopic(topic: PedTopic): ServerSlide[] | null {
  const d = topic.slide_data;
  if (!d) return null;
  const mod = PED_REGISTRY[topic.template];
  return mod ? mod.buildSlides(d) : null;
}

/** Story teaser HTML for a PED topic (server). Null if no storyHook. */
export function buildStoryForTopic(topic: PedTopic, rubricMap: RubricStoryMap = RUBRIC_STORY): string | null {
  const d = topic.slide_data;
  if (!d?.storyHook) return null;
  const mod = PED_REGISTRY[topic.template];
  return mod ? mod.buildStory(d, topic.rubric, rubricMap) : null;
}

/** Deterministic IG caption for a PED topic (server). Falls back to topic.title. */
export function buildCaptionForTopic(topic: PedTopic): string {
  const mod = PED_REGISTRY[topic.template];
  if (mod) return mod.buildCaption(topic);
  return (topic.title || "").slice(0, 2200);
}

/** Client preview slides for a topic (thunks + layout), or null if unknown. */
export function previewsForTopic(topic: PedTopic): TplPreview[] | null {
  const d = topic.slide_data;
  if (!d) return null;
  const mod = PED_REGISTRY[topic.template];
  return mod ? mod.previews(d, topic.rubric) : null;
}

// ── Static gallery previews (Templates tab / standalone page) ────────
// Keyed by template id; each entry is a sample render with placeholder data.
export const STATIC_PREVIEWS: Record<string, TplPreview[]> = {
  "ped-carosello-dati": [
    { label: "1 · Cover — stat", ...FEED_LAYOUT, css: feedCss, html: pedDatiCoverHtml },
    { label: "2 · Insight", ...FEED_LAYOUT, css: feedCss, html: pedDatiContentHtml },
    { label: "3 · Valore pratico", ...FEED_LAYOUT, css: feedCss, html: pedDatiValueHtml },
    { label: "4 · CTA", ...FEED_LAYOUT, css: feedCss, html: pedDatiCtaHtml },
  ],
  "ped-carosello-edu": [
    { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: pedEduCoverHtml },
    ...PED_EDU_ITEMS.map(([title, text, tip], i) => ({
      label: `${i + 2} · Item ${i + 1}`,
      ...FEED_LAYOUT,
      css: feedCss,
      html: () => pedEduItem(i + 1, title, text, tip),
    })),
    { label: "7 · CTA", ...FEED_LAYOUT, css: feedCss, html: pedEduCtaHtml },
  ],
  "ped-carosello-feature": [
    { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: pedFeatCoverHtml },
    { label: "2 · Insight", ...FEED_LAYOUT, css: feedCss, html: pedFeatInsightHtml },
    { label: "3 · Casi d'uso", ...FEED_LAYOUT, css: feedCss, html: pedFeatCasesHtml },
    { label: "4 · CTA", ...FEED_LAYOUT, css: feedCss, html: pedFeatCtaHtml },
  ],
  "ped-carosello-referral": [
    { label: "1 · Cover", ...FEED_LAYOUT, css: feedCss, html: pedRefCoverHtml },
    ...REF_STEPS.map(([title, text, note], i) => ({
      label: `${i + 2} · Step ${i + 1}`,
      ...FEED_LAYOUT,
      css: feedCss,
      html: () => pedRefStepHtml(i + 1, title, text, note),
    })),
    { label: "6 · CTA", ...FEED_LAYOUT, css: feedCss, html: pedRefCtaHtml },
  ],
  "ped-post-singolo": [
    { label: "Post singolo", ...FEED_LAYOUT, css: feedCss, html: pedPostSingoloHtml },
  ],
  "ped-tip": [{ label: "Tip", ...FEED_LAYOUT, css: feedCss, html: pedTipHtml }],
};

// Catalog metadata for the Templates gallery — derived from the registry
// so adding a template to PED_REGISTRY automatically surfaces it here.
export interface TemplateCatalogEntry {
  id: string;
  name: string;
  description: string;
  status: "ready" | "planned" | "wip";
  formats: { label: string; type: TplFormat; slides: string[] }[];
}

export const PED_CATALOG: TemplateCatalogEntry[] = [
  {
    id: "ped-carosello-dati",
    name: "Carosello — Dati di Mercato",
    description: "Statistica di mercato + insight pratico + 3 azioni + CTA. Per rubriche dati/mercato.",
    status: "ready",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "feed",
        slides: ["Cover stat", "Insight", "Valore pratico", "CTA"],
      },
    ],
  },
  {
    id: "ped-carosello-edu",
    name: "Carosello — Educativo",
    description: "Checklist numerata: cover + N item + CTA. Per rubriche formative/educative.",
    status: "ready",
    formats: [{ label: "Feed 1080×1350", type: "feed", slides: ["Cover", "Item ×N", "CTA"] }],
  },
  {
    id: "ped-carosello-feature",
    name: "Carosello — Feature",
    description: "Presentazione feature: cover con mockup + cosa non è/cos'è + casi d'uso + CTA.",
    status: "ready",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "feed",
        slides: ["Cover", "Insight no/sì", "Casi d'uso", "CTA"],
      },
    ],
  },
  {
    id: "ped-carosello-referral",
    name: "Carosello — Referral / Ambassador",
    description: "Programma ambassador: cover + 4 step + CTA con payout.",
    status: "ready",
    formats: [{ label: "Feed 1080×1350", type: "feed", slides: ["Cover", "Step ×4", "CTA"] }],
  },
  {
    id: "ped-post-singolo",
    name: "Post Singolo",
    description: "Slide unica con hook + body + CTA. Per pensieri/annunci veloci.",
    status: "ready",
    formats: [{ label: "Feed 1080×1350", type: "feed", slides: ["Post"] }],
  },
  {
    id: "ped-tip",
    name: "Tip",
    description: "Consiglio pratico numerato con scenario + come fare.",
    status: "ready",
    formats: [{ label: "Feed 1080×1350", type: "feed", slides: ["Tip"] }],
  },
];

// Re-export everything consumers might need from the builder submodules.
export {
  datiCoverD,
  datiInsightD,
  datiValueD,
  pedCtaD,
  pedDatiCoverHtml,
  pedDatiContentHtml,
  pedDatiValueHtml,
  pedDatiCtaHtml,
  eduCoverD,
  eduItemD,
  pedEduCoverHtml,
  pedEduItem,
  pedEduCtaHtml,
  featCoverD,
  featInsightD,
  featCasesD,
  pedFeatCoverHtml,
  pedFeatInsightHtml,
  pedFeatCasesHtml,
  pedFeatCtaHtml,
  postSingoloD,
  pedPostSingoloHtml,
  tipD,
  pedTipHtml,
  refCoverD,
  pedRefStepHtml,
  pedRefStepD,
  pedRefCoverHtml,
  pedRefCtaHtml,
  storyTeaserD,
  PED_EDU_ITEMS,
  REF_STEPS,
  RUBRIC_STORY,
  CLIENT_RUBRIC_STORY,
};
