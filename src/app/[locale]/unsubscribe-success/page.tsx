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
    it: "Disiscrizione completata",
    en: "Unsubscribe complete",
    es: "Baja completada",
    fr: "Desinscription terminee",
    ru: "Отписка завершена",
    uk: "Відписка завершена",
  };

  const descriptions: Record<Locale, string> = {
    it: "Sei stato rimosso con successo dalla nostra mailing list.",
    en: "You have been successfully removed from our mailing list.",
    es: "Has sido eliminado con exito de nuestra lista de correo.",
    fr: "Vous avez ete supprime avec succes de notre liste de diffusion.",
    ru: "Вы были успешно удалены из нашей рассылки.",
    uk: "Вас було успішно видалено з нашої розсилки.",
  };

  return {
    title: titles[locale as Locale],
    description: descriptions[locale as Locale],
    alternates: {
      canonical: `https://getnearme.it/${locale}/unsubscribe-success`,
    },
  };
}

export default async function UnsubscribeSuccessPage({ params }: Props) {
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
            {t.unsubscribe.subtitle}
          </h1>

          {/* Description */}
          <p className="text-slate-600 leading-relaxed text-lg max-w-xl mx-auto">
            {t.unsubscribe.description}
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
