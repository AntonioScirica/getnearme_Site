import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return {
    title: `${t.featuresPage.title} ${t.featuresPage.titleItalic} — GetNearMe`,
    description: t.featuresPage.subtitle,
    alternates: {
      canonical: `https://getnearme.it/${locale}/features`,
    },
  };
}

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  const features = [
    {
      title: t.features.card1.title,
      description: t.features.card1.desc,
      image: "/assets/png/analizza.png",
    },
    {
      title: t.features.card2.title,
      description: t.features.card2.desc,
      image: "/assets/png/contesto.png",
    },
    {
      title: t.features.card3.title,
      description: t.features.card3.desc,
      image: "/assets/png/metro_quadro.png",
    },
    {
      title: t.features.card4.title,
      description: t.features.card4.desc,
      image: "/assets/png/report_new.png",
    },
    {
      title: t.features.card5.title,
      description: t.features.card5.desc,
      image: "/assets/png/ai_img.png",
    },
    {
      title: t.featuresPage.feature6.title,
      description: t.featuresPage.feature6.desc,
      image: null,
      badge: t.featuresPage.feature6.badge,
    },
    {
      title: t.featuresPage.feature7.title,
      description: t.featuresPage.feature7.desc,
      image: null,
      badge: t.featuresPage.feature7.badge,
    },
    {
      title: t.features.comingSoonTitle,
      description: t.features.comingSoonDesc,
      image: null,
      isComingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar locale={locale as Locale} />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
            style={{
              fontFamily:
                'var(--font-old-standard), "Old Standard TT", serif',
            }}
          >
            {t.featuresPage.title}{" "}
            <span
              className="italic"
              style={{
                fontFamily:
                  'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.featuresPage.titleItalic}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            {t.featuresPage.subtitle}
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={index}
                className={`rounded-3xl overflow-hidden ${
                  isEven ? "bg-slate-50" : "bg-white border border-slate-100"
                }`}
              >
                <div className="py-12 md:py-16 px-6 md:px-12 lg:px-16">
                  <div
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center`}
                  >
                    {/* Text */}
                    <div
                      className={`space-y-5 ${
                        isEven ? "lg:order-1" : "lg:order-2"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-5xl md:text-6xl font-bold text-blue-500/15 leading-none">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {feature.badge && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-blue-500 text-white">
                            {feature.badge}
                          </span>
                        )}
                        {feature.isComingSoon && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-widest bg-slate-200 text-slate-500">
                            COMING SOON
                          </span>
                        )}
                      </div>

                      <h2
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight"
                        style={{
                          fontFamily:
                            'var(--font-old-standard), "Old Standard TT", serif',
                        }}
                      >
                        {feature.title}
                      </h2>

                      <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light">
                        {feature.description}
                      </p>
                    </div>

                    {/* Image */}
                    <div
                      className={`${
                        isEven ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                        {feature.image ? (
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
                            <div className="text-center">
                              <span className="text-7xl md:text-8xl font-bold text-slate-200">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2
            className="text-3xl md:text-5xl font-bold text-white leading-tight"
            style={{
              fontFamily:
                'var(--font-old-standard), "Old Standard TT", serif',
            }}
          >
            {t.featuresPage.ctaTitle}
          </h2>
          <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-2xl mx-auto">
            {t.featuresPage.ctaDesc}
          </p>
          <div className="pt-4">
            <a
              href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-bold text-lg"
            >
              {t.featuresPage.ctaButton}
            </a>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="py-12 text-center bg-white">
        <Link
          href={`/${locale}`}
          className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          {t.nav.backToHome}
        </Link>
      </div>
    </div>
  );
}
