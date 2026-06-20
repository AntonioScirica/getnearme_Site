// Video / Story / Stats template registry (client-side only).
//
// Mirrors the PED_REGISTRY pattern: a catalog of template metadata + a static
// previews map for the gallery. Unlike PED, these templates have no server-side
// render path yet (the video pipeline is not wired — see audit). They live only
// in the dashboard/standalone Templates page as <iframe srcDoc> previews.
//
// CSS is attached per-preview by the host (page.tsx) because each template type
// has its own stylesheet (VIDEO_STORIES_CSS / TIMELAPSE_*_CSS / STATS_CSS /
// TEMPLATE_CSS). The previews here reference those CSS constants by import.

import type { TplFormat, TplPreview } from "../ped/builders/index";
import type { TemplateCatalogEntry } from "../ped/builders/index";
import {
  feedSlide1Html,
  feedSlide2Html,
  reelsSlideHtml,
  STATS_CSS,
  statsBreakdownHtml,
  statsCtaHtml,
  statsHeroHtml,
  statsReelHtml,
  statsStoryHtml,
  storyCtaHtml,
  storyDayNightHtml,
  storyParticleDustHtml,
  storyStagingHtml,
  storyStopMotionHtml,
  storyTimelapseHtml,
  TEMPLATE_CSS,
  VIDEO_STORIES_CSS,
} from "./builders";

// Layout bases reused across templates.
const FEED = { format: "feed" as TplFormat, platform: "instagram" as const, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 };
const STORY = { format: "story" as TplFormat, platform: "instagram" as const, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 };
const REELS = { format: "reels" as TplFormat, platform: "instagram" as const, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 };

// ── Static gallery previews keyed by template id ─────────────────────
// These match the ids used by the dashboard's TPL_PREVIEWS map. PED ids are
// added at the host level (page.tsx merges PED STATIC_PREVIEWS with these).
export const VIDEO_STORY_PREVIEWS: Record<string, TplPreview[]> = {
  "before-after": [
    { label: "Reel — Slider", ...REELS, html: reelsSlideHtml, css: TEMPLATE_CSS },
    { label: "Story — CTA + foto", ...STORY, html: storyStagingHtml, css: VIDEO_STORIES_CSS },
    { label: "Video — Slider", ...REELS, platform: "linkedin", html: reelsSlideHtml, css: TEMPLATE_CSS },
  ],
  // Alias: the planner schedules the before/after slider as template "video_slider".
  // Same previews so it renders on the calendar (Reel slider + story).
  "video_slider": [
    { label: "Reel — Slider", ...REELS, html: reelsSlideHtml, css: TEMPLATE_CSS },
    { label: "Story — CTA + foto", ...STORY, html: storyStagingHtml, css: VIDEO_STORIES_CSS },
  ],
  "stop-motion": [
    { label: "Story — Stop Motion", ...STORY, html: storyStopMotionHtml, css: VIDEO_STORIES_CSS },
  ],
  particle: [
    { label: "Story — Effetto Polvere", ...STORY, html: storyParticleDustHtml, css: VIDEO_STORIES_CSS },
  ],
  "day-night": [
    { label: "Story — Day/Night", ...STORY, html: storyDayNightHtml, css: VIDEO_STORIES_CSS },
  ],
  timelapse: [
    { label: "Story — Timelapse", ...STORY, html: storyTimelapseHtml, css: VIDEO_STORIES_CSS },
  ],
  // Generic feed/staging slides (legacy "AI Staging" set).
  "feed-staging": [
    { label: "Feed — Slider", ...FEED, html: feedSlide1Html, css: TEMPLATE_CSS },
    { label: "Feed — CTA", ...FEED, html: feedSlide2Html, css: TEMPLATE_CSS },
    { label: "Story — CTA", ...STORY, html: storyCtaHtml, css: TEMPLATE_CSS },
  ],
  // Stats templates.
  stats: [
    { label: "Feed — Hero", ...FEED, html: statsHeroHtml, css: STATS_CSS },
    { label: "Feed — Breakdown", ...FEED, html: statsBreakdownHtml, css: STATS_CSS },
    { label: "Feed — CTA", ...FEED, html: statsCtaHtml, css: STATS_CSS },
    { label: "Story — Stat", ...STORY, html: statsStoryHtml, css: STATS_CSS },
    { label: "Reel — Counter", ...REELS, html: statsReelHtml, css: STATS_CSS },
  ],
};

