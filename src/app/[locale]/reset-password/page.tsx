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
  it: "Imposta una nuova password per il tuo account Agente Immo.",
  en: "Set a new password for your Agente Immo account.",
  es: "Establece una nueva contraseña para tu cuenta Agente Immo.",
  fr: "Définissez un nouveau mot de passe pour votre compte Agente Immo.",
  ru: "Установите новый пароль для вашего аккаунта Agente Immo.",
  uk: "Встановіть новий пароль для вашого акаунту Agente Immo.",
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
      <main className="h-screen bg-gray-50 flex items-center justify-center px-4 overflow-hidden">
        <ResetPasswordForm locale={locale as Locale} />
      </main>
    </>
  );
}
