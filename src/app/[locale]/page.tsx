import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import HeroFloatingIcons from "@/components/HeroFloatingIcons";
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
    { video: "/assets/png/gif/compare_pdf.mp4" },
    { video: "/assets/png/gif/agency_ai_anim.mp4" },
    { video: "/assets/png/gif/post_social.mp4" },
    { video: "/assets/png/gif/video_automation.mp4" },
    { video: "/assets/png/gif/prezzo_medio_m2.mp4" },
    { video: "/assets/png/gif/map_zone.mp4" },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#fafaf8", color: "#1a1a2e" }}
    >
      {/* Sticky Top Bar */}
      <div
        style={{
          background: "#1a1a2e",
          color: "#fff",
          padding: "11px 16px",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "3px solid #f59e0b",
        }}
      >
        <span>
          🔥 {l.topBar.promo}{" "}
          <span style={{ color: "#f59e0b" }}>{l.topBar.discount}</span>
        </span>
        <span className="hidden sm:inline" style={{ margin: "0 8px" }}>
          — {l.topBar.expiresIn}
        </span>
        <HomepageClient variant="countdown-inline" />
        <span style={{ marginLeft: 8, color: "#34d399" }}>
          — {l.topBar.freeTrialShort}
        </span>
      </div>

      {/* Navbar */}
      <div style={{ marginTop: 0 }}>
        <Navbar locale={locale as Locale} />
      </div>

      <main className="pt-20 relative">
        {/* Hero Section */}
        <section
          style={{
            padding: "80px 0 70px",
            background: "#fafaf8",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative shapes */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: -80,
              width: 240,
              height: 240,
              background: "#fef3c7",
              borderRadius: "50%",
              opacity: 0.5,
              border: "3px solid #fcd34d",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 180,
              right: 100,
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
            style={{
              position: "absolute",
              bottom: 20,
              left: -50,
              width: 160,
              height: 160,
              background: "#fce7f3",
              borderRadius: 24,
              opacity: 0.4,
              border: "3px solid #f9a8d4",
              transform: "rotate(-8deg)",
            }}
          />

          <div className="relative hidden md:block">
            <HeroFloatingIcons />
          </div>

          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              padding: "0 24px",
              position: "relative",
              zIndex: 10,
            }}
          >
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
              }}
            >
              ⚡ {l.hero.badge}
            </div>

            <h1
              style={{
                fontSize: "clamp(40px, 7vw, 72px)",
                fontWeight: 900,
                lineHeight: 1.05,
                margin: "0 0 22px",
                maxWidth: 780,
                letterSpacing: "-2px",
              }}
            >
              {l.hero.title1}
              <br />
              <span
                style={{
                  color: "#f59e0b",
                  textDecoration: "underline",
                  textDecorationStyle: "wavy",
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
                color: "#888",
                fontSize: 18,
                lineHeight: 1.7,
                maxWidth: 560,
                margin: "0 0 36px",
              }}
            >
              {l.hero.desc}
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a
                href="#pricing"
                className="neo-btn"
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "3px solid #1a1a2e",
                  padding: "16px 36px",
                  borderRadius: 14,
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "6px 6px 0px #1a1a2e",
                  transition: "all 0.15s",
                  letterSpacing: 0.5,
                  textDecoration: "none",
                }}
              >
                {l.hero.ctaPrimary}
              </a>
              <Link
                href={`/${locale}/tutorial`}
                className="neo-btn"
                style={{
                  background: "#fff",
                  color: "#1a1a2e",
                  border: "3px solid #1a1a2e",
                  padding: "16px 28px",
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "6px 6px 0px #1a1a2e",
                  transition: "all 0.15s",
                  textDecoration: "none",
                }}
              >
                {l.hero.ctaSecondary}
              </Link>
            </div>

            <div
              className="neo-border neo-shadow-sm"
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                marginTop: 48,
                padding: "16px 24px",
                background: "#fff",
                borderRadius: 14,
                maxWidth: 720,
              }}
            >
              {l.hero.stats.map((stat: string, i: number) => (
                <span
                  key={i}
                  style={{
                    color: "#666",
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {i > 0 && (
                    <span style={{ color: "#ddd", marginRight: 10 }}>|</span>
                  )}
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div
            style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              <div
                style={{
                  background: "#fef2f2",
                  border: "3px solid #fca5a5",
                  borderRadius: 16,
                  padding: "32px 28px",
                  boxShadow: "5px 5px 0 #fca5a540",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {l.problem.emoji}
                </div>
                <h2
                  style={{
                    fontSize: "clamp(22px, 3.5vw, 28px)",
                    fontWeight: 900,
                    color: "#dc2626",
                    margin: "0 0 12px",
                    lineHeight: 1.2,
                  }}
                >
                  {l.problem.title}
                </h2>
                <p style={{ color: "#888", fontSize: 15, lineHeight: 1.7 }}>
                  {l.problem.desc}
                </p>
              </div>
              <div
                style={{
                  background: "#ecfdf5",
                  border: "3px solid #6ee7b7",
                  borderRadius: 16,
                  padding: "32px 28px",
                  boxShadow: "5px 5px 0 #6ee7b740",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>
                  {l.solution.emoji}
                </div>
                <h2
                  style={{
                    fontSize: "clamp(22px, 3.5vw, 28px)",
                    fontWeight: 900,
                    color: "#059669",
                    margin: "0 0 12px",
                    lineHeight: 1.2,
                  }}
                >
                  {l.solution.title}
                </h2>
                <p style={{ color: "#888", fontSize: 15, lineHeight: 1.7 }}>
                  {l.solution.desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "70px 0", background: "#f3f4f6" }}>
          <div
            style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}
          >
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
                {l.features.title}{" "}
                <span
                  style={{
                    color: "#f59e0b",
                    textDecoration: "underline",
                    textDecorationStyle: "wavy",
                    textUnderlineOffset: 6,
                    textDecorationThickness: 3,
                  }}
                >
                  {l.features.titleHighlight}
                </span>
                .
              </h2>
              <p style={{ color: "#999", fontSize: 16 }}>
                {l.features.subtitle}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
                gap: 20,
              }}
            >
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
                    variant="feature-card"
                    featureData={f}
                    index={i}
                    videoSrc={featureVideos[i]?.video}
                  />
                )
              )}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: "70px 0", background: "#fffbeb" }}>
          <div
            style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}
          >
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
              <div
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
                        color: "#888",
                        boxShadow: "3px 3px 0 #1a1a2e",
                      }}
                    >
                      {s.label}:{" "}
                      <strong style={{ color: s.color }}>{s.value}</strong>
                    </span>
                  )
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
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
            modal: l.modal,
          }}
        />

        {/* How It Works */}
        <section style={{ padding: "70px 0", background: "#fff" }}>
          <div
            style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px" }}
          >
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
                {l.howItWorks.title}{" "}
                <span
                  style={{
                    background: "#1a1a2e",
                    color: "#f59e0b",
                    padding: "2px 14px",
                    borderRadius: 10,
                  }}
                >
                  {l.howItWorks.titleHighlight}
                </span>
                .
              </h2>
              <p style={{ color: "#999", fontSize: 16 }}>
                {l.howItWorks.subtitle}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                justifyContent: "center",
                flexWrap: "wrap",
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

        {/* FAQ */}
        <section style={{ padding: "70px 0", background: "#f9fafb" }}>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "0 24px",
            }}
          >
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
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              padding: "0 24px",
              textAlign: "center",
              position: "relative",
            }}
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
              {l.finalCta.title1}
              <br />
              <span style={{ color: "#f59e0b" }}>{l.finalCta.title2}</span>
            </h2>
            <p style={{ color: "#aaa", fontSize: 17, marginBottom: 36 }}>
              {l.finalCta.desc}
            </p>
            <a
              href="#pricing"
              className="neo-btn"
              style={{
                display: "inline-block",
                background: "#f59e0b",
                color: "#fff",
                border: "3px solid #fff",
                padding: "18px 48px",
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "6px 6px 0 rgba(255,255,255,0.2)",
                transition: "all 0.15s",
                letterSpacing: 0.5,
                textDecoration: "none",
              }}
            >
              {l.finalCta.button}
            </a>
            <div style={{ color: "#888", fontSize: 13, marginTop: 20 }}>
              {l.finalCta.footer}
            </div>
          </div>
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
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              padding: "0 24px",
            }}
          >
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
                  style={{
                    color: "#bbb",
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
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.features}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.pricing}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.faq}
                    </a>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/tutorial`}
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.nav.tutorial}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href={`/${locale}/privacy`}
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.footer.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/cookie`}
                      className="text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {t.footer.cookie}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/${locale}/termini`}
                      className="text-slate-400 hover:text-slate-900 transition-colors"
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
        </footer>
      </main>

      {/* Social Popup */}
      <HomepageClient variant="social-popup" popupMessages={l.popups} />
    </div>
  );
}
