import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  Zap,
  Shield,
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
  Sun,
  Mail,
  Package,
  Film,
  MapPin,
  Clapperboard,
  Palette,
  CalendarClock,
  Share2,
  Clock,
  Diamond,
  Brush,
  ImagePlus,
  Wand2,
  Scissors,
  Columns2,
  PictureInPicture2,
  Globe,
  Building2,
  FileText,
  Users,
  Smartphone,
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
    title: "Novità",
    description: "Scopri le ultime novità e miglioramenti di GetNearMe",
  };
}

const CURRENT_VERSION = "1.4.0";

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
    version: "1.4.0",
    date: "Giugno 2026",
    badge: "Ultima versione",
    badgeColor: "#059669",
    title: "GetNearMe diventa una piattaforma",
    subtitle:
      "Non solo estensione: ora hai una piattaforma web completa. Immobili, report, team, foto e video AI in un unico posto, anche da telefono.",
    features: [
      {
        icon: <Globe size={22} />,
        title: "Tutto dal browser, anche senza estensione",
        description:
          "GetNearMe ora è una piattaforma web completa: Foto AI, Video AI, Post social, Montaggio, Media e Brand li gestisci da un'unica dashboard, senza dipendere dall'estensione.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Building2 size={22} />,
        title: "Pagina Immobili con import ed export",
        description:
          "Gestisci tutti i tuoi immobili in un elenco ordinato. Importa ed esporta in CSV, Excel e PDF per portare i dati dentro e fuori in un attimo.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <FileText size={22} />,
        title: "Report PDF dell'immobile",
        description:
          "Genera un report professionale in PDF con punteggio, mappa, analisi di zona e punti di interesse. Pronto da inviare al cliente.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
      {
        icon: <Users size={22} />,
        title: "Team e piano Agenzia",
        description:
          "Invita i membri della tua agenzia, condividete galleria e brand, e ognuno lavora con la stessa identità. Logo, colori e testi impostati una volta sola per tutti.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Scissors size={22} />,
        title: "Taglia & Arreda",
        description:
          "Carica un video, segna i momenti da togliere: l'AI sostituisce ogni taglio con un'animazione prima/dopo che arreda la stanza, nello stile che scegli. La tua voce continua a sentirsi.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Columns2 size={22} />,
        title: "Montaggio Schermo diviso e Picture in picture",
        description:
          "Monta le clip della casa insieme al tuo video mentre parli: schermo diviso (casa sopra, tu sotto) oppure picture in picture (casa a tutto schermo, tu in un angolo).",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Clapperboard size={22} />,
        title: "Anteprima live e timeline a tempo",
        description:
          "Sistemi le clip su una timeline lunga quanto il tuo parlato, decidi quanto dura ognuna e vedi subito l'anteprima del video mentre parte.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Smartphone size={22} />,
        title: "Tutta la piattaforma da telefono",
        description:
          "Dashboard, immobili, creazione contenuti e gestione team sono ora completamente responsive: lavori comodamente anche dallo smartphone.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Clock size={22} />,
        title: "Scadenza video in galleria",
        description:
          "Ogni video generato resta disponibile 30 giorni: ora un contatore mostra quanti giorni mancano, così scarichi in tempo quelli che ti servono.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
    ],
  },
  {
    version: "1.3.8",
    date: "Maggio 2026",
    badge: "",
    badgeColor: "#6b7280",
    title: "Foto AI: fino a 30 foto insieme",
    subtitle:
      "Il wizard Foto AI ora supporta più foto in una volta sola. Carica fino a 30 foto, scegli lo stile e genera tutto insieme.",
    features: [
      {
        icon: <ImagePlus size={22} />,
        title: "Genera fino a 30 foto insieme",
        description:
          "Carica da 1 a 30 foto nello stesso wizard, scegli lo stile e lancia la generazione. Tutte le foto vengono elaborate e puoi scaricarle direttamente.",
        tag: "Aggiornamento",
        tagColor: "#2563eb",
      },
    ],
  },
  {
    version: "1.3.7",
    date: "Maggio 2026",
    badge: "",
    badgeColor: "#6b7280",
    title: "AI Video: consegna via email + pacchetti extra",
    subtitle:
      "Il video arriva direttamente nella tua casella di posta, e quando finisci la quota mensile puoi ricaricarla con pacchetti extra. Più libertà, meno attese.",
    features: [
      {
        icon: <Mail size={22} />,
        title: "Video AI direttamente in mail",
        description:
          "Avvia il render e chiudi pure il browser: appena il video è pronto te lo inviamo via email. Niente più attese davanti allo schermo.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Package size={22} />,
        title: "Pacchetti video extra",
        description:
          "Esaurita la quota mensile? Acquista 10, 50 o 100 video extra. Non scadono e si sommano al tuo piano attuale, attivati solo quando finisci i video del mese.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Film size={22} />,
        title: "Template Montaggio Automatico",
        description:
          "Nuovo template video che monta automaticamente video e foto dell'annuncio in sequenza con transizioni fluide, musica e titoli animati. Pronto da condividere.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Clapperboard size={22} />,
        title: "Montaggio Video separato",
        description:
          "Il Montaggio Automatico ora ha la sua card dedicata nel menu Promozione. Non consuma la quota dei Video AI e puoi crearne quanti ne vuoi, senza limiti.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <MapPin size={22} />,
        title: "Punti di Interesse nel report",
        description:
          "Il report ora include una pagina dedicata con tutti i servizi vicini: trasporti, scuole, supermercati, farmacie e altro. Nella comparazione, una tabella confronta i POI di ogni immobile.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Diamond size={22} />,
        title: "Nuovo stile Foto AI: Luxury Contemporary",
        description:
          "Lo stile Industrial lascia il posto a Luxury Contemporary: marmo, ottone spazzolato, noce scuro, vetro fumé. Ogni elemento viene sostituito con la versione di lusso dello stesso mobile, senza aggiungere arredi extra.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Palette size={22} />,
        title: "Brand condiviso con il team",
        description:
          "Logo, colori e testi dei report ora si impostano una volta sola e vengono applicati automaticamente a tutti i membri del team. Ogni agente lavora con l'identità dell'agenzia senza configurare nulla.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
      {
        icon: <Brush size={22} />,
        title: "Prompt Foto AI migliorati",
        description:
          "Gli stili Moderno, Nordico e Boho ora usano prompt più precisi, aggiunto lo stile Luxury.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
    ],
  },
  {
    version: "1.3.6",
    date: "Maggio 2026",
    badge: "",
    badgeColor: "#6b7280",
    title: "Video AI Giorno ↔ Notte",
    subtitle:
      "Carica una foto e trasformala da giorno a notte (o viceversa). L'AI cambia solo luci, cielo e atmosfera.",
    features: [
      {
        icon: <Sun size={22} />,
        title: "Nuovo template Giorno ↔ Notte",
        description:
          "Carica una foto del tuo immobile e l'AI cambia solo luci, cielo e atmosfera, da giorno a notte o viceversa. Perfetto per mostrare l'immobile in ogni momento della giornata.",
        tag: "Nuovo",
        tagColor: "#059669",
      },
    ],
  },
  {
    version: "1.3.5",
    date: "Maggio 2026",
    badge: "",
    badgeColor: "#6b7280",
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
          "La tua creatività non ha confini. Trasforma qualsiasi foto in uno staging professionale, ovunque ti trovi nel browser.",
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
          "Zero attese. Sblocca l'analisi completa di un immobile all'istante. I dati si caricano mentre tu decidi.",
        tag: "Migliorato",
        tagColor: "#2563eb",
      },
      {
        icon: <Sparkles size={22} />,
        title: "Foto AI alla velocità della luce",
        description:
          "Il wizard si apre in un lampo. Niente più caricamenti, inizia subito a creare.",
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
          padding: "72px 22px 54px",
          textAlign: "center",
        }}
      >
        {/* Decorative shapes */}
        <div
          style={{
            position: "absolute",
            top: 36,
            right: "10%",
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "3px solid #f59e0b",
            opacity: 0.15,
            transform: "rotate(15deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "8%",
            width: 54,
            height: 54,
            borderRadius: 13,
            border: "1px solid rgba(26,26,46,0.10)",
            opacity: 0.08,
            transform: "rotate(-12deg)",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 18px",
            background: "#fff",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 100,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 22,
          }}
        >
          <PartyPopper size={18} color="#f59e0b" />
          <span>GetNearMe si aggiorna!</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(29px, 5vw, 47px)",
            fontWeight: 900,
            lineHeight: 1.1,
            maxWidth: 630,
            margin: "0 auto 14px",
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
            fontSize: 16,
            color: "#52525b",
            maxWidth: 450,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Ogni aggiornamento migliora la tua esperienza.
          <br />
          Ecco cosa c&apos;è di nuovo.
        </p>
      </section>

      {/* Coming Soon */}
      <section
        style={{
          maxWidth: 702,
          margin: "0 auto",
          padding: "0 22px 43px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 14px",
              background: "#f59e0b",
              color: "#1a1a2e",
              borderRadius: 9,
              fontWeight: 800,
              fontSize: 14,
              border: "1px solid rgba(26,26,46,0.10)",
            }}
          >
            <Clock size={16} />
            In arrivo
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 18,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "25px 29px 18px",
              borderBottom: "2px solid #f3f4f6",
            }}
          >
            <h2
              style={{
                fontSize: 23,
                fontWeight: 900,
                margin: "0 0 5px",
                lineHeight: 1.2,
              }}
            >
              Pubblicazione automatica sui social
            </h2>
            <p style={{ fontSize: 14, color: "#71717a", margin: 0, lineHeight: 1.5 }}>
              Crea il post, scegli data e ora, e GetNearMe pubblica per te su Instagram, Facebook e LinkedIn. Zero copia-incolla, zero app esterne.
            </p>
          </div>

          <div style={{ padding: "7px 0" }}>
            <div
              style={{
                display: "flex",
                gap: 14,
                padding: "18px 29px",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 11,
                  background: "#fef3c7",
                  border: "1px solid rgba(26,26,46,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a2e",
                }}
              >
                <Share2 size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                    Pubblica direttamente dall&apos;estensione
                  </h3>
                  <span
                    style={{
                      padding: "2px 7px",
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#b45309",
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                    }}
                  >
                    In arrivo
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#52525b", margin: 0, lineHeight: 1.5 }}>
                  Collega i tuoi account social e pubblica post e stories con un click. Scegli il canale, scrivi la caption e vai.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                padding: "18px 29px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 11,
                  background: "#fef3c7",
                  border: "1px solid rgba(26,26,46,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1a1a2e",
                }}
              >
                <CalendarClock size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                    Calendario editoriale e programmazione
                  </h3>
                  <span
                    style={{
                      padding: "2px 7px",
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#b45309",
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                    }}
                  >
                    In arrivo
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#52525b", margin: 0, lineHeight: 1.5 }}>
                  Pianifica i contenuti in anticipo con un calendario visuale. Programma la pubblicazione automatica e gestisci tutto da un unico posto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Updates Timeline */}
      <section
        style={{
          maxWidth: 702,
          margin: "0 auto",
          padding: "0 22px 72px",
        }}
      >
        {updates.map((update, idx) => (
          <div key={update.version} style={{ marginBottom: idx < updates.length - 1 ? 50 : 0 }}>
            {/* Version Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 14px",
                  background: "#1a1a2e",
                  color: "#fff",
                  borderRadius: 9,
                  fontWeight: 800,
                  fontSize: 14,
                  border: "1px solid rgba(26,26,46,0.10)",
                }}
              >
                v{update.version}
              </div>
              <span style={{ color: "#71717a", fontSize: 13, fontWeight: 500 }}>
                {update.date}
              </span>
              {update.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    padding: "4px 11px",
                    background: update.badgeColor,
                    color: "#fff",
                    borderRadius: 7,
                    fontSize: 11,
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
                border: "1px solid rgba(26,26,46,0.10)",
                borderRadius: 18,
                boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
                overflow: "hidden",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: "25px 29px 18px",
                  borderBottom: "2px solid #f3f4f6",
                }}
              >
                <h2
                  style={{
                    fontSize: 23,
                    fontWeight: 900,
                    margin: "0 0 5px",
                    lineHeight: 1.2,
                  }}
                >
                  {update.title}
                </h2>
                <p style={{ fontSize: 14, color: "#71717a", margin: 0, lineHeight: 1.5 }}>
                  {update.subtitle}
                </p>
              </div>

              {/* Features List */}
              <div style={{ padding: "7px 0" }}>
                {update.features.map((feature, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "18px 29px",
                      borderBottom:
                        fIdx < update.features.length - 1 ? "1px solid #f3f4f6" : "none",
                      alignItems: "flex-start",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        minWidth: 40,
                        borderRadius: 11,
                        background: "#fef3c7",
                        border: "1px solid rgba(26,26,46,0.10)",
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
                          gap: 7,
                          marginBottom: 4,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {feature.title}
                        </h3>
                        {feature.tag && (
                          <span
                            style={{
                              padding: "2px 7px",
                              background: `${feature.tagColor}15`,
                              color: feature.tagColor,
                              borderRadius: 5,
                              fontSize: 10,
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
                          fontSize: 13,
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
          padding: "0 22px 72px",
        }}
      >
        <div
          style={{
            maxWidth: 522,
            margin: "0 auto",
            background: "#1a1a2e",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 18,
            boxShadow: "6px 6px 0px #f59e0b",
            padding: "36px 29px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "rgba(245, 158, 11, 0.15)",
              marginBottom: 14,
            }}
          >
            <Rocket size={28} color="#f59e0b" />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: "0 0 7px",
            }}
          >
            Ti piace GetNearMe?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#a1a1aa",
              margin: "0 0 22px",
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
              gap: 7,
              padding: "13px 25px",
              background: "#f59e0b",
              color: "#1a1a2e",
              border: "3px solid #f59e0b",
              borderRadius: 11,
              fontWeight: 800,
              fontSize: 14,
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
          padding: "0 22px 36px",
          fontSize: 12,
          color: "#a1a1aa",
        }}
      >
        GetNearMe v{CURRENT_VERSION} · Made with ❤️ in Italia
      </footer>
    </div>
  );
}
