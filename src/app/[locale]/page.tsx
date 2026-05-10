import Link from "next/link";
import { Flame, Zap, Lock, CreditCard, TrendingUp, Video, Megaphone, SquaresUnite, FileText, Frown, Rocket, Euro, ClipboardList, ArrowRight } from "lucide-react";
import { Icon } from "@/lib/icons";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import RevealBadge from "@/components/RevealBadge";
import HomepageClient from "./HomepageClient";


type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];
  const l = t.landing;

  const featureVideos = [
    { video: "/assets/png/gif/agency_ai_anim.mp4" },
    { video: "/assets/png/gif/ai_video_templates.png" },
    { video: "/assets/png/gif/post_social.mp4" },
    { video: "/assets/png/gif/compare_pdf.mp4" },
    { video: "/assets/png/gif/map_zone.mp4" },
    { video: "/assets/png/gif/prezzo_medio_m2.mp4" },
  ];

  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{ background: "#fafaf8", color: "#1a1a2e" }}
    >
      {/* Sticky Header: Banner + Navbar */}
      <div className="sticky top-0 z-50">
        {/* Top Bar */}
        <div
          style={{
            background: "#1a1a2e",
            color: "#fff",
            padding: "11px 16px",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            borderBottom: "3px solid #f59e0b",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <Flame size={14} color="#f59e0b" strokeWidth={2.5} />
            {l.topBar.promo}{" "}
            <span style={{ color: "#f59e0b" }}>{l.topBar.discount}</span>
            <span className="hidden sm:inline" style={{ color: "#aaa" }}>·</span>
            <span className="hidden sm:inline">{l.topBar.expiresIn}</span>
            <HomepageClient variant="countdown-inline" />
          </span>
          {/* <span style={{ marginLeft: 8, color: "#34d399" }}>
            — {l.topBar.freeTrialShort}
          </span> */}
        </div>

        {/* Navbar */}
        <Navbar locale={locale as Locale} />
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section
          className="py-12 md:py-20"
          style={{
            background: "#fafaf8",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative shapes */}
          <div
            className="hero-shape-circle"
            style={{
              position: "absolute",
              top: -140,
              right: -180,
              width: 240,
              height: 240,
              background: "#fef3c7",
              borderRadius: "50%",
              opacity: 0.5,
              border: "3px solid #fcd34d",
            }}
          />
          <div
            className="hero-shape-square"
            style={{
              position: "absolute",
              top: 380,
              left: -60,
              width: 90,
              height: 90,
              background: "#dbeafe",
              borderRadius: 18,
              opacity: 0.5,
              border: "3px solid #93c5fd",
              transform: "rotate(12deg)",
            }}
          />
          <div
            className="hero-shape-pink"
            style={{
              position: "absolute",
              bottom: 40,
              right: -120,
              width: 160,
              height: 160,
              background: "#fce7f3",
              borderRadius: 24,
              opacity: 0.4,
              border: "3px solid #f9a8d4",
              transform: "rotate(-8deg)",
            }}
          />

          <div className="max-w-5xl mx-auto px-5 md:px-6 relative z-10">
            {/* Centered text content */}
            <div className="text-center flex flex-col items-center">
              {l.hero.badge && (
                <div
                  style={{
                    display: "inline-block",
                    background: "#fffbeb",
                    border: "2px solid #f59e0b",
                    borderRadius: 20,
                    padding: "7px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#b45309",
                    marginBottom: 28,
                    boxShadow: "3px 3px 0 #f59e0b40",
                    // display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Zap size={14} color="#b45309" strokeWidth={2.75} />
                  {l.hero.badge}
                </div>
              )}

              <h1
                style={{
                  fontSize: "clamp(32px, 5vw, 54px)",
                  fontWeight: 900,
                  lineHeight: 1.05,
                  margin: "0 0 22px",
                  letterSpacing: "-2px",
                }}
              >
                {l.hero.title1}
                <br />
                <span
                  style={{
                    color: "#f59e0b",
                    // textDecoration: "underline",
                    // textDecorationStyle: "wavy",
                    textUnderlineOffset: 8,
                    textDecorationThickness: 3,
                    textDecorationColor: "#f59e0b",
                  }}
                >
                  {l.hero.title2}
                </span>
              </h1>

              <p
                style={{
                  color: "#333",
                  fontSize: 18,
                  lineHeight: 1.7,
                  maxWidth: 720,
                  margin: "0 0 24px",
                }}
              >
                {l.hero.desc}
              </p>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center w-full max-w-xs md:max-w-md mx-auto">
                <a
                  href="#pricing"
                  className="neo-border neo-shadow flex-1 text-center w-full"
                  style={{
                    background: "#f59e0b",
                    color: "#1a1a2e",
                    padding: "16px 20px",
                    borderRadius: 14,
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    textDecoration: "none",
                  }}
                >
                  {l.hero.ctaPrimary}
                </a>
                <Link
                  href={`/${locale}/demo`}
                  className="neo-border neo-shadow flex-1 text-center w-full"
                  style={{
                    background: "#fff",
                    color: "#1a1a2e",
                    padding: "16px 20px",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(l.hero as any).ctaDemo}
                </Link>
              </div>


            </div>

            {/* YouTube Video - Full width, 16:9, neobrutalism frame */}
            <div
              className="mt-12 md:mt-16"
              style={{
                border: "3px solid #1a1a2e",
                borderRadius: 18,
                boxShadow: "8px 8px 0px #1a1a2e",
                overflow: "hidden",
                background: "#1a1a2e",
              }}
            >
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src="https://www.youtube.com/embed/2_KNllGE1-0?rel=0&modestbranding=1"
                  title="GetNearMe Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 900,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 12,
                }}
              >
                {l.howItWorks.title}{" "}
                <RevealBadge
                  style={{
                    background: "#f59e0b",
                    color: "#fff",
                    padding: "2px 14px",
                    borderRadius: 10,
                  }}
                >
                  {l.howItWorks.titleHighlight}
                </RevealBadge>
              </h2>
              <p style={{ color: "#666", fontSize: 16 }}>
                {l.howItWorks.subtitle}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "stretch",
              }}
            >
              {l.howItWorks.steps.map(
                (
                  s: {
                    step: string;
                    title: string;
                    desc: string;
                    color: string;
                    bg: string;
                    emoji: string;
                  },
                  i: number
                ) => (
                  <HomepageClient
                    key={i}
                    variant="step-card"
                    stepData={s}
                    index={i}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* Features — Full-Width Alternating */}
        <section id="funzionalita" className="scroll-mt-32">
          <div style={{ textAlign: "center", padding: "70px 24px 0", background: "#fafaf8" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 44px)",
                fontWeight: 900,
                color: "#1a1a2e",
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              {l.features.title}{" "}
              <br className="hidden md:block" />
              <span
                style={{
                  color: "#f59e0b",
                  textUnderlineOffset: 6,
                  textDecorationThickness: 3,
                }}
              >
                {l.features.titleHighlight}
              </span>
            </h2>
            <p style={{ color: "#666", fontSize: 16, maxWidth: 700, margin: "0 auto" }}>
              {l.features.subtitle}
            </p>
          </div>
          {l.features.items.map(
            (
              f: {
                num: string;
                title: string;
                desc: string;
                icon: string;
                color: string;
              },
              i: number
            ) => (
              <HomepageClient
                key={f.num}
                variant="feature-showcase"
                featureData={f}
                index={i}
                videoSrc={featureVideos[i]?.video}
                reverse={i % 2 !== 0}
              />
            )
          )}
        </section>

        {/* Problem / Solution — comparison cards */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.15, margin: "0 0 14px" }}>
                Ogni attività che devi fare ha un costo.<br />
                <span style={{ color: "#f59e0b" }}>Con GetNearMe, no.</span>
              </h2>
              <p style={{ color: "#666", fontSize: 17, maxWidth: 700, margin: "0 auto", lineHeight: 1.6 }}>
                Staging AI, video, post social, report, confronti di zona e molto altro… tutto in un unico flusso operativo ed un unico costo mensile.
              </p>
            </div>
            {(() => {
              const RED = "#F0000F";
              const GREEN = "#009874";
              const DARK = "#0E2344";
              const rows = [
                { icon: Video, title: "Video dell'immobile", without: "Devi coordinare e pagare un videomaker per video ed edit.", withGNM: "Generi video per i social in due click grazie all'AI." },
                { icon: Megaphone, title: "Post social media", without: "Li crei tu o li affidi a un social media manager.", withGNM: "Template già pronti all'uso con il tuo brand integrato.", rotate: -15 },
                { icon: SquaresUnite, title: "Home staging multiplo", without: "Mostri una sola ipotesi, o nessuna.", withGNM: "Generi più proposte visive in pochi clic e secondi." },
                { icon: FileText, title: "Report comparativi", without: "Copi manualmente i dati e costruisci l'Excel.", withGNM: "Produci report ordinati in modo molto più veloce." },
              ];
              const Card = ({ color, headerTitle, headerSub, headerIcon, items }: { color: string; headerTitle: string; headerSub: string; headerIcon: React.ReactNode; items: { icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; title: string; desc: string; rotate?: number }[] }) => (
                <div style={{ border: `2px solid ${color}`, borderRadius: 20, padding: "28px 32px", background: "#fff" }}>
                  {/* Header */}
                  <div className="comparison-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                    <div>
                      <h3 style={{ fontSize: 26, fontWeight: 700, color, margin: 0, lineHeight: 1.1 }}>{headerTitle}</h3>
                      <p style={{ fontSize: 15, fontWeight: 500, color: DARK, margin: "6px 0 0", opacity: 0.6 }}>{headerSub}</p>
                    </div>
                    <div className="comparison-header-icon" style={{ width: 52, height: 52, borderRadius: "50%", background: `${color}0D`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 16 }}>
                      {headerIcon}
                    </div>
                  </div>
                  <div style={{ height: 1, background: `${color}20`, marginTop: -16, marginBottom: 6 }} />
                  {/* Rows */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((r, i) => {
                      const IconComp = r.icon;
                      const isLast = i === items.length - 1;
                      return (
                        <div key={r.title} className="comparison-row" style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: isLast ? "none" : `1px solid ${color}20` }}>
                          <div className="comparison-icon" style={{ width: 52, height: 52, borderRadius: "50%", border: `2px solid ${color}4D`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ display: "inline-flex", transform: r.rotate ? `rotate(${r.rotate}deg)` : undefined }}><IconComp size={22} color={color} strokeWidth={2} /></span>
                          </div>
                          <div className="comparison-title" style={{ fontWeight: 700, fontSize: 18, color: DARK, lineHeight: 1.2 }}>{r.title}</div>
                          <div className="comparison-desc" style={{ fontSize: 15, fontWeight: 500, color: DARK, lineHeight: 1.5, opacity: 0.7 }}>{r.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="comparison-grid">
                  <Card
                    color={RED}
                    headerTitle="Senza GetNearMe"
                    headerSub="Più tempo perso, più costi, meno risultati."
                    headerIcon={<Frown size={22} color={RED} strokeWidth={2} />}
                    items={rows.map(r => ({ icon: r.icon, title: r.title, desc: r.without, rotate: r.rotate }))}
                  />
                  <Card
                    color={GREEN}
                    headerTitle="Con GetNearMe"
                    headerSub="Più valore per te e per i tuoi clienti."
                    headerIcon={<Rocket size={22} color={GREEN} strokeWidth={2} />}
                    items={rows.map(r => ({ icon: r.icon, title: r.title, desc: r.withGNM, rotate: r.rotate }))}
                  />
                </div>
              );
            })()}
            {/* Benefits bar + CTA */}
            <div style={{ marginTop: 24, background: "#f8f9fa", borderRadius: 20, padding: 12, border: "1.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }} className="benefits-bar">
                {[
                  { icon: Euro, title: "Meno costi esterni", desc: "Riduci le spese per fornitori e servizi." },
                  { icon: ClipboardList, title: "Meno copia-incolla", desc: "Dati già pronti, zero lavoro ripetitivo." },
                  { icon: Zap, title: "Più velocità operativa", desc: "Rispondi ai clienti prima, migliori i risultati." },
                ].map((b) => (
                  <div key={b.title} className="benefit-card" style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <b.icon size={20} color="#fff" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>{b.title}</div>
                      <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
                <a href="#prezzi" className="neo-border neo-shadow benefits-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#f59e0b", color: "#1a1a2e", fontSize: 18, fontWeight: 700, padding: "0 28px", height: 58, borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s", marginBottom: 6, marginRight: 6 }}>
                  Prova ora <ArrowRight size={20} strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .comparison-grid {
                grid-template-columns: 1fr !important;
              }
              .comparison-header {
                flex-direction: column-reverse !important;
                align-items: center !important;
                text-align: center;
                gap: 12px;
              }
              .comparison-header-icon {
                margin-left: 0 !important;
              }
              .comparison-row {
                grid-template-columns: 1fr !important;
                justify-items: center;
                text-align: center;
                gap: 8px !important;
                padding: 16px 0 !important;
              }
              .benefits-bar {
                flex-direction: column !important;
                gap: 8px !important;
              }
              .benefit-card {
                flex-direction: column !important;
                text-align: center;
                padding: 14px !important;
                gap: 10px !important;
                margin: 0 !important;
                width: 100% !important;
              }
              .benefits-cta {
                width: calc(100% - 12px) !important;
                margin-top: 8px !important;
                margin-right: 6px !important;
                margin-bottom: 6px !important;
              }
            }
          `}</style>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "70px 0", background: "#fffbeb" }}>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 900,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 12,
                }}
              >
                {l.testimonials.title}
              </h2>
              {/* <div
                style={{
                  display: "flex",
                  gap: 16,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                {[
                  {
                    label: l.testimonials.npsLabel,
                    value: l.testimonials.npsValue,
                    color: "#10b981",
                  },
                  {
                    label: l.testimonials.retentionLabel,
                    value: l.testimonials.retentionValue,
                    color: "#6366f1",
                  },
                ].map(
                  (
                    s: { label: string; value: string; color: string },
                    i: number
                  ) => (
                    <span
                      key={i}
                      className="neo-border"
                      style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#333",
                        boxShadow: "3px 3px 0 #1a1a2e",
                      }}
                    >
                      {s.label}:{" "}
                      <strong style={{ color: s.color }}>{s.value}</strong>
                    </span>
                  )
                )}
              </div> */}
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-5"
            >
              {l.testimonials.items.map(
                (
                  testimonial: {
                    name: string;
                    role: string;
                    text: string;
                    avatar: string;
                    color: string;
                  },
                  i: number
                ) => (
                  <HomepageClient
                    key={i}
                    variant="testimonial"
                    testimonialData={testimonial}
                    index={i}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <HomepageClient
          variant="pricing-section"
          locale={locale}
          pricingData={{
            title1: l.pricing.title1,
            title2: l.pricing.title2,
            titleHighlight: l.pricing.titleHighlight,
            subtitle: l.pricing.subtitle,
            countdownLabel: l.pricing.countdownLabel,
            trustBadges: l.pricing.trustBadges,
            savingsLabel: l.pricing.savingsLabel,
            progressAgencies: l.pricing.progressAgencies,
            progressSpots: l.pricing.progressSpots,
            plans: l.pricing.plans,
          }}
        />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-32" style={{ padding: "70px 0", background: "#f9fafb" }}>
          <div className="max-w-3xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 900,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 12,
                }}
              >
                {l.faq.title}{" "}
                <span
                  style={{
                    background: "#f59e0b",
                    color: "#fff",
                    padding: "2px 16px",
                    borderRadius: 10,
                    border: "2px solid #1a1a2e",
                    boxShadow: "3px 3px 0 #1a1a2e",
                  }}
                >
                  {l.faq.titleHighlight}
                </span>
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {l.faq.items.map(
                (item: { q: string; a: string }, i: number) => (
                  <HomepageClient
                    key={i}
                    variant="faq-item"
                    faqData={item}
                    index={i}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          style={{
            padding: "80px 0",
            background: "#1a1a2e",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              background: "#f59e0b",
              borderRadius: "50%",
              opacity: 0.08,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 180,
              height: 180,
              background: "#6366f1",
              borderRadius: 30,
              opacity: 0.08,
              transform: "rotate(15deg)",
            }}
          />
          <div
            className="max-w-7xl mx-auto px-5 md:px-3 text-center relative"
          >
            <h2
              style={{
                fontSize: "clamp(30px, 5vw, 52px)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: "0 0 16px",
                color: "#fff",
              }}
            >
              {l.finalCta.title1}{" "}
              <br className="hidden md:block" />
              <span style={{ color: "#f59e0b" }}>{l.finalCta.title2}</span>
            </h2>
            <p style={{ color: "#aaa", fontSize: 17, marginBottom: 36 }}>
              {l.finalCta.desc}
            </p>
            <div className="final-cta-buttons" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href="#pricing"
                className="neo-shadow-light final-cta-btn"
                style={{
                  display: "inline-block",
                  background: "#f59e0b",
                  color: "#1a1a2e",
                  border: "3px solid #1a1a2e",
                  padding: "18px 48px",
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: 18,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {l.finalCta.button}
              </a>
              <Link
                href={`/${locale}/demo`}
                className="neo-shadow-light final-cta-btn"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#fff",
                  border: "3px solid #fff",
                  padding: "18px 36px",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(l.finalCta as any).buttonDemo}
              </Link>
            </div>
            <div className="final-cta-footer" style={{ color: "#eee", fontSize: 13, marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              {(() => {
                const text = l.finalCta.footer;
                const first = [...text][0] || "";
                if (first === "🔒") {
                  return (
                    <>
                      <Lock size={14} color="#eee" strokeWidth={2.5} />
                      {text.slice(first.length).trim()}
                    </>
                  );
                }
                return text;
              })()}
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .final-cta-buttons {
                flex-direction: column !important;
                align-items: center !important;
                gap: 20px !important;
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
              }
              .final-cta-btn {
                width: 100% !important;
                display: block !important;
                padding: 16px 20px !important;
              }
              .final-cta-footer {
                margin-top: 32px !important;
              }
            }
          `}</style>
        </section>

        {/* Footer */}
        <footer
          className="neo-border"
          style={{
            borderLeft: "none",
            borderRight: "none",
            borderBottom: "none",
            padding: "40px 0 32px",
            background: "#fafaf8",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
              <div className="md:col-span-1">
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginBottom: 6,
                    color: "#1a1a2e",
                  }}
                >
                  GetNearMe
                </h3>
                <p
                  className="footer-desc"
                  style={{
                    color: "#666",
                    fontSize: 13,
                    marginBottom: 24,
                    maxWidth: 250,
                  }}
                >
                  {t.footer.desc}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">{t.footer.product}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="#funzionalita"
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.features}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`/${locale}/tutorial`}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.tutorial}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.pricing}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.faq}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href={`/${locale}/privacy`}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.footer.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/cookie`}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.footer.cookie}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/termini`}
                      className="text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {t.footer.terms}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div
              style={{
                paddingTop: 24,
                borderTop: "2px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#bbb", fontSize: 13 }}>
                © 2026 GetNearMe. {t.footer.rights}
              </p>
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .footer-desc {
                max-width: none !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }
            }
          `}</style>
        </footer>
      </main>

      {/* Social Popup */}
      <HomepageClient variant="social-popup" popupMessages={l.popups} />
    </div>
  );
}
