'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import { track } from '@/lib/analytics';

const translations: Record<string, Record<string, string>> = {
  it: {
    title: 'Abbonamento attivato!',
    subtitle: 'Grazie per aver scelto GetNearMe.',
    cta: 'Vai alla dashboard',
    syncHint: 'Accedi con il tuo account per iniziare a usare la piattaforma.',
  },
  en: {
    title: 'Subscription activated!',
    subtitle: 'Thank you for choosing GetNearMe.',
    cta: 'Go to dashboard',
    syncHint: 'Sign in with your account to start using the platform.',
  },
  es: {
    title: '¡Suscripción activada!',
    subtitle: 'Gracias por elegir GetNearMe.',
    cta: 'Ir al panel',
    syncHint: 'Inicia sesión con tu cuenta para empezar a usar la plataforma.',
  },
  fr: {
    title: 'Abonnement activé !',
    subtitle: 'Merci d\'avoir choisi GetNearMe.',
    cta: 'Aller au tableau de bord',
    syncHint: 'Connectez-vous avec votre compte pour commencer à utiliser la plateforme.',
  },
  ru: {
    title: 'Подписка активирована!',
    subtitle: 'Спасибо, что выбрали GetNearMe.',
    cta: 'Перейти в панель',
    syncHint: 'Войдите в аккаунт, чтобы начать пользоваться платформой.',
  },
  uk: {
    title: 'Підписку активовано!',
    subtitle: 'Дякуємо, що обрали GetNearMe.',
    cta: 'Перейти до панелі',
    syncHint: 'Увійдіть у свій акаунт, щоб почати користуватися платформою.',
  },
};

export default function CheckoutSuccessPage() {
  const params = useParams();
  // Stripe subscription payment redirects here → fire the conversion event.
  useEffect(() => { track('Subscribe', { currency: 'EUR' }); }, []);
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full">
          <div className="bg-white neo-border rounded-2xl p-8 text-center" style={{ boxShadow: '0 4px 16px rgba(16,24,40,0.08)' }}>
            <div className="w-20 h-20 bg-green-100 neo-border rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-lg text-slate-500 mb-6">{t.subtitle}</p>

            <a
              href={`/${locale}/dashboard`}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 rounded-xl neo-border neo-btn text-white font-bold hover:bg-blue-600 transition-all text-lg"
              style={{ boxShadow: '0 4px 16px rgba(16,24,40,0.08)' }}
            >
              {t.cta}
            </a>

            <p className="text-xs text-slate-400 mt-6">{t.syncHint}</p>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
