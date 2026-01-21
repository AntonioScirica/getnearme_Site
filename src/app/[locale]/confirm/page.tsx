import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import { CheckCircle } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    it: "Iscrizione Confermata",
    en: "Subscription Confirmed",
    es: "Suscripcion Confirmada",
    fr: "Inscription Confirmee",
    ru: "Подписка Подтверждена",
    uk: "Пiдписка Пiдтверджена",
  };

  const descriptions: Record<Locale, string> = {
    it: "La tua iscrizione a GetNearMe e stata confermata con successo.",
    en: "Your subscription to GetNearMe has been successfully confirmed.",
    es: "Tu suscripcion a GetNearMe ha sido confirmada con exito.",
    fr: "Votre inscription a GetNearMe a ete confirmee avec succes.",
    ru: "Ваша подписка на GetNearMe успешно подтверждена.",
    uk: "Вашу пiдписку на GetNearMe успiшно пiдтверджено.",
  };

  return {
    title: titles[locale as Locale],
    description: descriptions[locale as Locale],
    alternates: {
      canonical: `https://getnearme.it/${locale}/confirm`,
    },
  };
}

export default async function ConfirmPage({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-4 flex justify-center">
            <CheckCircle className="w-14 h-14 text-blue-500" />
          </div>

          {/* Subtitle */}
          <h1 className="text-3xl md:text-4xl text-slate-900 font-bold mb-2">
            {t.confirm.subtitle}
          </h1>

          {/* Description */}
          <p className="text-slate-600 leading-relaxed text-lg max-w-xl mx-auto">
            {t.confirm.description}
          </p>
        </div>
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
