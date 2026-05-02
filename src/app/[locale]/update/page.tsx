import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Rocket,
  Star,
  MessageSquareHeart,
  PartyPopper,
  Camera,
  Video,
  LayoutGrid,
  GitCompare,
  ChevronRight,
  Construction,
  Gauge,
  MousePointerClick,
} from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Novità | GetNearMe",
    description: "Scopri le ultime novità e miglioramenti di GetNearMe",
  };
}

const CURRENT_VERSION = "1.3.5";

const updates: {
  version: string;
  date: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  features: {
    icon: React.ReactNode;
    title: string;
    description: string;
    tag?: string;
    tagColor?: string;
  }[];
}[] = [
  {
    version: "1.3.5",
    date: "Maggio 2026",
    badge: "Ultima versione",
    badgeColor: "#059669",
    title: "Video AI Cantiere e wizard più reattivo",
    subtitle:
      "Trasforma una foto del tuo immobile finito in un timelapse cinematografico del cantiere, e lavora con un wizard ancora più fluido.",
    features: [
      {
        icon: <Construction size={22} />,
        title: "Video AI Cantiere",
        description:
          "Da una sola foto dell'immobile finito generi un timelapse: scavo → struttura → casa completa, chiuso da un walkthrough cinematografico. Pronto per i social.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Gauge size={22} />,
        title: "Timelapse più punchy",
        description:
          "La fase di costruzione ora scorre più veloce e diretta, prima del walkthrough finale. Niente tempi morti, niente stacchi visibili tra una scena e l'altra.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
      {
        icon: <MousePointerClick size={22} />,
        title: "Wizard senza attriti",
        description:
          "Il pulsante \"Torna ai template\" risponde all'istante e tempo stimato chiaro sopra ogni rendering. Meno popup, più creatività.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
    ],
  },
  {
    version: "1.3.4",
    date: "Maggio 2026",
    badge: "",
    badgeColor: "#6b7280",
    title: "Più veloce, più libero",
    subtitle:
      "Wizard creativi accessibili ovunque, analisi istantanea e una dashboard ambassador tutta nuova.",
    features: [
      {
        icon: <Camera size={22} />,
        title: "Foto AI ovunque",
        description:
          "La tua creatività non ha confini. Trasforma qualsiasi foto in uno staging professionale — ovunque ti trovi nel browser.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <LayoutGrid size={22} />,
        title: "Post Social senza limiti",
        description:
          "Crea grafiche mozzafiato per Instagram e Facebook in pochi secondi, direttamente dalla tua estensione.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Star size={22} />,
        title: "Programma Ambassador",
        description:
          "Diventa protagonista della crescita di GetNearMe. Dashboard dedicata, codice promo personale e provvigioni su ogni agenzia.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Zap size={22} />,
        title: "Analisi fulminea",
        description:
          "Zero attese. Sblocca l'analisi completa di un immobile all'istante — i dati si caricano mentre tu decidi.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
      {
        icon: <Sparkles size={22} />,
        title: "Foto AI alla velocità della luce",
        description:
          "Il wizard si apre in un lampo. Niente più caricamenti — inizia subito a creare.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
      {
        icon: <GitCompare size={22} />,
        title: "Confronto immobili perfezionato",
        description:
          "Esperienza più fluida e intuitiva nella comparazione. Ogni dettaglio al posto giusto.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
    ],
  },
  {
    version: "1.3.3",
    date: "Aprile 2026",
    badge: "",
    badgeColor: "#6b7280",
    title: "AI Video e Stabilità",
    subtitle: "Avatar parlante AI, miglioramenti selettori e fix di stabilità.",
    features: [
      {
        icon: <Video size={22} />,
        title: "AI Video con avatar parlante",
        description:
          "Genera video verticali professionali con un avatar AI che descrive il tuo immobile.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Shield size={22} />,
        title: "Stabilità e correzioni",
        description:
          "Miglioramenti sotto il cofano per un'esperienza più stabile e affidabile su tutti i portali.",
      },
    ],
  },
];

export default async function UpdatePage({ params }: Props) {
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
          <PartyPopper size={18} color="#f59e0b" />
          <span>GetNearMe si aggiorna!</span>
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
          Scopri le{" "}
          <span
            style={{
              color: "#f59e0b",
              textDecoration: "underline",
              textDecorationThickness: 4,
              textUnderlineOffset: 6,
            }}
          >
            novità
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "#52525b",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Ogni aggiornamento migliora la tua esperienza.
          <br />
          Ecco cosa c&apos;è di nuovo.
        </p>
      </section>

      {/* Updates Timeline */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {updates.map((update, idx) => (
          <div key={update.version} style={{ marginBottom: idx < updates.length - 1 ? 56 : 0 }}>
            {/* Version Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  background: "#1a1a2e",
                  color: "#fff",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  border: "3px solid #1a1a2e",
                }}
              >
                v{update.version}
              </div>
              <span style={{ color: "#71717a", fontSize: 14, fontWeight: 500 }}>
                {update.date}
              </span>
              {update.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "4px 12px",
                    background: update.badgeColor,
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  {update.badge}
                </span>
              )}
            </div>

            {/* Card */}
            <div
              style={{
                background: "#fff",
                border: "3px solid #1a1a2e",
                borderRadius: 20,
                boxShadow: "6px 6px 0px #1a1a2e",
                overflow: "hidden",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: "28px 32px 20px",
                  borderBottom: "2px solid #f3f4f6",
                }}
              >
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  {update.title}
                </h2>
                <p style={{ fontSize: 15, color: "#71717a", margin: 0, lineHeight: 1.5 }}>
                  {update.subtitle}
                </p>
              </div>

              {/* Features List */}
              <div style={{ padding: "8px 0" }}>
                {update.features.map((feature, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "20px 32px",
                      borderBottom:
                        fIdx < update.features.length - 1 ? "1px solid #f3f4f6" : "none",
                      alignItems: "flex-start",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        minWidth: 44,
                        borderRadius: 12,
                        background: "#fef3c7",
                        border: "2px solid #1a1a2e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#1a1a2e",
                      }}
                    >
                      {feature.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {feature.title}
                        </h3>
                        {feature.tag && (
                          <span
                            style={{
                              padding: "2px 8px",
                              background: `${feature.tagColor}15`,
                              color: feature.tagColor,
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: 0.3,
                              textTransform: "uppercase",
                            }}
                          >
                            {feature.tag}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#52525b",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
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
            <Rocket size={28} color="#f59e0b" />
          </div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 900,
              margin: "0 0 8px",
            }}
          >
            Ti piace GetNearMe?
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#a1a1aa",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            Lascia una recensione sul Chrome Web Store.
            <br />
            Ogni stella ci aiuta a crescere!
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
            <MessageSquareHeart size={18} />
            Lascia una recensione
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
        GetNearMe v{CURRENT_VERSION} — Made with ❤️ in Italia
      </footer>
    </div>
  );
}
