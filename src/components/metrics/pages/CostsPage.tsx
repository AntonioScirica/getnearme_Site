"use client";

import { useMemo, useState } from "react";
import {
  Video,
  Film,
  ImageIcon,
  Images,
  FileText,
  PenLine,
  Search,
  AlertCircle,
  ChevronDown,
  Scissors,
  Sunset,
  HardHat,
} from "lucide-react";
import { MONO } from "../types";

type FeatureCost = {
  item: string;
  provider: string;
  unit: string;
  unitCost: number;
  note?: string;
  deprecated?: boolean;
};

type Feature = {
  id: string;
  title: string;
  where: string;
  perUseCost: number;
  perUseCostMax?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: FeatColor;
  costs: FeatureCost[];
};

type FeatColor = "indigo" | "emerald" | "violet" | "sky" | "pink" | "amber" | "rose" | "cyan" | "orange" | "lime";

const FEAT_COLORS: Record<FeatColor, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  violet: "bg-violet-500/10 text-violet-400",
  sky: "bg-sky-500/10 text-sky-400",
  pink: "bg-pink-500/10 text-pink-400",
  amber: "bg-amber-500/10 text-amber-400",
  rose: "bg-rose-500/10 text-rose-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
  orange: "bg-orange-500/10 text-orange-400",
  lime: "bg-lime-500/10 text-lime-400",
};

