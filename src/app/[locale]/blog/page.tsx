import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/landing/AgenteImmoLanding";
import { type Locale } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/blog";
import EndCta from "./components/EndCta";
import BlogPostCard from "./components/BlogPostCard";

// Content is published daily by cron, not fixed at deploy time — ISR instead
// of static generation keeps the hub fresh without a rebuild per post.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE_URL = "https://agenteimmo.me";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "it") return {};

  return {
    title: "Blog Agente Immo, risorse per agenti immobiliari",
    description:
      "Guide pratiche su home staging virtuale, video per i social, sito personale e lavoro in agenzia per agenti immobiliari.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
    },
    openGraph: {
      title: "Blog Agente Immo, risorse per agenti immobiliari",
      description:
        "Guide pratiche su home staging virtuale, video per i social, sito personale e lavoro in agenzia per agenti immobiliari.",
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
          Home staging virtuale, video per i social e il tuo sito: guide pratiche per vincere più incarichi.
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

      <EndCta locale={locale} title="Prova Agente Immo gratis" />

      <SiteFooter lang="it" />
    </div>
  );
}
