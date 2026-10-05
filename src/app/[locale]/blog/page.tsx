import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/landing/AgenteImmoLanding";
import { type Locale } from "@/lib/i18n";
import { getPublishedPosts } from "@/lib/blog";
import { breadcrumbs, ORG_ID, SITE_ID } from "@/lib/seo";
import EndCta from "./components/EndCta";
import BlogPostCard from "./components/BlogPostCard";

// Content is published daily by cron, not fixed at deploy time — ISR instead
// of static generation keeps the hub fresh without a rebuild per post.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

const BASE_URL = "https://agenteimmo.me";
const TITLE = "Blog Agente Immo: risorse per agenti immobiliari";
const DESCRIPTION = "Articoli pratici per agenti immobiliari: home staging virtuale, video per i social, report di zona, strumenti AI, sito personale e lavoro in agenzia.";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "it") return {};

  return {
    title: { absolute: TITLE },
    description:
      DESCRIPTION,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
      languages: { it: `${BASE_URL}/it/blog`, "x-default": `${BASE_URL}/it/blog` },
    },
    openGraph: {
      title: TITLE,
      description:
        DESCRIPTION,
      type: "website",
      url: `${BASE_URL}/it/blog`,
    },
  };
}

export default async function BlogHubPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };

  // V1 is IT-only — see plan "Blog automatico SEO/GEO". Other locales 404
  // instead of rendering an empty hub.
  if (locale !== "it") notFound();

  const posts = await getPublishedPosts(locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Blog", "@id": `${BASE_URL}/it/blog`, url: `${BASE_URL}/it/blog`, name: TITLE, description: DESCRIPTION, inLanguage: "it-IT", isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID },
        blogPost: posts.slice(0, 20).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${BASE_URL}/it/blog/${p.slug}`, datePublished: p.published_at, dateModified: p.updated_at || p.published_at })) },
      breadcrumbs([["Agente Immo", `${BASE_URL}/it`], ["Blog", `${BASE_URL}/it/blog`]]),
    ],
  };

  return (
    <div className="min-h-screen overflow-x-clip" style={{ background: "#fafaf8", color: "#1a1a2e" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
        <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 486, margin: "10px auto 0", lineHeight: 1.6 }}>
          Cerchi il quadro completo? Parti da <Link href="/it/agente-immobiliare" style={{ color: "#537eec", fontWeight: 700 }}>agente immobiliare: cosa fa</Link> o sfoglia tutte le <Link href="/it/guide" style={{ color: "#537eec", fontWeight: 700 }}>guide per agenti immobiliari</Link>.
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
