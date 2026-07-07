import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import AuthCta from "@/components/AuthCta";
import ReferenceGallery from "./ReferenceGallery";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Esempi reali — GetNearMe",
    description: "Esempi reali delle funzionalità GetNearMe: foto AI, video, post social, report PDF, analisi di zona e molto altro.",
    alternates: {
      canonical: `https://getnearme.it/${locale}/reference`,
    },
  };
}

const FEATURES = [
  {
    id: "ai-video",
    icon: "clapperboard",
    color: "#10b981",
    title: "Video AI per l'immobile",
    desc: "Reel, walkthrough, before/after, video con avatar parlante e molto altro.",
    media: [
      { type: "video", src: "/reference/primo-piano.mp4", poster: "/reference/primo-piano-poster.jpg", title: "Avatar in primo piano", desc: "Video con avatar, script e sottotitoli generati dall'AI." },
      { type: "video", src: "/reference/split.mp4", poster: "/reference/split-poster.jpg", title: "Schermo diviso", desc: "Immobile e avatar parlante nello stesso video." },
      { type: "video", src: "/reference/immagini-a-video.mp4", poster: "/reference/immagini-a-video-poster.jpg", title: "Immagini a Video", desc: "Trasforma le foto dell'immobile in un video animato." },
      { type: "video", src: "/reference/construction.mp4", poster: "/reference/construction-poster.jpg", title: "Timelapse AI", desc: "Da una foto dell'esterno, l'AI genera il timelapse." },
      { type: "video", src: "/reference/prima-dopo.mp4", poster: "/reference/prima-dopo-poster.jpg", title: "Prima vs Dopo", desc: "Partendo da una foto, l'AI arreda e crea il video." },
      { type: "video", src: "/reference/giorno-notte.mp4", poster: "/reference/giorno-notte-poster.jpg", title: "Giorno e notte", desc: "L'AI trasforma l'illuminazione della scena." },
      { type: "video", src: "/reference/sottotitoli.mp4", poster: "/reference/sottotitoli-poster.jpg", title: "Sottotitoli", desc: "Video con testo descrittivo animato." },
      { type: "video", src: "/reference/montaggio.mp4", poster: "/reference/montaggio-poster.jpg", title: "Montaggio", desc: "Montaggio automatico multi-stanza con musica." },
    ] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal"; title?: string; desc?: string; poster?: string }[],
  },
  {
    id: "social-posts",
    icon: "smartphone",
    color: "#ec4899",
    title: "Post automatici",
    desc: "Contenuti pronti per Instagram, Facebook, TikTok e LinkedIn.",
    layout: "social" as const,
    posts: [
      { src: "/reference/social-post-feed.png", title: "Post Feed", desc: "Formato 4:5 per il feed Instagram e Facebook." },
      { src: "/reference/social-post-square.png", title: "Post Quadrato", desc: "Formato 1:1 per Instagram e LinkedIn." },
      { src: "/reference/social-post-story.png", title: "Post Story", desc: "Formato 9:16 per Stories." },
      { src: "/reference/social-post.png", title: "Post Reel", desc: "Formato 9:16 per Reels e TikTok." },
    ],
    reels: [
      { src: "/reference/social-reel-feed.mp4", poster: "/reference/social-reel-feed-poster.jpg", title: "Reel Feed", desc: "Animazione automatica in formato feed." },
      { src: "/reference/social-reel-square.mp4", poster: "/reference/social-reel-square-poster.jpg", title: "Reel Quadrato", desc: "Animazione automatica in formato quadrato." },
      { src: "/reference/social-reel-story.mp4", poster: "/reference/social-reel-story-poster.jpg", title: "Reel Story", desc: "Animazione automatica in formato story." },
      { src: "/reference/social-reel.mp4", poster: "/reference/social-reel-poster.jpg", title: "Reel Verticale", desc: "Animazione automatica in formato reel." },
    ],
    media: [] as { type: "image" | "video"; src: string; aspect?: "vertical" | "horizontal"; title?: string; desc?: string }[],
  },
];