// ── Catalog metadata ─────────────────────────────────────────────────
// Video templates carry the "planned" status because their publish pipeline
// is not wired (see audit: generate-ped skips video topics).
export const VIDEO_STORY_CATALOG: TemplateCatalogEntry[] = [
  {
    id: "before-after",
    name: "Prima / Dopo (AI Staging)",
    description: "Slider before/after con foto staging AI. Reel + story + CTA.",
    status: "ready",
    formats: [
      { label: "Reels 1080×1920", type: "reels", slides: ["Slider animato"] },
      { label: "Story 1080×1920", type: "story", slides: ["CTA + foto card"] },
    ],
  },
  {
    id: "stop-motion",
    name: "Stop Motion",
    description: "Due card foto ruotate con freccia arco. Story teaser video.",
    status: "planned",
    formats: [{ label: "Story 1080×1920", type: "story", slides: ["Stop motion"] }],
  },
  {
    id: "particle",
    name: "Effetto Polvere",
    description: "Split diagonale prima/dopo con effetto dissolvenza.",
    status: "planned",
    formats: [{ label: "Story 1080×1920", type: "story", slides: ["Particle dust"] }],
  },
  {
    id: "day-night",
    name: "Giorno / Notte",
    description: "Split verticale giorno↔notte della stessa villa.",
    status: "planned",
    formats: [{ label: "Story 1080×1920", type: "story", slides: ["Day/Night"] }],
  },
  {
    id: "timelapse",
    name: "Timelapse AI",
    description: "Split verticale prima/dopo con freccia. Teaser ristrutturazione.",
    status: "planned",
    formats: [{ label: "Story 1080×1920", type: "story", slides: ["Timelapse"] }],
  },
  {
    id: "feed-staging",
    name: "Feed AI Staging",
    description: "Carousel feed legacy: slider + CTA + story con foto staging.",
    status: "ready",
    formats: [
      { label: "Feed 1080×1350", type: "feed", slides: ["Slider", "CTA"] },
      { label: "Story 1080×1920", type: "story", slides: ["CTA"] },
    ],
  },
  {
    id: "stats",
    name: "Statistiche Mercato",
    description: "Carousel dati ISTAT: hero + breakdown città + CTA + story + reel counter.",
    status: "ready",
    formats: [
      { label: "Feed 1080×1350", type: "feed", slides: ["Hero", "Breakdown", "CTA"] },
      { label: "Story 1080×1920", type: "story", slides: ["Stat card"] },
      { label: "Reels 1080×1920", type: "reels", slides: ["Counter animato"] },
    ],
  },
];

// Re-export builders + CSS so consumers can import everything from one place.
export {
  TEMPLATE_CSS,
  VIDEO_STORIES_CSS,
  TIMELAPSE_REEL_CSS,
  TIMELAPSE_STORY_CSS,
  STATS_CSS,
  storyStopMotionHtml,
  storyParticleDustHtml,
  storyDayNightHtml,
  storyTimelapseHtml,
  reelTimelapseHtml,
  storyTimelapseNewHtml,
  storyDayNightNewHtml,
  storyStagingHtmlDynamic,
  storyStagingHtml,
  feedSlide1Html,
  feedSlide2Html,
  storyCtaHtml,
  reelsSlideHtml,
  statsHeroHtml,
  statsBreakdownHtml,
  statsCtaHtml,
  statsStoryHtml,
  statsReelHtml,
} from "./builders";
