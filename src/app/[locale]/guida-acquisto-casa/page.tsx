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
  BookOpen,
  Clock,
  Home,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CHAPTERS } from "./data";
import GuideProgress from "./components/GuideProgress";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Guida completa all'acquisto casa in Italia | GetNearMe",
    description:
      "Dalla ricerca al rogito: 10 capitoli con tutto quello che devi sapere per comprare casa in Italia. Documenti, mutuo, costi, tasse e errori da evitare.",
    alternates: {
      canonical: "https://getnearme.it/it/guida-acquisto-casa",
    },
    openGraph: {
      title: "Guida completa all'acquisto casa in Italia | GetNearMe",
      description:
        "Dalla ricerca al rogito: 10 capitoli con tutto quello che devi sapere per comprare casa in Italia.",
      type: "website",
    },
  };
}

const iconMap: Record<string, React.ReactNode> = {
  Search: <Search size={28} />,
  FileSignature: <FileSignature size={28} />,
  Handshake: <Handshake size={28} />,
  FolderCheck: <FolderCheck size={28} />,
  UserCheck: <UserCheck size={28} />,
  FileSearch: <FileSearch size={28} />,
  FileStack: <FileStack size={28} />,
  Landmark: <Landmark size={28} />,
  Scale: <Scale size={28} />,
  Calculator: <Calculator size={28} />,
  ShieldAlert: <ShieldAlert size={28} />,
};

const chapterDescriptions: Record<string, string> = {
  "come-cercare-casa":
    "Budget, pre-delibera mutuo, priorità, canali di ricerca e cosa controllare durante le visite.",
  "proposta-acquisto":
    "Offerta formale, clausola sospensiva, caparra confirmatoria e penitenziale.",
  compromesso:
    "Contratto preliminare, registrazione obbligatoria, trascrizione e imposte.",
  "documenti-acquirente":
    "Carta d'identità, stato civile, regime patrimoniale e documenti per casi particolari.",
  "documenti-venditore":
    "Atto di provenienza, visure, APE, titoli edilizi, conformità urbanistica e condominiale.",
  "documenti-mutuo":
    "Documenti per dipendenti, autonomi e liberi professionisti. Lista completa per la banca.",
  mutuo:
    "Fasi del mutuo, parametri LTV, Fondo Garanzia Consap e assicurazione obbligatoria.",
  "rogito-notarile":
    "Atto pubblico, ruolo del notaio, pagamento saldo e consegna chiavi.",
  "costi-e-tasse":
    "Imposte, sistema prezzo-valore, spese accessorie e agevolazioni prima casa.",
  "errori-da-evitare":
    "Abusi edilizi, donazioni, ipoteche, difformità catastali e spese condominiali.",
};

const timelineSteps = [
  { label: "Ricerca e visite", duration: "1-6 mesi", icon: <Search size={18} /> },
  { label: "Proposta d'acquisto", duration: "1-2 settimane", icon: <FileSignature size={18} /> },
  { label: "Compromesso", duration: "2-4 settimane", icon: <Handshake size={18} /> },
  { label: "Istruttoria mutuo", duration: "1-3 mesi", icon: <Landmark size={18} /> },
  { label: "Rogito e chiavi", duration: "1-2 settimane", icon: <Home size={18} /> },
];

export default async function GuidaAcquistoCasaPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };

  return (
    <div
      className="min-h-screen overflow-x-clip"
      style={{ background: "#fafaf8", color: "#1a1a2e" }}
    >
      {/* Navbar */}
      <div className="sticky top-0 z-50">
        <Navbar locale={locale} />
      </div>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "80px 24px 60px",
          textAlign: "center",
        }}
      >
        {/* Decorative shapes */}
        <div
          style={{
            position: "absolute",
            top: 40,
            right: "10%",
            width: 80,
            height: 80,
            borderRadius: "50%",
            border: "3px solid #f59e0b",
            opacity: 0.15,
            transform: "rotate(15deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "8%",
            width: 60,
            height: 60,
            borderRadius: 14,
            border: "3px solid #1a1a2e",
            opacity: 0.08,
            transform: "rotate(-12deg)",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            background: "#fff",
            border: "3px solid #1a1a2e",
            borderRadius: 100,
            boxShadow: "4px 4px 0px #1a1a2e",
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <BookOpen size={18} color="#f59e0b" />
          <span>Guida gratuita</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 700,
            margin: "0 auto 16px",
          }}
        >
          Guida all&apos;acquisto{" "}
          <span
            style={{
              color: "#f59e0b",
              textDecoration: "underline",
              textDecorationThickness: 4,
              textUnderlineOffset: 6,
            }}
          >
            casa
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "#52525b",
            maxWidth: 540,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Dalla ricerca al rogito, tutto quello che devi sapere
          <br />
          per comprare casa in Italia. 10 capitoli, zero sorprese.
        </p>
      </section>

      {/* Progress bar */}
      <GuideProgress
        totalChapters={CHAPTERS.length}
        chapterSlugs={CHAPTERS.map((c) => c.slug)}
      />

      {/* Chapter Cards Grid */}
      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: 24,
          }}
        >
          {CHAPTERS.map((chapter, idx) => (
            <Link
              key={chapter.slug}
              href={`/${locale}/guida-acquisto-casa/${chapter.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "#fff",
                  border: "3px solid #1a1a2e",
                  borderRadius: 20,
                  boxShadow: "6px 6px 0px #1a1a2e",
                  padding: "28px 28px 24px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Chapter number + icon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
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
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Capitolo {idx + 1}
                  </span>
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    margin: "0 0 8px",
                    lineHeight: 1.3,
                  }}
                >
                  {chapter.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontSize: 14,
                    color: "#52525b",
                    margin: "0 0 16px",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {chapterDescriptions[chapter.slug]}
                </p>

                {/* Read link */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#f59e0b",
                  }}
                >
                  Leggi il capitolo
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 24px 64px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 900,
            textAlign: "center",
            margin: "0 0 12px",
          }}
        >
          La timeline tipica
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#71717a",
            textAlign: "center",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          Dalla prima visita alle chiavi di casa: ecco le tempistiche realistiche.
        </p>

        <div
          style={{
            background: "#fff",
            border: "3px solid #1a1a2e",
            borderRadius: 20,
            boxShadow: "6px 6px 0px #1a1a2e",
            overflow: "hidden",
          }}
        >
          {timelineSteps.map((step, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 28px",
                borderBottom:
                  idx < timelineSteps.length - 1
                    ? "1px solid #f3f4f6"
                    : "none",
              }}
            >
              {/* Step number */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 12,
                  background:
                    idx === timelineSteps.length - 1 ? "#f59e0b" : "#fef3c7",
                  border: "2px solid #1a1a2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a2e",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {step.icon}
              </div>

              {/* Label */}
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {step.label}
                </span>
              </div>

              {/* Duration */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#71717a",
                  background: "#f4f4f5",
                  padding: "4px 12px",
                  borderRadius: 8,
                }}
              >
                <Clock size={14} />
                {step.duration}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#a1a1aa",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          Tempo totale stimato: 4-12 mesi dalla prima ricerca al rogito.
        </p>
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
            <Home size={28} color="#f59e0b" />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 900,
              margin: "0 0 8px",
            }}
          >
            Stai cercando casa?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#a1a1aa",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            GetNearMe analizza ogni annuncio immobiliare per te.
            <br />
            Prezzo, zona, servizi vicini: tutto in un click.
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
            <Search size={18} />
            Prova GetNearMe gratis
            <ChevronRight size={16} />
          </a>
        </div>
      </section>

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
