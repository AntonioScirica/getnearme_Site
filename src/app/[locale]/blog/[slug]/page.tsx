import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import AuthCta from "@/components/AuthCta";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { type Locale } from "@/lib/i18n";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { getCoverImage } from "@/lib/blog-images";
import FaqAccordion from "../components/FaqAccordion";
import BlogPostCard from "../components/BlogPostCard";
import InlineCta from "../components/InlineCta";

export const revalidate = 3600;

const MARKDOWN_COMPONENTS: Components = {
  h2: (props) => <h2 style={{ fontSize: 24, fontWeight: 800, margin: "32px 0 12px", color: "#1a1a2e" }} {...props} />,
  h3: (props) => <h3 style={{ fontSize: 19, fontWeight: 700, margin: "24px 0 8px", color: "#1a1a2e" }} {...props} />,
  p: (props) => <p style={{ margin: "0 0 16px" }} {...props} />,
  a: (props) => <a style={{ color: "#3B83F6", fontWeight: 700, textDecoration: "underline" }} {...props} />,
  table: (props) => (
    <div style={{ overflowX: "auto", margin: "16px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "2px solid #e4e4e7", borderRadius: 12 }} {...props} />
    </div>
  ),
  th: (props) => <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, background: "#f4f4f5", borderBottom: "2px solid #e4e4e7" }} {...props} />,
  td: (props) => <td style={{ padding: "10px 14px", borderBottom: "1px solid #f4f4f5" }} {...props} />,
  ul: (props) => <ul style={{ margin: "8px 0 16px", paddingLeft: 24 }} {...props} />,
  li: (props) => <li style={{ marginBottom: 6, lineHeight: 1.6 }} {...props} />,
};

// Splits the article into an intro chunk + one chunk per H2, so InlineCta
// blocks can be interleaved between sections instead of only at the end.
function splitIntoSections(markdown: string): string[] {
  return markdown.split(/(?=^##\s+)/m).filter((s) => s.trim().length > 0);
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const BASE_URL = "https://www.getnearme.it";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== "it") return {};

  const post = await getPostBySlug(locale, slug);
  if (!post) return {};

  return {
    title: post.seo_title,
    description: post.seo_description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog/${slug}`,
      // V1 IT-only: no hreflang entries for locales that don't have this post
      // (pointing hreflang at a URL that 404s is worse than omitting it).
      languages: {
        it: `${BASE_URL}/it/blog/${slug}`,
        "x-default": `${BASE_URL}/it/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.seo_title,
      description: post.seo_description,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: [{ url: `${BASE_URL}${getCoverImage(post.pillar, post.slug)}` }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };

  if (locale !== "it") notFound();

  const post = await getPostBySlug(locale, slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(locale, post.pillar, slug);
  const cover = getCoverImage(post.pillar, post.slug);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description,
    image: `${BASE_URL}${cover}`,
    author: { "@type": "Organization", name: "GetNearMe", url: BASE_URL },
    publisher: { "@type": "Organization", name: "GetNearMe", url: BASE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/${locale}/blog/${slug}` },
    inLanguage: locale,
    datePublished: post.published_at,
    dateModified: post.updated_at,
  };

  const faqJsonLd = post.faq_items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq_items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen overflow-x-clip" style={{ background: "#fafaf8", color: "#1a1a2e" }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && (
        // eslint-disable-next-line react/no-danger
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <div className="sticky top-0 z-50">
        <Navbar locale={locale} />
      </div>

      <nav style={{ maxWidth: 780, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a1a1aa", flexWrap: "wrap" }}>
          <Link href={`/${locale}`} style={{ color: "#a1a1aa", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <Link href={`/${locale}/blog`} style={{ color: "#a1a1aa", textDecoration: "none" }}>Blog</Link>
          <ChevronRight size={14} />
          <span style={{ color: "#1a1a2e", fontWeight: 600 }}>{post.title}</span>
        </div>
      </nav>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 24px" }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 16px" }}>
          {post.title}
        </h1>

        {post.pillar === "ai-staging" ? (
          <div style={{ marginBottom: 8 }}>
            <BeforeAfterSlider />
          </div>
        ) : (
          <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16 / 9", marginBottom: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", display: "block" }} />
          </div>
        )}
      </section>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 16px" }}>
        <div style={{ fontSize: 16, lineHeight: 1.7, color: "#3f3f46" }}>
          {(() => {
            const sections = splitIntoSections(post.content_markdown);
            const midIndex = Math.floor(sections.length / 2);
            return sections.map((section, i) => (
              <div key={i}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {section}
                </ReactMarkdown>
                {i < sections.length - 1 && (i === 1 || (i === midIndex && midIndex !== 1)) && (
                  <InlineCta />
                )}
              </div>
            ));
          })()}
        </div>
      </section>

      {post.faq_items.length > 0 && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "16px 24px 16px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 16px" }}>Domande frequenti</h2>
          <FaqAccordion items={post.faq_items} />
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "16px 24px 48px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Leggi anche</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
            {relatedPosts.map((rp) => (
              <BlogPostCard key={rp.id} post={rp} locale={locale} />
            ))}
          </div>
        </section>
      )}

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
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", color: "#1a1a2e" }}>
            Provalo sulla tua prossima proprietà
          </h2>
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
