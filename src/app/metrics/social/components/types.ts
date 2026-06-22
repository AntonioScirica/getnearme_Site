// Shared types, constants, and helpers for the social dashboard.
// Extracted from src/app/metrics/social/page.tsx so view components and the
// standalone /templates page can import them without reaching into the big file.

export const MONO = "font-[family-name:var(--font-jetbrains)]";

// ── Page navigation ──────────────────────────────────────────────────
export type SocialPage = "calendar" | "news" | "costs" | "performance" | "templates";

// ── Data types ───────────────────────────────────────────────────────
export interface Topic {
  id: string;
  plan_date: string;
  rubric: string;
  category: string;
  title: string;
  status: string;
  edition: string | null;
  template: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slide_data: Record<string, any> | null;
}

export interface ContentItem {
  id: number;
  topic_id: string | null;
  post_id: string;
  type: string;
  status: string;
  publish_date: string;
  published_at: string | null;
  ig_post_id: string | null;
  ig_story_id: string | null;
  image_urls: string[] | null;
  video_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content_data: { caption?: string; hashtags?: string[]; rubric?: string; edition?: string; [k: string]: any } | null;
}

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  source: string;
  source_type: string;
  published_at: string | null;
  discovered_at: string;
}

export interface CostsData {
  totalUsd: number;
  byDay: Record<string, { anthropic: number; replicate: number; fal: number; total: number }>;
  byOperation: Record<string, number>;
  byService?: Record<string, number>;
}

export interface PostMetric {
  id: number;
  content_id: number | null;
  ig_post_id: string | null;
  publish_date: string;
  impressions: number;
  reach: number;
  saves: number;
  shares: number;
  comments: number;
  likes: number;
  plays: number;
  total_interactions: number;
  save_rate: number;
  share_rate: number;
  engagement_rate: number;
  content_type: string | null;
  rubric: string | null;
  hook_text: string | null;
  cta_text: string | null;
  fetched_at: string;
  thumbnail: string | null;
  caption: string | null;
}

export interface InsightRow {
  id: number;
  week_start: string;
  week_end: string;
  insights: {
    summary?: string;
    best_hook_pattern?: string;
    worst_pattern?: string;
    planner_adjustments?: string[];
    [key: string]: unknown;
  };
  applied: boolean;
  created_at: string;
}

export interface PerformanceData {
  days: number;
  posts: PostMetric[];
  insights: InsightRow[];
}

// ── Rubric colors (calendar + performance views) ─────────────────────
export const RUBRIC_COLORS: Record<string, string> = {
  news: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  education: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  people: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  myths: "bg-green-500/20 text-green-300 border-green-500/30",
  tools: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  world: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  question: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  prompt: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  video: "bg-red-500/20 text-red-300 border-red-500/30",
  mercato: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "roma-milano": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  feature: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  educativo: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  agenti: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  ambassador: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  tip: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

// ── Publish slots ────────────────────────────────────────────────────
export const FEED_SLOTS = ["09:00", "12:00", "18:00", "20:00"];
export const VIDEO_SLOT = "15:00";
export const TIP_SLOT = "20:00";

export function isVideoTopic(t: Topic): boolean {
  return t.rubric === "video" || t.template?.startsWith("video");
}
export function isTipTopic(t: Topic): boolean {
  return t.rubric === "tip";
}
export function getPublishTime(topic: Topic, allForDay: Topic[]): string {
  if (isVideoTopic(topic)) return VIDEO_SLOT;
  if (isTipTopic(topic)) return TIP_SLOT;
  const feedBefore = allForDay.filter((t) => !isVideoTopic(t) && !isTipTopic(t)).indexOf(topic);
  return FEED_SLOTS[Math.min(Math.max(feedBefore, 0), FEED_SLOTS.length - 1)];
}

// ── Status labels ────────────────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposto",
  approved: "Approvato",
  generating: "In generazione",
  generated: "Generato",
  published: "Pubblicato",
  failed: "Fallito",
  archived: "Archiviato",
};

