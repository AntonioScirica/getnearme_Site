"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Newspaper,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const MONO = "font-[family-name:var(--font-jetbrains)]";

// ── Types ──────────────────────────────────────────────────────────

type SocialPage = "calendar" | "news" | "costs";

interface Topic {
  id: string;
  plan_date: string;
  rubric: string;
  category: string;
  title: string;
  status: string;
  edition: string | null;
  template: string;
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
};

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
  { id: "news", label: "News AI", icon: Newspaper },
  { id: "costs", label: "Costi API", icon: Wallet },
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview modal
  const [preview, setPreview] = useState<{ topic: Topic; items: ContentItem[] } | null>(null);

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
  }, [authKey, page, loadCalendar, fetchView]);

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
              onSelect={(topic) =>
                setPreview({ topic, items: contentByTopic[topic.id] || [] })
              }
            />
          )}

          {page === "news" && <NewsView news={news} loading={loading} />}
          {page === "costs" && <CostsView costs={costs} loading={loading} />}
        </div>
      </main>

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          topic={preview.topic}
          items={preview.items}
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
                    const items = contentByTopic[t.id] || [];
                    const published = items.some((c) => c.published_at);
                    const color = RUBRIC_COLORS[t.rubric] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
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
                          {t.rubric}
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

// ── Preview modal ──────────────────────────────────────────────────

function PreviewModal({
  topic,
  items,
  onClose,
}: {
  topic: Topic;
  items: ContentItem[];
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
              {topic.plan_date} · {topic.rubric}
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
          <p className={`${MONO} text-[11px] text-gray-500 uppercase tracking-wider`}>Totale</p>
          <p className="text-2xl font-semibold text-gray-100 mt-1">${costs.totalUsd.toFixed(2)}</p>
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
