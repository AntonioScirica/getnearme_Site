import Link from "next/link";
import Image from "next/image";
import { locales, type Locale, altTexts } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import HeroFloatingIcons from "@/components/HeroFloatingIcons";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];
  const currentAlt = altTexts[locale as Locale];

  const cardImages = [
    "/assets/png/analizza.png",
    "/assets/png/contesto.png",
    "/assets/png/metro_quadro.png",
    "/assets/png/report_new.png",
    "/assets/png/ai_img.png",
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Background Split */}
      <div className="absolute top-0 left-0 w-full h-[75vh] bg-[#F5F5F5] -z-10" />

      {/* Navbar */}
      <Navbar locale={locale as Locale} />

      <main className="pt-32 pb-0 relative bg-white">
        <div className="absolute top-0 left-0 w-full h-[90vh] bg-[#F5F5F5] z-0"></div>

        {/* Hero Section */}
        <section className="relative px-6 max-w-7xl mx-auto text-center mb-32 z-10">
          <HeroFloatingIcons />

          <div className="relative z-10 max-w-5xl mx-auto space-y-4 pt-16 pb-10">
            <h1
              className="text-3xl md:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight"
              style={{
                fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.hero.title1}
              <br />
              {t.hero.title2}{" "}

              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
                }}
              >
                {t.hero.title3}
              </span>
              .
            </h1>

            <p className="text-base md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm font-medium mt-8">
              <Link
                href={`/${locale}/tutorial`}
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-all font-bold text-base sm:text-lg font-sans text-center"
              >
                {t.hero.ctaSecondary}
              </Link>
              <a
                href="https://chromewebstore.google.com/detail/getnearme-%E2%80%93-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 border-2 border-blue-500 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all font-bold text-base sm:text-lg font-sans"
              >
                {t.hero.cta}
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-12 md:mt-20 relative mx-auto w-full shadow-2xl rounded-2xl overflow-hidden border-4 md:border-10 border-white ring-2 ring-slate-200">
            <div className="aspect-video bg-black relative">
              <iframe
                src="https://www.youtube-nocookie.com/embed/2_KNllGE1-0?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&fs=0&disablekb=1&color=white"
                title={t.howItWorks.videoTitle}
                allow="accelerometer; clipboard-write; encrypted-media"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          <div className="mt-10 md:mt-20 max-w-4xl mx-auto text-center">
            <p className="text-base md:text-xl text-slate-600 leading-relaxed font-light">
              {t.hero.subMockup}
            </p>
          </div>
        </section>

        <div className="w-full h-4 bg-[#F5F5F5]"></div>

        {/* Features Section */}
        <section id="funzionalita" className="px-6 max-w-7xl mx-auto py-24">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-16 gap-8">
            <h2
              className="text-4xl md:text-5xl font-bold text-slate-900 max-w-xl leading-tight text-center md:text-left"
              style={{
                fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.features.title}
              <br />
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
                }}
              >
                {t.features.titleItalic}
              </span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light leading-relaxed text-center md:text-right max-w-sm">
              {t.features.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-3 mb-12">
            {[
              {
                title: t.features.card1.title,
                description: t.features.card1.desc,
              },
              {
                title: t.features.card2.title,
                description: t.features.card2.desc,
              },
              {
                title: t.features.card3.title,
                description: t.features.card3.desc,
              },
              {
                title: t.features.card4.title,
                description: t.features.card4.desc,
              },
              {
                title: t.features.card5.title,
                description: t.features.card5.desc,
              },
              {
                title: t.features.comingSoonTitle,
                description: t.features.comingSoonDesc,
                comingSoon: true,
              },
            ].map((item, i) => (
              <article
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-2">
                  <div className="aspect-[4/2.5] bg-slate-50 rounded-lg relative overflow-hidden">
                    {('comingSoon' in item && item.comingSoon) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                        <span className="text-4xl font-bold text-slate-200 tracking-wide">{t.features.comingSoonTitle}</span>
                      </div>
                    ) : (
                      <Image
                        src={cardImages[i]}
                        alt={currentAlt.cards[i]}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                </div>
                <div className="px-5 py-6">
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full sm:w-auto sm:inline-block px-5 py-2.5 sm:px-6 border-2 border-blue-500 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all font-bold text-base sm:text-lg font-sans"
            >
              {t.features.addExtension}
            </a>
          </div>
        </section>

        <div className="w-full h-4 bg-[#F5F5F5]"></div>

        {/* FAQ Section */}
        <section id="faq" className="px-6 max-w-7xl mx-auto py-24 border-t border-slate-100">
          <div className="mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight text-center md:text-left"
              style={{
                fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.faq.title}{" "}
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
                }}
              >
                {t.faq.titleItalic}
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.faq.items.map((item: { q: string; a: string }, i: number) => (
              <div key={i} className="space-y-3 text-center md:text-left">
                <h3 className="font-semibold text-xl text-slate-900">{item.q}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-light max-w-md mx-auto md:mx-0">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="w-full h-4 bg-[#F5F5F5]"></div>

        {/* How It Works Section */}
        <section id="prezzi" className="px-6 max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-2 leading-tight"
              style={{
                fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.pricing.title}{" "}
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
                }}
              >
                {t.pricing.titleItalic}
              </span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
              {t.pricing.description}
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px bg-slate-300 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 relative z-10">
              {[
                {
                  step: "01",
                  title: t.howItWorks.step1Title,
                  desc: t.howItWorks.step1Desc,
                  image: "/assets/png/login.png",
                },
                {
                  step: "02",
                  title: t.howItWorks.step2Title,
                  desc: t.howItWorks.step2Desc,
                  image: "/assets/png/agency.png",
                },
                {
                  step: "03",
                  title: t.howItWorks.step3Title,
                  desc: t.howItWorks.step3Desc,
                  image: "/assets/png/startWork.png",
                },
              ].map((item, i) => (
                <article
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-2">
                    <div className="aspect-4/3 bg-slate-50 rounded-lg relative overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      ) : (
                        <span className="text-6xl font-bold text-slate-200">{item.step}</span>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-6">
                    <h3 className="font-semibold text-lg mb-2 text-slate-900 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="text-center mt-12 space-y-8 sm:space-y-6">
            <a
              href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full sm:w-auto sm:inline-block px-5 py-2.5 sm:px-6 border-2 border-blue-500 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all font-bold text-base sm:text-lg font-sans"
            >
              {t.howItWorks.cta}
            </a>
            <div className="space-y-2 text-sm text-slate-500 font-light">
              <p dangerouslySetInnerHTML={{ __html: t.pricing.footer1.replace(/, /g, ',<br class="sm:hidden" /> ') }} />
              <p>{t.pricing.footer2}</p>
            </div>
          </div>
        </section>

        <div className="w-full h-4 bg-[#F5F5F5]"></div>

        {/* Final CTA Section */}
        <section id="estensione" className="px-6 max-w-7xl mx-auto py-32">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2
              className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight mb-2"
              style={{
                fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
              }}
            >
              {t.cta.title}
              <br />
              {t.cta.title2}{" "}
              <span
                className="font-bold"
                style={{
                  fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
                }}
              >
                {t.cta.titleItalic}
              </span>
            </h2>
            <p className="text-base md:text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              {t.cta.desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm font-medium pt-2">
              <a
                href="mailto:info@getnearme.it"
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-all font-bold text-base sm:text-lg font-sans text-center"
              >
                {t.cta.requestInfo}
              </a>
              <a
                href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 sm:px-6 border-2 border-blue-500 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:border-blue-600 transition-all font-bold text-base sm:text-lg font-sans"
              >
                {t.cta.button}
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
                    <a
                      href="#funzionalita"
                      className="text-slate-400 hover:text-white transition-colors font-light"
                    >
                      {t.nav.features}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#prezzi"
                      className="text-slate-400 hover:text-white transition-colors font-light"
                    >
                      {t.nav.pricing}
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="text-slate-400 hover:text-white transition-colors font-light"
                    >
                      {t.nav.faq}
                    </a>
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
      </main>
    </div>
  );
}

