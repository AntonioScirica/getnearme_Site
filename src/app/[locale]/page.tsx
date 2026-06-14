import Link from "next/link";
import { Flame, Zap, Lock, TrendingUp, Video, Megaphone, FileText, ArrowRight, Link2, Sparkles, Send, Clock } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import HomepageClient from "./HomepageClient";
import ReferenceGallery from "./reference/ReferenceGallery";


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
            borderBottom: "1px solid #f59e0b",
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
                    boxShadow: "0 4px 14px rgba(245,158,11,0.20)",
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
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    textDecoration: "none",
                  }}
                >
                  {l.hero.ctaPrimary}
                </a>
                <a
                  data-cal-link="getnearme/30min"
                  data-cal-config='{"layout":"month_view"}'
                  className="neo-border neo-shadow flex-1 text-center w-full"
                  style={{
                    background: "#fff",
                    color: "#1a1a2e",
                    padding: "16px 20px",
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    textDecoration: "none",
                    border: "1.5px solid rgba(26,26,46,0.25)",
                  }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(l.hero as any).ctaDemo}
                </a>
              </div>


            </div>

            {/* Hero tutorial video — 16:9 */}
            <div
              className="mt-12 md:mt-16"
              style={{
                border: "1px solid rgba(26,26,46,0.10)",
                borderRadius: 18,
                boxShadow: "0 12px 30px rgba(16,24,40,0.10)",
                overflow: "hidden",
                background: "#1a1a2e",
                aspectRatio: "16 / 9",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/staging/1.jpg"
                aria-label="GetNearMe — home staging AI: prima e dopo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              >
                <source src="/staging/prima_dopo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* Operational flow — Dall'annuncio al cliente */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div className="max-w-7xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 900,
                  color: "#1a1a2e",
                  lineHeight: 1.15,
                  marginBottom: 12,
                }}
              >
                {"Dall'annuncio al cliente, "}
                <span style={{ color: "#f59e0b" }}>in pochi minuti.</span>
              </h2>
              <p style={{ color: "#666", fontSize: 16, maxWidth: 720, margin: "0 auto", lineHeight: 1.6 }}>
                {"Niente da installare, niente da imparare. Parti dall'annuncio e l'assistente AI prepara tutto il materiale, già col tuo brand."}
              </p>
            </div>
            {(() => {
              const flowSteps = [
                { n: "1", icon: Link2, color: "#6366f1", bg: "#eef2ff", title: "Parti dall'annuncio", desc: "Incolli il link da Immobiliare o Idealista, oppure carichi le tue foto. GetNearMe legge i dati dell'immobile.", chips: ["Dati immobile", "Foto", "Zona"] },
                { n: "2", icon: Sparkles, color: "#f59e0b", bg: "#fffbeb", title: "L'AI prepara tutto", desc: "In pochi minuti l'assistente genera i materiali, già col tuo logo e i tuoi colori.", chips: ["Home staging", "Video", "Post social", "Report PDF"] },
                { n: "3", icon: Send, color: "#10b981", bg: "#ecfdf5", title: "Pubblichi e invii", desc: "Pubblichi sui social, metti sui portali o mandi al cliente. Tutto pronto, senza altri programmi.", chips: ["Portali", "Social", "Cliente"] },
              ];
              return (
                <div className="flow-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, alignItems: "stretch" }}>
                  {flowSteps.map((s) => {
                    const IconComp = s.icon;
                    return (
                      <div key={s.n} className="neo-border neo-shadow" style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, border: `2px solid ${s.color}`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <IconComp size={22} strokeWidth={2} />
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: s.color, textTransform: "uppercase", letterSpacing: 0.5 }}>Passo {s.n}</span>
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", margin: 0, lineHeight: 1.25 }}>{s.title}</h3>
                        <p style={{ color: "#444", fontSize: 14, lineHeight: 1.6, margin: 0, flex: 1 }}>{s.desc}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {s.chips.map((c) => (
                            <span key={c} style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e", background: s.bg, border: `1.5px solid ${s.color}55`, borderRadius: 999, padding: "5px 12px" }}>{c}</span>
                          ))}
                        </div>
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
          `}</style>
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

        {/* Time saved — Ogni attività ti porta via tempo */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-3">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.15, margin: "0 0 14px" }}>
                Ogni attività ti porta via tempo.<br />
                <span style={{ color: "#f59e0b" }}>Con GetNearMe, minuti.</span>
              </h2>
              <p style={{ color: "#666", fontSize: 17, maxWidth: 720, margin: "0 auto", lineHeight: 1.6 }}>
                {"Quello che oggi ti richiede ore lo fai in pochi minuti. Su una settimana di lavoro è più di un giorno e mezzo che ti riprendi per clienti e trattative."}
              </p>
            </div>
            {(() => {
              const DARK = "#0E2344";
              const GREEN = "#009874";
              const timeRows = [
                { icon: Sparkles, activity: "Home staging di una stanza", before: "~2 ore con designer o Photoshop", after: "30 secondi" },
                { icon: Video, activity: "Video per l'annuncio", before: "mezza giornata col videomaker", after: "2 minuti" },
                { icon: Megaphone, activity: "Post per i social", before: "~30 minuti su Canva", after: "1 minuto" },
                { icon: FileText, activity: "Report comparativo", before: "~1 ora tra Excel e PowerPoint", after: "2 minuti" },
                { icon: TrendingUp, activity: "Analisi di zona", before: "~30 minuti tra mappe e ricerche", after: "immediata" },
              ];
              return (
                <div className="neo-border neo-shadow" style={{ background: "#fff", borderRadius: 20, overflow: "hidden" }}>
                  <div className="time-row time-head" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", alignItems: "center", gap: 16, padding: "16px 24px", background: "#1a1a2e", color: "#fff", fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <div>Attività</div>
                    <div>Come la fai oggi</div>
                    <div style={{ textAlign: "right" }}>Con GetNearMe</div>
                  </div>
                  {timeRows.map((r, i) => {
                    const IconComp = r.icon;
                    return (
                      <div key={r.activity} className="time-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr", alignItems: "center", gap: 16, padding: "16px 24px", borderTop: i === 0 ? "none" : "1px solid #eef0f4" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 40, height: 40, borderRadius: 10, background: "#eef2ff", border: "2px solid #2563EB55", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <IconComp size={18} strokeWidth={2} />
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{r.activity}</span>
                        </div>
                        <div className="time-before" style={{ fontSize: 14, color: "#6b7280", textDecoration: "line-through" }}>{r.before}</div>
                        <div className="time-after" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontWeight: 800, fontSize: 15, color: GREEN }}>
                          <Clock size={15} strokeWidth={2.5} /> {r.after}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", marginTop: 14 }}>
              {"Stime indicative sul tempo tipico di preparazione manuale."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <a href="#pricing" className="neo-border neo-shadow" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f59e0b", color: "#1a1a2e", fontSize: 17, fontWeight: 800, padding: "16px 32px", borderRadius: 12, textDecoration: "none" }}>
                Prova gratis <ArrowRight size={20} strokeWidth={2.5} />
              </a>
            </div>
          </div>
          <style>{`
            @media (max-width: 768px) {
              .time-head { display: none !important; }
              .time-row { grid-template-columns: 1fr !important; gap: 4px !important; text-align: center; justify-items: center; padding: 16px !important; }
              .time-before { text-align: center; }
              .time-after { justify-content: center !important; }
            }
          `}</style>
        </section>

        {/* Real examples teaser */}
        <section style={{ padding: "70px 0", background: "#f3f4f6" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-6">
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#1a1a2e", lineHeight: 1.15, marginBottom: 12 }}>
                Esempi reali. <span style={{ color: "#f59e0b" }}>Risultati concreti.</span>
              </h2>
              <p style={{ color: "#555", fontSize: 16, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
                {"Guarda cosa puoi creare con GetNearMe: video, reel e post pronti in pochi click. Questi sono output veri, non mockup."}
              </p>
            </div>
            <ReferenceGallery
              variant="gallery"
              color="#6366f1"
              media={[
                { type: "video", src: "/reference/primo-piano.mp4", title: "Avatar in primo piano", desc: "Video con avatar, script e sottotitoli generati dall'AI." },
                { type: "video", src: "/reference/prima-dopo.mp4", title: "Prima vs Dopo", desc: "Carichi una foto: l'AI arreda e crea il video automaticamente." },
                { type: "video", src: "/reference/giorno-notte.mp4", title: "Giorno e notte", desc: "L'AI trasforma l'illuminazione della scena." },
                { type: "video", src: "/reference/social-reel.mp4", title: "Reel per i social", desc: "Reel pronto per Instagram, TikTok e Reels." },
                { type: "video", src: "/reference/construction.mp4", title: "Timelapse AI", desc: "Da una foto dell'esterno, l'AI genera il timelapse." },
                { type: "video", src: "/reference/split.mp4", title: "Schermo diviso", desc: "Immobile e avatar parlante nello stesso video." },
              ]}
            />
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 36 }}>
              <a href={`/${locale}/reference`} className="neo-border neo-shadow" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#1a1a2e", fontSize: 16, fontWeight: 800, padding: "15px 28px", borderRadius: 12, textDecoration: "none", border: "1.5px solid rgba(26,26,46,0.25)" }}>
                Guarda tutti gli esempi
              </a>
              <a href="#pricing" className="neo-border neo-shadow" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f59e0b", color: "#1a1a2e", fontSize: 16, fontWeight: 800, padding: "15px 28px", borderRadius: 12, textDecoration: "none" }}>
                Prova gratis <ArrowRight size={18} strokeWidth={2.5} />
              </a>
            </div>
          </div>
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
                    border: "1px solid rgba(26,26,46,0.10)",
                    boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
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
                  border: "1px solid rgba(26,26,46,0.10)",
                  padding: "18px 48px",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 18,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {l.finalCta.button}
              </a>
              <a
                data-cal-link="getnearme/30min"
                data-cal-config='{"layout":"month_view"}'
                className="neo-shadow-light final-cta-btn"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#fff",
                  border: "2px solid #fff",
                  padding: "18px 36px",
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 18,
                  cursor: "pointer",
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(l.finalCta as any).buttonDemo}
              </a>
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
              <p style={{ color: "#6b7280", fontSize: 13 }}>
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