export default async function ReferencePage({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return (
    <div className="min-h-screen" style={{ background: "#fafaf8", color: "#1a1a2e" }}>
      <div className="sticky top-0 z-50">
        <Navbar locale={locale as Locale} />
      </div>

      <main>
        {/* Header */}
        <section className="py-16 md:py-24" style={{ background: "#1a1a2e" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-6 text-center">
            <h1
              style={{
                fontSize: "clamp(29px, 5vw, 47px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              Esempi reali.{" "}
              <span style={{ color: "#3B83F6" }}>Risultati concreti.</span>
            </h1>
            <p style={{ color: "#aaa", fontSize: 15, maxWidth: 540, margin: "0 auto" }}>
              Scopri cosa puoi creare con ogni funzionalità di GetNearMe.
              Video, foto, post e report generati in pochi click.
            </p>
          </div>
        </section>



        {/* Feature sections */}
        {FEATURES.map((f, i) => (
          <section
            key={f.id}
            id={f.id}
            className="scroll-mt-32 py-16 md:py-20"
            style={{ background: i % 2 === 0 ? "#fafaf8" : "#f3f4f6" }}
          >
            <div className="max-w-6xl mx-auto px-5 md:px-6">
              {/* Feature header */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 29 }}>
                <span
                  style={{
                    width: 43,
                    height: 43,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${f.color}15`,
                    borderRadius: 13,
                    border: `2px solid ${f.color}40`,
                    color: f.color,
                    marginBottom: 11,
                  }}
                >
                  <ReferenceGallery variant="icon" iconName={f.icon} />
                </span>
                <h2 style={{ fontSize: 25, fontWeight: 900, color: "#1a1a2e", margin: "0 0 7px", lineHeight: 1.2 }}>
                  {f.title}
                </h2>
                <p style={{ color: "#666", fontSize: 14, margin: 0, maxWidth: 540 }}>
                  {f.desc}
                </p>
              </div>

              {/* Gallery */}
              {f.layout === "social" && f.posts && f.reels ? (
                <>
                  <ReferenceGallery variant="social" posts={f.posts} reels={f.reels} color={f.color} />
                  <div style={{ textAlign: "center", marginTop: 32 }}>
                    <a
                      href={`/${locale}#pricing`}
                      className="neo-shadow-light neo-cta-blue"
                      style={{
                        display: "inline-block",
                        border: "1px solid rgba(26,26,46,0.10)",
                        padding: "14px 29px",
                        borderRadius: 11,
                        fontWeight: 700,
                        fontSize: 15,
                        textDecoration: "none",
                        letterSpacing: 0.3,
                        boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
                      }}
                    >
                      Provali tutti gratis →
                    </a>
                  </div>
                </>
              ) : f.media.length > 0 ? (
                <ReferenceGallery variant="gallery" media={f.media} color={f.color} />
              ) : (
                <div
                  style={{
                    border: `2px dashed ${f.color}40`,
                    borderRadius: 14,
                    padding: "43px 22px",
                    textAlign: "center",
                    color: "#999",
                    fontSize: 14,
                  }}
                >
                  Contenuti in arrivo...
                </div>
              )}
            </div>
          </section>
        ))}

        {/* Bottom CTA */}
        <section style={{ background: "#1a1a2e", padding: "72px 0 108px" }}>
          <div className="max-w-5xl mx-auto px-5 md:px-6 text-center">
            <h2
              style={{
                fontSize: "clamp(27px, 5vw, 47px)",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#fff",
                marginBottom: 14,
              }}
            >
              Pronto a provare?
            </h2>
            <p style={{ color: "#aaa", fontSize: 15, marginBottom: 32 }}>
              Crei il tuo account in pochi secondi e inizi subito. Gratis, senza carta.
            </p>
            <div className="ref-cta-buttons" style={{ display: "flex", gap: 13, flexWrap: "wrap", justifyContent: "center" }}>
              <AuthCta
                locale={locale}
                href={`/${locale}#pricing`}
                className="neo-shadow-light neo-cta-blue ref-cta-btn"
                style={{
                  display: "inline-block",
                  border: "1px solid rgba(26,26,46,0.10)",
                  padding: "14px 29px",
                  borderRadius: 11,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  textAlign: "center",
                  letterSpacing: 0.3,
                }}
              >
                Prova gratis
              </AuthCta>
              <a
                data-cal-link="getnearme/30min"
                data-cal-config='{"layout":"month_view"}'
                className="neo-shadow-light final-cta-outline-dark ref-cta-btn"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: "#fff",
                  border: "2px solid #fff",
                  padding: "14px 29px",
                  borderRadius: 11,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                Prenota una demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          .ref-cta-buttons {
            flex-direction: column !important;
            align-items: center !important;
            gap: 20px !important;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }
          .ref-cta-btn {
            width: 100% !important;
            display: block !important;
            padding: 16px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