// ── Number/percent formatters (performance view) ─────────────────────
export const RANGE_OPTIONS = [7, 30, 90] as const;

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

// ── Calendar grid helpers ────────────────────────────────────────────
// Week-based grid: each Monday→Sunday week belongs to the month that contains
// its MONDAY. So a boundary week is shown in exactly ONE month (no day appears
// in two months) while the weeks stay consecutive (no gaps). A month's grid
// therefore starts on its first "owned" Monday and may spill the last week into
// the next month (trailing days carry their own content).
export function gridRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // 0=Mon
  // First Monday that belongs to this month (if the 1st isn't Monday and its
  // week's Monday is in the previous month, that week belongs to the prev month).
  const startDom = firstDow === 0 ? 1 : 1 + (7 - firstDow);
  const lastDow = (new Date(Date.UTC(y, m - 1, daysInMonth)).getUTCDay() + 6) % 7;
  const lastMondayDom = daysInMonth - lastDow; // Monday of the last owned week
  const from = new Date(Date.UTC(y, m - 1, startDom)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(y, m - 1, lastMondayDom + 6)).toISOString().slice(0, 10);
  return { from, to };
}

export function buildMonthGrid(month: string): string[] {
  const { from } = gridRange(month);
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lastDow = (new Date(Date.UTC(y, m - 1, daysInMonth)).getUTCDay() + 6) % 7;
  const lastMondayDom = daysInMonth - lastDow;
  const start = new Date(`${from}T00:00:00Z`);
  const lastMonday = new Date(Date.UTC(y, m - 1, lastMondayDom));
  const cells: string[] = [];
  for (let d = new Date(start); d <= lastMonday; d.setUTCDate(d.getUTCDate() + 7)) {
    for (let k = 0; k < 7; k++) {
      const day = new Date(d);
      day.setUTCDate(day.getUTCDate() + k);
      cells.push(day.toISOString().slice(0, 10));
    }
  }
  return cells;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

// ── Video template metadata (placeholder cards in PreviewModal) ──────
export const VIDEO_TYPE_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  video_slider: {
    label: "Slider Before/After",
    icon: "↔",
    desc: "Nano-Banana staging + slider reveal animato",
    color: "from-blue-600/30 to-cyan-600/30",
  },
  video_before_after_stopmotion: {
    label: "Stop Motion",
    icon: "▶",
    desc: "Veo 3.1 — mobili appaiono uno alla volta nella stanza",
    color: "from-violet-600/30 to-purple-600/30",
  },
  video_before_after_particle: {
    label: "Particle Dust",
    icon: "✦",
    desc: "Veo 3.1 — oggetti si dissolvono in particelle e si riformano",
    color: "from-pink-600/30 to-rose-600/30",
  },
  video_day_night: {
    label: "Day / Night",
    icon: "◑",
    desc: "Transizione giorno/notte con Nano-Banana + Veo",
    color: "from-amber-600/30 to-orange-600/30",
  },
  video_timelapse: {
    label: "Timelapse Ristrutturazione",
    icon: "⏱",
    desc: "3 fasi AI (scavo → struttura → finito) + Kling v2 Master",
    color: "from-emerald-600/30 to-green-600/30",
  },
};

// ── Templates gallery metadata ───────────────────────────────────────
// Kept here (dashboard-specific presentation) rather than in the builder
// registry because the descriptions carry editorial detail (post counts,
// weekly cadence) that belongs to the dashboard, not to the renderer.
export interface GalleryTemplate {
  id: string;
  name: string;
  description: string;
  formats: { label: string; slides: string[] }[];
  status: "ready" | "planned" | "wip";
}

