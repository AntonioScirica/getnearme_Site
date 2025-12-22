'use client';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            {t.nav.backToHome}
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🔒</span>
            <h1 className="text-4xl font-serif font-bold text-slate-900 m-0">{t.footer.privacy}</h1>
          </div>
          
          <p className="text-slate-500 text-sm mb-8">{t.privacy.update}</p>

          <p className="text-slate-600 leading-relaxed">
            {t.privacy.intro}
          </p>

          {t.privacy.sections.map((section: { t: string; c: string }, index: number) => (
            <div key={index}>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">{section.t}</h2>
              <p className="text-slate-600 leading-relaxed">
                {section.c}
              </p>
            </div>
          ))}
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
