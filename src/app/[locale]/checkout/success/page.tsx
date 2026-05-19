'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

type SuccessText = { title: string; subtitle: string; cta: string; hint: string; syncHint: string };
const translations: Record<string, { install: SuccessText; extension: SuccessText }> = {
  it: {
    install: {
      title: 'Abbonamento attivato!',
      subtitle: 'Grazie per aver scelto GetNearMe.',
      cta: 'Installa l\'estensione Chrome',
      hint: 'Hai già l\'estensione? Aprila e accedi con lo stesso account.',
      syncHint: 'Se l\'abbonamento non risulta subito visibile, prova a fare logout e login nell\'estensione.',
    },
    extension: {
      title: 'Abbonamento attivato!',
      subtitle: 'Grazie per aver scelto GetNearMe.',
      cta: 'Inizia ad usare l\'estensione',
      hint: 'Verrai reindirizzato su Immobiliare.it dove potrai usare subito GetNearMe.',
      syncHint: 'Se l\'abbonamento non risulta subito visibile, prova a fare logout e login nell\'estensione.',
    },
  },
  en: {
    install: {
      title: 'Subscription activated!',
      subtitle: 'Thank you for choosing GetNearMe.',
      cta: 'Install Chrome Extension',
      hint: 'Already have the extension? Open it and sign in with the same account.',
      syncHint: 'If the subscription doesn\'t appear right away, try logging out and back in.',
    },
    extension: {
      title: 'Subscription activated!',
      subtitle: 'Thank you for choosing GetNearMe.',
      cta: 'Start using the extension',
      hint: 'You\'ll be redirected to Immobiliare.it where you can use GetNearMe right away.',
      syncHint: 'If the subscription doesn\'t appear right away, try logging out and back in.',
    },
  },
  es: {
    install: {
      title: '¡Suscripción activada!',
      subtitle: 'Gracias por elegir GetNearMe.',
      cta: 'Instalar extensión Chrome',
      hint: '¿Ya tienes la extensión? Ábrela e inicia sesión con la misma cuenta.',
      syncHint: 'Si la suscripción no aparece de inmediato, prueba a cerrar sesión y volver a iniciarla.',
    },
    extension: {
      title: '¡Suscripción activada!',
      subtitle: 'Gracias por elegir GetNearMe.',
      cta: 'Empieza a usar la extensión',
      hint: 'Serás redirigido a Immobiliare.it donde podrás usar GetNearMe de inmediato.',
      syncHint: 'Si la suscripción no aparece de inmediato, prueba a cerrar sesión y volver a iniciarla.',
    },
  },
  fr: {
    install: {
      title: 'Abonnement activé !',
      subtitle: 'Merci d\'avoir choisi GetNearMe.',
      cta: 'Installer l\'extension Chrome',
      hint: 'Vous avez déjà l\'extension ? Ouvrez-la et connectez-vous avec le même compte.',
      syncHint: 'Si l\'abonnement n\'apparaît pas immédiatement, essayez de vous déconnecter puis de vous reconnecter.',
    },
    extension: {
      title: 'Abonnement activé !',
      subtitle: 'Merci d\'avoir choisi GetNearMe.',
      cta: 'Commencer à utiliser l\'extension',
      hint: 'Vous serez redirigé vers Immobiliare.it où vous pourrez utiliser GetNearMe immédiatement.',
      syncHint: 'Si l\'abonnement n\'apparaît pas immédiatement, essayez de vous déconnecter puis de vous reconnecter.',
    },
  },
  ru: {
    install: {
      title: 'Подписка активирована!',
      subtitle: 'Спасибо, что выбрали GetNearMe.',
      cta: 'Установить расширение Chrome',
      hint: 'Уже есть расширение? Откройте его и войдите с тем же аккаунтом.',
      syncHint: 'Если подписка не отображается сразу, попробуйте выйти и войти снова.',
    },
    extension: {
      title: 'Подписка активирована!',
      subtitle: 'Спасибо, что выбрали GetNearMe.',
      cta: 'Начать использовать расширение',
      hint: 'Вы будете перенаправлены на Immobiliare.it, где сможете сразу использовать GetNearMe.',
      syncHint: 'Если подписка не отображается сразу, попробуйте выйти и войти снова.',
    },
  },
  uk: {
    install: {
      title: 'Підписку активовано!',
      subtitle: 'Дякуємо, що обрали GetNearMe.',
      cta: 'Встановити розширення Chrome',
      hint: 'Вже маєте розширення? Відкрийте його та увійдіть з тим самим акаунтом.',
      syncHint: 'Якщо підписка не з\'являється одразу, спробуйте вийти та увійти знову.',
    },
    extension: {
      title: 'Підписку активовано!',
      subtitle: 'Дякуємо, що обрали GetNearMe.',
      cta: 'Почати використовувати розширення',
      hint: 'Вас буде перенаправлено на Immobiliare.it, де ви зможете одразу використовувати GetNearMe.',
      syncHint: 'Якщо підписка не з\'являється одразу, спробуйте вийти та увійти знову.',
    },
  },
};

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/getnearme-%E2%80%93-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia';
const IMMOBILIARE_URL = 'https://www.immobiliare.it';

function SuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as Locale) || 'it';
  const isFromExtension = searchParams.get('source') === 'extension';
  const localeTranslations = translations[locale] || translations.it;
  const t = isFromExtension ? localeTranslations.extension : localeTranslations.install;
  const ctaUrl = isFromExtension ? IMMOBILIARE_URL : CHROME_EXTENSION_URL;

  return (
    <div className="max-w-md w-full">
      <div className="bg-white neo-border rounded-2xl p-8 text-center" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
        <div className="w-20 h-20 bg-green-100 neo-border rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-lg text-slate-500 mb-6">{t.subtitle}</p>

        <a
          href={ctaUrl}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 rounded-xl neo-border neo-btn text-white font-bold hover:bg-blue-600 transition-all text-lg"
          style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
        >
          {t.cta}
        </a>

        <p className="text-sm text-slate-400 mt-6">{t.hint}</p>
        <p className="text-xs text-slate-400 mt-2">{t.syncHint}</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'it';

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <Suspense>
          <SuccessContent />
        </Suspense>
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
