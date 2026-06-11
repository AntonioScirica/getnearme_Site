"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Newspaper,
  Wallet,
  TrendingUp,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const MONO = "font-[family-name:var(--font-jetbrains)]";

// ── Types ──────────────────────────────────────────────────────────

type SocialPage = "calendar" | "news" | "costs" | "performance" | "templates";

interface Topic {
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

interface ContentItem {
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
  content_data: { caption?: string; hashtags?: string[]; rubric?: string; edition?: string } | null;
}

interface NewsItem {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  source: string;
  source_type: string;
  published_at: string | null;
  discovered_at: string;
}

interface CostsData {
  totalUsd: number;
  byDay: Record<string, { anthropic: number; replicate: number; total: number }>;
  byOperation: Record<string, number>;
}

interface PostMetric {
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

interface InsightRow {
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

interface PerformanceData {
  days: number;
  posts: PostMetric[];
  insights: InsightRow[];
}

// ── Constants ──────────────────────────────────────────────────────

const RUBRIC_COLORS: Record<string, string> = {
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

const FEED_SLOTS = ["09:00", "12:00", "18:00"];
const VIDEO_SLOT = "15:00";
const TIP_SLOT = "20:00";
function isVideoTopic(t: Topic) { return t.rubric === "video" || t.template?.startsWith("video"); }
function isTipTopic(t: Topic) { return t.rubric === "tip"; }
function getPublishTime(topic: Topic, allForDay: Topic[]): string {
  if (isVideoTopic(topic)) return VIDEO_SLOT;
  if (isTipTopic(topic)) return TIP_SLOT;
  const feedBefore = allForDay.filter((t) => !isVideoTopic(t) && !isTipTopic(t)).indexOf(topic);
  return FEED_SLOTS[Math.min(Math.max(feedBefore, 0), 2)];
}

const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposto",
  approved: "Approvato",
  generating: "In generazione",
  generated: "Generato",
  published: "Pubblicato",
  failed: "Fallito",
  archived: "Archiviato",
};

const NAV: { id: SocialPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "calendar", label: "Piano Editoriale", icon: CalendarDays },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "news", label: "News AI", icon: Newspaper },
  { id: "costs", label: "Costi API", icon: Wallet },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
];

// ── Page ───────────────────────────────────────────────────────────

export default function SocialDashboard() {
  const router = useRouter();
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [page, setPage] = useState<SocialPage>("calendar");

  // Calendar state
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [topics, setTopics] = useState<Topic[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [costs, setCosts] = useState<CostsData | null>(null);
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [perfDays, setPerfDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview modal
  const [preview, setPreview] = useState<{ topic: Topic; items: ContentItem[]; publishTime?: string } | null>(null);

  useEffect(() => {
    const key = sessionStorage.getItem("metrics_key");
    if (!key) {
      router.replace("/metrics");
      return;
    }
    setAuthKey(key);
  }, [router]);

  const fetchView = useCallback(
    async (view: string, extra = "") => {
      if (!authKey) return null;
      const res = await fetch(`/api/social/data?view=${view}${extra}`, {
        headers: { "x-metrics-key": authKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [authKey]
  );

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchView("calendar", `&month=${month}`);
      if (data) {
        setTopics(data.topics);
        setContent(data.content);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fetchView, month]);

  useEffect(() => {
    if (!authKey) return;
    if (page === "calendar") loadCalendar();
    if (page === "news") {
      setLoading(true);
      fetchView("news")
        .then((d) => d && setNews(d.news))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
    if (page === "costs") {
      setLoading(true);
      fetchView("costs")
        .then((d) => d && setCosts(d))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
    if (page === "performance") {
      setLoading(true);
      fetchView("performance", `&days=${perfDays}`)
        .then((d) => d && setPerf(d))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [authKey, page, perfDays, loadCalendar, fetchView]);

  // Map topic_id → content items (newest first already)
  const contentByTopic = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const c of content) {
      if (!c.topic_id) continue;
      (map[c.topic_id] ??= []).push(c);
    }
    return map;
  }, [content]);

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const topicsByDay = useMemo(() => {
    const map: Record<string, Topic[]> = {};
    for (const t of topics) (map[t.plan_date] ??= []).push(t);
    for (const day of Object.keys(map)) {
      const feed = map[day].filter((t) => !isVideoTopic(t) && !isTipTopic(t));
      const video = map[day].filter((t) => isVideoTopic(t));
      const tips = map[day].filter((t) => isTipTopic(t));
      const sorted: Topic[] = [];
      let fi = 0;
      for (const slot of ["09:00", "12:00", VIDEO_SLOT, "18:00"]) {
        if (slot === VIDEO_SLOT) { sorted.push(...video); continue; }
        if (fi < feed.length) sorted.push(feed[fi++]);
      }
      while (fi < feed.length) sorted.push(feed[fi++]);
      sorted.push(...tips);
      map[day] = sorted;
    }
    return map;
  }, [topics]);

  if (!authKey) return null;

  return (
    <div className="flex h-screen bg-[#0d0f14] text-gray-200">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#161920] border-r border-white/[0.08] flex flex-col">
        <div className="px-5 h-16 flex items-center border-b border-white/[0.08] shrink-0">
          <span className="font-semibold text-gray-100 text-lg">GetNearMe</span>
          <span className={`${MONO} text-[10px] text-gray-500 tracking-wider uppercase ml-2`}>Social</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left ${
                  active
                    ? "bg-indigo-500/20 text-indigo-400 font-medium"
                    : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/[0.08] p-3">
          <button
            onClick={() => router.push("/metrics")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
            Torna a Metrics
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[1400px]">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {page === "calendar" && (
            <CalendarView
              month={month}
              setMonth={setMonth}
              days={days}
              topicsByDay={topicsByDay}
              contentByTopic={contentByTopic}
              loading={loading}
              onRefresh={loadCalendar}
              onSelect={(topic) => {
                const dayTopics = topicsByDay[topic.plan_date] || [];
                setPreview({ topic, items: contentByTopic[topic.id] || [], publishTime: getPublishTime(topic, dayTopics) });
              }}
            />
          )}

          {page === "news" && <NewsView news={news} loading={loading} />}
          {page === "costs" && <CostsView costs={costs} loading={loading} />}
          {page === "performance" && (
            <PerformanceView perf={perf} loading={loading} days={perfDays} setDays={setPerfDays} />
          )}
          {page === "templates" && <TemplatesView />}
        </div>
      </main>

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          topic={preview.topic}
          items={preview.items}
          publishTime={preview.publishTime}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────────

function buildMonthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // Monday-first offset
  const offset = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function CalendarView({
  month,
  setMonth,
  days,
  topicsByDay,
  contentByTopic,
  loading,
  onRefresh,
  onSelect,
}: {
  month: string;
  setMonth: (m: string) => void;
  days: (string | null)[];
  topicsByDay: Record<string, Topic[]>;
  contentByTopic: Record<string, ContentItem[]>;
  loading: boolean;
  onRefresh: () => void;
  onSelect: (t: Topic) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const monthLabel = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Piano Editoriale</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setMonth(shiftMonth(month, -1))}
            className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`${MONO} text-sm text-gray-300 w-36 text-center capitalize`}>{monthLabel}</span>
          <button
            onClick={() => setMonth(shiftMonth(month, 1))}
            className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d} className={`${MONO} bg-[#161920] px-2 py-2 text-[10px] uppercase tracking-wider text-gray-500 text-center`}>
            {d}
          </div>
        ))}
        {days.map((date, i) => (
          <div
            key={i}
            className={`bg-[#12141a] min-h-28 p-1.5 ${date === today ? "ring-1 ring-inset ring-indigo-500/50" : ""}`}
          >
            {date && (
              <>
                <div className={`${MONO} text-[10px] mb-1 ${date === today ? "text-indigo-400" : "text-gray-600"}`}>
                  {Number(date.slice(8, 10))}
                </div>
                <div className="space-y-1">
                  {(topicsByDay[date] || []).map((t) => {
                    const dayTopics = topicsByDay[date] || [];
                    const items = contentByTopic[t.id] || [];
                    const published = items.some((c) => c.published_at);
                    const color = RUBRIC_COLORS[t.rubric] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
                    const time = getPublishTime(t, dayTopics);
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className={`w-full text-left px-1.5 py-1 rounded border text-[10px] leading-tight transition-opacity hover:opacity-80 cursor-pointer ${color}`}
                      >
                        <span className="flex items-center gap-1">
                          {published && <CheckCircle2 className="w-3 h-3 shrink-0 text-green-400" />}
                          <span className="truncate">{t.title}</span>
                        </span>
                        <span className={`${MONO} block mt-0.5 text-[9px] opacity-70`}>
                          {time} · {t.rubric}
                          {t.edition && t.rubric === "news" ? ` · ${t.edition === "morning" ? "☀️" : "🌙"}` : ""}
                          {" · "}
                          {published ? "Pubblicato" : STATUS_LABELS[t.status] || t.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <p className={`${MONO} mt-3 text-[11px] text-gray-600`}>
        Click su un contenuto per l&apos;anteprima reale. ✓ verde = pubblicato su Instagram.
      </p>
    </div>
  );
}

// ── Video preview placeholder ──────────────────────────────────────

const VIDEO_TYPE_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
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

function VideoPreviewPlaceholder({ topic }: { topic: Topic }) {
  const meta = VIDEO_TYPE_META[topic.template] || {
    label: topic.template,
    icon: "▶",
    desc: "",
    color: "from-gray-600/30 to-gray-700/30",
  };

  const previews = TPL_PREVIEWS[topic.template];

  return (
    <div>
      <p className={`${MONO} text-[11px] text-gray-500 mb-3`}>
        Anteprima — {meta.label}
      </p>

      {previews ? (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {previews.map((p) => (
            <div key={p.label} className="shrink-0 flex flex-col items-center">
              <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>{p.label}</p>
              <div style={{ width: p.frameW, height: p.frameH, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale} css={p.css} />
              </div>
              <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>{p.w} × {p.h}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3">
          <div className="shrink-0">
            <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Feed 1080 x 1350</p>
            <div
              className={`relative w-[240px] h-[300px] rounded-xl border border-white/[0.1] bg-gradient-to-br ${meta.color} flex flex-col items-center justify-center overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)",
              }} />
              <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                <span className="text-3xl">{meta.icon}</span>
                <p className="text-sm font-medium text-gray-200">{meta.label}</p>
                <p className={`${MONO} text-[10px] text-gray-400 leading-relaxed`}>{meta.desc}</p>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className={`${MONO} text-[9px] px-2 py-0.5 rounded bg-white/[0.08] text-gray-400`}>REEL</span>
                <span className={`${MONO} text-[9px] text-gray-500`}>9:16</span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story 1080 x 1920</p>
            <div
              className={`relative w-[169px] h-[300px] rounded-xl border border-white/[0.1] bg-gradient-to-br ${meta.color} flex flex-col items-center justify-center overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)",
              }} />
              <div className="relative z-10 flex flex-col items-center gap-3 px-3 text-center">
                <span className="text-3xl">{meta.icon}</span>
                <p className="text-sm font-medium text-gray-200">{meta.label}</p>
                <p className={`${MONO} text-[10px] text-gray-400 leading-relaxed`}>Story</p>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className={`${MONO} text-[9px] px-2 py-0.5 rounded bg-white/[0.08] text-gray-400`}>STORY</span>
                <span className={`${MONO} text-[9px] text-gray-500`}>9:16</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 px-4 py-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.15]">
        <p className={`${MONO} text-[11px] text-amber-400`}>
          Contenuto non ancora generato. Il video e le slide verranno creati dal pipeline automatico.
        </p>
      </div>
    </div>
  );
}

// ── Template slides preview (PED posts) ───────────────────────────

function TemplateSlidesPreview({ topic }: { topic: Topic }) {
  const dynamic = topic.slide_data ? buildSlidesForTopic(topic) : null;
  const previews = dynamic || TPL_PREVIEWS[topic.template];
  if (!previews) return null;
  return (
    <div>
      <p className={`${MONO} text-[11px] text-gray-500 mb-3`}>
        Anteprima template — {previews.length} slide
      </p>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {previews.map((p) => (
          <div key={p.label} className="shrink-0 flex flex-col items-center">
            <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>{p.label}</p>
            <div style={{ width: p.frameW * 1.5, height: p.frameH * 1.5, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
              <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale * 1.5} css={p.css} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Preview modal ──────────────────────────────────────────────────

function PreviewModal({
  topic,
  items,
  publishTime,
  onClose,
}: {
  topic: Topic;
  items: ContentItem[];
  publishTime?: string;
  onClose: () => void;
}) {
  const item = items[0] || null;
  const slides = item?.image_urls || [];
  const caption = item?.content_data?.caption || "";
  const hashtags = item?.content_data?.hashtags || [];
  const published = !!item?.published_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="bg-[#161920] border border-white/[0.1] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-white/[0.08] sticky top-0 bg-[#161920] z-10">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-semibold text-gray-100 leading-snug">{topic.title}</h2>
            <p className={`${MONO} text-[11px] text-gray-500 mt-1`}>
              {topic.plan_date}{publishTime ? ` ${publishTime}` : ""} · {topic.rubric}
              {topic.edition && topic.rubric === "news" ? ` · ${topic.edition}` : ""} ·{" "}
              {published ? (
                <span className="text-green-400">Pubblicato {item?.published_at ? new Date(item.published_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
              ) : (
                STATUS_LABELS[topic.status] || topic.status
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {slides.length > 0 ? (
            <>
              <p className={`${MONO} text-[11px] text-gray-500 mb-2`}>
                Anteprima reale — {slides.length} slide
              </p>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {slides.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Slide ${i + 1}`}
                    className="h-80 rounded-lg border border-white/[0.08] shrink-0"
                  />
                ))}
              </div>
            </>
          ) : topic.rubric === "video" ? (
            <VideoPreviewPlaceholder topic={topic} />
          ) : TPL_PREVIEWS[topic.template] || topic.slide_data ? (
            <TemplateSlidesPreview topic={topic} />
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-500 bg-white/[0.02] rounded-lg border border-white/[0.06]">
              Contenuto non ancora generato. Le slide appariranno qui dopo il cron di generazione (08:30).
            </div>
          )}

          {caption && (
            <div className="mt-4">
              <p className={`${MONO} text-[11px] text-gray-500 mb-1.5`}>Caption</p>
              <div className="px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300 whitespace-pre-wrap">
                {caption}
                {hashtags.length > 0 && (
                  <p className="mt-2 text-indigo-400">{hashtags.map((h) => `#${h}`).join(" ")}</p>
                )}
              </div>
            </div>
          )}

          {item?.ig_post_id && (
            <p className={`${MONO} mt-4 inline-flex items-center gap-2 text-[12px] text-gray-500`}>
              <ExternalLink className="w-3.5 h-3.5" />
              IG media ID: {item.ig_post_id}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── News ───────────────────────────────────────────────────────────

function NewsView({ news, loading }: { news: NewsItem[]; loading: boolean }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-100 mb-6">News AI raccolte</h1>
      {loading ? (
        <p className={`${MONO} text-sm text-gray-500`}>Caricamento…</p>
      ) : news.length === 0 ? (
        <p className={`${MONO} text-sm text-gray-500`}>
          Nessuna news ancora. Il cron discover (07:00 / 19:00) riempirà questa lista.
        </p>
      ) : (
        <div className="space-y-2">
          {news.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`${MONO} text-[10px] px-1.5 py-0.5 rounded ${n.source_type === "twitter" ? "bg-sky-500/20 text-sky-300" : "bg-orange-500/20 text-orange-300"}`}>
                  {n.source_type}
                </span>
                <span className={`${MONO} text-[11px] text-gray-500`}>{n.source}</span>
                <span className={`${MONO} text-[10px] text-gray-600 ml-auto`}>
                  {new Date(n.discovered_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-snug">{n.title}</p>
              {n.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.summary}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Performance ────────────────────────────────────────────────────

const RANGE_OPTIONS = [7, 30, 90] as const;

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function PerformanceView({
  perf,
  loading,
  days,
  setDays,
}: {
  perf: PerformanceData | null;
  loading: boolean;
  days: number;
  setDays: (d: number) => void;
}) {
  const posts = useMemo(() => perf?.posts || [], [perf]);

  const totals = useMemo(() => {
    const t = { reach: 0, impressions: 0, likes: 0, saves: 0, shares: 0, comments: 0, interactions: 0 };
    for (const p of posts) {
      t.reach += p.reach;
      t.impressions += p.impressions;
      t.likes += p.likes;
      t.saves += p.saves;
      t.shares += p.shares;
      t.comments += p.comments;
      t.interactions += p.total_interactions;
    }
    return t;
  }, [posts]);

  const avgEngagement = useMemo(() => {
    if (posts.length === 0) return 0;
    return posts.reduce((s, p) => s + Number(p.engagement_rate), 0) / posts.length;
  }, [posts]);

  // Reach per day (chronological) for the trend bars
  const trend = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const p of posts) byDay[p.publish_date] = (byDay[p.publish_date] || 0) + p.reach;
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
  }, [posts]);
  const trendMax = Math.max(1, ...trend.map(([, v]) => v));

  // Per-rubric aggregation
  const byRubric = useMemo(() => {
    const map: Record<string, { posts: number; reach: number; engagement: number }> = {};
    for (const p of posts) {
      const r = p.rubric || "altro";
      map[r] ??= { posts: 0, reach: 0, engagement: 0 };
      map[r].posts += 1;
      map[r].reach += p.reach;
      map[r].engagement += Number(p.engagement_rate);
    }
    return Object.entries(map)
      .map(([rubric, v]) => ({ rubric, posts: v.posts, reach: v.reach, avgEng: v.engagement / v.posts }))
      .sort((a, b) => b.avgEng - a.avgEng);
  }, [posts]);

  const topPosts = useMemo(
    () => [...posts].sort((a, b) => Number(b.engagement_rate) - Number(a.engagement_rate)).slice(0, 10),
    [posts]
  );

  const latestInsight = perf?.insights?.[0] || null;

  if (loading) return <p className={`${MONO} text-sm text-gray-500`}>Caricamento…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Performance Instagram</h1>
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
          {RANGE_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`${MONO} px-3 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                days === d ? "bg-indigo-500/30 text-indigo-300" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {d}g
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className={`${MONO} text-sm text-gray-500`}>
          Nessuna metrica ancora. I dati appariranno qui dopo il fetch delle insights IG sui post pubblicati.
        </p>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Post analizzati", value: String(posts.length) },
              { label: "Reach totale", value: fmtNum(totals.reach) },
              { label: "Engagement medio", value: fmtPct(avgEngagement) },
              { label: "Interazioni", value: fmtNum(totals.interactions) },
              { label: "Like", value: fmtNum(totals.likes) },
              { label: "Salvataggi", value: fmtNum(totals.saves) },
              { label: "Condivisioni", value: fmtNum(totals.shares) },
              { label: "Commenti", value: fmtNum(totals.comments) },
            ].map((kpi) => (
              <div key={kpi.label} className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider`}>{kpi.label}</p>
                <p className="text-2xl font-semibold text-gray-100 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Reach trend */}
          <div className="mb-6 px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-3`}>Reach per giorno</p>
            <div className="flex items-end gap-1 h-28">
              {trend.map(([day, v]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
                  <div
                    className="w-full rounded-t bg-indigo-500/50 group-hover:bg-indigo-400 transition-colors"
                    style={{ height: `${Math.max(2, (v / trendMax) * 100)}%` }}
                  />
                  <span className={`${MONO} absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 whitespace-nowrap bg-[#161920] px-1 rounded`}>
                    {day.slice(5)} · {fmtNum(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Per rubrica */}
            <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-3`}>Per rubrica (engagement medio)</p>
              <div className="space-y-2">
                {byRubric.map((r) => {
                  const color = RUBRIC_COLORS[r.rubric] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
                  return (
                    <div key={r.rubric} className="flex items-center gap-3">
                      <span className={`${MONO} px-1.5 py-0.5 rounded border text-[10px] w-20 text-center shrink-0 ${color}`}>
                        {r.rubric}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500/60"
                          style={{ width: `${Math.min(100, (r.avgEng / Math.max(0.0001, byRubric[0].avgEng)) * 100)}%` }}
                        />
                      </div>
                      <span className={`${MONO} text-[11px] text-gray-400 w-24 text-right shrink-0`}>
                        {fmtPct(r.avgEng)} · {r.posts}p
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI insights */}
            <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-3`}>
                Insights AI {latestInsight ? `(settimana ${latestInsight.week_start})` : ""}
              </p>
              {latestInsight ? (
                <div className="space-y-3 text-sm text-gray-300">
                  {latestInsight.insights.summary && <p className="leading-snug">{latestInsight.insights.summary}</p>}
                  {latestInsight.insights.best_hook_pattern && (
                    <p className="text-xs">
                      <span className="text-green-400">Hook migliore:</span> {latestInsight.insights.best_hook_pattern}
                    </p>
                  )}
                  {latestInsight.insights.worst_pattern && (
                    <p className="text-xs">
                      <span className="text-red-400">Pattern peggiore:</span> {latestInsight.insights.worst_pattern}
                    </p>
                  )}
                  {Array.isArray(latestInsight.insights.planner_adjustments) &&
                    latestInsight.insights.planner_adjustments.length > 0 && (
                      <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                        {latestInsight.insights.planner_adjustments.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    )}
                </div>
              ) : (
                <p className={`${MONO} text-sm text-gray-600`}>
                  Nessuna analisi settimanale ancora. Generata dal cron insights ogni settimana.
                </p>
              )}
            </div>
          </div>

          {/* Top posts */}
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-2`}>Top post per engagement</p>
          <div className="space-y-2">
            {topPosts.map((p) => {
              const color = RUBRIC_COLORS[p.rubric || ""] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" className="w-12 h-15 rounded object-cover border border-white/[0.08] shrink-0" />
                  ) : (
                    <div className="w-12 h-15 rounded bg-white/[0.04] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">{p.hook_text || p.caption || p.ig_post_id || `Post #${p.id}`}</p>
                    <p className={`${MONO} text-[10px] text-gray-500 mt-0.5 flex items-center gap-2`}>
                      <span>{p.publish_date}</span>
                      {p.rubric && <span className={`px-1.5 py-px rounded border ${color}`}>{p.rubric}</span>}
                      {p.content_type && <span>{p.content_type}</span>}
                    </p>
                  </div>
                  <div className={`${MONO} text-[11px] text-gray-400 flex items-center gap-4 shrink-0`}>
                    <span title="Reach">👁 {fmtNum(p.reach)}</span>
                    <span title="Like">❤️ {fmtNum(p.likes)}</span>
                    <span title="Salvataggi">🔖 {fmtNum(p.saves)}</span>
                    <span title="Condivisioni">↗ {fmtNum(p.shares)}</span>
                    <span title="Commenti">💬 {fmtNum(p.comments)}</span>
                    <span className="text-indigo-300 font-medium" title="Engagement rate">
                      {fmtPct(Number(p.engagement_rate))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Costs ──────────────────────────────────────────────────────────

function CostsView({ costs, loading }: { costs: CostsData | null; loading: boolean }) {
  if (loading) return <p className={`${MONO} text-sm text-gray-500`}>Caricamento…</p>;
  if (!costs) return null;
  const dayEntries = Object.entries(costs.byDay).sort((a, b) => b[0].localeCompare(a[0]));
  const opEntries = Object.entries(costs.byOperation).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-100 mb-6">Costi API (30 giorni)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider`}>Totale (30gg)</p>
          <p className="text-2xl font-semibold text-gray-100 mt-1">${costs.totalUsd.toFixed(2)}</p>
        </div>
        <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider`}>Media giornaliera</p>
          <p className="text-2xl font-semibold text-gray-100 mt-1">${dayEntries.length ? (costs.totalUsd / dayEntries.length).toFixed(3) : "0.000"}</p>
        </div>
        <div className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider`}>Proiezione mese</p>
          <p className="text-2xl font-semibold text-gray-100 mt-1">${dayEntries.length ? ((costs.totalUsd / dayEntries.length) * 30).toFixed(2) : "0.00"}</p>
        </div>
      </div>
      <div className="px-5 py-4 rounded-xl bg-violet-500/[0.06] border border-violet-500/[0.15] mb-6">
        <p className={`${MONO} text-[11px] text-violet-400 uppercase tracking-wider mb-3`}>Costi previsti — Piano video (15-28 giu)</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p className={`${MONO} text-[10px] text-gray-500`}>6x Slider</p>
            <p className={`${MONO} text-sm text-gray-200`}>~$0.48</p>
          </div>
          <div>
            <p className={`${MONO} text-[10px] text-gray-500`}>2x Stop Motion</p>
            <p className={`${MONO} text-sm text-gray-200`}>~$0.50</p>
          </div>
          <div>
            <p className={`${MONO} text-[10px] text-gray-500`}>2x Particelle</p>
            <p className={`${MONO} text-sm text-gray-200`}>~$0.50</p>
          </div>
          <div>
            <p className={`${MONO} text-[10px] text-gray-500`}>2x Day/night</p>
            <p className={`${MONO} text-sm text-gray-200`}>~$0.40</p>
          </div>
          <div>
            <p className={`${MONO} text-[10px] text-gray-500`}>2x Timelapse</p>
            <p className={`${MONO} text-sm text-gray-200`}>~$1.70</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-violet-500/[0.15] flex items-center justify-between">
          <p className={`${MONO} text-[10px] text-gray-500`}>Totale 2 settimane (14 video)</p>
          <p className={`${MONO} text-sm font-semibold text-violet-300`}>~$3.58</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className={`${MONO} text-[10px] text-gray-500`}>Proiezione mensile (30 video)</p>
          <p className={`${MONO} text-sm font-semibold text-violet-300`}>~$7.70</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-2`}>Per giorno</p>
          <div className="space-y-1">
            {dayEntries.map(([day, v]) => (
              <div key={day} className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className={`${MONO} text-xs text-gray-400`}>{day}</span>
                <span className={`${MONO} text-xs text-gray-300`}>
                  <span className="text-violet-400">A ${v.anthropic.toFixed(3)}</span>
                  {" · "}
                  <span className="text-pink-400">R ${v.replicate.toFixed(3)}</span>
                  {" · "}${v.total.toFixed(3)}
                </span>
              </div>
            ))}
            {dayEntries.length === 0 && <p className={`${MONO} text-sm text-gray-600`}>Nessun costo registrato.</p>}
          </div>
        </div>
        <div>
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider mb-2`}>Per operazione</p>
          <div className="space-y-1">
            {opEntries.map(([op, v]) => (
              <div key={op} className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className={`${MONO} text-xs text-gray-400`}>{op}</span>
                <span className={`${MONO} text-xs text-gray-300`}>${v.toFixed(3)}</span>
              </div>
            ))}
            {opEntries.length === 0 && <p className={`${MONO} text-sm text-gray-600`}>Nessun costo registrato.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Templates ─────────────────────────────────────────────────────

const TEMPLATE_CSS = `
@keyframes clip-reveal{0%,8%{clip-path:inset(0 0 0 5%)}45%,55%{clip-path:inset(0 0 0 95%)}92%,100%{clip-path:inset(0 0 0 5%)}}
@keyframes divider-slide{0%,8%{left:5%}45%,55%{left:95%}92%,100%{left:5%}}
@keyframes bounce-down{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
*{margin:0;padding:0;box-sizing:border-box}
.slide{position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.slide-1{background:#0f0f0f;width:100%;height:100%;position:relative}
.split-container{position:absolute;inset:0;overflow:hidden}
.split-half{position:absolute;inset:0;overflow:hidden}
.split-before img{filter:grayscale(60%) brightness(0.7);width:100%;height:100%;object-fit:cover}
.split-before::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1) 0%,rgba(0,0,0,.5) 100%)}
.split-after{clip-path:inset(0 0 0 50%);animation:clip-reveal 15s ease-in-out infinite}
.split-after img{width:100%;height:100%;object-fit:cover}
.split-after::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.3) 100%)}
.divider{position:absolute;left:5%;top:0;bottom:0;width:6px;background:#fff;transform:translateX(-50%);z-index:10;box-shadow:0 0 20px rgba(255,255,255,.3);animation:divider-slide 15s ease-in-out infinite}
.divider-icon{position:absolute;left:5%;top:50%;transform:translate(-50%,-50%);width:72px;height:72px;background:#fff;border-radius:50%;z-index:11;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,.4);animation:divider-slide 15s ease-in-out infinite}
.divider-icon svg{width:36px;height:36px}
.top-badge{position:absolute;top:60px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.6);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);padding:10px 32px;border-radius:40px;font-size:24px;font-weight:600;color:#fff;letter-spacing:2px;text-transform:uppercase}
.label-before,.label-after{position:absolute;top:60px;z-index:12;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase}
.label-before{left:60px;color:rgba(255,255,255,.85)}
.label-after{right:60px;color:#fff;text-shadow:0 2px 12px rgba(124,58,237,.4)}
.bottom-bar-center{position:absolute;bottom:0;left:0;right:0;padding:36px 60px;background:linear-gradient(0deg,rgba(0,0,0,.8) 0%,transparent 100%);z-index:12;display:flex;justify-content:center}
.bottom-bar-center .badge{background:#f59e0b;color:#1a1a2e;font-size:28px;font-weight:900;padding:14px 40px;border-radius:14px;border:3px solid #1a1a2e;letter-spacing:1.5px;box-shadow:5px 5px 0 rgba(0,0,0,.4)}
.slide-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px;position:relative;width:100%;height:100%;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.slide-cta .deco-circle{position:absolute;top:-80px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;border:4px solid #fcd34d;opacity:.5}
.slide-cta .deco-square{position:absolute;bottom:120px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:4px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.slide-cta .deco-pink{position:absolute;bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:4px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.slide-cta .cta-badge{background:#fffbeb;border:3px solid #f59e0b;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;color:#b45309;margin-bottom:48px;box-shadow:4px 4px 0 rgba(245,158,11,.25);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.slide-cta h2{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.05;margin-bottom:28px;position:relative;z-index:1;letter-spacing:-2px}
.slide-cta .highlight{color:#f59e0b}
.slide-cta .cta-sub{font-size:30px;color:#555;line-height:1.55;margin-bottom:52px;max-width:820px;position:relative;z-index:1}
.slide-cta .feature-pills{display:flex;gap:16px;margin-bottom:52px;position:relative;z-index:1;flex-wrap:wrap;justify-content:center}
.slide-cta .pill{background:#fff;border:3px solid #1a1a2e;border-radius:14px;padding:14px 28px;font-size:22px;font-weight:700;color:#1a1a2e;box-shadow:4px 4px 0 #1a1a2e;display:flex;align-items:center;gap:10px}
.slide-cta .pill svg{width:22px;height:22px}
.slide-cta .cta-btn{background:#f59e0b;color:#1a1a2e;font-size:36px;font-weight:900;padding:28px 72px;border-radius:18px;border:4px solid #1a1a2e;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:8px 8px 0 #1a1a2e}
.slide-cta .cta-btn svg{width:32px;height:32px;stroke-width:3}
.slide-cta .cta-footer{position:absolute;bottom:48px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.story-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;text-align:center;padding:280px 72px 300px;position:relative;width:100%;height:100%;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif}
.story-cta .deco-circle{position:absolute;top:200px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;border:4px solid #fcd34d;opacity:.5}
.story-cta .deco-square{position:absolute;bottom:500px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:4px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.story-cta .deco-pink{position:absolute;bottom:300px;right:60px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:4px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.story-cta .cta-badge{background:#fffbeb;border:3px solid #f59e0b;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;color:#b45309;margin-bottom:40px;box-shadow:4px 4px 0 rgba(245,158,11,.25);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.story-cta .photo-card{position:relative;width:880px;height:560px;border-radius:24px;border:4px solid #1a1a2e;overflow:hidden;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:40px;z-index:1;display:flex}
.story-cta .pc-half{flex:1;position:relative;overflow:hidden}
.story-cta .pc-half img{width:100%;height:100%;object-fit:cover}
.story-cta .pc-before img{filter:grayscale(60%) brightness(.7)}
.story-cta .pc-after{position:absolute;top:0;right:0;bottom:0;width:35%}
.story-cta .pc-divider{position:absolute;left:65%;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-50%);z-index:2}
.story-cta .pc-slider-icon{position:absolute;left:65%;top:50%;transform:translate(-50%,-50%);width:48px;height:48px;background:#fff;border-radius:50%;z-index:3;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,.4)}
.story-cta .pc-slider-icon svg{width:24px;height:24px}
.story-cta .pc-label{position:absolute;bottom:16px;font-size:22px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:2px;z-index:3;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.story-cta .pc-label-before{left:24px}
.story-cta .pc-label-after{right:24px}
.story-cta h2{font-size:88px;font-weight:900;color:#1a1a2e;line-height:1.08;margin-bottom:32px;position:relative;z-index:1;letter-spacing:-2px}
.story-cta .highlight{color:#f59e0b}
.story-cta .cta-sub{font-size:36px;color:#555;line-height:1.5;margin-bottom:52px;max-width:860px;position:relative;z-index:1}
.story-cta .cta-btn{background:#f59e0b;color:#1a1a2e;font-size:38px;font-weight:900;padding:28px 72px;border-radius:18px;border:4px solid #1a1a2e;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:8px 8px 0 #1a1a2e}
.story-cta .cta-btn svg{width:32px;height:32px}
.story-cta .cta-footer{margin-top:24px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1;position:relative}
`;

const ARROWS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/></svg>';

/* ── Video Stories CSS (shared across all 5 story types) ── */
const ROOM_EMPTY_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 960'%3E%3Cdefs%3E%3ClinearGradient id='w' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8e4df'/%3E%3Cstop offset='1' stop-color='%23d5d0c9'/%3E%3C/linearGradient%3E%3ClinearGradient id='f' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c4a882'/%3E%3Cstop offset='1' stop-color='%23a8906e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='540' height='960' fill='url(%23w)'/%3E%3Crect y='620' width='540' height='340' fill='url(%23f)'/%3E%3Cline x1='0' y1='620' x2='540' y2='620' stroke='%23b8a080' stroke-width='2'/%3E%3Crect x='160' y='180' width='220' height='280' rx='4' fill='%23b8d4e8' stroke='%23999' stroke-width='3'/%3E%3Cline x1='270' y1='180' x2='270' y2='460' stroke='%23999' stroke-width='2'/%3E%3Cline x1='160' y1='320' x2='380' y2='320' stroke='%23999' stroke-width='2'/%3E%3Crect x='170' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='275' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='170' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='275' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='40' y='500' width='120' height='180' rx='3' fill='%23d5cfc6' stroke='%23b0a898' stroke-width='2'/%3E%3Crect x='48' y='508' width='104' height='164' rx='2' fill='%23c8c0b4'/%3E%3C/svg%3E")`;
const ROOM_FULL_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 960'%3E%3Cdefs%3E%3ClinearGradient id='w2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8e4df'/%3E%3Cstop offset='1' stop-color='%23d5d0c9'/%3E%3C/linearGradient%3E%3ClinearGradient id='f2' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23c4a882'/%3E%3Cstop offset='1' stop-color='%23a8906e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='540' height='960' fill='url(%23w2)'/%3E%3Crect y='620' width='540' height='340' fill='url(%23f2)'/%3E%3Cline x1='0' y1='620' x2='540' y2='620' stroke='%23b8a080' stroke-width='2'/%3E%3Crect x='160' y='180' width='220' height='280' rx='4' fill='%23b8d4e8' stroke='%23999' stroke-width='3'/%3E%3Cline x1='270' y1='180' x2='270' y2='460' stroke='%23999' stroke-width='2'/%3E%3Cline x1='160' y1='320' x2='380' y2='320' stroke='%23999' stroke-width='2'/%3E%3Crect x='170' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='275' y='190' width='95' height='125' fill='%23cce5f5' opacity='.6'/%3E%3Crect x='170' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='275' y='325' width='95' height='125' fill='%23b8d8ec' opacity='.5'/%3E%3Crect x='80' y='520' width='380' height='160' rx='12' fill='%236b7f5e'/%3E%3Crect x='90' y='510' width='140' height='100' rx='8' fill='%237a9068'/%3E%3Crect x='250' y='510' width='140' height='100' rx='8' fill='%237a9068'/%3E%3Crect x='80' y='680' width='380' height='20' rx='4' fill='%23594a3a'/%3E%3Crect x='200' y='700' width='140' height='80' rx='4' fill='%23695842' stroke='%23594a3a' stroke-width='2'/%3E%3Crect x='40' y='500' width='120' height='180' rx='3' fill='%23d5cfc6' stroke='%23b0a898' stroke-width='2'/%3E%3Crect x='48' y='508' width='104' height='164' rx='2' fill='%23dab06a'/%3E%3Cellipse cx='430' cy='480' rx='40' ry='140' fill='%234a7a3a' opacity='.8'/%3E%3Crect x='425' y='480' width='10' height='200' fill='%23594a3a'/%3E%3Crect x='400' y='680' width='60' height='20' rx='10' fill='%236b5d4d'/%3E%3Cellipse cx='270' cy='720' rx='120' ry='60' fill='%23a0785a' opacity='.3'/%3E%3Ccircle cx='460' cy='200' r='60' fill='%23f5e6b8' opacity='.15'/%3E%3Crect x='440' y='280' width='6' height='200' fill='%23b0a898'/%3E%3Ccircle cx='443' cy='280' r='30' fill='%23f5e6b8' opacity='.5'/%3E%3C/svg%3E")`;

const LOGO_SVG_PATH = 'M224.816 4.98C217.966-1.72 207.036-1.65 200.274 5.13L51.253 154.306c-14.922 14.922-27.88 29.952-37.086 49.303-9.206 19.35-13.635 38.526-14.071 58.923-.567 26.135.975 49.699 17.468 70.838 13.962 17.889 31.458 32.876 46.576 49.739 16.601 18.521 34.14 36.475 51.178 54.691 4.56 4.887 58.465 62.021 83.051 88.418 6.698 7.177 17.976 7.439 25.001.567L379.138 374.925c55.018-53.971 58.334-133.379 15.969-196.448-16.885-25.153-40.882-45.812-63.483-66.471-6.85-6.261-17.409-6.043-24.019.48L167.856 250.403c-6.61 6.522-6.959 17.059-.785 23.997l33.508 37.784c6.61 7.461 18.129 7.875 25.262.894L320.193 220.69s41.885 40.773.349 93.152L225.427 408.782c-6.785 6.763-17.736 6.807-24.564.109L111.463 321.084s-61.759-46.619.658-109.491c49.521-49.106 119.483-118.479 147.778-146.512 6.915-6.85 6.871-18.063-.088-24.87L224.816 4.98z';
const ARROW_ARC_SVG = '<svg viewBox="0 0 94 29" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M88.1266 9.57854C87.3044 12.6015 86.5639 15.5492 85.6513 18.882C87.7071 18.7237 88.9347 17.5167 89.4596 16.1269C91.0341 11.9575 92.5327 7.70694 93.6407 3.36357C94.285 0.882061 92.5236 -0.514612 90.0537 0.176354C85.913 1.27486 81.8422 2.61087 77.6956 3.86575C77.4565 3.93514 77.1386 4.00161 77.0541 4.15505C76.64 4.68771 76.3805 5.30441 76.0423 5.91819C76.5847 6.17328 77.1154 6.74114 77.5907 6.68055C79.2529 6.50758 80.8421 6.1753 82.4285 5.9212C83.3004 5.79708 84.0964 5.59185 85.3416 6.02972C84.4406 6.93572 83.5367 7.91991 82.6356 8.82591C63.2037 26.7368 34.95 29.5992 12.1136 16.1426C9.1829 14.3892 6.50002 12.3318 3.65385 10.425C2.65361 9.76135 1.65045 9.17589 0.65021 8.51225C0.408182 8.65983 0.241976 8.88853 -5.13402e-05 9.03611C0.209937 9.74861 0.25372 10.6898 0.787383 11.1795C2.45837 12.886 4.12935 14.5924 6.04528 16.0732C25.0471 30.8745 52.1899 32.4337 73.7129 19.7683C77.8245 17.3377 81.4899 14.1857 85.301 11.3524C86.1117 10.7562 86.7678 10.076 87.5026 9.3987C87.663 9.32638 87.8963 9.41336 88.1266 9.57854Z" fill="#3B83F6"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><polygon points="8,5 20,12 8,19"/></svg>';
const CHEVRONS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#3B83F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/></svg>';
const LOGO_FOOTER = `<svg viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path fill="#3B83F6" d="${LOGO_SVG_PATH}"/></svg>getnearme.it`;

const VIDEO_STORIES_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.vs{width:1080px;height:1920px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.vs-bottom{position:absolute;bottom:120px;left:32px;right:32px;padding:48px 56px 52px;background:#fff;border:1px solid #b0b0b0;border-radius:24px;z-index:20;text-align:center}
.vs-title{font-size:84px;font-weight:900;color:#1a1a2e;line-height:1.08;margin-bottom:24px;letter-spacing:-2px}
.vs-desc{font-size:34px;color:#555;line-height:1.5;margin-bottom:44px}
.vs-btn{display:inline-flex;align-items:center;gap:16px;background:#3B83F6;color:#fff;font-size:36px;font-weight:900;padding:26px 64px;border-radius:18px;border:4px solid #1a1a2e;box-shadow:8px 8px 0 #1a1a2e}
.vs-footer{margin-top:36px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase}
.vs-footer svg{width:36px;height:36px}
.hl-amber{color:#f59e0b}.hl-blue{color:#3B83F6}.hl-violet{color:#8b5cf6}.hl-emerald{color:#10b981}.hl-cyan{color:#06b6d4}.hl-red{color:#ef4444}

/* AI Staging */
.vs-staging{background:#fff}
.ba-photo{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:700px;aspect-ratio:9/16;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12)}
.ba-layer{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center}
.ba-after{clip-path:inset(0 0 0 65%)}
.ba-slider-line{position:absolute;left:65%;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-50%);z-index:5;box-shadow:0 0 12px rgba(0,0,0,0.2)}
.ba-slider-handle{position:absolute;left:65%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;background:#fff;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 16px rgba(0,0,0,0.2)}
.ba-slider-handle svg{width:28px;height:28px}
.ba-label{position:absolute;top:24px;font-size:24px;font-weight:800;color:#1a1a2e;text-transform:uppercase;letter-spacing:3px;z-index:7;background:#fff;padding:10px 24px;border-radius:12px}
.ba-label-l{left:32px}.ba-label-r{right:32px}

/* Cards (Stop Motion) */
.vs-cards{background:#fff}
.card-photo{position:absolute;width:440px;aspect-ratio:9/16;border-radius:28px;background-size:cover;background-position:center;box-shadow:0 12px 40px rgba(0,0,0,0.15);border:6px solid #fff}
.card-before{top:140px;left:80px;transform:rotate(-4deg);z-index:2}
.card-after{top:380px;right:80px;left:auto;transform:rotate(3deg);z-index:3}
.card-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.card-play svg{width:36px;height:36px;margin-left:4px}
.card-label{position:absolute;bottom:28px;left:32px;font-size:28px;font-weight:900;color:#1a1a2e;text-transform:uppercase;letter-spacing:4px;background:#fff;padding:10px 24px;border-radius:12px;z-index:4}
.card-arrow{position:absolute;top:975px;left:435px;transform:translateX(-50%) scale(0.7) rotate(20deg);z-index:5}
.card-arrow svg{width:200px;height:62px}

/* Dust (diagonal split) */
.vs-dust{background:#fff}
.dust-photos{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:700px;aspect-ratio:9/16;border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.12);border:6px solid #fff}
.dust-ph{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center}
.dust-before{clip-path:polygon(0 0,100% 0,0 100%);z-index:2}
.dust-after{clip-path:polygon(100% 0,100% 100%,0 100%);z-index:2}
.dust-diag{position:absolute;top:0;left:0;right:0;bottom:0;z-index:3;overflow:hidden;pointer-events:none}
.dust-diag::after{content:'';position:absolute;top:-2px;left:-2px;right:-2px;bottom:-2px;background:linear-gradient(to bottom right,transparent calc(50% - 2px),#fff calc(50% - 2px),#fff calc(50% + 2px),transparent calc(50% + 2px))}
.dust-label{position:absolute;font-size:28px;font-weight:900;color:#1a1a2e;text-transform:uppercase;letter-spacing:4px;background:#fff;padding:10px 24px;border-radius:12px;z-index:5}
.dust-label-before{top:32px;left:32px}.dust-label-after{bottom:100px;right:32px}
.dust-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.dust-play svg{width:36px;height:36px;margin-left:4px}

/* Split (Day/Night + Timelapse shared) */
.vs-split{display:flex}
.sp-left,.sp-right{flex:1;position:relative;background:#fff}
.sp-mid-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:#b0b0b0;z-index:3}
.sp-ph{position:absolute;top:280px;left:40px;right:40px;height:800px;border-radius:20px;background-size:cover;background-position:center;box-shadow:0 8px 32px rgba(0,0,0,0.12)}
.sp-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;background:rgba(255,255,255,0.25);backdrop-filter:blur(16px);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:6;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
.sp-play svg{width:36px;height:36px;margin-left:4px}
.sp-arrow{position:absolute;left:50%;top:1120px;transform:translateX(-50%) translateY(-30px) scale(0.6) rotate(7deg);z-index:15}
.sp-arrow svg{width:280px;height:86px}

/* Day/Night overrides */
.vs-dn .sp-ph{top:0;left:0;right:0;bottom:0;height:auto;border-radius:0;box-shadow:none}
.vs-dn .sp-mid-line{background:#fff;width:4px}
.vs-dn .sp-divider{position:absolute;left:50%;top:0;bottom:0;width:4px;background:#fff;z-index:10;transform:translateX(-50%)}
.vs-dn .sp-swap{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:12;width:72px;height:72px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,0,0,0.3)}
.vs-dn .sp-swap svg{width:36px;height:36px}
`;

/* ── PED Formats CSS (feed 1080×1350) ── */
const PED_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.ped{width:1080px;height:1350px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;padding:180px 72px;display:flex;flex-direction:column;justify-content:center}
.ped-badge{position:absolute;top:80px;left:72px;display:inline-flex;align-items:center;gap:10px;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;box-shadow:4px 4px 0 rgba(0,0,0,0.15);text-transform:uppercase;letter-spacing:2px;z-index:1}
.badge-amber{background:#fffbeb;border:3px solid #f59e0b;color:#b45309}
.badge-blue{background:#eff6ff;border:3px solid #3B83F6;color:#1d4ed8}
.ped-title{font-size:76px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px}
.hl-amber{color:#f59e0b}.hl-blue{color:#3B83F6}.hl-violet{color:#8b5cf6}.hl-emerald{color:#10b981}.hl-cyan{color:#06b6d4}.hl-red{color:#ef4444}
.ped-footer{position:absolute;bottom:80px;left:72px;right:72px;display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.ped-footer svg{width:36px;height:36px}
.ped-footer .swipe{margin-left:auto;display:flex;align-items:center;gap:8px;color:#1a1a2e;font-size:20px;letter-spacing:1px}
.ped-footer .swipe svg{width:28px;height:28px}
.deco{position:absolute;z-index:0}
.deco-c1{top:-80px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;border:4px solid #fcd34d;opacity:.5}
.deco-s1{bottom:200px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:4px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.deco-p1{bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:4px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
/* carosello dati cover */
.cd-stat{margin:0 0 20px;position:relative;z-index:1}
.cd-num{font-size:200px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-6px}
.cd-num .unit{font-size:100px;letter-spacing:-2px}
.cd-delta{display:inline-flex;align-items:center;gap:10px;background:#ecfdf5;border:3px solid #10b981;color:#047857;font-size:36px;font-weight:900;padding:12px 32px;border-radius:16px;margin-top:24px;box-shadow:4px 4px 0 rgba(16,185,129,0.25)}
.cd-delta svg{width:32px;height:32px}
.cd-statlabel{font-size:30px;color:#888;font-weight:700;margin-top:16px;letter-spacing:.5px}
.cd-title{margin-top:70px;position:relative;z-index:1}
/* carosello dati content slide */
.cdc-kicker{font-size:24px;font-weight:800;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:28px}
.cdc-text{font-size:44px;color:#1a1a2e;line-height:1.45;font-weight:500;position:relative;z-index:1}
.cdc-text strong{font-weight:900}
.cdc-card{margin-top:56px;background:#fff;border:4px solid #1a1a2e;border-radius:24px;padding:40px 48px;box-shadow:8px 8px 0 #1a1a2e;position:relative;z-index:1}
.cdc-card .label{font-size:24px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.cdc-card .value{font-size:64px;font-weight:900;color:#1a1a2e;letter-spacing:-1px}
.cdc-card .value span{color:#f59e0b}
/* slide valore — azioni concrete */
.pva-title{font-size:56px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin:0 0 48px;position:relative;z-index:1}
.pva-list{display:flex;flex-direction:column;gap:24px;position:relative;z-index:1}
.pva-item{display:flex;align-items:flex-start;gap:24px;background:#fff;border:4px solid #1a1a2e;border-radius:20px;padding:32px 36px;box-shadow:6px 6px 0 #1a1a2e}
.pva-item .n{width:64px;height:64px;flex-shrink:0;background:#f59e0b;color:#1a1a2e;border:3px solid #1a1a2e;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900}
.pva-item .tx{font-size:33px;font-weight:700;color:#1a1a2e;line-height:1.35}
.pva-item .tx small{display:block;font-size:26px;font-weight:500;color:#777;margin-top:6px}
/* carosello educativo */
.ce-num{font-size:260px;font-weight:900;color:#3B83F6;line-height:.9;letter-spacing:-8px;position:relative;z-index:1;text-shadow:10px 10px 0 rgba(59,131,246,0.15);margin-bottom:16px}
.ce-title{margin-top:0;position:relative;z-index:1}
.ce-save{margin-top:48px;align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:#fff;border:3px solid #1a1a2e;border-radius:14px;padding:16px 32px;font-size:26px;font-weight:800;color:#1a1a2e;box-shadow:5px 5px 0 #1a1a2e;position:relative;z-index:1}
.ce-save svg{width:28px;height:28px}
.cec-num{width:130px;height:130px;background:#3B83F6;color:#fff;border:4px solid #1a1a2e;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:72px;font-weight:900;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:48px;position:relative;z-index:1}
.cec-title{font-size:64px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:32px;position:relative;z-index:1}
.cec-text{font-size:38px;color:#555;line-height:1.5;position:relative;z-index:1}
.cec-tip{margin-top:48px;background:#eff6ff;border:3px solid #3B83F6;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:700;color:#1d4ed8;line-height:1.4;position:relative;z-index:1}
/* carosello feature */
.cf-visual{width:100%;height:500px;background:#fff;border:4px solid #1a1a2e;border-radius:28px;box-shadow:10px 10px 0 #1a1a2e;position:relative;z-index:1;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:56px}
.cf-visual .mock{width:85%;height:78%;background:#f5f5f3;border:3px solid #e5e5e5;border-radius:18px;position:relative;overflow:hidden}
.cf-visual .mock .bar{height:56px;background:#1a1a2e;display:flex;align-items:center;gap:8px;padding:0 20px}
.cf-visual .mock .bar i{width:16px;height:16px;border-radius:50%;display:block}
.cf-visual .mock .body{padding:24px;display:flex;gap:20px}
.cf-visual .mock .panel{flex:1;background:#fff;border:2px solid #e5e5e5;border-radius:12px;height:220px}
.cf-visual .mock .panel.acc{background:#eff6ff;border-color:#93c5fd}
.cf-no{display:flex;align-items:flex-start;gap:20px;background:#fef2f2;border:3px solid #ef4444;border-radius:18px;padding:28px 36px;margin-bottom:24px;position:relative;z-index:1}
.cf-yes{display:flex;align-items:flex-start;gap:20px;background:#ecfdf5;border:3px solid #10b981;border-radius:18px;padding:28px 36px;position:relative;z-index:1}
.cf-no .ic,.cf-yes .ic{width:48px;height:48px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900}
.cf-no .ic{background:#ef4444;color:#fff}
.cf-yes .ic{background:#10b981;color:#fff}
.cf-no .tx,.cf-yes .tx{font-size:34px;font-weight:700;line-height:1.4;color:#1a1a2e}
.cf-no .tx small,.cf-yes .tx small{display:block;font-size:27px;font-weight:500;color:#777;margin-top:6px}
/* slide CTA finale */
.pcta{display:flex;flex-direction:column;align-items:center;text-align:center}
.pcta-kicker{font-size:26px;font-weight:800;color:#888;letter-spacing:3px;text-transform:uppercase;margin:0 0 36px;position:relative;z-index:1}
.pcta-title{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;max-width:880px;position:relative;z-index:1}
.pcta-pill{margin-top:56px;display:inline-flex;align-items:center;gap:14px;background:#3B83F6;color:#fff;font-size:42px;font-weight:900;padding:30px 72px;border-radius:18px;border:4px solid #1a1a2e;box-shadow:8px 8px 0 #1a1a2e;position:relative;z-index:1}
.pcta-sub{margin-top:36px;font-size:32px;color:#777;line-height:1.5;max-width:760px;position:relative;z-index:1}
/* post singolo */
.ps{padding:160px 72px 200px}
.ps-kicker{font-size:24px;font-weight:800;color:#b45309;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;position:relative;z-index:1}
.ps-hook{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.ps-divider{width:80px;height:6px;background:#f59e0b;border-radius:3px;margin:48px 0;position:relative;z-index:1}
.ps-body{font-size:38px;color:#555;line-height:1.55;position:relative;z-index:1}
.ps-body strong{color:#1a1a2e;font-weight:800}
.ps-cta{margin-top:56px;display:flex;flex-direction:column;align-items:flex-start;gap:20px;position:relative;z-index:1}
.ps-cta .pill{background:#3B83F6;color:#fff;font-size:32px;font-weight:900;padding:20px 48px;border-radius:14px;border:3px solid #1a1a2e;box-shadow:6px 6px 0 #1a1a2e}
.ps-cta .hint{font-size:26px;color:#888;font-weight:600}
/* tip */
.tip{padding:100px 72px 180px}
.tip-num{width:96px;height:96px;background:#3B83F6;color:#fff;border:4px solid #1a1a2e;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;box-shadow:6px 6px 0 #1a1a2e;position:relative;z-index:1;margin-bottom:40px}
.tip-scenario{font-size:26px;font-weight:800;color:#3B83F6;letter-spacing:2px;text-transform:uppercase;margin-bottom:32px;position:relative;z-index:1}
.tip-title{font-size:64px;font-weight:900;color:#1a1a2e;line-height:1.12;letter-spacing:-2px;position:relative;z-index:1}
.tip-divider{width:80px;height:6px;background:#3B83F6;border-radius:3px;margin:40px 0;position:relative;z-index:1}
.tip-body{font-size:36px;color:#555;line-height:1.55;position:relative;z-index:1}
.tip-body strong{color:#1a1a2e;font-weight:800}
.tip-how{margin-top:40px;background:#eff6ff;border:3px solid #3B83F6;border-radius:18px;padding:24px 32px;font-size:28px;font-weight:700;color:#1d4ed8;line-height:1.45;position:relative;z-index:1}
.tip-how svg{width:24px;height:24px;display:inline;vertical-align:middle;margin-right:8px}
/* carosello referral */
.cr-cover-title{font-size:68px;font-weight:900;color:#1a1a2e;line-height:1.1;letter-spacing:-2px;position:relative;z-index:1}
.cr-cover-sub{font-size:36px;color:#555;line-height:1.5;margin-top:32px;position:relative;z-index:1}
.cr-step-num{width:120px;height:120px;background:#f59e0b;color:#1a1a2e;border:4px solid #1a1a2e;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:900;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:40px;position:relative;z-index:1}
.cr-step-title{font-size:56px;font-weight:900;color:#1a1a2e;line-height:1.15;letter-spacing:-1.5px;margin-bottom:28px;position:relative;z-index:1}
.cr-step-text{font-size:36px;color:#555;line-height:1.5;position:relative;z-index:1}
.cr-step-highlight{margin-top:40px;background:#fffbeb;border:3px solid #f59e0b;border-radius:18px;padding:28px 36px;font-size:30px;font-weight:700;color:#b45309;line-height:1.4;position:relative;z-index:1}
.cr-payout{margin-top:48px;background:#ecfdf5;border:4px solid #10b981;border-radius:20px;padding:36px 44px;position:relative;z-index:1;box-shadow:6px 6px 0 rgba(16,185,129,0.25)}
.cr-payout .label{font-size:24px;font-weight:800;color:#047857;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.cr-payout .value{font-size:52px;font-weight:900;color:#047857}
`;

const PED_LOGO_FOOTER = `<svg viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path fill="#3B83F6" d="${LOGO_SVG_PATH}"/></svg>getnearme.it`;
const PED_SWIPE = '<span class="swipe">Scorri <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></span>';
const PED_UP_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';

function pedDatiCoverHtml() {
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

function pedDatiContentHtml() {
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

function pedDatiValueHtml() {
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

function pedDatiCtaHtml() {
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

function pedEduCoverHtml() {
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

function pedEduItem(n: number, title: string, text: string, tip: string) {
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="cec-num">${n}</div>
    <div class="cec-title">${title}</div>
    <div class="cec-text">${text}</div>
    <div class="cec-tip">${tip}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

const PED_EDU_ITEMS: [string, string, string][] = [
  ["Perché quel prezzo è coerente", "Il cliente non vuole solo sapere quanto costa. Vuole capire perché. Comparabili e andamento della zona rendono il numero credibile invece che arbitrario.", "In pratica: mostra sempre un confronto con 2-3 immobili simili in zona."],
  ["Cosa offre la zona", "Trasporti, scuole, servizi, aree verdi. Per molte case il contesto è una delle leve più forti, ma di solito finisce in una frase generica.", "In pratica: dedica una sezione alla zona, non una riga nella descrizione."],
  ["Quali immobili sono comparabili", "Il cliente confronta comunque, da solo e online. Meglio guidare tu il confronto con dati ordinati che lasciarlo a un portale.", "In pratica: porta tu i comparabili prima che li trovi lui."],
  ["Qual è il potenziale degli spazi", "Una stanza vuota o datata non si spiega da sola. Il cliente fatica a immaginare quello che tu invece vedi subito.", "In pratica: un prima/dopo con home staging rende visibile il potenziale."],
  ["Perché merita attenzione", "Tra decine di annunci simili, vince quello che spiega meglio. Non servono più foto: serve più chiarezza.", "In pratica: ogni annuncio dovrebbe avere materiali che lo raccontano, non solo immagini."],
];

function pedEduCtaHtml() {
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

function pedFeatCoverHtml() {
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

function pedFeatInsightHtml() {
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="cdc-kicker">Prima di tutto, cosa non è</div>
    <div class="cf-no"><div class="ic">✕</div><div class="tx">Non serve a nascondere i difetti di un immobile<small>Il cliente li vedrà comunque in visita. E perderesti credibilità.</small></div></div>
    <div class="cf-yes"><div class="ic">✓</div><div class="tx">Serve quando lo spazio non si spiega da solo<small>Una stanza vuota, fredda o poco leggibile non fa capire il suo potenziale.</small></div></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function pedFeatCasesHtml() {
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

function pedFeatCtaHtml() {
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

function pedPostSingoloHtml() {
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

function pedTipHtml() {
  return `<div class="ped tip">
    <div class="deco deco-c1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="deco deco-s1" style="background:#eff6ff;border-color:#3B83F6"></div>
    <div class="deco deco-p1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="ped-badge badge-blue">Tip #1</div>
    <div class="tip-num">1</div>
    <div class="tip-scenario">Open house</div>
    <div class="tip-title">Stampa il prima/dopo <span class="hl-blue">per i cartelloni</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">Hai una stanza vuota da mostrare? <strong>Genera il prima/dopo con lo staging AI</strong> e stampalo in A3 da esporre durante l'open house.</div>
    <div class="tip-how">${TIP_ARROW} Apri l'annuncio, vai su AI Foto, scegli lo stile e scarica.</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}

function pedRefCoverHtml() {
  return `<div class="ped">
    <div class="deco deco-c1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Ambassador</div>
    <div class="cr-cover-title">I tuoi contatti nel settore<br><span class="hl-amber">valgono più di quanto pensi.</span></div>
    <div class="cr-cover-sub">Se conosci agenzie o agenti immobiliari, c'è un modo semplice per trasformare quella relazione in qualcosa di concreto.</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

const REF_STEPS: [string, string, string][] = [
  ["Segnala il contatto", "Conosci un titolare, un agente o un team? Basta una segnalazione. Non devi vendere nulla.", "Tu apri la conversazione, noi facciamo il resto."],
  ["Noi facciamo la demo", "Il nostro team contatta l'agenzia, organizza la demo e presenta GetNearMe nel dettaglio.", "Non devi seguire la trattativa."],
  ["L'agenzia decide", "Nessuna pressione. L'agenzia valuta in autonomia se attivare GetNearMe per il proprio lavoro.", "Tu non hai obblighi dopo la segnalazione."],
  ["Ricevi il payout", "Se l'agenzia diventa cliente, ricevi il compenso previsto dal programma ambassador.", ""],
];

function pedRefStepHtml(n: number, title: string, text: string, note: string) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Step ${n} di 4</div>
    <div class="cr-step-num">${n}</div>
    <div class="cr-step-title">${title}</div>
    <div class="cr-step-text">${text}</div>
    ${note ? `<div class="cr-step-highlight">${note}</div>` : ''}
    ${n === 4 ? `<div class="cr-payout"><div class="label">Risultato</div><div class="value">Payout per ogni agenzia attivata</div></div>` : ''}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

function pedRefCtaHtml() {
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

function storyStopMotionHtml() {
  return `<div class="vs vs-cards">
    <div class="card-photo card-before" style="background-image:${ROOM_EMPTY_SVG}"><div class="card-label">PRIMA</div></div>
    <div class="card-arrow">${ARROW_ARC_SVG}</div>
    <div class="card-photo card-after" style="background-image:${ROOM_FULL_SVG}"><div class="card-label">DOPO</div><div class="card-play">${PLAY_SVG}</div></div>
    <div class="vs-bottom">
      <div class="vs-title">Stop <span class="hl-blue">Motion</span></div>
      <div class="vs-desc">Guarda i mobili apparire uno alla volta.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

function storyParticleDustHtml() {
  return `<div class="vs vs-dust">
    <div class="dust-photos">
      <div class="dust-ph dust-before" style="background-image:${ROOM_EMPTY_SVG}"></div>
      <div class="dust-ph dust-after" style="background-image:${ROOM_FULL_SVG}"></div>
      <div class="dust-diag"></div>
      <div class="dust-label dust-label-before">PRIMA</div>
      <div class="dust-label dust-label-after">DOPO</div>
      <div class="dust-play">${PLAY_SVG}</div>
    </div>
    <div class="vs-bottom">
      <div class="vs-title">Effetto <span class="hl-blue">Polvere</span></div>
      <div class="vs-desc">I mobili si dissolvono in particelle e si riformano.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

function storyDayNightHtml() {
  return `<div class="vs vs-split vs-dn">
    <div class="sp-left"><div class="sp-ph" style="background-image:${ROOM_EMPTY_SVG}"></div></div>
    <div class="sp-right"><div class="sp-ph" style="background-image:${ROOM_FULL_SVG}"></div></div>
    <div class="sp-mid-line"></div>
    <div class="sp-divider"></div>
    <div class="sp-swap"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></div>
    <div class="vs-bottom">
      <div class="vs-title">Da Giorno a <span class="hl-blue">Notte</span></div>
      <div class="vs-desc">La stessa stanza, due atmosfere diverse.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

function storyTimelapseHtml() {
  return `<div class="vs vs-split">
    <div class="sp-left"><div class="sp-ph" style="background-image:${ROOM_EMPTY_SVG}"></div></div>
    <div class="sp-right"><div class="sp-ph" style="background-image:${ROOM_FULL_SVG}"><div class="sp-play">${PLAY_SVG}</div></div></div>
    <div class="sp-mid-line"></div>
    <div class="sp-arrow">${ARROW_ARC_SVG}</div>
    <div class="vs-bottom">
      <div class="vs-title">AI <span class="hl-amber">Timelapse</span></div>
      <div class="vs-desc">Ristrutturazione completa in un timelapse AI.<br>Il video completo è nel profilo.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

function storyStagingHtml() {
  return `<div class="vs vs-staging">
    <div class="ba-photo">
      <div class="ba-layer ba-before" style="background-image:${ROOM_EMPTY_SVG}"></div>
      <div class="ba-layer ba-after" style="background-image:${ROOM_FULL_SVG}"></div>
      <div class="ba-slider-line"></div>
      <div class="ba-slider-handle">${CHEVRONS_SVG}</div>
      <div class="ba-label ba-label-l">PRIMA</div>
      <div class="ba-label ba-label-r">DOPO</div>
    </div>
    <div class="vs-bottom">
      <div class="vs-title">AI <span class="hl-amber">Staging</span></div>
      <div class="vs-desc">Trasforma le tue foto con l'AI.<br>Scegli lo stile e vedi il risultato.</div>
      <div class="vs-btn">Post sul profilo!</div>
      <div class="vs-footer">${LOGO_FOOTER}</div>
    </div>
  </div>`;
}

function feedSlide1Html() {
  return `<div class="slide-1" style="width:1080px;height:1350px">
    <div class="top-badge">AI Staging</div>
    <div class="split-container">
      <div class="split-half split-before"><img src="/staging/1.jpg"></div>
      <div class="split-half split-after"><img src="/staging/2.jpg"></div>
    </div>
    <div class="divider"></div>
    <div class="divider-icon">${ARROWS_SVG}</div>
    <div class="label-before">Prima</div>
    <div class="label-after">Dopo</div>
    <div class="bottom-bar-center"><div class="badge">GetNearMe</div></div>
  </div>`;
}

function feedSlide2Html() {
  return `<div class="slide-cta" style="width:1080px;height:1350px">
    <div class="deco-circle"></div><div class="deco-square"></div><div class="deco-pink"></div>
    <div class="cta-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>AI Staging</div>
    <h2>Trasforma i tuoi<br>annunci in <span class="highlight">30 secondi</span></h2>
    <div class="cta-sub">Staging AI, analisi di zona, template social e video pronti per i tuoi annunci. Tutto in un&apos;estensione Chrome gratuita.</div>
    <div class="feature-pills">
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>Staging AI</div>
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>Post Social</div>
      <div class="pill"><svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Video AI</div>
    </div>
    <div class="cta-btn">Link in bio<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg></div>
    <div class="cta-footer">getnearme.it</div>
  </div>`;
}

function storyCtaHtml() {
  return `<div class="story-cta" style="width:1080px;height:1920px">
    <div class="deco-circle"></div><div class="deco-square"></div><div class="deco-pink"></div>
    <div class="cta-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>AI Staging</div>
    <div class="photo-card">
      <div class="pc-half pc-before"><img src="/staging/1.jpg"><div class="pc-label pc-label-before">Prima</div></div>
      <div class="pc-half pc-after"><img src="/staging/2.jpg"><div class="pc-label pc-label-after">Dopo</div></div>
      <div class="pc-divider"></div>
      <div class="pc-slider-icon">${ARROWS_SVG}</div>
    </div>
    <h2>Vedi il risultato<br><span class="highlight">completo</span></h2>
    <div class="cta-sub">Staging AI per trasformare i tuoi annunci immobiliari in pochi secondi.</div>
    <div class="cta-btn">Guarda nel profilo<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></div>
    <div class="cta-footer">getnearme.it</div>
  </div>`;
}

function reelsSlideHtml() {
  return `<div class="slide-1" style="width:1080px;height:1920px">
    <div class="top-badge" style="top:270px">AI Staging</div>
    <div class="split-container">
      <div class="split-half split-before"><img src="/staging/1.jpg"></div>
      <div class="split-half split-after"><img src="/staging/2.jpg"></div>
    </div>
    <div class="divider"></div>
    <div class="divider-icon">${ARROWS_SVG}</div>
    <div class="label-before" style="top:278px">Prima</div>
    <div class="label-after" style="top:278px">Dopo</div>
    <div class="bottom-bar-center" style="padding:0 60px 280px"><div class="badge">GetNearMe</div></div>
  </div>`;
}

function TemplateFrame({ html, w, h, scale, css }: { html: string; w: number; h: number; scale: number; css?: string }) {
  const srcDoc = `<!DOCTYPE html><html><head><style>${css || TEMPLATE_CSS}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;
  return (
    <iframe
      srcDoc={srcDoc}
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        border: "none",
        borderRadius: 12,
        pointerEvents: "none",
      }}
      sandbox="allow-same-origin"
      title="template preview"
    />
  );
}

// ── Stats template CSS + HTML ───────────────────────────────────────
const STATS_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
.neo-deco-circle{position:absolute;top:-80px;right:-100px;width:280px;height:280px;background:#fef3c7;border-radius:50%;border:4px solid #fcd34d;opacity:.5}
.neo-deco-square{position:absolute;bottom:120px;left:-40px;width:120px;height:120px;background:#dbeafe;border-radius:24px;border:4px solid #93c5fd;opacity:.5;transform:rotate(12deg)}
.neo-deco-dots{position:absolute;top:180px;right:60px;width:100px;height:100px;background-image:radial-gradient(circle,rgba(245,158,11,.2) 2px,transparent 2px);background-size:18px 18px;opacity:.6}
.neo-deco-pink{position:absolute;bottom:-60px;right:80px;width:180px;height:180px;background:#fce7f3;border-radius:28px;border:4px solid #f9a8d4;opacity:.4;transform:rotate(-8deg)}
.stat-hero{background:#fafaf8;display:flex;flex-direction:column;padding:60px 64px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-hero .source-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;position:relative;z-index:1}
.stat-hero .source-tag{background:#fff;border:3px solid #1a1a2e;border-radius:14px;padding:10px 24px;font-size:20px;font-weight:700;color:#1a1a2e;box-shadow:3px 3px 0 #1a1a2e;display:flex;align-items:center;gap:10px}
.stat-hero .source-tag svg{width:20px;height:20px}
.stat-hero .date-tag{font-size:20px;font-weight:600;color:#999;letter-spacing:1px}
.stat-hero .hero-content{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1}
.stat-hero .category-badge{background:#fffbeb;border:3px solid #f59e0b;border-radius:24px;padding:12px 32px;font-size:22px;font-weight:800;color:#b45309;box-shadow:4px 4px 0 rgba(245,158,11,.25);display:inline-flex;align-items:center;gap:10px;align-self:flex-start;margin-bottom:40px}
.stat-hero .category-badge svg{width:22px;height:22px}
.stat-hero .big-number{font-size:160px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-6px;margin-bottom:16px}
.stat-hero .big-number .unit{font-size:72px;font-weight:800;letter-spacing:-2px;color:#f59e0b}
.stat-hero .trend-row{display:flex;align-items:center;gap:16px;margin-bottom:32px}
.stat-hero .trend-pill{display:flex;align-items:center;gap:6px;padding:8px 20px;border-radius:12px;font-size:28px;font-weight:800;border:3px solid}
.stat-hero .trend-pill.up{background:#dcfce7;border-color:#22c55e;color:#16a34a}
.stat-hero .trend-pill.down{background:#fee2e2;border-color:#ef4444;color:#dc2626}
.stat-hero .trend-pill svg{width:24px;height:24px}
.stat-hero .trend-label{font-size:24px;color:#888;font-weight:500}
.stat-hero .stat-title{font-size:52px;font-weight:800;color:#1a1a2e;line-height:1.15;letter-spacing:-1px;margin-bottom:20px}
.stat-hero .stat-title .highlight{color:#f59e0b}
.stat-hero .stat-desc{font-size:28px;color:#666;line-height:1.55;max-width:880px}
.stat-hero .bottom-brand{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:40px;position:relative;z-index:1}
.stat-hero .brand-name{font-size:24px;font-weight:800;color:#ccc;letter-spacing:3px;text-transform:uppercase}
.stat-hero .swipe-hint{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:600;color:#bbb;letter-spacing:1px;text-transform:uppercase}
.stat-hero .swipe-hint svg{width:18px;height:18px}
.stat-breakdown{background:#fafaf8;display:flex;flex-direction:column;padding:60px 64px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-breakdown .section-title{font-size:36px;font-weight:800;color:#1a1a2e;margin-bottom:40px;position:relative;z-index:1;display:flex;align-items:center;gap:16px}
.stat-breakdown .section-title::before{content:'';width:6px;height:36px;background:#f59e0b;border-radius:3px;flex-shrink:0}
.stat-breakdown .stat-cards{display:flex;flex-direction:column;gap:20px;flex:1;justify-content:center;position:relative;z-index:1}
.stat-breakdown .stat-card{background:#fff;border:3px solid #1a1a2e;border-radius:20px;padding:32px 36px;box-shadow:6px 6px 0 #1a1a2e;display:flex;align-items:center;gap:24px}
.stat-breakdown .card-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:3px solid}
.stat-breakdown .card-icon svg{width:32px;height:32px}
.stat-breakdown .card-icon.amber{background:#fffbeb;border-color:#f59e0b}
.stat-breakdown .card-icon.blue{background:#eff6ff;border-color:#3b82f6}
.stat-breakdown .card-icon.green{background:#f0fdf4;border-color:#22c55e}
.stat-breakdown .card-icon.purple{background:#faf5ff;border-color:#a855f7}
.stat-breakdown .card-body{flex:1}
.stat-breakdown .card-value{font-size:42px;font-weight:900;color:#1a1a2e;line-height:1.1}
.stat-breakdown .card-label{font-size:22px;font-weight:600;color:#888;margin-top:4px}
.stat-breakdown .card-trend{font-size:24px;font-weight:800;padding:6px 14px;border-radius:10px;flex-shrink:0}
.stat-breakdown .card-trend.up{background:#dcfce7;color:#16a34a}
.stat-breakdown .card-trend.down{background:#fee2e2;color:#dc2626}
.stat-breakdown .source-note{font-size:18px;color:#aaa;margin-top:auto;padding-top:24px;position:relative;z-index:1;display:flex;align-items:center;gap:8px}
.stat-breakdown .source-note svg{width:16px;height:16px}
.stat-cta{background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-cta .cta-badge{background:#fffbeb;border:3px solid #f59e0b;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;color:#b45309;margin-bottom:48px;box-shadow:4px 4px 0 rgba(245,158,11,.25);position:relative;z-index:1;display:flex;align-items:center;gap:10px;white-space:nowrap}
.stat-cta .cta-badge svg{width:24px;height:24px}
.stat-cta h2{font-size:72px;font-weight:900;color:#1a1a2e;line-height:1.05;margin-bottom:28px;position:relative;z-index:1;letter-spacing:-2px}
.stat-cta .highlight{color:#f59e0b}
.stat-cta .cta-sub{font-size:30px;color:#555;line-height:1.55;margin-bottom:52px;max-width:820px;position:relative;z-index:1}
.stat-cta .feature-pills{display:flex;gap:16px;margin-bottom:52px;position:relative;z-index:1;flex-wrap:wrap;justify-content:center}
.stat-cta .pill{background:#fff;border:3px solid #1a1a2e;border-radius:14px;padding:14px 28px;font-size:22px;font-weight:700;color:#1a1a2e;box-shadow:4px 4px 0 #1a1a2e;display:flex;align-items:center;gap:10px}
.stat-cta .pill svg{width:22px;height:22px}
.stat-cta .cta-btn{background:#f59e0b;color:#1a1a2e;font-size:36px;font-weight:900;padding:28px 72px;border-radius:18px;border:4px solid #1a1a2e;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:8px 8px 0 #1a1a2e}
.stat-cta .cta-btn svg{width:32px;height:32px;stroke-width:3}
.stat-cta .cta-footer{position:absolute;bottom:48px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1}
.stat-story{background:#fafaf8;display:flex;flex-direction:column;align-items:center;text-align:center;padding:280px 72px 300px;position:relative;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.stat-story .category-badge{background:#fffbeb;border:3px solid #f59e0b;border-radius:24px;padding:12px 32px;font-size:24px;font-weight:800;color:#b45309;box-shadow:4px 4px 0 rgba(245,158,11,.25);position:relative;z-index:1;display:flex;align-items:center;gap:10px;margin-bottom:40px;white-space:nowrap}
.stat-story .category-badge svg{width:24px;height:24px}
.stat-story .stat-card-big{width:880px;background:#fff;border:4px solid #1a1a2e;border-radius:28px;padding:56px 48px;box-shadow:8px 8px 0 #1a1a2e;margin-bottom:48px;position:relative;z-index:1;text-align:center}
.stat-story .big-number{font-size:140px;font-weight:900;color:#1a1a2e;line-height:1;letter-spacing:-4px}
.stat-story .big-number .unit{font-size:64px;font-weight:800;color:#f59e0b;letter-spacing:-1px}
.stat-story .stat-label{font-size:32px;font-weight:700;color:#666;margin-top:16px}
.stat-story .trend-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px}
.stat-story .trend-pill{display:flex;align-items:center;gap:6px;padding:6px 16px;border-radius:10px;font-size:24px;font-weight:800;border:2px solid}
.stat-story .trend-pill.up{background:#dcfce7;border-color:#22c55e;color:#16a34a}
.stat-story .trend-pill svg{width:20px;height:20px}
.stat-story .source{font-size:18px;color:#bbb;margin-top:16px;font-weight:500}
.stat-story h2{font-size:80px;font-weight:900;color:#1a1a2e;line-height:1.08;margin-bottom:32px;position:relative;z-index:1;letter-spacing:-2px}
.stat-story .highlight{color:#f59e0b}
.stat-story .cta-sub{font-size:34px;color:#555;line-height:1.5;margin-bottom:48px;max-width:860px;position:relative;z-index:1}
.stat-story .cta-btn{background:#f59e0b;color:#1a1a2e;font-size:38px;font-weight:900;padding:28px 72px;border-radius:18px;border:4px solid #1a1a2e;display:inline-flex;align-items:center;gap:16px;position:relative;z-index:1;box-shadow:8px 8px 0 #1a1a2e}
.stat-story .cta-btn svg{width:32px;height:32px}
.stat-story .cta-footer{margin-top:24px;font-size:20px;font-weight:700;color:#bbb;letter-spacing:3px;text-transform:uppercase;z-index:1;position:relative}
@keyframes counter-reveal{0%{opacity:0;transform:scale(.5) translateY(40px)}60%{opacity:1;transform:scale(1.05) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes trend-slide{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.stat-reel{background:#1a1a2e;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.stat-reel .reel-bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(245,158,11,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.05) 1px,transparent 1px);background-size:60px 60px}
.stat-reel .reel-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(245,158,11,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
.stat-reel .reel-content{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:24px;padding:0 80px}
.stat-reel .reel-category{background:rgba(245,158,11,.15);border:2px solid rgba(245,158,11,.4);border-radius:20px;padding:10px 28px;font-size:22px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:2px}
.stat-reel .reel-number{font-size:200px;font-weight:900;color:#fff;line-height:1;letter-spacing:-8px;animation:counter-reveal 3s ease-out forwards}
.stat-reel .reel-number .reel-unit{font-size:80px;font-weight:800;color:#f59e0b;letter-spacing:-2px}
.stat-reel .reel-trend{display:flex;align-items:center;gap:10px;padding:10px 28px;border-radius:14px;font-size:32px;font-weight:800;animation:trend-slide 3s ease-out forwards;animation-delay:.5s;opacity:0}
.stat-reel .reel-trend.up{background:rgba(34,197,94,.2);color:#4ade80}
.stat-reel .reel-trend svg{width:28px;height:28px}
.stat-reel .reel-title{font-size:52px;font-weight:800;color:#fff;line-height:1.2;max-width:800px;animation:trend-slide 3s ease-out forwards;animation-delay:.8s;opacity:0}
.stat-reel .reel-desc{font-size:28px;color:rgba(255,255,255,.5);line-height:1.5;max-width:700px;animation:trend-slide 3s ease-out forwards;animation-delay:1.1s;opacity:0}
.stat-reel .reel-source{font-size:18px;color:rgba(255,255,255,.25);margin-top:16px;animation:trend-slide 3s ease-out forwards;animation-delay:1.4s;opacity:0}
.stat-reel .reel-brand{position:absolute;bottom:280px;display:flex;align-items:center;gap:12px;font-size:22px;font-weight:700;color:rgba(255,255,255,.2);letter-spacing:3px;text-transform:uppercase;z-index:2;animation:trend-slide 3s ease-out forwards;animation-delay:1.6s;opacity:0}
.logo-icon{width:28px;height:28px;flex-shrink:0}
.bottom-brand .logo-icon{width:36px;height:36px}
.cta-footer{display:flex;align-items:center;gap:10px}
.cta-footer .logo-icon{width:36px;height:36px}
.stat-reel .reel-brand .logo-icon{width:32px;height:32px;opacity:.5}
.stat-cta .cta-btn{background:#3B83F6;color:#fff;border-color:#1a1a2e;box-shadow:8px 8px 0 #1a1a2e}
.stat-story .cta-btn{background:#3B83F6;color:#fff;border-color:#1a1a2e;box-shadow:8px 8px 0 #1a1a2e}
.stat-breakdown .section-title::before{background:#3B83F6}
`;

const HOUSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
const TREND_UP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
const ARROW_RIGHT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';
const CHART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
const PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z"/></svg>';
const DL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const FLAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
const INFO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
const LOGO_BLUE = '<svg class="logo-icon" viewBox="0 0 424 533" xmlns="http://www.w3.org/2000/svg"><path d="M224.816 4.98C217.966-1.72 207.036-1.65 200.274 5.13L51.253 154.306c-14.922 14.922-27.88 29.952-37.086 49.303-9.206 19.35-13.635 38.526-14.071 58.923-.567 26.135.975 49.699 17.468 70.838 13.962 17.889 31.458 32.876 46.576 49.739 16.601 18.521 34.14 36.475 51.178 54.691 4.56 4.887 58.465 62.021 83.051 88.418 6.698 7.177 17.976 7.439 25.001.567L379.138 374.925c55.018-53.971 58.334-133.379 15.969-196.448-16.885-25.153-40.882-45.812-63.483-66.471-6.85-6.261-17.409-6.043-24.019.48L167.856 250.403c-6.61 6.522-6.959 17.059-.785 23.997l33.508 37.784c6.61 7.461 18.129 7.875 25.262.894L320.193 220.69s41.885 40.773.349 93.152L225.427 408.782c-6.785 6.763-17.736 6.807-24.564.109L111.463 321.084s-61.759-46.619.658-109.491c49.521-49.106 119.483-118.479 147.778-146.512 6.915-6.85 6.871-18.063-.088-24.87L224.816 4.98z" fill="#3B83F6"/></svg>';
const LOGO_WHITE = LOGO_BLUE.replace('fill="#3B83F6"', 'fill="rgba(255,255,255,0.35)"');

function statsHeroHtml() {
  return `<div class="stat-hero" style="width:1080px;height:1350px">
    <div class="neo-deco-circle"></div><div class="neo-deco-square"></div><div class="neo-deco-dots"></div>
    <div class="source-bar">
      <div class="source-tag">${LOGO_BLUE}ISTAT</div>
      <div class="date-tag">Q1 2026</div>
    </div>
    <div class="hero-content">
      <div class="category-badge"><span style="display:flex">${HOUSE_SVG.replace('stroke="currentColor"', 'stroke="#b45309"')}</span>Mercato Immobiliare</div>
      <div class="big-number">+3,2<span class="unit">%</span></div>
      <div class="trend-row">
        <div class="trend-pill up">${TREND_UP_SVG}+3,2% YoY</div>
        <span class="trend-label">vs Q1 2025</span>
      </div>
      <div class="stat-title">Compravendite in <span class="highlight">crescita</span> nel primo trimestre</div>
      <div class="stat-desc">Il mercato residenziale italiano registra un aumento delle transazioni rispetto allo stesso periodo dell&apos;anno precedente.</div>
    </div>
    <div class="bottom-brand">
      <span class="brand-name" style="display:flex;align-items:center;gap:10px">${LOGO_BLUE}getnearme.it</span>
      <span class="swipe-hint">Scorri${ARROW_RIGHT_SVG}</span>
    </div>
  </div>`;
}

function statsBreakdownHtml() {
  const card = (city: string, color: string, stroke: string, trend: string, dir: string) =>
    `<div class="stat-card"><div class="card-icon ${color}">${HOUSE_SVG.replace('stroke="currentColor"', `stroke="${stroke}"`)}</div><div class="card-body"><div class="card-value">${city}</div><div class="card-label">Prezzo medio al mq</div></div><div class="card-trend ${dir}">${trend}</div></div>`;
  return `<div class="stat-breakdown" style="width:1080px;height:1350px">
    <div class="neo-deco-circle" style="top:auto;bottom:-80px;right:-60px"></div><div class="neo-deco-dots" style="top:60px;right:40px"></div>
    <div class="section-title">Dettaglio per zona</div>
    <div class="stat-cards">
      ${card("Milano", "amber", "#f59e0b", "+4,1%", "up")}
      ${card("Roma", "blue", "#3b82f6", "+2,8%", "up")}
      ${card("Napoli", "green", "#22c55e", "+1,5%", "up")}
      ${card("Torino", "purple", "#a855f7", "-0,3%", "down")}
    </div>
    <div class="source-note">${INFO_SVG}Fonte: ISTAT, Nomisma — Q1 2026</div>
  </div>`;
}

function statsCtaHtml() {
  return `<div class="stat-cta" style="width:1080px;height:1350px">
    <div class="neo-deco-circle"></div><div class="neo-deco-square"></div><div class="neo-deco-pink"></div>
    <div class="cta-badge">${CHART_SVG.replace('stroke="currentColor"', 'stroke="#b45309"')}Dati Mercato</div>
    <h2>Conosci il tuo<br><span class="highlight">mercato</span> locale</h2>
    <div class="cta-sub">Analisi di zona, prezzi medi, trend e confronti per i tuoi annunci. Tutto aggiornato, tutto gratis.</div>
    <div class="feature-pills">
      <div class="pill">${CHART_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Trend prezzi</div>
      <div class="pill">${PIN_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Analisi zona</div>
      <div class="pill">${DL_SVG.replace('stroke="currentColor"', 'stroke="#1a1a2e"')}Report PDF</div>
    </div>
    <div class="cta-btn">Link in bio<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg></div>
    <div class="cta-footer">${LOGO_BLUE}getnearme.it</div>
  </div>`;
}

function statsStoryHtml() {
  return `<div class="stat-story" style="width:1080px;height:1920px">
    <div class="neo-deco-circle" style="top:200px"></div><div class="neo-deco-square" style="bottom:500px"></div><div class="neo-deco-dots" style="top:320px;right:40px"></div>
    <div class="category-badge"><span style="display:flex">${HOUSE_SVG.replace('stroke="currentColor"', 'stroke="#b45309"')}</span>Mercato Immobiliare</div>
    <div class="stat-card-big">
      <div class="big-number">+3,2<span class="unit">%</span></div>
      <div class="stat-label">Compravendite Q1 2026</div>
      <div class="trend-row"><div class="trend-pill up">${TREND_UP_SVG}vs anno scorso</div></div>
      <div class="source">Fonte: ISTAT</div>
    </div>
    <h2>Il mercato<br><span class="highlight">cresce</span></h2>
    <div class="cta-sub">Scopri i dati della tua zona con l&apos;analisi gratuita di GetNearMe.</div>
    <div class="cta-btn">Guarda nel profilo<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></div>
    <div class="cta-footer">${LOGO_BLUE}getnearme.it</div>
  </div>`;
}

function statsReelHtml() {
  return `<div class="stat-reel" style="width:1080px;height:1920px">
    <div class="reel-bg-grid"></div><div class="reel-glow"></div>
    <div class="reel-content">
      <div class="reel-category">Mercato Immobiliare</div>
      <div class="reel-number">+3,2<span class="reel-unit">%</span></div>
      <div class="reel-trend up">${TREND_UP_SVG}+3,2% YoY</div>
      <div class="reel-title">Compravendite in crescita nel primo trimestre 2026</div>
      <div class="reel-desc">Il mercato residenziale italiano registra segnali positivi, soprattutto nelle grandi citta.</div>
      <div class="reel-source">Fonte: ISTAT, Q1 2026</div>
    </div>
    <div class="reel-brand">${LOGO_WHITE}getnearme.it</div>
  </div>`;
}

// ── Dynamic slide generators (parameterized by slide_data) ───────────

type TplFormat = "feed" | "story" | "reels";

interface TplPreview {
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

const FEED_BASE: Omit<TplPreview, "label" | "html"> = { format: "feed", platform: "instagram", css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 };

const STORY_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.story{width:1080px;height:1920px;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden;background:#fafaf8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:160px 90px}
/* Big accent shape — different per rubric */
.st-shape{position:absolute;opacity:0.08}
.st-shape.sh-circle{width:600px;height:600px;border-radius:50%;top:-120px;right:-160px}
.st-shape.sh-square{width:400px;height:400px;border-radius:32px;bottom:180px;left:-100px;transform:rotate(15deg)}
.st-shape.sh-pill{width:240px;height:560px;border-radius:120px;top:200px;right:-60px}
.st-shape.sh-diamond{width:360px;height:360px;border-radius:32px;transform:rotate(45deg);bottom:-80px;right:120px}
.st-shape.sh-bar{width:120px;height:100%;border-radius:0;top:0;right:80px}
.st-shape.sh-ring{width:500px;height:500px;border-radius:50%;border:60px solid;background:transparent !important;top:-60px;left:-120px}
/* Badge — center top */
.st-badge{border-radius:12px;padding:16px 36px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:4px;margin-bottom:72px;position:relative;z-index:1}
/* Hook — big centered */
.st-hook{font-size:96px;font-weight:900;color:#1a1a2e;line-height:1.08;letter-spacing:-3px;max-width:920px;position:relative;z-index:1}
.st-hook .hl-amber{color:#f59e0b}
.st-hook .hl-blue{color:#3B83F6}
.st-hook .hl-emerald{color:#10b981}
.st-hook .hl-cyan{color:#06b6d4}
.st-hook .hl-lime{color:#84cc16}
.st-hook .hl-red{color:#ef4444}
/* Sub */
.st-sub{font-size:32px;font-weight:500;color:#64748b;line-height:1.5;margin-top:48px;max-width:740px;position:relative;z-index:1}
/* CTA — inline below text */
.st-cta{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:72px;position:relative;z-index:1}
.st-cta-pill{display:inline-flex;align-items:center;gap:12px;border-radius:60px;padding:22px 44px;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#fff}
.st-cta-pill svg{width:22px;height:22px}
/* Footer */
.st-footer{position:absolute;bottom:48px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:8px;font-size:18px;font-weight:600;color:#ccc;letter-spacing:3px;text-transform:uppercase}
.st-footer svg{width:18px;height:18px}
`;

const RUBRIC_STORY: Record<string, { hex: string; hl: string; shape: string }> = {
  mercato:       { hex: "#10b981", hl: "hl-emerald", shape: "sh-circle" },
  "roma-milano": { hex: "#06b6d4", hl: "hl-cyan",    shape: "sh-pill" },
  feature:       { hex: "#3B83F6", hl: "hl-blue",    shape: "sh-square" },
  educativo:     { hex: "#3B83F6", hl: "hl-blue",    shape: "sh-ring" },
  agenti:        { hex: "#f59e0b", hl: "hl-amber",   shape: "sh-diamond" },
  ambassador:    { hex: "#f59e0b", hl: "hl-amber",   shape: "sh-bar" },
  video:         { hex: "#ef4444", hl: "hl-red",     shape: "sh-circle" },
  tip:           { hex: "#8b5cf6", hl: "hl-violet",  shape: "sh-pill" },
};

const STORY_BASE: Omit<TplPreview, "label" | "html"> = { format: "story" as TplFormat, platform: "instagram", css: STORY_CSS, w: 1080, h: 1920, scale: 0.14, frameW: 151, frameH: 269 };

const GNM_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ARROW_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function storyTeaserD(d: any, rubric: string) {
  const r = RUBRIC_STORY[rubric] || RUBRIC_STORY.mercato;
  const borderStyle = r.shape === "sh-ring" ? `border-color:${r.hex}` : "";
  return `<div class="story">
    <div class="st-shape ${r.shape}" style="background:${r.hex};${borderStyle}"></div>
    <div class="st-badge" style="background:${r.hex}22;color:${r.hex};border:2px solid ${r.hex}44">${d.storyBadge || "NUOVO POST"}</div>
    <div class="st-hook">${d.storyHook || ""}<br><span class="${r.hl}">${d.storyHookHL || ""}</span></div>
    ${d.storySub ? `<div class="st-sub">${d.storySub}</div>` : ""}
    <div class="st-cta">
      <div class="st-cta-pill" style="background:${r.hex}">Post fuori ora!</div>
    </div>
    <div class="st-footer">${GNM_ICON_SM} GETNEARME.IT</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSlidesForTopic(topic: Topic): TplPreview[] | null {
  const d = topic.slide_data;
  if (!d) return null;

  const storySlide = d.storyHook ? [{ label: "Story", ...STORY_BASE, html: () => storyTeaserD(d, topic.rubric) }] : [];

  switch (topic.template) {
    case "ped-carosello-dati": return [
      { label: "1 · Cover", ...FEED_BASE, html: () => datiCoverD(d) },
      { label: "2 · Insight", ...FEED_BASE, html: () => datiInsightD(d) },
      { label: "3 · Valore", ...FEED_BASE, html: () => datiValueD(d) },
      { label: "4 · CTA", ...FEED_BASE, html: () => pedCtaD(d) },
      ...storySlide,
    ];
    case "ped-carosello-edu": return [
      { label: "1 · Cover", ...FEED_BASE, html: () => eduCoverD(d) },
      ...(d.items || []).map((item: { title: string; text: string; tip: string }, i: number) => ({
        label: `${i + 2} · Item ${i + 1}`, ...FEED_BASE,
        html: () => eduItemD(i + 1, item),
      })),
      { label: `${(d.items?.length || 5) + 2} · CTA`, ...FEED_BASE, html: () => pedCtaD(d) },
      ...storySlide,
    ];
    case "ped-carosello-feature": return [
      { label: "1 · Cover", ...FEED_BASE, html: () => featCoverD(d) },
      { label: "2 · Insight", ...FEED_BASE, html: () => featInsightD(d) },
      { label: "3 · Casi", ...FEED_BASE, html: () => featCasesD(d) },
      { label: "4 · CTA", ...FEED_BASE, html: () => pedCtaD(d) },
      ...storySlide,
    ];
    case "ped-post-singolo": return [
      { label: "Post", ...FEED_BASE, html: () => postSingoloD(d) },
      ...storySlide,
    ];
    case "ped-carosello-referral": return [
      { label: "1 · Cover", ...FEED_BASE, html: () => refCoverD(d) },
      ...(d.steps || REF_STEPS).map((s: [string, string, string] | { title: string; text: string; note: string }, i: number) => ({
        label: `${i + 2} · Step ${i + 1}`, ...FEED_BASE,
        html: () => {
          const arr = Array.isArray(s) ? { title: s[0], text: s[1], note: s[2] } : s;
          return pedRefStepHtml(i + 1, arr.title, arr.text, arr.note);
        },
      })),
      { label: `${((d.steps || REF_STEPS).length) + 2} · CTA`, ...FEED_BASE, html: () => pedCtaD(d) },
      ...storySlide,
    ];
    case "ped-tip": return [
      { label: "Tip", ...FEED_BASE, html: () => tipD(d) },
      ...storySlide,
    ];
    default: return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function datiCoverD(d: any) {
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
function datiInsightD(d: any) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cdc-kicker">${d.kicker || ""}</div>
    <div class="cdc-text">${d.insight || ""}</div>
    ${d.cardLabel ? `<div class="cdc-card"><div class="label">${d.cardLabel}</div><div class="value">${d.cardValue || ""}</div></div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function datiValueD(d: any) {
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  const items = d.actions || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">${d.valueTitle || ""} <span class="${hlc}">${d.valueHL || ""}</span></div>
    <div class="pva-list">${items.map((a: { text: string; sub: string }, i: number) =>
    `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${a.text}<small>${a.sub}</small></div></div>`
  ).join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pedCtaD(d: any) {
  return `<div class="ped pcta">
    <div class="deco deco-c1"></div><div class="deco deco-p1"></div>
    <div class="pcta-kicker">${d.ctaKicker || ""}</div>
    <div class="pcta-title">${d.ctaTitle || ""} <span class="${d.badgeColor === "blue" ? "hl-blue" : "hl-amber"}">${d.ctaHL || ""}</span></div>
    <div class="pcta-pill">Commenta "${d.ctaPill || "DEMO"}"</div>
    <div class="pcta-sub">${d.ctaSub || "Ricevi il link per provare GetNearMe."}</div>
    <div class="ped-footer" style="width:100%">${PED_LOGO_FOOTER}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eduCoverD(d: any) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Educativo</div>
    <div class="ce-num">${d.num || "5"}</div>
    <div class="ped-title ce-title">${d.title || ""}<br><span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="ce-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Salva per dopo</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eduItemD(n: number, item: { title: string; text: string; tip: string }) {
  return `<div class="ped">
    <div class="deco deco-p1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">${n} di ${5}</div>
    <div class="cec-num">${n}</div>
    <div class="cec-title">${item.title}</div>
    <div class="cec-text">${item.text}</div>
    ${item.tip ? `<div class="cec-tip">${item.tip}</div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featCoverD(d: any) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-blue">Feature</div>
    <div class="cf-visual"><div class="mock"><div class="bar"><i style="background:#ef4444"></i><i style="background:#fbbf24"></i><i style="background:#22c55e"></i></div><div class="body"><div class="panel"></div><div class="panel acc"></div></div></div></div>
    <div class="ped-title">${d.coverTitle || ""}<br><span class="hl-blue">${d.coverHL || ""}</span></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featInsightD(d: any) {
  return `<div class="ped">
    <div class="deco deco-p1"></div>
    <div class="cf-no"><div class="ic">✕</div><div class="tx">${d.noText || ""}<small>${d.noSub || ""}</small></div></div>
    <div class="cf-yes"><div class="ic">✓</div><div class="tx">${d.yesText || ""}<small>${d.yesSub || ""}</small></div></div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featCasesD(d: any) {
  const cases = d.cases || [];
  return `<div class="ped">
    <div class="deco deco-s1"></div>
    <div class="pva-title">Quando ha senso <span class="hl-blue">usarlo</span></div>
    <div class="pva-list">${cases.map((c: { title: string; text: string }, i: number) =>
    `<div class="pva-item"><div class="n">${i + 1}</div><div class="tx">${c.title}<small>${c.text}</small></div></div>`
  ).join("")}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function postSingoloD(d: any) {
  const bc = d.badgeColor === "blue" ? "badge-blue" : "badge-amber";
  const hlc = d.badgeColor === "blue" ? "hl-blue" : "hl-amber";
  return `<div class="ped ps">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div><div class="deco deco-p1"></div>
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

const TIP_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tipD(d: any) {
  return `<div class="ped tip">
    <div class="deco deco-c1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="deco deco-s1" style="background:#eff6ff;border-color:#3B83F6"></div>
    <div class="deco deco-p1" style="background:#dbeafe;border-color:#93c5fd"></div>
    <div class="ped-badge badge-blue">Tip #${d.tipNum || "1"}</div>
    <div class="tip-num">${d.tipNum || "1"}</div>
    <div class="tip-scenario">${d.scenario || ""}</div>
    <div class="tip-title">${d.title || ""} <span class="hl-blue">${d.titleHL || ""}</span></div>
    <div class="tip-divider"></div>
    <div class="tip-body">${d.body || ""}</div>
    ${d.how ? `<div class="tip-how">${TIP_ARROW} ${d.how}</div>` : ""}
    <div class="ped-footer">${PED_LOGO_FOOTER}</div>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function refCoverD(d: any) {
  return `<div class="ped">
    <div class="deco deco-c1"></div><div class="deco deco-s1"></div>
    <div class="ped-badge badge-amber">Ambassador</div>
    <div class="cr-cover-title">${d.coverTitle || ""}<br><span class="hl-amber">${d.coverHL || ""}</span></div>
    <div class="cr-cover-sub">${d.coverSub || ""}</div>
    <div class="ped-footer">${PED_LOGO_FOOTER}${PED_SWIPE}</div>
  </div>`;
}

// ── Preview registry per template ────────────────────────────────────

const TPL_PREVIEWS: Record<string, TplPreview[]> = {
  "before-after": [
    { label: "Reel — Slider", format: "reels", platform: "instagram", html: reelsSlideHtml, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
    { label: "Story — CTA + foto", format: "story", platform: "instagram", html: storyStagingHtml, css: VIDEO_STORIES_CSS, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
    { label: "Video — Slider", format: "reels", platform: "linkedin", html: reelsSlideHtml, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
  ],
  "ped-carosello-dati": [
    { label: "1 · Cover — stat", format: "feed", platform: "instagram", html: pedDatiCoverHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "2 · Insight", format: "feed", platform: "instagram", html: pedDatiContentHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "3 · Valore pratico", format: "feed", platform: "instagram", html: pedDatiValueHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "4 · CTA", format: "feed", platform: "instagram", html: pedDatiCtaHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "ped-carosello-edu": [
    { label: "1 · Cover", format: "feed", platform: "instagram", html: pedEduCoverHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    ...PED_EDU_ITEMS.map(([title, text, tip], i) => ({
      label: `${i + 2} · Item ${i + 1}`, format: "feed" as const, platform: "instagram" as const,
      html: () => pedEduItem(i + 1, title, text, tip), css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270,
    })),
    { label: "7 · CTA", format: "feed", platform: "instagram", html: pedEduCtaHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "ped-carosello-feature": [
    { label: "1 · Cover", format: "feed", platform: "instagram", html: pedFeatCoverHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "2 · Insight", format: "feed", platform: "instagram", html: pedFeatInsightHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "3 · Casi d'uso", format: "feed", platform: "instagram", html: pedFeatCasesHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    { label: "4 · CTA", format: "feed", platform: "instagram", html: pedFeatCtaHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "ped-carosello-referral": [
    { label: "1 · Cover", format: "feed", platform: "instagram", html: pedRefCoverHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
    ...REF_STEPS.map(([title, text, note], i) => ({
      label: `${i + 2} · Step ${i + 1}`, format: "feed" as const, platform: "instagram" as const,
      html: () => pedRefStepHtml(i + 1, title, text, note), css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270,
    })),
    { label: "6 · CTA", format: "feed", platform: "instagram", html: pedRefCtaHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "ped-post-singolo": [
    { label: "Post singolo", format: "feed", platform: "instagram", html: pedPostSingoloHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "ped-tip": [
    { label: "Tip", format: "feed", platform: "instagram", html: pedTipHtml, css: PED_CSS, w: 1080, h: 1350, scale: 0.2, frameW: 216, frameH: 270 },
  ],
  "stop-motion": [
    { label: "Story — Stop Motion", format: "story", platform: "instagram", html: storyStopMotionHtml, css: VIDEO_STORIES_CSS, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
  ],
  "particle": [
    { label: "Story — Effetto Polvere", format: "story", platform: "instagram", html: storyParticleDustHtml, css: VIDEO_STORIES_CSS, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
  ],
  "day-night": [
    { label: "Story — Day/Night", format: "story", platform: "instagram", html: storyDayNightHtml, css: VIDEO_STORIES_CSS, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
  ],
  "timelapse": [
    { label: "Story — Timelapse", format: "story", platform: "instagram", html: storyTimelapseHtml, css: VIDEO_STORIES_CSS, w: 1080, h: 1920, scale: 0.2, frameW: 216, frameH: 384 },
  ],
};

function TemplatesView() {
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);

  const tplData = selectedTpl ? ALL_TEMPLATES.find((t) => t.id === selectedTpl) : null;
  const previews = selectedTpl ? TPL_PREVIEWS[selectedTpl] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Templates Social</h1>
          {!tplData && <p className="text-sm text-gray-500 mt-1">Clicca un template per vedere l&apos;anteprima</p>}
        </div>
      </div>

      {/* All templates grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Tutti i template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ALL_TEMPLATES.map((tpl) => {
            const st = TPL_STATUS[tpl.status] || TPL_STATUS.planned;
            const isSelected = selectedTpl === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedTpl(tpl.id)}
                className={`rounded-xl border p-5 transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "border-indigo-500/40 bg-indigo-500/[0.06]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-100">{tpl.name}</h3>
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${st}`}>
                    {tpl.status === "ready" ? "Pronto" : tpl.status === "wip" ? "In sviluppo" : "Pianificato"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{tpl.description}</p>
                <div className="space-y-2">
                  {tpl.formats.map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className={`${MONO} text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded`}>{f.label}</span>
                      <span className="text-xs text-gray-600">{f.slides.join(" → ")}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview panel — appears when a template is selected */}
      {tplData && (
        <div className="mt-8 pt-8 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-100">{tplData.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{tplData.description}</p>
            </div>
            <button
              onClick={() => setSelectedTpl(null)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {previews ? (
            <div className="space-y-8">
              {/* Instagram */}
              {previews.some((p) => p.platform === "instagram") && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className={`${MONO} text-[11px] text-pink-400 uppercase tracking-wider font-medium`}>Instagram</h3>
                    <span className={`${MONO} text-[10px] text-gray-600`}>Video verticali + Story</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    {previews.filter((p) => p.platform === "instagram").map((p) => (
                      <div key={p.label} className="flex flex-col items-center">
                        <p className={`${MONO} text-[10px] text-gray-600 uppercase tracking-wider mb-2`}>{p.label}</p>
                        <div style={{ width: p.frameW, height: p.frameH, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                          <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale} css={p.css} />
                        </div>
                        <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>{p.w} × {p.h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* LinkedIn */}
              {previews.some((p) => p.platform === "linkedin") && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className={`${MONO} text-[11px] text-blue-400 uppercase tracking-wider font-medium`}>LinkedIn</h3>
                    <span className={`${MONO} text-[10px] text-gray-600`}>Video 1080×1350 via n8n</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    {previews.filter((p) => p.platform === "linkedin").map((p) => (
                      <div key={p.label} className="flex flex-col items-center">
                        <p className={`${MONO} text-[10px] text-gray-600 uppercase tracking-wider mb-2`}>{p.label}</p>
                        <div style={{ width: p.frameW, height: p.frameH, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                          <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale} css={p.css} />
                        </div>
                        <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>{p.w} × {p.h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01]">
              <p className="text-sm text-gray-600">Preview non ancora disponibile per questo template</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALL_TEMPLATES = [
  // ── PED formats (3 post/giorno) ──
  {
    id: "ped-carosello-dati",
    name: "Carosello Dati",
    description: "Stat gigante + insight + valore pratico + CTA. Mercato e focus Roma/Milano. 8 post nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Cover stat", "Insight", "Valore pratico", "CTA"] },
    ],
    status: "ready",
  },
  {
    id: "ped-carosello-edu",
    name: "Carosello Educativo",
    description: "Checklist salvabile: numero grande + item con tip pratico + CTA. 4 post nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Cover numero", "Item ×N", "CTA"] },
    ],
    status: "ready",
  },
  {
    id: "ped-carosello-feature",
    name: "Carosello Feature",
    description: "Mockup prodotto + cosa è/non è + casi d'uso + CTA. 5 post nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Cover mockup", "Insight", "Casi d'uso", "CTA"] },
    ],
    status: "ready",
  },
  {
    id: "ped-carosello-referral",
    name: "Carosello Referral",
    description: "Programma ambassador in 4 step + payout + CTA. 2 post nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Cover", "Step ×4", "CTA"] },
    ],
    status: "ready",
  },
  {
    id: "ped-post-singolo",
    name: "Post Singolo",
    description: "Hook forte + insight + CTA. Post immagine singola per valore agente, riflessioni, ambassador. 8 post nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Hook + insight + CTA"] },
    ],
    status: "ready",
  },
  {
    id: "ped-tip",
    name: "Tip GetNearMe",
    description: "Mini tip pratico su come usare GetNearMe in scenari reali. 1 al giorno, 28 nel PED",
    formats: [
      { label: "IG Feed 1080×1350", slides: ["Tip card"] },
    ],
    status: "ready",
  },
  // ── Video templates (7/settimana) ──
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

const TPL_STATUS: Record<string, string> = {
  ready: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  planned: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  wip: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};
