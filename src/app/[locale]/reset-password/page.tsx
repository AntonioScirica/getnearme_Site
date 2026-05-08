import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import ResetPasswordForm from "./ResetPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const titles: Record<Locale, string> = {
  it: "Reimposta Password",
  en: "Reset Password",
  es: "Restablecer Contraseña",
  fr: "Réinitialiser le mot de passe",
  ru: "Сбросить пароль",
  uk: "Скинути пароль",
};

const descriptions: Record<Locale, string> = {
  it: "Imposta una nuova password per il tuo account GetNearMe.",
  en: "Set a new password for your GetNearMe account.",
  es: "Establece una nueva contraseña para tu cuenta GetNearMe.",
  fr: "Définissez un nouveau mot de passe pour votre compte GetNearMe.",
  ru: "Установите новый пароль для вашего аккаунта GetNearMe.",
  uk: "Встановіть новий пароль для вашого акаунту GetNearMe.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: titles[locale as Locale],
    description: descriptions[locale as Locale],
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Navbar locale={locale as Locale} />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24 pb-16">
        <ResetPasswordForm locale={locale as Locale} />
      </main>
    </>
  );
}