export const ALL_TEMPLATES: GalleryTemplate[] = [
  // ── PED formats ──
  {
    id: "ped-carosello-dati",
    name: "Carosello Dati",
    description: "Stat gigante + insight + valore pratico + CTA. Mercato e focus Roma/Milano. 8 post nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Cover stat", "Insight", "Valore pratico", "CTA"] }],
    status: "ready",
  },
  {
    id: "ped-carosello-edu",
    name: "Carosello Educativo",
    description: "Checklist salvabile: numero grande + item con tip pratico + CTA. 4 post nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Cover numero", "Item ×N", "CTA"] }],
    status: "ready",
  },
  {
    id: "ped-carosello-feature",
    name: "Carosello Feature",
    description: "Mockup prodotto + cosa è/non è + casi d'uso + CTA. 5 post nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Cover mockup", "Insight", "Casi d'uso", "CTA"] }],
    status: "ready",
  },
  {
    id: "ped-carosello-referral",
    name: "Carosello Referral",
    description: "Programma ambassador in 4 step + payout + CTA. 2 post nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Cover", "Step ×4", "CTA"] }],
    status: "ready",
  },
  {
    id: "ped-post-singolo",
    name: "Post Singolo",
    description: "Hook forte + insight + CTA. Post immagine singola per valore agente, riflessioni, ambassador. 8 post nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Hook + insight + CTA"] }],
    status: "ready",
  },
  {
    id: "ped-tip",
    name: "Tip GetNearMe",
    description: "Mini tip pratico su come usare GetNearMe in scenari reali. 1 al giorno, 28 nel PED",
    formats: [{ label: "IG Feed 1080×1350", slides: ["Tip card"] }],
    status: "ready",
  },
  // ── Video templates ──
  {
    id: "before-after",
    name: "Slider Before/After",
    description: "Nano-Banana staging + slider reveal animato. 3x/settimana",
    formats: [
      { label: "IG Reel 1080×1920", slides: ["Slider animato 15s"] },
      { label: "IG Story 1080×1920", slides: ["CTA + foto card"] },
      { label: "LI Video 1080×1350", slides: ["Slider animato"] },
    ],
    status: "ready",
  },
  {
    id: "stop-motion",
    name: "Prima/Dopo — Stop Motion",
    description: "Veo 3.1 — mobili appaiono uno alla volta nella stanza. 1x/settimana",
    formats: [
      { label: "IG Reel 1080×1920", slides: ["Video 8s stop motion"] },
      { label: "IG Story 1080×1920", slides: ["Video + CTA"] },
      { label: "LI Video 1080×1350", slides: ["Video 8s stop motion"] },
    ],
    status: "planned",
  },
  {
    id: "particle",
    name: "Prima/Dopo — Particelle",
    description: "Veo 3.1 — oggetti si dissolvono in particelle e si riformano. 1x/settimana",
    formats: [
      { label: "IG Reel 1080×1920", slides: ["Video 8s particle dust"] },
      { label: "IG Story 1080×1920", slides: ["Video + CTA"] },
      { label: "LI Video 1080×1350", slides: ["Video 8s particle dust"] },
    ],
    status: "planned",
  },
  {
    id: "day-night",
    name: "Day / Night",
    description: "Transizione giorno/notte con Nano-Banana + Veo. 1x/settimana",
    formats: [
      { label: "IG Reel 1080×1920", slides: ["Video 8s transizione luce"] },
      { label: "IG Story 1080×1920", slides: ["Video + CTA"] },
      { label: "LI Video 1080×1350", slides: ["Video 8s transizione luce"] },
    ],
    status: "planned",
  },
  {
    id: "timelapse",
    name: "Timelapse Ristrutturazione",
    description: "3 fasi AI (scavo → struttura → finito) + Kling v2 Master. 1x/settimana",
    formats: [
      { label: "IG Reel 1080×1920", slides: ["Video timelapse ~15s"] },
      { label: "IG Story 1080×1920", slides: ["Video + CTA"] },
      { label: "LI Video 1080×1350", slides: ["Video timelapse ~15s"] },
    ],
    status: "planned",
  },
];

export const TPL_STATUS: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  planned: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  wip: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};
