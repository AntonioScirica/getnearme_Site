import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import AuthCta from "@/components/AuthCta";
import { type Locale } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/blog";
import BlogPostCard from "./components/BlogPostCard";

// Content is published daily by cron, not fixed at deploy time — ISR instead
// of static generation keeps the hub fresh without a rebuild per post.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE_URL = "https://www.getnearme.it";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "it") return {};

  return {
    title: "Blog GetNearMe — risorse per agenti immobiliari",
    description:
      "Guide pratiche su home staging AI, video per annunci, social media e produttività per agenzie immobiliari.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
    },
    openGraph: {
      title: "Blog GetNearMe — risorse per agenti immobiliari",
      description:
        "Guide pratiche su home staging AI, video per annunci, social media e produttività per agenzie immobiliari.",
      type: "website",
    },
  };
}

export default async function BlogHubPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };

  // V1 is IT-only — see plan "Blog automatico SEO/GEO". Other locales 404
  // instead of rendering an empty hub.
  if (locale !== "it") notFound();

  const posts = await getPublishedPosts(locale);

  return (
    <div className="min-h-screen overflow-x-clip" style={{ background: "#fafaf8", color: "#1a1a2e" }}>
      <div className="sticky top-0 z-50">
        <Navbar locale={locale} />
      </div>

      <section style={{ padding: "80px 24px 48px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 700,
            margin: "0 auto 16px",
          }}
        >
          Blog per agenti{" "}
          <span style={{ color: "#f59e0b", textDecoration: "underline", textDecorationThickness: 4, textUnderlineOffset: 6 }}>
            immobiliari
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#52525b", maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
          Home staging AI, video, social media e produttività: guide pratiche per far crescere la tua agenzia.
        </p>
      </section>

      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px" }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "#71717a", fontSize: 15 }}>
            Nuovi articoli in arrivo a breve.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: 24,
            }}
          >
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 20,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
            padding: "40px 32px",
          }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#1a1a2e" }}>Prova GetNearMe gratis</h2>
          <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
            Staging AI, video, template social e report brandizzati per la tua agenzia.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
            <a
              data-cal-link="getnearme/30min"
              data-cal-config='{"layout":"month_view"}'
              className="neo-shadow neo-cta-blue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: 12,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Prenota una demo <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <AuthCta
              locale={locale}
              href={`/${locale}#pricing`}
              className="neo-border neo-shadow neo-cta-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#fff",
                color: "#1a1a2e",
                fontSize: 16,
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: 12,
                textDecoration: "none",
              }}
              dashLabel="Vai alla dashboard"
            >
              Vedi piani e prezzi
            </AuthCta>
          </div>
        </div>
      </section>
    </div>
  );
}
