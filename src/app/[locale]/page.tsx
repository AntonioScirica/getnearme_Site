import Link from "next/link";
import { Flame, Zap, Lock, TrendingUp, Video, Megaphone, FileText, ArrowRight, Link2, Sparkles, Send, Clock, ImagePlus, MapPin, BarChart3, Check } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import AuthCta from "@/components/AuthCta";
import ScrollCue from "@/components/ScrollCue";
import HeroVideo from "@/components/HeroVideo";
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
    { video: "/assets/png/gif/map_zone.mp4" },
    { video: "/assets/png/gif/compare_pdf.mp4" },
  ];

  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{ background: "#fff", color: "#1a1a2e" }}
    >
      {/* Preload del poster hero (LCP): Next lo issa nel <head> → carica per primo */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <link rel="preload" as="image" href="/staging/1.webp" fetchPriority="high" />

      {/* Sticky Header: Banner + Navbar */}
      <div className="sticky top-0 z-50">
        {/* Top Bar — cliccabile → prezzi */}
        <a
          href={`/${locale}#pricing`}
          style={{
            display: "block",
            background: "#1a1a2e",
            color: "#fff",
            padding: "10px 14px",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            borderBottom: "1px solid #3B83F6",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <Flame size={14} color="#60a5fa" strokeWidth={2.5} style={{ flexShrink: 0, position: 'relative', top: -1 }} />
            {l.topBar.promo}{" "}
            <span style={{ color: "#60a5fa" }}>{l.topBar.discount}</span>
            <span className="hidden sm:inline" style={{ color: "#aaa" }}>·</span>
            <span className="hidden sm:inline">{l.topBar.expiresIn}</span>
            <HomepageClient variant="countdown-inline" />
          </span>
        </a>

        {/* Navbar */}
        <Navbar locale={locale as Locale} />
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section
          className="py-12 md:py-20"
          style={{
            background: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative shapes */}
          <div
            className="hero-shape-circle"
            style={{
              position: "absolute",
              top: -126,
              right: -162,
              width: 216,
              height: 216,
              background: "#dbeafe",
              borderRadius: "50%",
              opacity: 0.5,
              border: "1px solid #93c5fd",
            }}
          />
          <div
            className="hero-shape-square"
            style={{
              position: "absolute",
              top: 342,
              left: -54,
              width: 81,
              height: 81,
              background: "#dbeafe",
              borderRadius: 16,
              opacity: 0.5,
              border: "1px solid #93c5fd",
              transform: "rotate(12deg)",
            }}
          />
          <div
            className="hero-shape-pink"
            style={{
              position: "absolute",
              bottom: 36,
              right: -108,
              width: 144,
              height: 144,
              background: "#fce7f3",
              borderRadius: 22,
              opacity: 0.4,
              border: "1px solid #f9a8d4",
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
                    background: "#eff6ff",
                    border: "1px solid #3B83F6",
                    borderRadius: 18,
                    padding: "6px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1d4ed8",
                    marginBottom: 25,
                    boxShadow: "0 4px 14px rgba(59,131,246,0.20)",
                    // display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Zap size={14} color="#1d4ed8" strokeWidth={2.75} />
                  {l.hero.badge}
                </div>
              )}

              <style>{`
                @media (max-width: 768px) {
                  .hero-title { font-size: 30px !important; line-height: 1.2 !important; }
                  .hero-desc { font-size: 16px !important; }
                }
              `}</style>
              <h1
                className="hero-title"
                style={{
                  fontSize: "clamp(29px, 5vw, 49px)",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  margin: "0 0 20px",
                  letterSpacing: "-1px",
                }}
              >
                {"L'assistente "}<span style={{ color: "#3B83F6" }}>{"AI"}</span>{" "}<br className="md:hidden" /><span style={{ color: "#3B83F6" }}>{"per agenti"}</span>{" immobiliari."}
              </h1>

              <p
                className="hero-desc"
                style={{
                  color: "#555",
                  fontSize: 18,
                  lineHeight: 1.7,
                  maxWidth: 702,
                  margin: "0 0 22px",
                  marginTop: -5,
                }}
              >
                {l.hero.desc}
              </p>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center w-full max-w-xs md:max-w-md mx-auto">
                <AuthCta
                  locale={locale}
                  href="#pricing"
                  className="neo-shadow neo-cta-blue flex-1 text-center w-full"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 11,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    letterSpacing: 0.3,
                    textDecoration: "none",
                    border: "none",
                  }}
                >
                  {l.hero.ctaPrimary}
                </AuthCta>
                <a
                  data-cal-link="getnearme/30min"
                  data-cal-config='{"layout":"month_view"}'
                  className="neo-shadow neo-cta-outline flex-1 text-center w-full"
                  style={{
                    background: "#fff",
                    color: "#1a1a2e",
                    padding: "14px 16px",
                    borderRadius: 11,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    textDecoration: "none",
                    border: "1px solid rgba(26,26,46,0.20)",
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(l.hero as any).ctaDemo}
                </a>
              </div>


            </div>

            {/* Hero tutorial video — 16:9. Cliccabile: porta alla feature Video AI in basso. */}
            <a href="#ai-video" className="mt-12 md:mt-16 block" style={{ position: "relative", cursor: "default" }}>
              {/* Foto originale + freccia: mostra che il video parte da questa foto. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/staging/time.png"
                alt="Foto originale dell'immobile"
                className="hidden md:block"
                style={{ position: "absolute", top: -55, left: -140, width: 130, height: "auto", zIndex: 10 }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/staging/time.png"
                alt="Foto originale dell'immobile"
                className="block md:hidden"
                style={{ position: "absolute", top: -18, left: 10, width: 70, height: "auto", zIndex: 10 }}
              />
              <div
                style={{
                  border: "1px solid rgba(26,26,46,0.10)",
                  borderRadius: 16,
                  boxShadow: "0 12px 30px rgba(16,24,40,0.10)",
                  overflow: "hidden",
                  background: "#1a1a2e",
                  aspectRatio: "16 / 9",
                }}
              >
                <HeroVideo
                  poster="/staging/timelaps_ai-poster.jpg"
                  src="/staging/timelaps_ai.mp4"
                  ariaLabel="GetNearMe — AI timelapse ricostruzione immobile"
                />
              </div>
            </a>
          </div>
        </section>

        {/* Operational flow — Dall'annuncio al cliente */}
        <section style={{ padding: "63px 0", background: "#f3f4f6" }}>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 43 }}>
              <h2
                style={{
                  fontSize: "clamp(23px, 4.5vw, 34px)",
                  fontWeight: 800,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 11,
                }}
              >
                {"Dall'annuncio al cliente, "}
                <span style={{ color: "#3B83F6" }}>in pochi minuti.</span>
              </h2>
              <p style={{ color: "#555", fontSize: 16, maxWidth: 684, margin: "0 auto", lineHeight: 1.6 }}>
                {"Niente da installare, niente da imparare. Carichi le tue foto, l'assistente AI prepara tutto il materiale, già col tuo brand."}
              </p>
            </div>
            {(() => {
              const flowSteps = [
                { n: "1", icon: ImagePlus, color: "#6366f1", bg: "#eef2ff", title: "Carichi le tue foto", desc: "Carichi le foto dell'immobile, inserisci i dati principali e scegli cosa vuoi ottenere. Il resto lo fa GetNearMe." },
                { n: "2", icon: Sparkles, color: "#f59e0b", bg: "#fffbeb", title: "L'AI prepara tutto", desc: "In pochi minuti l'assistente genera home staging, video e post social, già col tuo logo e i tuoi colori." },
                { n: "3", icon: Send, color: "#10b981", bg: "#ecfdf5", title: "Pubblichi e invii", desc: "Pubblichi sui social, metti sui portali o mandi al cliente. Tutto pronto, senza altri programmi." },
              ];
              return (
                <div className="flow-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, alignItems: "stretch" }}>
                  {flowSteps.map((s) => {
                    const IconComp = s.icon;
                    return (
                      <div key={s.n} className="neo-border neo-shadow flow-card" style={{ background: "#fff", borderRadius: 14, padding: "25px 22px", display: "flex", flexDirection: "column", gap: 13, transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "default" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <span className={`step-icon step-icon-${s.n}`} style={{ width: 43, height: 43, borderRadius: 11, background: s.bg, border: `1px solid ${s.color}33`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <IconComp size={22} strokeWidth={2} />
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5 }}>Passo {s.n}</span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0, lineHeight: 1.25 }}>{s.title}</h3>
                        <p style={{ color: "#444", fontSize: 14, lineHeight: 1.6, margin: 0, flex: 1 }}>{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <style>{`
            @media (max-width: 768px) {
              .flow-grid { grid-template-columns: 1fr !important; }
            }
            .flow-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 32px rgba(59,131,246,0.12);
              border-color: #bfdbfe;
            }
            .step-icon {
              animation: stepFloat 3s ease-in-out infinite;
            }
            .step-icon-2 { animation-delay: 0.4s; }
            .step-icon-3 { animation-delay: 0.8s; }
            @keyframes stepFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
          `}</style>
        </section>

        {/* Features — Full-Width Alternating */}
        <section id="funzionalita" className="scroll-mt-32">
          <div style={{ textAlign: "center", padding: "63px 22px 0", background: "#fff" }}>
            <h2
              style={{
                fontSize: "clamp(23px, 4.5vw, 34px)",
                fontWeight: 800,
                color: "#1a1a2e",
                lineHeight: 1.15,
                marginBottom: 11,
              }}
            >
              {l.features.title}{" "}
              <br className="hidden md:block" />
              <span
                style={{
                  color: "#3B83F6",
                  textUnderlineOffset: 6,
                  textDecorationThickness: 3,
                }}
              >
                {l.features.titleHighlight}
              </span>
            </h2>
            <p style={{ color: "#555", fontSize: 16, maxWidth: 684, margin: "0 auto", lineHeight: 1.6 }}>
              {l.features.subtitle}
            </p>
          </div>
          {l.features.items.slice(0, 3).map(
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

        {/* Time saved — Ogni attività ti porta via tempo */}
        <section style={{ padding: "63px 0", background: "#f3f4f6" }}>
          <div className="max-w-4xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontSize: "clamp(23px, 4.5vw, 32px)", fontWeight: 800, color: "#1a1a2e", lineHeight: 1.15, margin: "0 0 13px" }}>
                Ogni attività ti porta via tempo.<br />
                <span style={{ color: "#3B83F6" }}>Con GetNearMe, minuti.</span>
              </h2>
              <p style={{ color: "#666", fontSize: 15, maxWidth: 648, margin: "0 auto", lineHeight: 1.6 }}>
                {"Quello che oggi ti richiede ore lo fai in pochi minuti. Su una settimana di lavoro è più di un giorno e mezzo che ti riprendi per clienti e trattative."}
              </p>
            </div>
            {(() => {
              const DARK = "#0E2344";
              const GREEN = "#009874";
              const timeRows = [
                { icon: Sparkles, activity: "Homestaging", before: "~€1.500", beforeSub: "home staging fisico, ~4 giorni", beforeTime: "~4 giorni", after: "Incluso nel piano" },
                { icon: Video, activity: "Video", before: "~€250", beforeSub: "videomaker professionista, mezza giornata", beforeTime: "mezza giornata", after: "Incluso nel piano" },
                { icon: Megaphone, activity: "Post", before: "~€50/post", beforeSub: "social media manager, ~1 giorno", beforeTime: "~1 giorno", after: "Incluso nel piano" },
                { icon: MapPin, activity: "Zona", before: "~€80", beforeSub: "consulente o agenzia dati, ~1 ora", beforeTime: "~1 ora", after: "Incluso nel piano" },
                { icon: BarChart3, activity: "Report", before: "~€40", beforeSub: "grafico o assistente, ~45 minuti", beforeTime: "~45 minuti", after: "Incluso nel piano" },
              ];
              return (
                <>
                  <div className="neo-border neo-shadow" style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
                    <div className="time-row time-head" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", alignItems: "center", gap: 14, padding: "14px 22px", background: "#1a1a2e", color: "#fff", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      <div>Attività</div>
                      <div>Senza</div>
                      <div style={{ textAlign: "right" }}>Con Get</div>
                    </div>
                    {timeRows.map((r, i) => {
                      const IconComp = r.icon;
                      return (
                        <div key={r.activity} className="time-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", alignItems: "center", gap: 14, padding: "14px 22px", borderTop: i === 0 ? "none" : "1px solid #eef0f4" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <span style={{ width: 36, height: 36, borderRadius: 9, background: "#eef2ff", border: "1px solid #2563EB22", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <IconComp size={18} strokeWidth={2} />
                            </span>
                            <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{r.activity}</span>
                          </div>
                          <div className="time-before">
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{r.before}</div>
                            <div className="time-before-sub time-before-sub-full" style={{ fontSize: 11, color: "#9ca3af" }}>{r.beforeSub}</div>
                            <div className="time-before-sub time-before-sub-short" style={{ fontSize: 11, color: "#9ca3af" }}>{r.beforeTime}</div>
                          </div>
                          <div className="time-after" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, fontWeight: 800, fontSize: 14, color: GREEN }}>
                            <Check size={15} strokeWidth={3} /> <span className="time-after-full">{r.after}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="vs-total" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 18, marginTop: 18, background: "#fff", borderRadius: 14, padding: "20px 25px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Con Agenzia</div>
                      <div style={{ fontSize: 25, fontWeight: 800, color: "#dc2626", textDecoration: "line-through", textDecorationColor: "rgba(220,38,38,0.35)" }}>~€2.020+</div>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a1a2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>VS</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Con GetNearMe</div>
                      <div style={{ fontSize: 25, fontWeight: 800, color: GREEN }}>da €14,99</div>
                    </div>
                  </div>
                </>
              );
            })()}
            <p style={{ color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 13 }}>
              {"Stime indicative sui costi tipici di fornitori esterni per un immobile (home staging fisico, 1 video, 3 post, analisi e report)."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
              <AuthCta locale={locale} href="#pricing" className="neo-shadow neo-cta-blue" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 15, fontWeight: 700, padding: "14px 29px", borderRadius: 11, textDecoration: "none" }}>
                Prova gratis <ArrowRight size={20} strokeWidth={2.5} />
              </AuthCta>
            </div>
          </div>
          <style>{`
            .time-before-sub-short { display: none; }
            @media (max-width: 768px) {
              .time-after-full { display: none; }
              .time-before-sub-full { display: none; }
              .time-before-sub-short { display: block !important; font-size: 10px !important; line-height: 1.2; }
              .time-row {
                grid-template-columns: 1.1fr 1fr 82px !important;
                gap: 8px !important;
                padding: 14px 14px !important;
                text-align: left !important;
                justify-items: stretch !important;
              }
              .time-head { font-size: 11px !important; letter-spacing: 0.2px !important; }
              .time-head > div:nth-child(2) { text-align: left !important; padding-left: 18px !important; }
              .time-head > div:last-child { text-align: center !important; }
              .time-row > div:first-child span:last-child { font-size: 13.5px !important; line-height: 1.25; }
              .time-row > div:first-child span:first-child { display: none !important; }
              .time-before { text-align: left !important; padding-left: 18px !important; }
              .time-before > div:first-child { font-size: 13px !important; }
              .time-after { justify-content: center !important; padding-right: 0 !important; }
              .time-after svg { width: 18px; height: 18px; position: relative; left: -2px; }
              .vs-total { grid-template-columns: 1fr auto 1fr !important; gap: 10px !important; padding: 16px 14px !important; }
              .vs-total > div:nth-child(2) { width: 32px !important; height: 32px !important; font-size: 10.5px !important; }
              .vs-total > div:first-child > div:first-child,
              .vs-total > div:last-child > div:first-child { font-size: 10px !important; letter-spacing: 0.3px !important; }
              .vs-total > div:first-child > div:last-child,
              .vs-total > div:last-child > div:last-child { font-size: 17px !important; }
            }
          `}</style>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section" style={{ padding: "63px 0", background: "#f3f4f6" }}>
          <style>{`@media (max-width: 768px){ .testimonials-section{ padding-top: 32px !important; } }`}</style>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2
                style={{
                  fontSize: "clamp(23px, 4.5vw, 34px)",
                  fontWeight: 800,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 11,
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
                        boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
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
              className="reviews-slider grid grid-cols-1 md:grid-cols-3 gap-5"
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
            <style>{`
              @media (max-width: 767px) {
                .reviews-slider {
                  display: flex !important;
                  overflow-x: auto;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                  gap: 16px;
                  /* padding verticale: overflow-x:auto rende overflow-y clip,
                     senza spazio le ombre delle card vengono tagliate sopra/sotto. */
                  padding: 16px 20px 22px;
                  margin: 0 -20px;
                  scrollbar-width: none;
                }
                .reviews-slider::-webkit-scrollbar { display: none; }
                .reviews-slider > * {
                  flex: 0 0 85%;
                  scroll-snap-align: center;
                }
              }
            `}</style>
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
            plansByTier: l.pricing.plansByTier,
            tierToggle: l.pricing.tierToggle,
          }}
        />

        {/* FAQ */}
        <section id="faq" className="scroll-mt-32" style={{ padding: "63px 0", background: "#f3f4f6" }}>
          <div className="max-w-3xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2
                style={{
                  fontSize: "clamp(23px, 4.5vw, 34px)",
                  fontWeight: 800,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 11,
                }}
              >
                {l.faq.title}{" "}
                <span
                  style={{
                    background: "#3B83F6",
                    color: "#fff",
                    padding: "2px 14px",
                    borderRadius: 9,
                    border: "1px solid rgba(26,26,46,0.10)",
                    boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
                    position: "relative",
                    top: 1.5,
                  }}
                >
                  <span style={{ position: "relative", top: -1.5, display: "inline-block" }}>{l.faq.titleHighlight}</span>
                </span>
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 11,
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
            padding: "72px 0",
            background: "#1a1a2e",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -54,
              right: -54,
              width: 198,
              height: 198,
              background: "#3B83F6",
              borderRadius: "50%",
              opacity: 0.06,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -36,
              left: -36,
              width: 162,
              height: 162,
              background: "#6366f1",
              borderRadius: 27,
              opacity: 0.08,
              transform: "rotate(15deg)",
            }}
          />
          <div
            className="max-w-7xl mx-auto px-5 md:px-3 text-center relative"
          >
            <h2
              style={{
                fontSize: "clamp(25px, 4.5vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.1,
                margin: "0 0 14px",
                color: "#fff",
              }}
            >
              {l.finalCta.title1}{" "}
              <br className="hidden md:block" />
              <span style={{ color: "#3B83F6" }}>{l.finalCta.title2}</span>
            </h2>
            <p style={{ color: "#aaa", fontSize: 15, marginBottom: 32 }}>
              {l.finalCta.desc}
            </p>
            <div className="final-cta-buttons" style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
              <AuthCta
                locale={locale}
                href="#pricing"
                className="neo-shadow-light neo-cta-blue final-cta-btn"
                style={{
                  display: "inline-block",
                  border: "none",
                  padding: "14px 29px",
                  borderRadius: 11,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {l.finalCta.button}
              </AuthCta>
              <a
                data-cal-link="getnearme/30min"
                data-cal-config='{"layout":"month_view"}'
                className="neo-shadow-light final-cta-outline-dark final-cta-btn"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.5)",
                  padding: "14px 29px",
                  borderRadius: 11,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(l.finalCta as any).buttonDemo}
              </a>
            </div>
            <div className="final-cta-footer" style={{ color: "#eee", fontSize: 12, marginTop: 18, display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
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
            padding: "36px 0 29px",
            background: "#fafaf8",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
              <div className="md:col-span-1">
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 5,
                    color: "#1a1a2e",
                  }}
                >
                  GetNearMe
                </h3>
                <p
                  className="footer-desc"
                  style={{
                    color: "#666",
                    fontSize: 12,
                    marginBottom: 22,
                    maxWidth: 225,
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
                paddingTop: 22,
                borderTop: "2px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#6b7280", fontSize: 12 }}>
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

      {/* Scroll cue (solo mobile, sparisce allo scroll) */}
      <ScrollCue />

      {/* Social Popup */}
      <HomepageClient variant="social-popup" popupMessages={l.popups} />
    </div>
  );
}
