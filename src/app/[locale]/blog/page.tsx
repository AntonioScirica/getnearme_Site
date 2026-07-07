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

      <section style={{ padding: "65px 22px 36px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "clamp(25px, 4vw, 36px)",
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 576,
            margin: "0 auto 13px",
            color: "#1a1a2e",
          }}
        >
          Risorse per agenti immobiliari
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 486, margin: "0 auto", lineHeight: 1.6 }}>
          Home staging AI, video, social media e produttività: guide pratiche per far crescere la tua agenzia.
        </p>
      </section>

      <section style={{ maxWidth: 1152, margin: "0 auto", padding: "0 22px 72px" }}>
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "#71717a", fontSize: 14 }}>
            Nuovi articoli in arrivo a breve.
          </p>
        ) : (
          <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}
        <style>{`
          @media (max-width: 1024px) { .blog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      <section style={{ maxWidth: 702, margin: "0 auto", padding: "0 22px 72px", textAlign: "center" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 18,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
            padding: "36px 29px",
          }}
        >
          <h2 style={{ fontSize: 23, fontWeight: 800, margin: "0 0 7px", color: "#1a1a2e" }}>Prova GetNearMe gratis</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 22px", lineHeight: 1.6 }}>
            Staging AI, video, template social e report brandizzati per la tua agenzia.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 13 }}>
            <a
              data-cal-link="getnearme/30min"
              data-cal-config='{"layout":"month_view"}'
              className="neo-shadow neo-cta-blue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                padding: "13px 25px",
                borderRadius: 11,
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
                gap: 7,
                background: "#fff",
                color: "#1a1a2e",
                fontSize: 14,
                fontWeight: 700,
                padding: "13px 25px",
                borderRadius: 11,
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
