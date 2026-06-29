'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Video } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import { track } from '@/lib/analytics';

const translations: Record<string, Record<string, string>> = {
  it: {
    title: 'Pacchetto attivato!',
    subtitle: 'Grazie per il tuo acquisto. I crediti extra sono stati aggiunti al tuo account.',
    cta: 'Vai alla dashboard',
    syncHint: 'I crediti extra non scadono e si sommano al tuo piano attuale.',
    footer: 'Tutti i diritti riservati',
  },
  en: {
    title: 'Pack activated!',
    subtitle: 'Thank you for your purchase. The extra credits have been added to your account.',
    cta: 'Go to dashboard',
    syncHint: 'Extra credits do not expire and stack on top of your current plan.',
    footer: 'All rights reserved',
  },
  es: {
    title: '¡Paquete activado!',
    subtitle: 'Gracias por tu compra. Los créditos extra se han añadido a tu cuenta.',
    cta: 'Ir al panel',
    syncHint: 'Los créditos extra no caducan y se suman a tu plan actual.',
    footer: 'Todos los derechos reservados',
  },
  fr: {
    title: 'Pack activé !',
    subtitle: 'Merci pour votre achat. Les crédits supplémentaires ont été ajoutés à votre compte.',
    cta: 'Aller au tableau de bord',
    syncHint: 'Les crédits supplémentaires n\'expirent pas et s\'ajoutent à votre forfait actuel.',
    footer: 'Tous droits réservés',
  },
  ru: {
    title: 'Пакет активирован!',
    subtitle: 'Спасибо за покупку. Дополнительные кредиты добавлены в ваш аккаунт.',
    cta: 'Перейти в панель',
    syncHint: 'Дополнительные кредиты не сгорают и добавляются к вашему текущему плану.',
    footer: 'Все права защищены',
  },
  uk: {
    title: 'Пакет активовано!',
    subtitle: 'Дякуємо за покупку. Додаткові кредити додано до вашого облікового запису.',
    cta: 'Перейти до панелі',
    syncHint: 'Додаткові кредити не згорають і додаються до вашого поточного плану.',
    footer: 'Всі права захищені',
  },
};

export default function VideoCheckoutSuccessPage() {
  const params = useParams();
  // Stripe one-time credit-pack payment redirects here → fire the conversion event.
  useEffect(() => { track('Purchase', { currency: 'EUR' }); }, []);
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full">
          <div className="bg-white neo-border rounded-2xl p-8 text-center" style={{ boxShadow: '0 4px 16px rgba(16,24,40,0.08)' }}>
            <div className="w-20 h-20 bg-blue-100 neo-border rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-blue-600" />
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
              © 2025 GetNearMe. {t.footer}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
