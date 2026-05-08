import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import ForgotPasswordForm from "./ForgotPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Password dimenticata",
    en: "Forgot Password",
    es: "Olvidé mi contraseña",
    fr: "Mot de passe oublié",
    ru: "Забыли пароль",
    uk: "Забули пароль",
  };
  return {
    title: titles[locale as Locale],
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  return (
    <>
      <Navbar locale={locale as Locale} />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-24 pb-16">
        <ForgotPasswordForm locale={locale as Locale} />
      </main>
    </>
  );
}
