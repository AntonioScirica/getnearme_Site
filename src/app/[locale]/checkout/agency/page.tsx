'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Loader2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const translations = {
  it: {
    title: 'Piano Agency',
    planName: 'Agency',
    price: '199',
    perMonth: '/mese',
    features: [
      'Accesso completo all\'estensione',
      '50 foto AI gratuite al mese',
      'Analisi illimitate',
      'Supporto prioritario'
    ],
    loginButton: 'Continua con Google',
    orDivider: 'oppure',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    emailLoginButton: 'Accedi con email',
    loading: 'Caricamento...',
    redirecting: 'Reindirizzamento al pagamento...',
    errorDefault: 'Si è verificato un errore. Riprova.',
    errorInvalidCredentials: 'Credenziali non valide',
    footer: 'Tutti i diritti riservati'
  },
  en: {
    title: 'Agency Plan',
    planName: 'Agency',
    price: '199',
    perMonth: '/month',
    features: [
      'Full extension access',
      '50 free AI photos per month',
      'Unlimited analysis',
      'Priority support'
    ],
    loginButton: 'Continue with Google',
    orDivider: 'or',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    emailLoginButton: 'Sign in with email',
    loading: 'Loading...',
    redirecting: 'Redirecting to payment...',
    errorDefault: 'An error occurred. Please try again.',
    errorInvalidCredentials: 'Invalid credentials',
    footer: 'All rights reserved'
  },
  es: {
    title: 'Plan Agency',
    planName: 'Agency',
    price: '199',
    perMonth: '/mes',
    features: [
      'Acceso completo a la extension',
      '50 fotos AI gratis al mes',
      'Analisis ilimitados',
      'Soporte prioritario'
    ],
    loginButton: 'Continuar con Google',
    orDivider: 'o',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Contrasena',
    emailLoginButton: 'Acceder con email',
    loading: 'Cargando...',
    redirecting: 'Redirigiendo al pago...',
    errorDefault: 'Se produjo un error. Intentalo de nuevo.',
    errorInvalidCredentials: 'Credenciales no validas',
    footer: 'Todos los derechos reservados'
  },
  fr: {
    title: 'Plan Agency',
    planName: 'Agency',
    price: '199',
    perMonth: '/mois',
    features: [
      'Acces complet a l\'extension',
      '50 photos AI gratuites par mois',
      'Analyses illimitees',
      'Support prioritaire'
    ],
    loginButton: 'Continuer avec Google',
    orDivider: 'ou',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Mot de passe',
    emailLoginButton: 'Se connecter avec email',
    loading: 'Chargement...',
    redirecting: 'Redirection vers le paiement...',
    errorDefault: 'Une erreur s\'est produite. Veuillez reessayer.',
    errorInvalidCredentials: 'Identifiants invalides',
    footer: 'Tous droits reserves'
  },
  ru: {
    title: 'План Agency',
    planName: 'Agency',
    price: '199',
    perMonth: '/месяц',
    features: [
      'Полный доступ к расширению',
      '50 бесплатных AI фото в месяц',
      'Неограниченный анализ',
      'Приоритетная поддержка'
    ],
    loginButton: 'Продолжить с Google',
    orDivider: 'или',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Пароль',
    emailLoginButton: 'Войти с email',
    loading: 'Загрузка...',
    redirecting: 'Перенаправление на оплату...',
    errorDefault: 'Произошла ошибка. Попробуйте еще раз.',
    errorInvalidCredentials: 'Неверные учетные данные',
    footer: 'Все права защищены'
  },
  uk: {
    title: 'План Agency',
    planName: 'Agency',
    price: '199',
    perMonth: '/місяць',
    features: [
      'Повний доступ до розширення',
      '50 безкоштовних AI фото на місяць',
      'Необмежений аналіз',
      'Пріоритетна підтримка'
    ],
    loginButton: 'Продовжити з Google',
    orDivider: 'або',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Пароль',
    emailLoginButton: 'Увійти з email',
    loading: 'Завантаження...',
    redirecting: 'Перенаправлення на оплату...',
    errorDefault: 'Сталася помилка. Спробуйте ще раз.',
    errorInvalidCredentials: 'Невірні облікові дані',
    footer: 'Всі права захищені'
  }
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function CheckoutAgencyPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;

  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function goToCheckout(accessToken: string) {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          packageId: 'agency-subscription',
          successUrl: window.location.origin + '?checkout=success',
          cancelUrl: window.location.href
        })
      });

      const result = await response.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || t.errorDefault);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDefault);
      setIsRedirecting(false);
    }
  }

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await goToCheckout(session.access_token);
      }
    }

    checkSession();
  }, []);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href
        }
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDefault);
      setIsLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(t.errorInvalidCredentials);
      }

      if (data.session) {
        await goToCheckout(data.session.access_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDefault);
      setIsEmailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale} />

      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          {/* Plan Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            {/* Logo */}
            <div className="text-center mb-6">
              <span className="text-2xl font-bold text-blue-500">GetNearMe</span>
              <h1 className="text-xl font-semibold text-slate-900 mt-2">{t.title}</h1>
            </div>

            {/* Plan Info */}
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900">{t.planName}</div>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-blue-500">{t.price}€</span>
                  <span className="text-slate-500">{t.perMonth}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {t.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || isEmailLoading || isRedirecting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.loading}</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>{t.loginButton}</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-sm">{t.orDivider}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                disabled={isLoading || isEmailLoading || isRedirecting}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                disabled={isLoading || isEmailLoading || isRedirecting}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || isEmailLoading || isRedirecting}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 rounded-xl text-white font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEmailLoading || isRedirecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isRedirecting ? t.redirecting : t.loading}</span>
                  </>
                ) : (
                  <span>{t.emailLoginButton}</span>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe. {t.footer}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
