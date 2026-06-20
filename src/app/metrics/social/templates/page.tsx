"use client";

// Standalone Templates gallery at /metrics/social/templates.
//
// This is the "vetrina" that mirrors EXACTLY what the renderer produces: it
// reads the catalog + static previews from the shared registries, so when a
// template HTML builder changes in src/lib/social/ped/builders or
// src/lib/social/video-stories, this page updates automatically. No more
// hand-maintained template list with invented ids.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanCss = (css || "").replace(/@import\s+url\([^)]+\);?\s*/g, "");
  const fullHtml = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"><style>${cleanCss}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;

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

export default function TemplatesPage() {
  const router = useRouter();
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(ALL_CATALOG[0]?.id ?? "");

  useEffect(() => {
    const key = sessionStorage.getItem("metrics_key");
    if (!key) {
      router.replace("/metrics");
      return;
    }
    setAuthKey(key);
  }, [router]);

  if (!authKey) return null;

  const tpl = ALL_CATALOG.find((t) => t.id === selected) ?? ALL_CATALOG[0];
  const previews = ALL_PREVIEWS[tpl.id];

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/[0.06]">
        <button
          onClick={() => router.push("/metrics/social")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-100">Templates Social</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Anteprime reali dei template usati dal pipeline
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* ── Left: template list ── */}
        <aside className="w-80 shrink-0 border-r border-white/[0.06] overflow-y-auto py-3">
          {ALL_CATALOG.map((t) => {
            const isSel = t.id === selected;
            const st = STATUS_STYLE[t.status] || STATUS_STYLE.planned;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-l-2 ${
                  isSel
                    ? "bg-indigo-500/[0.08] border-indigo-400"
                    : "border-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSel ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  <Layers className={`w-4 h-4 ${isSel ? "text-indigo-300" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-medium truncate ${isSel ? "text-gray-100" : "text-gray-300"}`}>
                      {t.name}
                    </h3>
                    <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${st.bg}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className={`${MONO} text-[10px] text-gray-600 mt-0.5 truncate`}>{t.id}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── Right: selected template detail ── */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-gray-100">{tpl.name}</h2>
            <span className={`${MONO} text-[10px] text-gray-700 bg-white/[0.04] px-2 py-0.5 rounded`}>{tpl.id}</span>
            <span className={`${MONO} text-[10px] text-gray-600`}>{tpl.formats.length} formati</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">{tpl.description}</p>

          {previews && previews.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span className={`${MONO} text-[11px] text-gray-400 uppercase tracking-wider`}>
                  Anteprima reale — {previews.length} slide
                </span>
              </div>
              <div className="flex flex-wrap gap-6">
                {previews.map((p) => (
                  <div key={p.label} className="shrink-0 flex flex-col items-center">
                    <p className={`${MONO} text-[10px] text-gray-500 mb-2`}>{p.label}</p>
                    <div
                      style={{
                        width: p.frameW * 1.4,
                        height: p.frameH * 1.4,
                        borderRadius: 14,
                        overflow: "hidden",
                        boxShadow: "0 8px 40px rgba(0,0,0,.5)",
                      }}
                    >
                      <TemplateFrame html={p.html()} w={p.w} h={p.h} scale={p.scale * 1.4} css={p.css} />
                    </div>
                    <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>
                      {p.w} × {p.h}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.15]">
              <p className={`${MONO} text-[11px] text-amber-400`}>
                Anteprima non ancora disponibile — il builder per questo template non ha slide statiche definite.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
