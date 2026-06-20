"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Wallet,
  TrendingUp,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";

// ── Shared types, constants, helpers (extracted) ──────────────────────
import {
  MONO,
  type SocialPage,
  type Topic,
  type ContentItem,
  type CostsData,
  type PostMetric,
  type InsightRow,
  type PerformanceData,
  RUBRIC_COLORS,
  FEED_SLOTS,
  VIDEO_SLOT,
  TIP_SLOT,
  isVideoTopic,
  isTipTopic,
  getPublishTime,
  STATUS_LABELS,
  RANGE_OPTIONS,
  fmtNum,
  fmtPct,
  buildMonthGrid,
  shiftMonth,
  VIDEO_TYPE_META,
  ALL_TEMPLATES,
  TPL_STATUS,
} from "./components/types";

// ── Template builders (single source of truth via registry) ───────────
// PED feed/story builders + dispatcher live in src/lib/social/ped/builders.
// Video/story/stats builders live in src/lib/social/video-stories.
// CSS strings are imported here and attached to previews at render time.
import { PED_CSS, STORY_CSS } from "@/lib/social/ped/client-css";
import {
  setPreviewCss,
  previewsForTopic as buildSlidesForTopic,
  STATIC_PREVIEWS as PED_STATIC_PREVIEWS,
  type TplPreview,
  type TplFormat,
} from "@/lib/social/ped/builders/index";
import {
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
  VIDEO_STORY_PREVIEWS,
} from "@/lib/social/video-stories/index";

// Wire the dashboard's PED_CSS / STORY_CSS into the registry so previews
// render with the client stylesheets. Done once at module load.
setPreviewCss(PED_CSS, STORY_CSS);

function TemplateFrame({ html, w, h, scale, css }: { html: string; w: number; h: number; scale: number; css?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanCss = (css || TEMPLATE_CSS).replace(/@import\s+url\([^)]+\);?\s*/g, "");
  // blob-URL iframes resolve root-relative paths against the blob origin, which
  // breaks <img src="/staging/1.jpg">. A <base> with the real origin fixes it.
  const baseHref = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  const fullHtml = `<!DOCTYPE html><html><head><base href="${baseHref}"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"><style>${cleanCss}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [fullHtml]);

  return (
    <iframe
      ref={ref}
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        border: "none",
        borderRadius: 12,
        pointerEvents: "none",
      }}
      title="template preview"
    />
  );
}


const NAV: { id: SocialPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "calendar", label: "Piano Editoriale", icon: CalendarDays },
  { id: "performance", label: "Performance", icon: TrendingUp },
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
      const res = await fetch(`/api/social/data?view=${view}${extra}&_t=${Date.now()}`, {
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
      // Chronological order matching the slots used by getPublishTime:
      // feed → 09:00, 12:00, 16:00, 18:00 (FEED_SLOTS), video → 15:00, tip → 20:00.
      // Video sits between the 12:00 and 16:00 feed posts.
      const sorted: Topic[] = [
        ...feed.slice(0, 2),
        ...video,
        ...feed.slice(2),
        ...tips,
      ];
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
  days: string[];
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
        {days.map((date, i) => {
          const inMonth = date.slice(0, 7) === month;
          return (
          <div
            key={i}
            className={`bg-[#12141a] min-h-28 p-1.5 ${date === today ? "ring-1 ring-inset ring-indigo-500/50" : ""}`}
          >
            <>
                <div className={`${MONO} text-[10px] mb-1 ${date === today ? "text-indigo-400" : inMonth ? "text-gray-600" : "text-gray-700/70"}`}>
                  {Number(date.slice(8, 10))}{!inMonth ? `/${Number(date.slice(5, 7))}` : ""}
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
          </div>
          );
        })}
      </div>

      <p className={`${MONO} mt-3 text-[11px] text-gray-600`}>
        Click su un contenuto per l&apos;anteprima reale. ✓ verde = pubblicato su Instagram.
      </p>
    </div>
  );
}

