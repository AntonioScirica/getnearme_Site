import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import PagePicker from "@/components/PagePicker";
import { CheckCircle, XCircle } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    it: "Account Social Collegato",
    en: "Social Account Connected",
    es: "Cuenta Social Conectada",
    fr: "Compte Social Connecté",
    ru: "Социальный аккаунт подключён",
    uk: "Соціальний акаунт підключено",
  };

  return {
    title: titles[locale as Locale],
    alternates: {
      canonical: `https://getnearme.it/${locale}/social-connected`,
    },
    robots: { index: false, follow: false },
  };
}

const content: Record<Locale, {
  success: { title: string; desc: string; close: string };
  error: { title: string; desc: string; retry: string };
  igMissing: string;
}> = {
  it: {
    success: {
      title: "Account collegato!",
      desc: "Puoi chiudere questa pagina e tornare all'estensione GetNearMe.",
      close: "Chiudi questa pagina",
    },
    error: {
      title: "Connessione non riuscita",
      desc: "Si è verificato un errore durante il collegamento. Riprova dall'estensione.",
      retry: "Chiudi e riprova",
    },
    igMissing: "Instagram Business non trovato. Assicurati di aver convertito il tuo profilo in Business e collegato una Pagina Facebook.",
  },
  en: {
    success: {
      title: "Account connected!",
      desc: "You can close this page and return to the GetNearMe extension.",
      close: "Close this page",
    },
    error: {
      title: "Connection failed",
      desc: "An error occurred during the connection. Please try again from the extension.",
      retry: "Close and retry",
    },
    igMissing: "Instagram Business not found. Make sure you converted your profile to Business and linked a Facebook Page.",
  },
  es: {
    success: {
      title: "Cuenta conectada!",
      desc: "Puedes cerrar esta página y volver a la extensión GetNearMe.",
      close: "Cerrar esta página",
    },
    error: {
      title: "Conexión fallida",
      desc: "Se produjo un error durante la conexión. Inténtalo de nuevo desde la extensión.",
      retry: "Cerrar y reintentar",
    },
    igMissing: "Instagram Business no encontrado. Asegúrate de haber convertido tu perfil a Business y vinculado una Página de Facebook.",
  },
  fr: {
    success: {
      title: "Compte connecté !",
      desc: "Vous pouvez fermer cette page et retourner à l'extension GetNearMe.",
      close: "Fermer cette page",
    },
    error: {
      title: "Connexion échouée",
      desc: "Une erreur est survenue lors de la connexion. Veuillez réessayer depuis l'extension.",
      retry: "Fermer et réessayer",
    },
    igMissing: "Instagram Business introuvable. Assurez-vous d'avoir converti votre profil en Business et lié une Page Facebook.",
  },
  ru: {
    success: {
      title: "Аккаунт подключён!",
      desc: "Вы можете закрыть эту страницу и вернуться к расширению GetNearMe.",
      close: "Закрыть страницу",
    },
    error: {
      title: "Ошибка подключения",
      desc: "Произошла ошибка при подключении. Попробуйте снова из расширения.",
      retry: "Закрыть и повторить",
    },
    igMissing: "Instagram Business не найден. Убедитесь, что вы переключили профиль на Business и привязали страницу Facebook.",
  },
  uk: {
    success: {
      title: "Акаунт підключено!",
      desc: "Ви можете закрити цю сторінку і повернутися до розширення GetNearMe.",
      close: "Закрити сторінку",
    },
    error: {
      title: "Помилка підключення",
      desc: "Під час підключення сталася помилка. Спробуйте ще раз з розширення.",
      retry: "Закрити і спробувати знову",
    },
    igMissing: "Instagram Business не знайдено. Переконайтесь, що ви перевели профіль на Business і прив'язали сторінку Facebook.",
  },
};

export default async function SocialConnectedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const success = sp.success === "true";
  const igMissing = sp.ig_business_missing === "true";
  const errorDetail = sp.error || "";
  const choosePage = sp.choose_page === "true";
  const sessionId = sp.session || "";
  const t = content[locale as Locale] || content.it;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          {choosePage && sessionId ? (
            /* ── Page Picker mode ── */
            <PagePicker sessionId={sessionId} locale={locale} />
          ) : (
            /* ── Success / Error mode ── */
            <>
              <div className="mb-4 flex justify-center">
                {success ? (
                  <CheckCircle className="w-14 h-14 text-green-500" />
                ) : (
                  <XCircle className="w-14 h-14 text-red-500" />
                )}
              </div>

              <h1 className="text-3xl md:text-4xl text-slate-900 font-bold mb-2">
                {success ? t.success.title : t.error.title}
              </h1>

              <p className="text-slate-600 leading-relaxed text-lg max-w-xl mx-auto mb-2">
                {success ? t.success.desc : t.error.desc}
              </p>

              {igMissing && (
                <p className="text-amber-600 text-sm max-w-md mx-auto mb-6">
                  {t.igMissing}
                </p>
              )}

              {!success && errorDetail && (
                <p className="text-red-400 text-xs font-mono max-w-lg mx-auto mb-6 break-all">
                  {errorDetail}
                </p>
              )}

              <a
                href="https://getnearme.it"
                className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                {success ? t.success.close : t.error.retry}
              </a>
            </>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
