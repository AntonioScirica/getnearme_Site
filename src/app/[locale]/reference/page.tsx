import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import ReferenceGallery from "./ReferenceGallery";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Reference — GetNearMe",
    description: "Esempi reali delle funzionalità GetNearMe: foto AI, video, post social, report PDF, analisi di zona e molto altro.",
    alternates: {
      canonical: `https://getnearme.it/${locale}/reference`,
    },
  };
}

const FEATURES = [
  {
    id: "ai-photos",
    icon: "sparkles",
    color: "#6366f1",
    title: "Homestaging AI",
    desc: "Arreda, svuota o trasforma qualsiasi ambiente in pochi secondi.",
    media: [
      // { type: "image", src: "/reference/staging-1.jpg", aspect: "vertical" },
      // { type: "video", src: "/reference/staging-demo.mp4", aspect: "horizontal" },
    ] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
  {
    id: "ai-video",
    icon: "clapperboard",
    color: "#10b981",
    title: "Video AI per l'immobile",
    desc: "Reel, walkthrough, before/after, video con avatar parlante e molto altro.",
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
  {
    id: "social-posts",
    icon: "smartphone",
    color: "#ec4899",
    title: "Post, reel e storie social",
    desc: "Contenuti pronti per Instagram, Facebook, TikTok e LinkedIn.",
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
  {
    id: "reports",
    icon: "file-text",
    color: "#f97316",
    title: "Report PDF white-label",
    desc: "Presentazioni comparative col tuo logo, colori e font.",
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
  {
    id: "zone-analysis",
    icon: "map",
    color: "#0ea5e9",
    title: "Analisi di zona interattiva",
    desc: "Servizi, trasporti, scuole, sanità e punti di interesse su mappa.",
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
  {
    id: "price-calculator",
    icon: "trending-up",
    color: "#f59e0b",
    title: "Prezzo medio di zona al m²",
    desc: "Dati di riferimento sul prezzo medio €/m² della zona.",
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal" }[],
  },
];

export default async function ReferencePage({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return (
    <div className="min-h-screen" style={{ background: "#fafaf8", color: "#1a1a2e" }}>
      <div className="sticky top-0 z-50">
        <Navbar locale={locale as Locale} />
      </div>

      <main>
        {/* Header */}
        <section className="py-16 md:py-24" style={{ background: "#1a1a2e" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-6 text-center">
            <h1
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.1,
                marginBottom: 16,
              }}
            >
              Esempi reali.{" "}
              <span style={{ color: "#f59e0b" }}>Risultati concreti.</span>
            </h1>
            <p style={{ color: "#aaa", fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
              Scopri cosa puoi creare con ogni funzionalità di GetNearMe.
              Video, foto, post e report generati in pochi click.
            </p>
          </div>
        </section>

        {/* Feature nav */}
        <div className="sticky top-20 z-40 bg-[#fafaf8] border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-5 md:px-6">
            <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
              {FEATURES.map((f) => (
                <a
                  key={f.id}
                  href={`#${f.id}`}
                  className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-100"
                  style={{ color: f.color, border: `1.5px solid ${f.color}30`, background: `${f.color}08` }}
                >
                  {f.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Feature sections */}
        {FEATURES.map((f, i) => (
          <section
            key={f.id}
            id={f.id}
            className="scroll-mt-32 py-16 md:py-20"
            style={{ background: i % 2 === 0 ? "#fafaf8" : "#f3f4f6" }}
          >
            <div className="max-w-5xl mx-auto px-5 md:px-6">
              {/* Feature header */}
              <div className="flex items-center gap-4 mb-3">
                <span
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${f.color}15`,
                    borderRadius: 14,
                    border: `2px solid ${f.color}40`,
                    color: f.color,
                    flexShrink: 0,
                  }}
                >
                  <ReferenceGallery variant="icon" iconName={f.icon} />
                </span>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a2e", margin: 0, lineHeight: 1.2 }}>
                    {f.title}
                  </h2>
                </div>
              </div>
              <p style={{ color: "#666", fontSize: 16, marginBottom: 32, maxWidth: 600 }}>
                {f.desc}
              </p>

              {/* Gallery */}
              {f.media.length > 0 ? (
                <ReferenceGallery variant="gallery" media={f.media} color={f.color} />
              ) : (
                <div
                  style={{
                    border: `2px dashed ${f.color}40`,
                    borderRadius: 16,
                    padding: "48px 24px",
                    textAlign: "center",
                    color: "#999",
                    fontSize: 15,
                  }}
                >
                  Contenuti in arrivo...
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Bottom CTA */}
        <section style={{ background: "#1a1a2e", padding: "60px 0" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-6 text-center">
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 12 }}>
              Pronto a provare?
            </h2>
            <p style={{ color: "#aaa", fontSize: 16, marginBottom: 28 }}>
              Aggiungi GetNearMe al tuo browser e inizia subito.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <a
                href={`/${locale}#pricing`}
                className="neo-border neo-shadow"
                style={{
                  background: "#f59e0b",
                  color: "#1a1a2e",
                  padding: "14px 36px",
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: 16,
                  textDecoration: "none",
                }}
              >
                Aggiungi estensione
              </a>
              <Link
                href={`/${locale}/demo`}
                style={{
                  color: "#fff",
                  border: "2px solid #fff",
                  padding: "14px 36px",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                }}
              >
                Prenota demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
