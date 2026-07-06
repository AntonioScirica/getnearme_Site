import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

// Text-only card — no cover image. The available assets are 9:16 reel
// posters that crop badly into any landscape card format; simpler and
// cleaner to skip images here entirely rather than force a bad crop.
export default function BlogPostCard({ post, locale }: { post: BlogPost; locale: string }) {
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
          padding: "24px 22px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#3B83F6",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          {PILLAR_LABELS[post.pillar] || post.pillar}
        </span>
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>
          {post.title}
        </h2>
        <p style={{ fontSize: 13.5, color: "#6b7280", margin: "0 0 16px", lineHeight: 1.5, flex: 1 }}>
          {post.seo_description}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13.5, fontWeight: 700, color: "#3B83F6" }}>
          Leggi l&apos;articolo
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}
