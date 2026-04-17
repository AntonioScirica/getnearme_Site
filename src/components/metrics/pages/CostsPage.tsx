"use client";

import { useMemo, useState } from "react";
import {
  Video,
  Film,
  ImageIcon,
  FileText,
  PenLine,
  Search,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { MONO } from "../types";

// ============================================================
// Cost data — organized by USER-FACING FEATURE
// ============================================================
// Each feature lists the AI costs we sustain to deliver it + a clear
// "why" (what the user actually gets). Update prices here when a provider
// changes rates — this file is the single source of truth.
// Prices are in EUR (USD × 0.92 approx).
// ============================================================

type FeatureCost = {
  item: string;                // cosa paghiamo
  provider: string;            // a chi
  unit: string;                // per quale unità
  unitCost: number;            // EUR
  note?: string;
  deprecated?: boolean;
};

type Feature = {
  id: string;
  title: string;               // il nome user-facing
  where: string;               // dove nell'app lo vede l'utente
  why: string;                 // perché serve / cosa offre
  perUseCost: number;          // costo totale stimato per una singola consegna (€)
  icon: React.ComponentType<{ className?: string }>;
  color: FeatColor;
  costs: FeatureCost[];
};

type FeatColor = "indigo" | "emerald" | "violet" | "sky" | "pink" | "amber";

const FEAT_COLORS: Record<FeatColor, string> = {
  indigo: "bg-indigo-500/10 text-indigo-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  violet: "bg-violet-500/10 text-violet-400",
  sky: "bg-sky-500/10 text-sky-400",
  pink: "bg-pink-500/10 text-pink-400",
  amber: "bg-amber-500/10 text-amber-400",
};

const FEATURES: Feature[] = [
  // ────────────────────────────────────────────────────────────
  {
    id: "video-before-after",
    title: "Video AI — Before / After",
    where: "Wizard video AI · template «Before/After» (stanza vuota → arredata)",
    why: "Trasforma due foto statiche in un video 15s che mostra il progressivo arredamento dell'immobile. Usato per annunci social ad alto impatto visivo.",
    perUseCost: 1.03,
    icon: Film,
    color: "indigo",
    costs: [
      {
        item: "Generazione video (Kling O1 Standard)",
        provider: "fal.ai",
        unit: "video 10s",
        unitCost: 1.03,
        note: "Modello first-last-frame. $0.112/s × 10s. Motion migliore per transizioni stanza vuota → arredata.",
      },
      {
        item: "Compositing finale ffmpeg",
        provider: "AWS Lambda",
        unit: "render ~30s",
        unitCost: 0.003,
        note: "Lambda gnm-ai-video-ffmpeg (ARM Graviton, 3 GB). Aggiunge freeze frame + label PRIMA/DOPO.",
      },
      {
        item: "Storage output temporaneo",
        provider: "Cloudflare R2",
        unit: "MP4 finale",
        unitCost: 0.0002,
        note: "File cancellato dopo download utente. Zero egress fee.",
      },
      {
        item: "Alternativa economica (Wan 2.1 FLF)",
        provider: "fal.ai",
        unit: "video 8s",
        unitCost: 0.18,
        note: "Selezionabile via AI_VIDEO_MODEL=wan. Open-source, 720p, più economico ma motion meno preciso.",
        deprecated: true,
      },
      {
        item: "Alternativa storica (Veo 3.1 Lite)",
        provider: "fal.ai",
        unit: "video 8s",
        unitCost: 0.14,
        note: "Qualità motion insufficiente per before/after. Mantenuto come config flag.",
        deprecated: true,
      },
    ],
  },
  // ────────────────────────────────────────────────────────────
  {
    id: "video-avatar",
    title: "Video AI — Avatar parlante",
    where: "Wizard video AI · template «Classic» e «Split»",
    why: "Un avatar HeyGen parla in italiano raccontando l'immobile con un copy generato AI dalle clip caricate dall'agente.",
    perUseCost: 0.32,
    icon: Video,
    color: "violet",
    costs: [
      {
        item: "Lip-sync avatar",
        provider: "HeyGen",
        unit: "video ~30s",
        unitCost: 0.30,
        note: "Modello business. Costo fisso per video nel nostro piano.",
      },
      {
        item: "Voce italiana (TTS)",
        provider: "ElevenLabs",
        unit: "script ~150 parole",
        unitCost: 0.015,
        note: "Modello eleven_multilingual_v2. Qualità nettamente superiore al TTS nativo HeyGen in italiano.",
      },
      {
        item: "Copy del video",
        provider: "Anthropic (Claude 3 Haiku)",
        unit: "script generato",
        unitCost: 0.001,
        note: "Genera lo script a partire dai dati immobile + caption frame delle clip.",
      },
      {
        item: "Vision frame clip",
        provider: "Groq (llama-4-scout)",
        unit: "~5 frame per clip",
        unitCost: 0.0005,
        note: "Descrive in breve ogni clip per arricchire lo script. Free tier copre quasi tutto.",
      },
      {
        item: "Compositing ffmpeg",
        provider: "AWS Lambda",
        unit: "render",
        unitCost: 0.003,
      },
      {
        item: "Storage output + clip intermedie",
        provider: "Cloudflare R2",
        unit: "bundle",
        unitCost: 0.0005,
      },
    ],
  },
  // ────────────────────────────────────────────────────────────
  {
    id: "video-walkthrough",
    title: "Video AI — Walkthrough & Sottotitoli",
    where: "Wizard video AI · template «Walkthrough» e «Sottotitoli»",
    why: "Monta le clip caricate dall'utente in un unico video con musica, transizioni e sottotitoli sincronizzati. Nessun avatar, nessuna generazione frame.",
    perUseCost: 0.019,
    icon: FileText,
    color: "sky",
    costs: [
      {
        item: "Voce italiana sottotitoli (TTS)",
        provider: "ElevenLabs",
        unit: "script ~150 parole",
        unitCost: 0.015,
        note: "Solo template «Sottotitoli». Il walkthrough usa soltanto musica di sottofondo.",
      },
      {
        item: "Copy + word-timestamps",
        provider: "Anthropic (Claude 3 Haiku)",
        unit: "script",
        unitCost: 0.001,
      },
      {
        item: "Compositing ffmpeg",
        provider: "AWS Lambda",
        unit: "render",
        unitCost: 0.003,
      },
      {
        item: "Storage output",
        provider: "Cloudflare R2",
        unit: "MP4",
        unitCost: 0.0002,
      },
    ],
  },
  // ────────────────────────────────────────────────────────────
  {
    id: "ai-staging",
    title: "AI Staging foto",
    where: "Side-panel · funzione «Staging AI» (+ usata anche come step 1 del template video «AI Staging»)",
    why: "Trasforma una foto di stanza vuota in arredata con stili selezionabili. Output usato in annunci, social post e come frame iniziale dei video Before/After.",
    perUseCost: 0.036,
    icon: ImageIcon,
    color: "emerald",
    costs: [
      {
        item: "Staging standard",
        provider: "Replicate (google/nano-banana)",
        unit: "immagine",
        unitCost: 0.036,
        note: "Google Imagen 3 Fast. Tempo medio 8-15s. Supporta image_input (foto originale come riferimento).",
      },
      {
        item: "Staging high-fidelity",
        provider: "Replicate (google/nano-banana-pro)",
        unit: "immagine",
        unitCost: 0.055,
        note: "Variante Pro, solo text-to-image (no image_input). Usata quando servono render più curati.",
      },
      {
        item: "Storage output",
        provider: "Cloudflare R2",
        unit: "foto",
        unitCost: 0.0001,
      },
    ],
  },
  // ────────────────────────────────────────────────────────────
  {
    id: "property-analysis",
    title: "Analisi qualità descrizione annuncio",
    where: "Side-panel · sezione «Analisi descrizione» su ogni annuncio immobiliare",
    why: "Valuta il testo dell'annuncio (completezza, chiarezza, keyword) e restituisce score 1-10 + punti di forza e debolezze. Aiuta l'agente a migliorare il copy.",
    perUseCost: 0.0001,
    icon: PenLine,
    color: "pink",
    costs: [
      {
        item: "Valutazione testo annuncio",
        provider: "Groq (llama-3.1-8b-instant)",
        unit: "analisi",
        unitCost: 0.0001,
        note: "~1500 token totali. Modello veloce e molto economico, sufficiente per punteggio + summary breve. Free tier Groq copre il 99% dell'uso.",
      },
    ],
  },
];

// ============================================================
// Plan / margin data
// ============================================================

type Plan = {
  name: string;
  priceMonthly: number;        // EUR
  priceAnnual?: number;        // EUR
  features: string[];
  variableCost: number;        // EUR/utente/mese
};

const PLANS: Plan[] = [
  {
    name: "Free",
    priceMonthly: 0,
    features: ["Crediti onboarding", "10 analisi/mese", "Nessun export PDF"],
    variableCost: 0.08,
  },
  {
    name: "Agency Monthly",
    priceMonthly: 29,
    features: ["Analisi illimitate", "4 video AI/mese", "20 foto AI staging", "PDF export"],
    variableCost: 5.6,
  },
  {
    name: "Agency Quarterly",
    priceMonthly: 24,
    priceAnnual: 72,
    features: ["Analisi illimitate", "8 video AI/mese", "40 foto AI staging", "PDF export"],
    variableCost: 9.8,
  },
  {
    name: "Agency Annual",
    priceMonthly: 19,
    priceAnnual: 228,
    features: ["Analisi illimitate", "12 video AI/mese", "60 foto AI staging", "PDF export"],
    variableCost: 13.2,
  },
  {
    name: "Ambassador",
    priceMonthly: 0,
    features: ["15 token shared/mese (photos + videos + posts + reports)", "Account dedicato"],
    variableCost: 6.5,
  },
];

// ============================================================
// Helpers
// ============================================================

const eur = (n: number) => {
  if (n === 0) return "Gratis";
  if (n < 0.01) return `€${n.toFixed(4)}`;
  if (n < 1) return `€${n.toFixed(3)}`;
  if (n < 100) return `€${n.toFixed(2)}`;
  return `€${n.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
};

const marginColor = (pct: number) => {
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 50) return "text-emerald-400/80";
  if (pct >= 30) return "text-amber-400";
  return "text-red-400";
};

// ============================================================
// Component
// ============================================================

export default function CostsPage() {
  const [search, setSearch] = useState("");
  const [showDeprecated, setShowDeprecated] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEATURES.map((f) => ({
      ...f,
      costs: f.costs.filter((c) => {
        if (c.deprecated && !showDeprecated) return false;
        if (!q) return true;
        return (
          c.item.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q) ||
          (c.note || "").toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q)
        );
      }),
    })).filter((f) => f.costs.length > 0);
  }, [search, showDeprecated]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-100 mb-1">
          Costi AI per feature
        </h1>
        <p className={`${MONO} text-xs text-gray-500`}>
          Dove e perché spendiamo sui modelli AI · costo reale per singola consegna
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca feature, provider, nota…"
            className={`${MONO} w-full bg-[#161920] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors`}
          />
        </div>
        <label
          className={`${MONO} flex items-center gap-2 text-xs text-gray-400 px-3 py-2.5 bg-[#161920] border border-white/[0.08] rounded-lg cursor-pointer hover:border-white/20 transition-colors`}
        >
          <input
            type="checkbox"
            checked={showDeprecated}
            onChange={(e) => setShowDeprecated(e.target.checked)}
            className="accent-indigo-500"
          />
          Mostra alternative / deprecate
        </label>
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {filtered.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="bg-[#161920] rounded-xl border border-white/[0.08] overflow-hidden"
            >
              {/* Feature header */}
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${FEAT_COLORS[feat.color]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-100 mb-1">
                      {feat.title}
                    </h2>
                    <div className="space-y-1.5">
                      <p className={`${MONO} text-[11px] text-gray-400`}>
                        <span className="text-gray-600 uppercase tracking-wider mr-2">
                          Dove
                        </span>
                        {feat.where}
                      </p>
                      <p className={`${MONO} text-[11px] text-gray-400 leading-relaxed`}>
                        <span className="text-gray-600 uppercase tracking-wider mr-2">
                          Perché
                        </span>
                        {feat.why}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p
                      className={`${MONO} text-[10px] uppercase tracking-wider text-gray-600`}
                    >
                      costo / consegna
                    </p>
                    <p
                      className={`${MONO} text-xl font-semibold text-gray-100 mt-0.5`}
                    >
                      {eur(feat.perUseCost)}
                    </p>
                  </div>
                </div>
                {/* Mobile per-use cost */}
                <div className="sm:hidden mt-3 flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className={`${MONO} text-[11px] uppercase tracking-wider text-gray-600`}>
                    costo / consegna
                  </span>
                  <span className={`${MONO} text-base font-semibold text-gray-100`}>
                    {eur(feat.perUseCost)}
                  </span>
                </div>
              </div>

              {/* Cost table */}
              <div>
                <div
                  className={`${MONO} hidden md:grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-gray-600 border-b border-white/[0.04] bg-white/[0.02]`}
                >
                  <div>Voce</div>
                  <div>Provider</div>
                  <div>Unità</div>
                  <div className="text-right">Costo unitario</div>
                </div>
                {feat.costs.map((c, idx) => (
                  <CostLineView key={idx} row={c} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Plans & margins */}
      <div className="mt-8 mb-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Margine per piano
        </h2>
        <p className={`${MONO} text-xs text-gray-500`}>
          Prezzo pubblico vs. costi variabili medi per utente attivo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const margin = plan.priceMonthly - plan.variableCost;
          const pct =
            plan.priceMonthly > 0 ? (margin / plan.priceMonthly) * 100 : 0;
          return (
            <div
              key={plan.name}
              className="bg-[#161920] rounded-xl border border-white/[0.08] p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p
                    className={`${MONO} text-[10px] uppercase tracking-wider text-gray-600 mb-1`}
                  >
                    Piano
                  </p>
                  <h3 className="text-base font-semibold text-gray-100">
                    {plan.name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className={`${MONO} text-2xl font-semibold text-gray-100`}>
                    €{plan.priceMonthly}
                  </p>
                  <p className={`${MONO} text-[10px] text-gray-600`}>
                    /mese
                    {plan.priceAnnual ? ` (€${plan.priceAnnual}/anno)` : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {plan.features.map((f, i) => (
                  <p key={i} className={`${MONO} text-xs text-gray-400`}>
                    · {f}
                  </p>
                ))}
              </div>

              <div className="border-t border-white/[0.06] pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className={`${MONO} text-xs text-gray-500`}>
                    Costo variabile/utente
                  </span>
                  <span className={`${MONO} text-xs text-gray-300`}>
                    {eur(plan.variableCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${MONO} text-xs text-gray-500`}>
                    Margine lordo
                  </span>
                  <span
                    className={`${MONO} text-xs font-medium ${marginColor(pct)}`}
                  >
                    {plan.priceMonthly > 0
                      ? `${eur(margin)} · ${pct.toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className={`${MONO} text-xs text-amber-300/80 leading-relaxed`}>
          Prezzi aggiornati manualmente in{" "}
          <code className="text-amber-200">
            src/components/metrics/pages/CostsPage.tsx
          </code>
          . Il «costo per consegna» è la somma delle voci non deprecate di
          ciascuna feature. Il costo variabile medio per piano stima l&apos;utilizzo
          reale (non la quota massima consumata).
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Cost line row (responsive)
// ============================================================

function CostLineView({ row }: { row: FeatureCost }) {
  return (
    <div
      className={`border-b border-white/[0.04] last:border-0 ${
        row.deprecated ? "opacity-50" : ""
      }`}
    >
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-4 px-5 py-3 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-100 font-medium truncate">
              {row.item}
            </p>
            {row.deprecated && <Tag label="ALT" />}
          </div>
          {row.note && (
            <p className={`${MONO} text-[11px] text-gray-500 mt-0.5 leading-relaxed`}>
              {row.note}
            </p>
          )}
        </div>
        <div className={`${MONO} text-xs text-gray-400 truncate`}>
          {row.provider}
        </div>
        <div className={`${MONO} text-xs text-gray-500 truncate`}>
          {row.unit}
        </div>
        <div className={`${MONO} text-sm text-gray-100 text-right font-medium`}>
          {eur(row.unitCost)}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden px-5 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-gray-100 font-medium">{row.item}</p>
              {row.deprecated && <Tag label="ALT" />}
            </div>
            <p className={`${MONO} text-[11px] text-gray-500 mt-0.5`}>
              {row.provider} · {row.unit}
            </p>
          </div>
          <p className={`${MONO} text-sm text-gray-100 font-medium shrink-0`}>
            {eur(row.unitCost)}
          </p>
        </div>
        {row.note && (
          <p className={`${MONO} text-[11px] text-gray-500 leading-relaxed`}>
            {row.note}
          </p>
        )}
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className={`${MONO} text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-gray-500/15 text-gray-400 border-gray-500/30`}
    >
      {label}
    </span>
  );
}
