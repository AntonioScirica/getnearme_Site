'use client';

import Link from "next/link";
import { MapPin } from "lucide-react";
import HeroFloatingIcons from "@/components/HeroFloatingIcons";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">

      {/* --- Background Split --- */}
      {/* Background #F5F5F5 ending a bit more than half screen (e.g. 75vh) */}
      <div className="absolute top-0 left-0 w-full h-[75vh] bg-[#F5F5F5] -z-10" />

      {/* --- Navbar --- */}
      <Navbar />

      <main className="pt-32 pb-0 relative bg-white">
        {/* Gray Background Header Effect */}
        <div className="absolute top-0 left-0 w-full h-[90vh] bg-[#F5F5F5] z-0"></div>

        {/* --- Hero Section --- */}
        <section className="relative px-4 max-w-7xl mx-auto text-center mb-32 z-10">

          <HeroFloatingIcons />

          <div className="relative z-10 max-w-4xl mx-auto space-y-4 pt-16 pb-10">
            <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-[1.05] tracking-tight">
              <span className="font-old-standard font-bold">{t.hero.title1}</span>
              <br />
              <span className="font-old-standard font-bold">{t.hero.title2}</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">{t.hero.title3}</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-medium mt-8">
              <Link
                href="#"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans"
              >
                {t.hero.cta}
              </Link>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          {/* White card with browser-like header */}
          <div className="mt-20 relative mx-auto w-full max-w-full shadow-2xl rounded-t-2xl bg-white border border-[#E4E4E4] p-1 pb-0">
            <div className="w-full bg-slate-50 rounded-t-xl overflow-hidden shadow-inner border-b border-slate-100">
              {/* Browser Header */}
              <div className="h-8 bg-[#F5F5F5] flex items-center px-4 gap-2 border-b border-[#E4E4E4]">
                <div className="flex gap-1.5 opacity-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                </div>
              </div>

              {/* Content Placeholder */}
              <div className="aspect-video bg-white relative">
                {/* Split View Mockup */}
                <div className="absolute inset-0 flex">
                  {/* Map side */}
                  <div className="w-1/2 bg-blue-50/50 border-r border-[#E4E4E4] p-4">
                    <div className="w-full h-full rounded-lg bg-blue-100/30 border border-blue-100 relative overflow-hidden">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MapPin className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  {/* Data side */}
                  <div className="w-1/2 p-6 flex flex-col gap-4">
                    <div className="h-6 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-50 rounded"></div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="h-20 bg-slate-50 rounded border border-slate-100"></div>
                      <div className="h-20 bg-slate-50 rounded border border-slate-100"></div>
                    </div>
                    <div className="mt-auto h-12 bg-blue-500/10 rounded border border-blue-500/20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text below mockup */}
          <div className="mt-20 max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-light">
              {t.hero.subMockup}
            </p>
          </div>

        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Grid Section --- */}
        <section id="funzionalita" className="px-4 max-w-7xl mx-auto py-24">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 max-w-md leading-tight text-center md:text-left">
              <span className="font-old-standard">{t.features.title}</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">{t.features.titleItalic}</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light leading-relaxed text-center md:text-right max-w-sm">
              {t.features.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {[
              {
                title: t.features.card1.title,
                description: t.features.card1.desc
              },
              {
                title: t.features.card2.title,
                description: t.features.card2.desc
              },
              {
                title: t.features.card3.title,
                description: t.features.card3.desc
              },
              {
                title: t.features.card4.title,
                description: t.features.card4.desc
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-2">
                  <div className="aspect-4/3 bg-[#F5F5F5] rounded-lg"></div>
                </div>
                <div className="px-3 py-6">
                  <h3 className="font-serif text-lg mb-2 text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 font-light">
            {t.features.disclaimer}
          </p>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- FAQ Section --- */}
        <section id="faq" className="px-6 max-w-7xl mx-auto py-24 border-t border-slate-100">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 leading-tight text-center md:text-left">
              <span className="font-old-standard">{t.faq.title}</span> <span className="font-merriweather italic font-light text-3xl md:text-4xl">{t.faq.titleItalic}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {t.faq.items.map((item: any, i: number) => (
              <div key={i} className="space-y-3 text-center md:text-left">
                <h4 className="font-serif text-xl font-medium text-slate-900">
                  {item.q}
                </h4>
                <p className="text-base text-slate-500 leading-relaxed font-light max-w-md mx-auto md:mx-0">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Pricing Section --- */}
        <section id="prezzi" className="px-4 max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-2 leading-tight">
              <span className="font-old-standard">{t.pricing.title}</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">{t.pricing.titleItalic}</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
              {t.pricing.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-3 mb-12">
            {t.pricing.plans.map((plan: any, i: number) => {
              const isPopular = i === 2;
              const isFree = i === 0;
              const price = i === 1 ? "4,99" : i === 2 ? "9,99" : i === 3 ? "24,99" : t.pricing.free;
              const buttonText = isFree ? t.pricing.registerNow : t.pricing.buyNow;

              return (
                <div
                  key={i}
                  className={`relative bg-white rounded-2xl border-2 p-6 hover:shadow-xl transition-all flex flex-col ${isPopular ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                    }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      {t.pricing.mostChosen}
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-serif text-slate-900 mb-1">{plan.name}</h3>
                    {plan.subtitle && (
                      <p className="text-sm text-slate-500 font-light mb-4">{plan.subtitle}</p>
                    )}
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-slate-900">{isFree ? t.pricing.free : `€${price}`}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-light leading-relaxed">{plan.desc}</p>
                  </div>

                  <button className={`w-full px-6 py-2.5 rounded-[8px] transition-all text-lg font-sans mt-auto ${isFree
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 font-medium'
                    : 'bg-blue-500 text-white hover:bg-blue-600 font-bold'
                    }`}>
                    {buttonText}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center space-y-2 text-sm text-slate-500 font-light">
            <p>{t.pricing.footer1}</p>
            <p>{t.pricing.footer2}</p>
            <p>{t.pricing.footer3}</p>
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Final CTA Section --- */}
        <section id="estensione" className="px-4 max-w-7xl mx-auto py-32">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight mb-2">
              <span className="font-old-standard">{t.cta.title}</span><br />
              <span className="font-old-standard">{t.cta.title2}</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">{t.cta.titleItalic}</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              {t.cta.desc}
            </p>
            <div className="pt-2">
              <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans">
                {t.cta.button}
              </button>
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
            <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
              {/* Brand Column */}
              <div className="md:col-span-1">
                <h3 className="text-2xl font-serif mb-4">GetNearMe</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  {t.footer.desc}
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold mb-4">{t.footer.product}</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#funzionalita" className="text-slate-400 hover:text-white transition-colors font-light">{t.nav.features}</a></li>
                  <li><a href="#prezzi" className="text-slate-400 hover:text-white transition-colors font-light">{t.nav.pricing}</a></li>
                  <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors font-light">{t.nav.faq}</a></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors font-light">{t.footer.privacy}</a></li>
                  <li><a href="/cookie" className="text-slate-400 hover:text-white transition-colors font-light">{t.footer.cookie}</a></li>
                  <li><a href="/termini" className="text-slate-400 hover:text-white transition-colors font-light">{t.footer.terms}</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800">
              <p className="text-slate-400 text-sm font-light text-center">
                © 2025 GetNearMe. {t.footer.rights}
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
