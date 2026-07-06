import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCoverImage } from "@/lib/blog-images";
import type { BlogPost } from "@/lib/blog";

const PILLAR_LABELS: Record<string, string> = {
  "ai-staging": "Home Staging AI",
  "ai-video": "Video AI",
  "social-media": "Social Media",
  "reports-analytics": "Report & Analisi",
  "ai-avatar": "Avatar AI",
  "agency-productivity": "Produttività Agenzia",
  "comparison-geo": "Confronti",
};

export default function BlogPostCard({ post, locale }: { post: BlogPost; locale: string }) {
  const cover = getCoverImage(post.pillar, post.slug);

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(26,26,46,0.10)",
          borderRadius: 16,
          boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <div style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#3B83F6",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            {PILLAR_LABELS[post.pillar] || post.pillar}
          </span>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>
            {post.title}
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5, flex: 1 }}>
            {post.seo_description}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#3B83F6" }}>
            Leggi l&apos;articolo
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
