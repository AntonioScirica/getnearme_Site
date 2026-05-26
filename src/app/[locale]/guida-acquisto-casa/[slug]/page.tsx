import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import {
  Search,
  FileSignature,
  Handshake,
  FolderCheck,
  UserCheck,
  FileSearch,
  FileStack,
  Landmark,
  Scale,
  Calculator,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Home,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS } from "../data";
import { notFound } from "next/navigation";
import AccordionSection from "../components/AccordionSection";
import GuideChecklist from "../components/GuideChecklist";
import TaxCalculator from "../components/TaxCalculator";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    for (const chapter of CHAPTERS) {
      params.push({ locale, slug: chapter.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chapter = CHAPTERS.find((c) => c.slug === slug);
  if (!chapter) return {};

  return {
    title: chapter.seoTitle,
    description: chapter.seoDescription,
    alternates: {
      canonical: `https://getnearme.it/it/guida-acquisto-casa/${slug}`,
    },
    openGraph: {
      title: chapter.seoTitle,
      description: chapter.seoDescription,
      type: "article",
    },
  };
}

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search size={24} />,
  FileSignature: <FileSignature size={24} />,
  Handshake: <Handshake size={24} />,
  FolderCheck: <FolderCheck size={24} />,
  UserCheck: <UserCheck size={24} />,
  FileSearch: <FileSearch size={24} />,
  FileStack: <FileStack size={24} />,
  Landmark: <Landmark size={24} />,
  Scale: <Scale size={24} />,
  Calculator: <Calculator size={24} />,
  ShieldAlert: <ShieldAlert size={24} />,
};

export default async function ChapterPage({ params }: Props) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };

  const chapterIndex = CHAPTERS.findIndex((c) => c.slug === slug);
  if (chapterIndex === -1) notFound();

  const chapter = CHAPTERS[chapterIndex];
  const prevChapter = chapterIndex > 0 ? CHAPTERS[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < CHAPTERS.length - 1 ? CHAPTERS[chapterIndex + 1] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: chapter.seoTitle,
    description: chapter.seoDescription,
    author: {
      "@type": "Organization",
      name: "GetNearMe",
      url: "https://getnearme.it",
    },
    publisher: {
      "@type": "Organization",
      name: "GetNearMe",
      url: "https://getnearme.it",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://getnearme.it/it/guida-acquisto-casa/${slug}`,
    },
    isPartOf: {
      "@type": "WebPage",
      name: "Guida completa all'acquisto casa in Italia",
      url: "https://getnearme.it/it/guida-acquisto-casa",
    },
    inLanguage: "it",
    datePublished: "2026-05-01",
    dateModified: "2026-05-23",
  };

  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{ background: "#fafaf8", color: "#1a1a2e" }}
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navbar */}
      <div className="sticky top-0 z-50">
        <Navbar locale={locale} />
      </div>

      {/* Breadcrumb */}
      <nav
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "24px 24px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#a1a1aa",
            flexWrap: "wrap",
          }}
        >
          <Link
            href={`/${locale}`}
            style={{ color: "#a1a1aa", textDecoration: "none" }}
          >
            Home
          </Link>
          <ChevronRight size={14} />
          <Link
            href={`/${locale}/guida-acquisto-casa`}
            style={{ color: "#a1a1aa", textDecoration: "none" }}
          >
            Guida Acquisto Casa
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: "#1a1a2e", fontWeight: 600 }}>
            {chapter.title}
          </span>
        </div>
      </nav>

      {/* Chapter Header */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "40px 24px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              minWidth: 52,
              borderRadius: 14,
              background: "#fef3c7",
              border: "2px solid #1a1a2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1a1a2e",
            }}
          >
            {iconMap[chapter.icon]}
          </div>
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Capitolo {chapterIndex + 1} di {CHAPTERS.length}
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 900,
            lineHeight: 1.15,
            margin: "0 0 12px",
          }}
        >
          {chapter.title}
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "#71717a",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {chapter.seoDescription}
        </p>
      </section>

      {/* Chapter Content — Accordion */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 24px 16px",
        }}
      >
        {chapter.sections.map((section, idx) => (
          <AccordionSection
            key={idx}
            index={idx}
            title={section.title}
            content={section.content}
            defaultOpen={idx === 0}
          />
        ))}
      </section>

      {/* Tax Calculator — only on costi-e-tasse chapter */}
      {slug === "costi-e-tasse" && (
        <section
          style={{
            maxWidth: 780,
            margin: "0 auto",
            padding: "0 24px 16px",
          }}
        >
          <TaxCalculator />
        </section>
      )}

      {/* Checklist */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 24px 48px",
        }}
      >
        <GuideChecklist slug={slug} items={chapter.checklist} />
      </section>

      {/* Navigation */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 24px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {prevChapter && (
            <Link
              href={`/${locale}/guida-acquisto-casa/${prevChapter.slug}`}
              style={{
                flex: 1,
                minWidth: "min(100%, 280px)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "3px solid #1a1a2e",
                  borderRadius: 16,
                  boxShadow: "4px 4px 0px #1a1a2e",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <ChevronLeft size={20} color="#a1a1aa" />
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#a1a1aa",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Capitolo precedente
                  </span>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    {prevChapter.title}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {nextChapter && (
            <Link
              href={`/${locale}/guida-acquisto-casa/${nextChapter.slug}`}
              style={{
                flex: 1,
                minWidth: "min(100%, 280px)",
                textDecoration: "none",
                color: "inherit",
                marginLeft: !prevChapter ? "auto" : undefined,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "3px solid #1a1a2e",
                  borderRadius: 16,
                  boxShadow: "4px 4px 0px #1a1a2e",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 12,
                  textAlign: "right",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#a1a1aa",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Capitolo successivo
                  </span>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    {nextChapter.title}
                  </div>
                </div>
                <ChevronRight size={20} color="#a1a1aa" />
              </div>
            </Link>
          )}
        </div>

        {/* Back to guide */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            href={`/${locale}/guida-acquisto-casa`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "#71717a",
              textDecoration: "none",
            }}
          >
            <Home size={16} />
            Torna alla guida completa
          </Link>
        </div>
      </section>

      {/* CTA Bottom */}
      <section
        style={{
          textAlign: "center",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            maxWidth: 580,
            margin: "0 auto",
            background: "#1a1a2e",
            border: "3px solid #1a1a2e",
            borderRadius: 20,
            boxShadow: "6px 6px 0px #f59e0b",
            padding: "40px 32px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(245, 158, 11, 0.15)",
              marginBottom: 16,
            }}
          >
            <Search size={28} color="#f59e0b" />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 900,
              margin: "0 0 8px",
            }}
          >
            Analizza ogni annuncio
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#a1a1aa",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            GetNearMe ti mostra prezzo al mq, servizi vicini e
            <br />
            confronto con il mercato. Direttamente dal portale.
          </p>
          <a
            href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia?hl=it"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              background: "#f59e0b",
              color: "#1a1a2e",
              border: "3px solid #f59e0b",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "4px 4px 0px rgba(255,255,255,0.15)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
          >
            Prova GetNearMe gratis
            <ChevronRight size={16} />
          </a>
        </div>
      </section>

      {/* Content styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .chapter-content p {
              margin: 0 0 12px;
            }
            .chapter-content p:last-child {
              margin-bottom: 0;
            }
            .chapter-content ul {
              margin: 8px 0 16px;
              padding-left: 24px;
            }
            .chapter-content ul:last-child {
              margin-bottom: 0;
            }
            .chapter-content li {
              margin-bottom: 6px;
              line-height: 1.6;
            }
            .chapter-content h3 {
              font-size: 17px;
              font-weight: 700;
              margin: 20px 0 8px;
              color: #1a1a2e;
            }
            .chapter-content strong {
              color: #1a1a2e;
              font-weight: 600;
            }
            .chapter-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0 16px;
              font-size: 14px;
              border-radius: 12px;
              overflow: hidden;
              border: 2px solid #e4e4e7;
            }
            .chapter-content thead {
              background: #f4f4f5;
            }
            .chapter-content th {
              text-align: left;
              padding: 10px 14px;
              font-weight: 700;
              color: #1a1a2e;
              border-bottom: 2px solid #e4e4e7;
            }
            .chapter-content td {
              padding: 10px 14px;
              border-bottom: 1px solid #f4f4f5;
            }
            .chapter-content tbody tr:nth-child(even) {
              background: #fafafa;
            }
            .chapter-content tbody tr:last-child td {
              border-bottom: none;
            }
          `,
        }}
      />

      {/* Footer note */}
      <footer
        style={{
          textAlign: "center",
          padding: "0 24px 40px",
          fontSize: 13,
          color: "#a1a1aa",
        }}
      >
        Guida aggiornata a Maggio 2026 · GetNearMe
      </footer>
    </div>
  );
}
