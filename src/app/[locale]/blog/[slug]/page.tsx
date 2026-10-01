import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/landing/AgenteImmoLanding";
import { type Locale } from "@/lib/i18n";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { getCoverImage } from "@/lib/blog-images";
import FaqAccordion from "../components/FaqAccordion";
import EndCta from "../components/EndCta";
import BlogPostCard from "../components/BlogPostCard";
import InlineCta from "../components/InlineCta";
import { GUIDES } from "@/lib/guides";

export const revalidate = 3600;

const MARKDOWN_COMPONENTS: Components = {
  h2: (props) => <h2 style={{ fontSize: 22, fontWeight: 800, margin: "29px 0 11px", color: "#1a1a2e" }} {...props} />,
  h3: (props) => <h3 style={{ fontSize: 17, fontWeight: 700, margin: "22px 0 7px", color: "#1a1a2e" }} {...props} />,
  p: (props) => <p style={{ margin: "0 0 14px" }} {...props} />,
  a: (props) => <a style={{ color: "#537eec", fontWeight: 700, textDecoration: "underline" }} {...props} />,
  table: (props) => (
    <div style={{ overflowX: "auto", margin: "14px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "2px solid #e4e4e7", borderRadius: 11 }} {...props} />
    </div>
  ),
  th: (props) => <th style={{ textAlign: "left", padding: "9px 13px", fontWeight: 700, background: "#f4f4f5", borderBottom: "2px solid #e4e4e7" }} {...props} />,
  td: (props) => <td style={{ padding: "9px 13px", borderBottom: "1px solid #f4f4f5" }} {...props} />,
  ul: (props) => <ul style={{ margin: "7px 0 14px", paddingLeft: 22 }} {...props} />,
  li: (props) => <li style={{ marginBottom: 5, lineHeight: 1.6 }} {...props} />,
};

// Splits the article into an intro chunk + one chunk per H2, so InlineCta
// blocks can be interleaved between sections instead of only at the end.
function splitIntoSections(markdown: string): string[] {
  return markdown.split(/(?=^##\s+)/m).filter((s) => s.trim().length > 0);
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const BASE_URL = "https://agenteimmo.me";

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
      images: [{ url: getCoverImage(post.pillar, post.slug), width: 1200, height: 675 }],
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
    image: cover,
    author: { "@type": "Organization", name: "Agente Immo", url: BASE_URL },
    publisher: { "@type": "Organization", name: "Agente Immo", url: BASE_URL },
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

      <nav style={{ maxWidth: 780, margin: "0 auto", padding: "22px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#a1a1aa", flexWrap: "wrap" }}>
          <Link href={`/${locale}`} style={{ color: "#a1a1aa", textDecoration: "none" }}>Home</Link>
          <ChevronRight size={14} />
          <Link href={`/${locale}/blog`} style={{ color: "#a1a1aa", textDecoration: "none" }}>Blog</Link>
          <ChevronRight size={14} />
          <span style={{ color: "#1a1a2e", fontWeight: 600 }}>{post.title}</span>
        </div>
      </nav>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "29px 22px 22px" }}>
        <h1 style={{ fontSize: "clamp(25px, 5vw, 38px)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 14px" }}>
          {post.title}
        </h1>

        <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16 / 9", marginBottom: 7 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </section>

      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 22px 14px" }}>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "#3f3f46" }}>
          {(() => {
            const sections = splitIntoSections(post.content_markdown);
            const midIndex = Math.floor(sections.length / 2);
            return sections.map((section, i) => (
              <div key={i}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {section}
                </ReactMarkdown>
                {i < sections.length - 1 && (i === 1 || (i === midIndex && midIndex !== 1)) && (
                  <InlineCta locale={locale} />
                )}
              </div>
            ));
          })()}
        </div>
      </section>

      {post.faq_items.length > 0 && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "14px 22px 14px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 14px" }}>Domande frequenti</h2>
          <FaqAccordion items={post.faq_items} />
        </section>
      )}

      {/* guide di riferimento: ogni articolo passa link alla pagina pilastro e alle satelliti */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "14px 22px 14px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>Guide per agenti immobiliari</h2>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
          {GUIDES.map((g) => (
            <li key={g.slug}><Link href={`/it/${g.slug}`} style={{ display: "inline-block", padding: "8px 14px", borderRadius: 999, background: "#f7f7f7", fontSize: 14, fontWeight: 600, color: "#222" }}>{g.label}</Link></li>
          ))}
        </ul>
      </section>

      {relatedPosts.length > 0 && (
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "14px 22px 43px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 14px" }}>Leggi anche</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 18 }}>
            {relatedPosts.map((rp) => (
              <BlogPostCard key={rp.id} post={rp} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <EndCta locale={locale} title="Provalo sulla tua prossima casa" />

      <SiteFooter lang="it" />
    </div>
  );
}
