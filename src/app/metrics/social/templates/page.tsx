"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Eye, Layers } from "lucide-react";

const MONO = "font-[family-name:var(--font-jetbrains)]";

const TEMPLATES = [
  {
    id: "before-after",
    name: "Prima / Dopo",
    description: "AI Virtual Staging con slider before/after e CTA neobrutalist",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "carousel",
        slides: [
          { name: "Slider animato", desc: "Before/after con divider che si muove 5%→95%, 15s ease-in-out" },
          { name: "CTA", desc: "Neobrutalist — badge AI Staging, feature pills, Link in bio" },
        ],
      },
      {
        label: "Story 1080×1920",
        type: "image",
        slides: [
          { name: "CTA + foto card", desc: "Neobrutalist con foto before/after incastonata, Guarda nel profilo" },
        ],
      },
      {
        label: "Reels 1080×1920",
        type: "video",
        slides: [
          { name: "Slider animato 15s", desc: "Before/after full-screen con divider animato, safe area compliant" },
        ],
      },
    ],
    rubric: "staging",
    status: "ready" as const,
    pipeline: "Replicate API → staging → render template → publish",
  },
  {
    id: "feature-demo",
    name: "Feature Demo",
    description: "Dimostrazione di una feature GetNearMe con screenshot e spiegazione",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "carousel",
        slides: [
          { name: "Screenshot feature", desc: "Screenshot annotato della feature in uso" },
          { name: "CTA", desc: "Neobrutalist CTA con link al profilo" },
        ],
      },
      {
        label: "Story 1080×1920",
        type: "image",
        slides: [
          { name: "Screenshot + CTA", desc: "Combinato per story format" },
        ],
      },
    ],
    rubric: "demo",
    status: "planned" as const,
    pipeline: "Screenshot API → annotate → render → publish",
  },
  {
    id: "tips",
    name: "Tips Annunci",
    description: "Consigli per migliorare gli annunci immobiliari online",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "carousel",
        slides: [
          { name: "Tip card", desc: "Titolo tip + icona + spiegazione breve" },
          { name: "CTA", desc: "Provalo gratis con GetNearMe" },
        ],
      },
    ],
    rubric: "tips",
    status: "planned" as const,
    pipeline: "AI generate → render template → publish",
  },
  {
    id: "stats",
    name: "Statistiche",
    description: "Dati e statistiche sul mercato immobiliare italiano",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "carousel",
        slides: [
          { name: "Stat card", desc: "Numero grande + contesto + fonte" },
          { name: "CTA", desc: "Analizza la tua zona con GetNearMe" },
        ],
      },
    ],
    rubric: "stats",
    status: "planned" as const,
    pipeline: "Data fetch → format → render → publish",
  },
  {
    id: "quote",
    name: "Citazione",
    description: "Quote e insight per agenti immobiliari",
    formats: [
      {
        label: "Feed 1080×1350",
        type: "image",
        slides: [{ name: "Quote card", desc: "Citazione con sfondo brand" }],
      },
      {
        label: "Story 1080×1920",
        type: "image",
        slides: [{ name: "Quote card", desc: "Citazione verticale" }],
      },
    ],
    rubric: "quote",
    status: "planned" as const,
    pipeline: "AI generate → render → publish",
  },
];

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  ready: { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "Pronto" },
  planned: { bg: "bg-amber-500/20 text-amber-400 border-amber-500/30", label: "Pianificato" },
  wip: { bg: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "In sviluppo" },
};

const FORMAT_ICON: Record<string, string> = {
  carousel: "📑",
  image: "🖼",
  video: "🎬",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("before-after");

  useEffect(() => {
    const key = sessionStorage.getItem("metrics_key");
    if (!key) {
      router.replace("/metrics");
      return;
    }
    setAuthKey(key);
  }, [router]);

  if (!authKey) return null;

  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-200">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/metrics/social")}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Templates Social</h1>
            <p className="text-sm text-gray-500 mt-1">
              Template per la generazione automatica di post — target agenti immobiliari
            </p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-gray-100`}>{TEMPLATES.length}</p>
            <p className="text-xs text-gray-500 mt-1">Template totali</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-emerald-400`}>
              {TEMPLATES.filter((t) => t.status === "ready").length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pronti</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
            <p className={`${MONO} text-2xl font-bold text-gray-100`}>
              {TEMPLATES.reduce((sum, t) => sum + t.formats.length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Formati totali</p>
          </div>
        </div>

        {/* Template cards */}
        <div className="space-y-4">
          {TEMPLATES.map((tpl) => {
            const isExpanded = expanded === tpl.id;
            const st = STATUS_STYLE[tpl.status] || STATUS_STYLE.planned;
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
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-100">{tpl.name}</h3>
                      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${st.bg}`}>
                        {st.label}
                      </span>
                      <span className={`${MONO} text-[10px] text-gray-600`}>
                        {tpl.formats.length} formati
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{tpl.description}</p>
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
                    {/* Pipeline */}
                    <div className="mt-4 mb-4 flex items-center gap-2">
                      <span className={`${MONO} text-[10px] text-gray-600 uppercase tracking-wider`}>Pipeline:</span>
                      <span className={`${MONO} text-xs text-gray-400`}>{tpl.pipeline}</span>
                    </div>

                    {/* Formats */}
                    <div className="space-y-3">
                      {tpl.formats.map((fmt) => (
                        <div key={fmt.label} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm">{FORMAT_ICON[fmt.type] || "📄"}</span>
                            <span className={`${MONO} text-xs font-medium text-gray-300`}>{fmt.label}</span>
                            <span className={`${MONO} text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded`}>
                              {fmt.type}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {fmt.slides.map((slide, i) => (
                              <div key={i} className="flex items-start gap-3 pl-2">
                                <span className={`${MONO} text-[10px] text-gray-600 mt-0.5`}>{i + 1}</span>
                                <div>
                                  <p className="text-sm text-gray-300 font-medium">{slide.name}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">{slide.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {tpl.status === "ready" && (
                      <div className="mt-4 flex gap-3">
                        <a
                          href={`/lib/social/carousel/templates/preview-${tpl.id}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview HTML
                        </a>
                        <a
                          href={`/api/social/data?view=calendar`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Vedi nel calendario
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