const FEATURES: Feature[] = [
  {
    id: "ai-staging",
    title: "Foto AI Staging",
    where: "Extension side-panel + Dashboard sito",
    perUseCost: 0.036,
    icon: ImageIcon,
    color: "emerald",
    costs: [
      { item: "Staging standard (Imagen 3 Fast)", provider: "Replicate", unit: "immagine", unitCost: 0.036, note: "google/nano-banana. 8-15s. Stili: modern, nordic, luxury, boho, daynight, empty, custom." },
      { item: "Staging high-fidelity (Imagen 3 Pro)", provider: "Replicate", unit: "immagine", unitCost: 0.055, note: "google/nano-banana-pro. Text-to-image only (no image_input). Usata per render premium.", deprecated: true },
      { item: "Storage output", provider: "Cloudflare R2", unit: "foto", unitCost: 0.0001 },
    ],
  },
  {
    id: "video-before-after",
    title: "Video AI - Before/After",
    where: "Wizard video AI, template «Before/After»",
    perUseCost: 1.069,
    icon: Film,
    color: "indigo",
    costs: [
      { item: "Generazione video (Kling O1 Standard)", provider: "fal.ai", unit: "video 10s", unitCost: 1.03, note: "First-last-frame. $0.112/s x 10s. Transizione stanza vuota -> arredata." },
      { item: "Foto staging input", provider: "Replicate", unit: "1 foto", unitCost: 0.036, note: "Genera foto arredata come frame finale del video." },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
      { item: "Alternativa (Wan 2.1 FLF)", provider: "fal.ai", unit: "video 8s", unitCost: 0.18, note: "Open-source, 720p, motion meno preciso.", deprecated: true },
      { item: "Alternativa (Veo 3.1 Lite)", provider: "fal.ai", unit: "video 8s", unitCost: 0.14, note: "Motion insufficiente per B/A.", deprecated: true },
    ],
  },
  {
    id: "video-day-night",
    title: "Video AI - Giorno/Notte",
    where: "Wizard video AI, template «Giorno/Notte»",
    perUseCost: 1.069,
    icon: Sunset,
    color: "amber",
    costs: [
      { item: "Generazione video (Kling O1 Standard)", provider: "fal.ai", unit: "video 10s", unitCost: 1.03, note: "Transizione giorno -> notte o viceversa." },
      { item: "Foto daynight input", provider: "Replicate", unit: "1 foto", unitCost: 0.036 },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
    ],
  },
  {
    id: "video-construction",
    title: "Video AI - Ristrutturazione",
    where: "Wizard video AI, template «Ristrutturazione»",
    perUseCost: 1.069,
    icon: HardHat,
    color: "orange",
    costs: [
      { item: "Generazione video (Kling O1 Standard)", provider: "fal.ai", unit: "video 10s", unitCost: 1.03, note: "Transizione pre-ristrutturazione -> post." },
      { item: "Foto staging input", provider: "Replicate", unit: "1 foto", unitCost: 0.036 },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
    ],
  },
  {
    id: "video-walkthrough",
    title: "Video AI - Walkthrough",
    where: "Wizard video AI, template «Da immagini a video»",
    perUseCost: 0.261,
    perUseCostMax: 1.551,
    icon: Images,
    color: "pink",
    costs: [
      { item: "Animazione foto (Kling 1.6 Standard)", provider: "fal.ai", unit: "clip 5s / foto", unitCost: 0.258, note: "Image-to-video, $0.056/s x 5s. Da 1 a 6 foto: €0.258 (1) -> €1.548 (6)." },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003, note: "Concatena clip animate con musica e transizioni." },
    ],
  },
  {
    id: "video-classic",
    title: "Video AI - Avatar parlante (Classic)",
    where: "Wizard video AI, template «Classic»",
    perUseCost: 0.32,
    icon: Video,
    color: "violet",
    costs: [
      { item: "Lip-sync avatar", provider: "HeyGen", unit: "video ~30s", unitCost: 0.30, note: "Modello business, costo fisso per video." },
      { item: "Voce italiana (TTS)", provider: "ElevenLabs", unit: "script ~150 parole", unitCost: 0.015 },
      { item: "Copy video", provider: "Anthropic (Claude 3 Haiku)", unit: "script", unitCost: 0.001 },
      { item: "Vision frame clip", provider: "Groq (llama-4-scout)", unit: "~5 frame/clip", unitCost: 0.0005 },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
    ],
  },
  {
    id: "video-split",
    title: "Video AI - Avatar parlante (Split)",
    where: "Wizard video AI, template «Split»",
    perUseCost: 0.32,
    icon: Video,
    color: "cyan",
    costs: [
      { item: "Lip-sync avatar", provider: "HeyGen", unit: "video ~30s", unitCost: 0.30 },
      { item: "Voce italiana (TTS)", provider: "ElevenLabs", unit: "script ~150 parole", unitCost: 0.015 },
      { item: "Copy video", provider: "Anthropic (Claude 3 Haiku)", unit: "script", unitCost: 0.001 },
      { item: "Vision frame clip", provider: "Groq (llama-4-scout)", unit: "~5 frame/clip", unitCost: 0.0005 },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
    ],
  },
  {
    id: "video-sottotitoli",
    title: "Video AI - Sottotitoli",
    where: "Wizard video AI, template «Sottotitoli»",
    perUseCost: 0.019,
    icon: FileText,
    color: "sky",
    costs: [
      { item: "Voce italiana (TTS)", provider: "ElevenLabs", unit: "script ~150 parole", unitCost: 0.015 },
      { item: "Copy + word-timestamps", provider: "Anthropic (Claude 3 Haiku)", unit: "script", unitCost: 0.001 },
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003 },
    ],
  },
  {
    id: "video-montaggio",
    title: "Video AI - Montaggio",
    where: "Wizard video AI, template «Montaggio»",
    perUseCost: 0.003,
    icon: Scissors,
    color: "lime",
    costs: [
      { item: "Compositing ffmpeg", provider: "AWS Lambda", unit: "render", unitCost: 0.003, note: "Solo concatenazione clip + musica. Nessun AI." },
    ],
  },
  {
    id: "property-analysis",
    title: "Analisi descrizione annuncio",
    where: "Extension side-panel, sezione «Analisi descrizione»",
    perUseCost: 0.0001,
    icon: PenLine,
    color: "rose",
    costs: [
      { item: "Valutazione testo annuncio", provider: "Groq (llama-3.1-8b)", unit: "analisi", unitCost: 0.0001, note: "~1500 token. Free tier copre il 99% dell'uso." },
    ],
  },
];

const eur = (n: number) => {
  if (n === 0) return "Gratis";
  if (n < 0.01) return `€${n.toFixed(4)}`;
  if (n < 1) return `€${n.toFixed(3)}`;
  return `€${n.toFixed(2)}`;
};

