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
      title: t.features.card4.title,
      description: t.features.card4.desc,
      image: "/assets/png/report_new.png",
    },
    {
      title: t.features.card5.title,
      description: t.features.card5.desc,
      image: "/assets/png/gif/agency_ai_anim.gif",
    },
    {
      title: t.featuresPage.feature6.title,
      description: t.featuresPage.feature6.desc,
      image: "/assets/png/templates.png",
    },
    {
      title: t.featuresPage.feature7.title,
      description: t.featuresPage.feature7.desc,
      image: "/assets/png/video.png",
    },
    {
      title: t.features.card3.title,
      description: t.features.card3.desc,
      image: "/assets/png/gif/prezzo_medio_m2.gif",
    },
    {
      title: t.features.card2.title,
      description: t.features.card2.desc,
      image: "/assets/png/contesto.png",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar locale={locale as Locale} />

      {/* Hero */}
      <section className="pt-44 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
            style={{
              fontFamily:
                'var(--font-old-standard), "Old Standard TT", serif',
            }}
          >
            {t.featuresPage.title}
            <br />
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
                className="rounded-xl md:rounded-3xl overflow-hidden border border-gray-300 bg-white"
              >
                <div className="pt-2 pb-6 md:py-10 md:px-12 lg:px-16">
                  <div
                    className={`grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-16 items-center`}
                  >
                    {/* Text */}
                    <div
                      className={`space-y-3 order-2 px-4 md:px-0 ${
                        isEven ? "lg:order-1" : "lg:order-2"
                      }`}
                    >
                      <span className="hidden md:block text-5xl md:text-6xl font-bold text-blue-500/15 leading-none mb-3">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="flex items-center gap-3 flex-wrap">
                        <h2
                          className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight"
                          style={{
                            fontFamily:
                              'var(--font-old-standard), "Old Standard TT", serif',
                          }}
                        >
                          {feature.title}
                        </h2>
                      </div>

                      <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light">
                        {feature.description}
                      </p>
                    </div>

                    {/* Image */}
                    <div
                      className={`order-1 px-2 md:px-0 ${
                        isEven ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      <div className="rounded-lg md:rounded-xl overflow-hidden border border-gray-300">
                        {feature.image ? (
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            width={658}
                            height={491}
                            className="w-full h-auto"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            unoptimized={feature.image.endsWith(".gif")}
                          />
                        ) : (
                          <div className="aspect-4/3 flex items-center justify-center bg-linear-to-br from-slate-50 via-slate-100 to-slate-200">
                            <span className="text-7xl md:text-8xl font-bold text-slate-200">
                              {String(index + 1).padStart(2, "0")}
                            </span>
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

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <hr className="border-t border-gray-200" />
      </div>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h2
            className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight"
            style={{
              fontFamily:
                'var(--font-old-standard), "Old Standard TT", serif',
            }}
          >
            {t.featuresPage.ctaTitle}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
            {t.featuresPage.ctaDesc}
          </p>
          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href={`/${locale}#contatti`}
              className="px-8 py-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-bold text-lg"
            >
              {t.featuresPage.ctaContact}
            </Link>
            <a
              href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-bold text-lg"
            >
              {t.featuresPage.ctaButton}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold mb-4">GetNearMe</h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed max-w-48 mx-auto md:mx-0">
                {t.footer.desc}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.product}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href={`/${locale}/features`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.nav.features}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}#prezzi`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.nav.pricing}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}#faq`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.nav.faq}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/tutorial`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.nav.tutorial}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href={`/${locale}/privacy`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/cookie`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.footer.cookie}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/termini`}
                    className="text-slate-400 hover:text-white transition-colors font-light"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2026 GetNearMe. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
