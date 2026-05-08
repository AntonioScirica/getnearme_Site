"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/lib/i18n";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const t: Record<Locale, {
  title: string;
  subtitle: string;
  email: string;
  emailPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  successDesc: string;
  errorRequired: string;
  errorInvalid: string;
  errorGeneric: string;
}> = {
  it: {
    title: "Password dimenticata?",
    subtitle: "Inserisci la tua email e ti invieremo un link per reimpostare la password.",
    email: "Email",
    emailPlaceholder: "tua@email.com",
    submit: "Invia link di reset",
    submitting: "Invio in corso...",
    success: "Email inviata",
    successDesc: "Controlla la tua casella di posta. Se l'indirizzo è associato a un account, riceverai un link per reimpostare la password.",
    errorRequired: "Inserisci la tua email.",
    errorInvalid: "Inserisci un indirizzo email valido.",
    errorGeneric: "Errore durante l'invio. Riprova.",
  },
  en: {
    title: "Forgot password?",
    subtitle: "Enter your email and we'll send you a link to reset your password.",
    email: "Email",
    emailPlaceholder: "you@email.com",
    submit: "Send reset link",
    submitting: "Sending...",
    success: "Email sent",
    successDesc: "Check your inbox. If the address is associated with an account, you'll receive a password reset link.",
    errorRequired: "Enter your email.",
    errorInvalid: "Enter a valid email address.",
    errorGeneric: "Error sending email. Please try again.",
  },
  es: {
    title: "¿Olvidaste tu contraseña?",
    subtitle: "Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    submit: "Enviar enlace de restablecimiento",
    submitting: "Enviando...",
    success: "Email enviado",
    successDesc: "Revisa tu bandeja de entrada. Si la dirección está asociada a una cuenta, recibirás un enlace para restablecer tu contraseña.",
    errorRequired: "Introduce tu email.",
    errorInvalid: "Introduce una dirección de email válida.",
    errorGeneric: "Error al enviar el email. Inténtalo de nuevo.",
  },
  fr: {
    title: "Mot de passe oublié ?",
    subtitle: "Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
    email: "Email",
    emailPlaceholder: "vous@email.com",
    submit: "Envoyer le lien",
    submitting: "Envoi...",
    success: "Email envoyé",
    successDesc: "Vérifiez votre boîte de réception. Si l'adresse est associée à un compte, vous recevrez un lien de réinitialisation.",
    errorRequired: "Entrez votre email.",
    errorInvalid: "Entrez une adresse email valide.",
    errorGeneric: "Erreur lors de l'envoi. Veuillez réessayer.",
  },
  ru: {
    title: "Забыли пароль?",
    subtitle: "Введите свой email, и мы отправим вам ссылку для сброса пароля.",
    email: "Email",
    emailPlaceholder: "вы@email.com",
    submit: "Отправить ссылку",
    submitting: "Отправка...",
    success: "Email отправлен",
    successDesc: "Проверьте почту. Если адрес связан с аккаунтом, вы получите ссылку для сброса пароля.",
    errorRequired: "Введите свой email.",
    errorInvalid: "Введите корректный email.",
    errorGeneric: "Ошибка отправки. Попробуйте ещё раз.",
  },
  uk: {
    title: "Забули пароль?",
    subtitle: "Введіть свій email, і ми надішлемо вам посилання для скидання пароля.",
    email: "Email",
    emailPlaceholder: "ви@email.com",
    submit: "Надіслати посилання",
    submitting: "Надсилання...",
    success: "Email надіслано",
    successDesc: "Перевірте пошту. Якщо адреса пов'язана з акаунтом, ви отримаєте посилання для скидання пароля.",
    errorRequired: "Введіть свій email.",
    errorInvalid: "Введіть коректний email.",
    errorGeneric: "Помилка надсилання. Спробуйте ще раз.",
  },
};

export default function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const s = t[locale] || t.it;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) { setError(s.errorRequired); return; }
    if (!trimmed.includes("@") || !trimmed.includes(".")) { setError(s.errorInvalid); return; }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `https://www.getnearme.it/${locale}/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch {
      setError(s.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{s.success}</h1>
        <p className="text-gray-500 text-sm">{s.successDesc}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Mail className="w-6 h-6 text-blue-500" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">{s.title}</h1>
      <p className="text-gray-500 text-sm mb-6 text-center">{s.subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
            {s.email}
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={s.emailPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {s.submitting}
            </>
          ) : (
            s.submit
          )}
        </button>
      </form>
    </div>
  );
}
