'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const translations: Record<string, Record<string, string>> = {
  it: {
    title: 'Abbonamento attivato!',
    subtitle: 'Grazie per aver scelto GetNearMe.',
    redirecting: 'Ti stiamo reindirizzando al Chrome Web Store...',
    installCta: 'Installa l\'estensione Chrome',
    alreadyInstalled: 'Hai già l\'estensione? Aprila e accedi con lo stesso account.',
    footer: 'Tutti i diritti riservati',
  },
  en: {
    title: 'Subscription activated!',
    subtitle: 'Thank you for choosing GetNearMe.',
    redirecting: 'Redirecting you to the Chrome Web Store...',
    installCta: 'Install Chrome Extension',
    alreadyInstalled: 'Already have the extension? Open it and sign in with the same account.',
    footer: 'All rights reserved',
  },
  es: {
    title: '¡Suscripción activada!',
    subtitle: 'Gracias por elegir GetNearMe.',
    redirecting: 'Te estamos redirigiendo al Chrome Web Store...',
    installCta: 'Instalar extensión Chrome',
    alreadyInstalled: '¿Ya tienes la extensión? Ábrela e inicia sesión con la misma cuenta.',
    footer: 'Todos los derechos reservados',
  },
  fr: {
    title: 'Abonnement activé !',
    subtitle: 'Merci d\'avoir choisi GetNearMe.',
    redirecting: 'Redirection vers le Chrome Web Store...',
    installCta: 'Installer l\'extension Chrome',
    alreadyInstalled: 'Vous avez déjà l\'extension ? Ouvrez-la et connectez-vous avec le même compte.',
    footer: 'Tous droits réservés',
  },
  ru: {
    title: 'Подписка активирована!',
    subtitle: 'Спасибо, что выбрали GetNearMe.',
    redirecting: 'Перенаправляем вас в Chrome Web Store...',
    installCta: 'Установить расширение Chrome',
    alreadyInstalled: 'Уже есть расширение? Откройте его и войдите с тем же аккаунтом.',
    footer: 'Все права защищены',
  },
  uk: {
    title: 'Підписку активовано!',
    subtitle: 'Дякуємо, що обрали GetNearMe.',
    redirecting: 'Перенаправляємо вас до Chrome Web Store...',
    installCta: 'Встановити розширення Chrome',
    alreadyInstalled: 'Вже маєте розширення? Відкрийте його та увійдіть з тим самим акаунтом.',
    footer: 'Всі права захищені',
  },
};

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/getnearme-%E2%80%93-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia';

export default function CheckoutSuccessPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = CHROME_EXTENSION_URL;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full">
          <div className="bg-white neo-border rounded-2xl p-8 text-center" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
            <div className="w-20 h-20 bg-green-100 neo-border rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-lg text-slate-500 mb-6">{t.subtitle}</p>

            <p className="text-slate-500 text-sm mb-6">
              {t.redirecting} <span className="font-bold text-blue-500">{countdown}s</span>
            </p>

            <a
              href={CHROME_EXTENSION_URL}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 rounded-xl neo-border neo-btn text-white font-bold hover:bg-blue-600 transition-all text-lg"
              style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
            >
              {t.installCta}
            </a>

            <p className="text-sm text-slate-400 mt-6">{t.alreadyInstalled}</p>
          </div>
        </div>
      </main>

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