// ── Video preview placeholder ──────────────────────────────────────


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
  const reelItem = items.find(i => i.type === "reel") || items[0] || null;
  const storyItem = items.find(i => i.type === "story") || null;
  const videoItem = items.find(i => !!i.video_url) || null;
  // The stored video_url is the branded share PAGE (/v/<id>, text/html), which a
  // <video> tag can't play. The raw MP4 is served at /d/<id>. Use that for preview.
  const videoSrc = (videoItem?.video_url || "").replace("/v/", "/d/");
  // Previews autoplay muted (browser requirement); this button unmutes them so
  // the user can hear the background music.
  const [isMuted, setIsMuted] = useState(true);
  const toggleAudio = () => {
    const next = !isMuted;
    document.querySelectorAll("video").forEach((v) => { v.muted = next; if (!next) v.play().catch(() => {}); });
    setIsMuted(next);
  };
  const item = reelItem;
  const slides = item?.image_urls || [];
  const sd = topic.slide_data || {};

  // Caption: prefer generated content, fallback to slide_data fields
  let caption = item?.content_data?.caption || "";
  if (!caption && sd) {
    const parts: string[] = [];
    const hook = sd.hook ? `${sd.hook}${sd.hookHL ? " " + sd.hookHL : ""}` : "";
    if (hook) parts.push(hook);
    const body = (sd.body || sd.insight || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (body) parts.push(body);
    const kicker = sd.kicker || "";
    if (kicker && !body.includes(kicker)) parts.push(kicker);
    if (sd.ctaHint) parts.push(sd.ctaHint);
    if (!parts.length) parts.push(topic.title);
    caption = parts.join("\n\n");
  }

  // Hashtags: prefer generated, fallback to rubric-based
  let hashtags = item?.content_data?.hashtags || [];
  if (!hashtags.length) {
    const base = ["GetNearMe", "immobiliare", "agenteimmobiliare"];
    const rubricTags: Record<string, string[]> = {
      "roma-milano": ["mercatoimmobiliare", "Milano", "Roma"],
      educativo: ["homestaging", "tips", "realestate"],
      feature: ["AIstaging", "proptech", "innovazione"],
      ambassador: ["ambassador", "referral", "agenti"],
      video: ["AIstaging", "virtualstaging", "reel"],
      tip: ["tips", "consigliimmobiliari", "agenziaimmobiliare"],
    };
    hashtags = [...base, ...(rubricTags[topic.rubric] || [])];
  }
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
          <div className="flex items-center gap-1 shrink-0">
            {videoSrc && (
              <button
                onClick={toggleAudio}
                title={isMuted ? "Attiva audio" : "Disattiva audio"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${isMuted ? "text-gray-400 hover:bg-white/5 hover:text-gray-200" : "bg-indigo-500/20 text-indigo-300"}`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? "Audio" : "Audio on"}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {videoItem?.video_url && topic.template === "video_timelapse" ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {/* Reel — native elements (TemplateFrame iframe blocks video autoplay) */}
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Reel</p>
                  <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)", position: "relative", background: "#0a0a0a" }}>
                    {/* Top half — PRIMA photo */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slides[0] || ""} alt="Prima" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "60%", fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 3 }}>PRIMA</span>
                    </div>
                    {/* Divider */}
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#fff", zIndex: 10, transform: "translateY(-50%)" }} />
                    {/* Bottom half — DOPO video */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
                      <video src={videoSrc} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 8, fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 3 }}>DOPO</span>
                    </div>
                    {/* Center logo box */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 20, background: "#fff", borderRadius: 5, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      <span style={{ fontSize: 6, fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap" }}>Realizzato con</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo_blu_nero.svg" alt="GetNearMe" style={{ height: 10 }} />
                    </div>
                  </div>
                </div>
                {/* Story — static template (no video needed) */}
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story</p>
                  <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                    <TemplateFrame html={storyTimelapseHtml(slides[0] || undefined, slides[1] || slides[0] || undefined)} w={1080} h={1920} scale={0.2} css={VIDEO_STORIES_CSS} />
                  </div>
                </div>
              </div>
            </>
          ) : videoItem?.video_url && topic.template === "video_day_night" ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {/* Reel — GIORNO/NOTTE split with video */}
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Reel</p>
                  <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)", position: "relative", background: "#0a0a0a" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slides[0] || ""} alt="Giorno" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: "60%", fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 3 }}>GIORNO</span>
                    </div>
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "#fff", zIndex: 10, transform: "translateY(-50%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
                      <video src={videoSrc} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 8, fontSize: 7, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", padding: "3px 8px", borderRadius: 3 }}>NOTTE</span>
                    </div>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 20, background: "#fff", borderRadius: 5, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                      <span style={{ fontSize: 6, fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap" }}>Realizzato con</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo_blu_nero.svg" alt="GetNearMe" style={{ height: 10 }} />
                    </div>
                  </div>
                </div>
                {/* Story — GIORNO/NOTTE split photos + card */}
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story</p>
                  <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                    <TemplateFrame html={storyDayNightHtml(slides[0] || undefined, slides[1] || slides[0] || undefined)} w={1080} h={1920} scale={0.2} css={VIDEO_STORIES_CSS} />
                  </div>
                </div>
              </div>
            </>
          ) : videoItem?.video_url && topic.template === "video_before_after_stopmotion" ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3">
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Reel</p>
                  <video src={videoSrc} autoPlay loop muted playsInline className="h-96 rounded-lg border border-white/[0.08]" />
                </div>
                {slides.length >= 2 && (
                  <div className="shrink-0 flex flex-col items-center">
                    <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story</p>
                    <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                      <TemplateFrame html={storyStopMotionHtml(slides[0] || undefined, slides[1] || undefined)} w={1080} h={1920} scale={0.2} css={VIDEO_STORIES_CSS} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : videoItem?.video_url && topic.template === "video_before_after_particle" ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3">
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Reel</p>
                  <video src={videoSrc} autoPlay loop muted playsInline className="h-96 rounded-lg border border-white/[0.08]" />
                </div>
                {slides.length >= 2 && (
                  <div className="shrink-0 flex flex-col items-center">
                    <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story</p>
                    <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                      <TemplateFrame html={storyParticleDustHtml(slides[0] || undefined, slides[1] || undefined)} w={1080} h={1920} scale={0.2} css={VIDEO_STORIES_CSS} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : videoItem?.video_url ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-3">
                <div className="shrink-0 flex flex-col items-center">
                  <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Reel</p>
                  <video
                    src={videoSrc}
                    autoPlay loop muted playsInline
                    className="h-96 rounded-lg border border-white/[0.08]"
                  />
                </div>
                {topic.template === "video_slider" && slides && slides.length >= 2 && (
                  <div className="shrink-0 flex flex-col items-center">
                    <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>Story</p>
                    <div style={{ width: 216, height: 384, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                      <TemplateFrame html={storyStagingHtmlDynamic(slides[0], slides[1])} w={1080} h={1920} scale={0.2} css={VIDEO_STORIES_CSS} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : slides.length > 0 && !isVideoTopic(topic) ? (
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
          ) : topic.rubric === "video" || isVideoTopic(topic) ? (
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

// ── Performance ────────────────────────────────────────────────────


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
                  {" · "}
                  <span className="text-amber-400">K ${(v.fal || 0).toFixed(3)}</span>
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

// TPL_PREVIEWS merges the PED static previews (from the registry) with the
// video/story/stats previews. Built once from the two registries so the
// TemplatesView gallery renders every template from a single map.
const TPL_PREVIEWS: Record<string, TplPreview[]> = {
  ...PED_STATIC_PREVIEWS,
  ...VIDEO_STORY_PREVIEWS,
};

function TemplatesView() {
  const [selectedTpl, setSelectedTpl] = useState<string>(ALL_TEMPLATES[0]?.id ?? "");

  const tplData = ALL_TEMPLATES.find((t) => t.id === selectedTpl) ?? ALL_TEMPLATES[0];
  const previews = TPL_PREVIEWS[selectedTpl];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-100">Templates Social</h1>
        <p className="text-sm text-gray-500 mt-1">Seleziona un template a sinistra per vederne le slide</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* ── Left: template list ── */}
        <aside className="w-72 shrink-0 overflow-y-auto pr-1 space-y-1.5">
          {ALL_TEMPLATES.map((tpl) => {
            const st = TPL_STATUS[tpl.status] || TPL_STATUS.planned;
            const isSelected = selectedTpl === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedTpl(tpl.id)}
                className={`w-full rounded-lg border px-3.5 py-3 transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "border-indigo-500/40 bg-indigo-500/[0.08]"
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-medium ${isSelected ? "text-gray-100" : "text-gray-300"}`}>{tpl.name}</h3>
                  <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${st}`}>
                    {tpl.status === "ready" ? "Pronto" : tpl.status === "wip" ? "In sviluppo" : "Pianificato"}
                  </span>
                </div>
                <p className={`${MONO} text-[10px] text-gray-600 mt-1`}>{tpl.formats.map((f) => f.label.split(" ")[0]).join(" · ")}</p>
              </button>
            );
          })}
        </aside>

        {/* ── Right: selected template detail ── */}
        <main className="flex-1 overflow-y-auto pr-1">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-100">{tplData.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{tplData.description}</p>
          </div>

          {previews ? (
            <div className="space-y-8">
              {/* Instagram */}
              {previews.some((p) => p.platform === "instagram") && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className={`${MONO} text-[11px] text-pink-400 uppercase tracking-wider font-medium`}>Instagram</h3>
                    <span className={`${MONO} text-[10px] text-gray-600`}>Feed + Story</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    {previews.filter((p) => p.platform === "instagram").map((p) => (
                      <div key={p.label} className="flex flex-col items-center">
                        <p className={`${MONO} text-[10px] text-gray-600 uppercase tracking-wider mb-2`}>{p.label}</p>
                        <div style={{ width: p.frameW * 1.3, height: p.frameH * 1.3, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                          <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale * 1.3} css={p.css} />
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
                        <div style={{ width: p.frameW * 1.3, height: p.frameH * 1.3, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                          <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale * 1.3} css={p.css} />
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
        </main>
      </div>
    </div>
  );
}