export default function CostsPage() {
  const [search, setSearch] = useState("");
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setOpenIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEATURES.filter(f => {
      if (!q) return true;
      return f.title.toLowerCase().includes(q) ||
        f.where.toLowerCase().includes(q) ||
        f.costs.some(c => c.item.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q));
    });
  }, [search]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-100 mb-1">Costi AI per feature</h1>
        <p className={`${MONO} text-xs text-gray-500`}>Costo reale per singola consegna, tutti i template foto e video</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca feature, provider..."
            className={`${MONO} w-full bg-[#161920] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors`}
          />
        </div>
        <label className={`${MONO} flex items-center gap-2 text-xs text-gray-400 px-3 py-2.5 bg-[#161920] border border-white/[0.08] rounded-lg cursor-pointer hover:border-white/20 transition-colors`}>
          <input type="checkbox" checked={showDeprecated} onChange={(e) => setShowDeprecated(e.target.checked)} className="accent-indigo-500" />
          Mostra deprecate
        </label>
      </div>

      <div className="space-y-2">
        {filtered.map((feat) => {
          const Icon = feat.icon;
          const isOpen = openIds.has(feat.id);
          const visibleCosts = feat.costs.filter(c => !c.deprecated || showDeprecated);
          return (
            <div key={feat.id} className="bg-[#161920] rounded-xl border border-white/[0.08] overflow-hidden">
              <button
                onClick={() => toggle(feat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${FEAT_COLORS[feat.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">{feat.title}</p>
                  <p className={`${MONO} text-[10px] text-gray-500 truncate`}>{feat.where}</p>
                </div>
                <div className="text-right shrink-0 mr-2">
                  <p className={`${MONO} text-lg font-semibold text-gray-100`}>
                    {feat.perUseCostMax
                      ? `${eur(feat.perUseCost)} - ${eur(feat.perUseCostMax)}`
                      : eur(feat.perUseCost)}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-white/[0.06]">
                  <div className={`${MONO} hidden md:grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-4 px-5 py-2 text-[10px] uppercase tracking-wider text-gray-600 bg-white/[0.02]`}>
                    <div>Voce</div>
                    <div>Provider</div>
                    <div>Unita</div>
                    <div className="text-right">Costo</div>
                  </div>
                  {visibleCosts.map((c, idx) => (
                    <div key={idx} className={`border-b border-white/[0.04] last:border-0 ${c.deprecated ? "opacity-50" : ""}`}>
                      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-100 font-medium truncate">{c.item}</p>
                            {c.deprecated && <span className={`${MONO} text-[9px] uppercase px-1.5 py-0.5 rounded border bg-gray-500/15 text-gray-400 border-gray-500/30`}>ALT</span>}
                          </div>
                          {c.note && <p className={`${MONO} text-[11px] text-gray-500 mt-0.5 leading-relaxed`}>{c.note}</p>}
                        </div>
                        <div className={`${MONO} text-xs text-gray-400`}>{c.provider}</div>
                        <div className={`${MONO} text-xs text-gray-500`}>{c.unit}</div>
                        <div className={`${MONO} text-sm text-gray-100 text-right font-medium`}>{eur(c.unitCost)}</div>
                      </div>
                      <div className="md:hidden px-5 py-3 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-100 font-medium">{c.item}</p>
                            <p className={`${MONO} text-[11px] text-gray-500`}>{c.provider} · {c.unit}</p>
                          </div>
                          <p className={`${MONO} text-sm text-gray-100 font-medium shrink-0`}>{eur(c.unitCost)}</p>
                        </div>
                        {c.note && <p className={`${MONO} text-[11px] text-gray-500 leading-relaxed`}>{c.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className={`${MONO} text-xs text-amber-300/80 leading-relaxed`}>
          Prezzi in EUR. Il «costo per consegna» e la somma delle voci non deprecate.
          Walkthrough scala con numero foto (1-6). Aggiornare qui quando cambiano i provider.
        </p>
      </div>
    </div>
  );
}
