'use client';

import { useParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const translations: Record<string, Record<string, string>> = {
  it: {
    title: 'Abbonamento attivato!',
    subtitle: 'Grazie per aver scelto GetNearMe.',
    desc: 'Il tuo abbonamento è ora attivo. Installa l\'estensione Chrome per iniziare ad usare tutte le funzionalità.',
    installCta: 'Installa l\'estensione Chrome',
    alreadyInstalled: 'Hai già l\'estensione? Aprila e accedi con lo stesso account.',
    footer: 'Tutti i diritti riservati',
  },
  en: {
    title: 'Subscription activated!',
    subtitle: 'Thank you for choosing GetNearMe.',
    desc: 'Your subscription is now active. Install the Chrome extension to start using all the features.',
    installCta: 'Install Chrome Extension',
    alreadyInstalled: 'Already have the extension? Open it and sign in with the same account.',
    footer: 'All rights reserved',
  },
  es: {
    title: '¡Suscripción activada!',
    subtitle: 'Gracias por elegir GetNearMe.',
    desc: 'Tu suscripción ya está activa. Instala la extensión de Chrome para empezar a usar todas las funcionalidades.',
    installCta: 'Instalar extensión Chrome',
    alreadyInstalled: '¿Ya tienes la extensión? Ábrela e inicia sesión con la misma cuenta.',
    footer: 'Todos los derechos reservados',
  },
  fr: {
    title: 'Abonnement activé !',
    subtitle: 'Merci d\'avoir choisi GetNearMe.',
    desc: 'Votre abonnement est maintenant actif. Installez l\'extension Chrome pour commencer à utiliser toutes les fonctionnalités.',
    installCta: 'Installer l\'extension Chrome',
    alreadyInstalled: 'Vous avez déjà l\'extension ? Ouvrez-la et connectez-vous avec le même compte.',
    footer: 'Tous droits réservés',
  },
  ru: {
    title: 'Подписка активирована!',
    subtitle: 'Спасибо, что выбрали GetNearMe.',
    desc: 'Ваша подписка активна. Установите расширение Chrome, чтобы начать использовать все функции.',
    installCta: 'Установить расширение Chrome',
    alreadyInstalled: 'Уже есть расширение? Откройте его и войдите с тем же аккаунтом.',
    footer: 'Все права защищены',
  },
  uk: {
    title: 'Підписку активовано!',
    subtitle: 'Дякуємо, що обрали GetNearMe.',
    desc: 'Ваша підписка активна. Встановіть розширення Chrome, щоб почати використовувати всі функції.',
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

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale} />

      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.title}</h1>
          <p className="text-lg text-slate-500 mb-4">{t.subtitle}</p>
          <p className="text-slate-600 mb-8">{t.desc}</p>

          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 rounded-xl text-white font-semibold hover:bg-blue-600 transition-all text-lg"
          >
            {t.installCta}
          </a>

          <p className="text-sm text-slate-400 mt-6">{t.alreadyInstalled}</p>
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
