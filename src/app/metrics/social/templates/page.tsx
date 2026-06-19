"use client";

// Standalone Templates gallery at /metrics/social/templates.
//
// This is the "vetrina" that mirrors EXACTLY what the renderer produces: it
// reads the catalog + static previews from the shared registries, so when a
// template HTML builder changes in src/lib/social/ped/builders or
// src/lib/social/video-stories, this page updates automatically. No more
// hand-maintained template list with invented ids.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Layers } from "lucide-react";
import {
  PED_CATALOG,
  STATIC_PREVIEWS as PED_STATIC_PREVIEWS,
  type TplPreview,
  type TemplateCatalogEntry,
} from "@/lib/social/ped/builders/index";
import { PED_CSS } from "@/lib/social/ped/client-css";
import {
  VIDEO_STORY_CATALOG,
  VIDEO_STORY_PREVIEWS,
} from "@/lib/social/video-stories/index";

const MONO = "font-[family-name:var(--font-jetbrains)]";

// Merge PED + video/story/stats catalogs into one ordered list. PED first
// (the published formats), then video (planned/partial), then stats.
const ALL_CATALOG: TemplateCatalogEntry[] = [
  ...PED_CATALOG,
  ...VIDEO_STORY_CATALOG,
];

// Merge the preview maps the same way.
const ALL_PREVIEWS: Record<string, TplPreview[]> = {
  ...PED_STATIC_PREVIEWS,
  ...VIDEO_STORY_PREVIEWS,
};

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  ready: { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Pronto" },
  planned: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Pianificato" },
  wip: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "In sviluppo" },
};

const FORMAT_ICON: Record<string, string> = {
  carousel: "📑",
  feed: "🖼",
  image: "🖼",
  story: "📱",
  video: "🎬",
  reels: "🎬",
};

// PED preview slides use the client PED_CSS; video/story previews already
// carry their own css on each preview object. Patch PED entries so the
// gallery iframe renders with the right stylesheet.
for (const id of Object.keys(PED_STATIC_PREVIEWS)) {
  ALL_PREVIEWS[id] = ALL_PREVIEWS[id].map((p) => ({ ...p, css: PED_CSS }));
}

function TemplateFrame({
  html,
  w,
  h,
  scale,
  css,
}: {
  html: string;
  w: number;
  h: number;
  scale: number;
  css?: string;
}) {
  const srcDoc = `<!DOCTYPE html><html><head><style>${css || ""}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;
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

export default function TemplatesPage() {
  const router = useRouter();
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(PED_CATALOG[0]?.id ?? null);

  useEffect(() => {
    const key = sessionStorage.getItem("metrics_key");
    if (!key) {
      router.replace("/metrics");
      return;
    }
    setAuthKey(key);
  }, [router]);

  if (!authKey) return null;

  const readyCount = ALL_CATALOG.filter((t) => t.status === "ready").length;
  const totalFormats = ALL_CATALOG.reduce((sum, t) => sum + t.formats.length, 0);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/metrics/social")}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Templates Social</h1>
            <p className="text-sm text-gray-500 mt-1">
              Anteprime reali dei template usati dal pipeline — ciò che vedi qui è
              esattamente ciò che viene pubblicato
            </p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-gray-100`}>{ALL_CATALOG.length}</p>
            <p className="text-xs text-gray-500 mt-1">Template totali</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-emerald-400`}>{readyCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pronti</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-gray-100`}>{totalFormats}</p>
            <p className="text-xs text-gray-500 mt-1">Formati totali</p>
          </div>
        </div>

        {/* Template cards */}
        <div className="space-y-4">
          {ALL_CATALOG.map((tpl) => {
            const isExpanded = expanded === tpl.id;
            const st = STATUS_STYLE[tpl.status] || STATUS_STYLE.planned;
            const previews = ALL_PREVIEWS[tpl.id];
            return (
              <div
                key={tpl.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : tpl.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-100">{tpl.name}</h3>
                      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.bg}`}>
                        {st.label}
                      </span>
                      <span className={`${MONO} text-[10px] text-gray-600`}>
                        {tpl.formats.length} formati
                      </span>
                      <span className={`${MONO} text-[10px] text-gray-700 bg-white/[0.04] px-1.5 py-0.5 rounded`}>
                        {tpl.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{tpl.description}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-600 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] px-5 pb-5">
                    {/* Formats */}
                    <div className="mt-4 space-y-3">
                      {tpl.formats.map((fmt) => (
                        <div key={fmt.label} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm">{FORMAT_ICON[fmt.type] || "📄"}</span>
                            <span className={`${MONO} text-xs font-medium text-gray-300`}>{fmt.label}</span>
                            <span className={`${MONO} text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded`}>
                              {fmt.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {fmt.slides.map((slide, i) => (
                              <span key={i} className={`${MONO} text-[10px] text-gray-500 bg-white/[0.03] px-2 py-1 rounded`}>
                                {i + 1}. {slide}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real previews from the registry */}
                    {previews && previews.length > 0 ? (
                      <div className="mt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span className={`${MONO} text-[11px] text-gray-400 uppercase tracking-wider`}>
                            Anteprima reale ({previews.length} slide)
                          </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-3">
                          {previews.map((p) => (
                            <div key={p.label} className="shrink-0 flex flex-col items-center">
                              <p className={`${MONO} text-[10px] text-gray-500 mb-1.5`}>{p.label}</p>
                              <div
                                style={{
                                  width: p.frameW,
                                  height: p.frameH,
                                  borderRadius: 12,
                                  overflow: "hidden",
                                  boxShadow: "0 8px 40px rgba(0,0,0,.5)",
                                }}
                              >
                                <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale} css={p.css} />
                              </div>
                              <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>
                                {p.w} × {p.h}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 px-4 py-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.15]">
                        <p className={`${MONO} text-[11px] text-amber-400`}>
                          Anteprima non ancora disponibile — il builder per questo template non ha slide statiche definite.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className={`${MONO} text-[10px] text-gray-700 mt-8 text-center`}>
          I template e le anteprime sono generati dai registri in{" "}
          <code className="text-gray-600">src/lib/social/ped/builders</code> e{" "}
          <code className="text-gray-600">src/lib/social/video-stories</code>.
          Modificare un builder aggiorna automaticamente questa pagina.
        </p>
      </div>
    </div>
  );
}
