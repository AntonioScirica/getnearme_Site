'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STRIPE_BILLING_PORTAL = 'https://billing.stripe.com/p/login/cN2eY70E1ftd0kE000';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  user_lite: 'Lite',
  agency_starter: 'Starter',
  agency: 'Agency',
  agency_premium: 'Pro',
  agency_pro: 'Pro',
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-700',
  user_lite: 'bg-blue-100 text-blue-700',
  agency_starter: 'bg-indigo-100 text-indigo-700',
  agency: 'bg-amber-100 text-amber-800',
  agency_premium: 'bg-emerald-100 text-emerald-700',
  agency_pro: 'bg-emerald-100 text-emerald-700',
};

const translations: Record<string, Record<string, string>> = {
  it: {
    title: 'Il mio account',
    subscription: 'Abbonamento',
    currentPlan: 'Piano attuale',
    free: 'Nessun abbonamento attivo',
    freeDesc: 'Scegli un piano per sbloccare tutte le funzionalità.',
    choosePlan: 'Scegli un piano',
    manageSub: 'Gestisci abbonamento',
    manageSubDesc: 'Modifica, aggiorna o cancella il tuo abbonamento su Stripe.',
    credits: 'Crediti',
    creditsAvailable: 'crediti disponibili',
    email: 'Email',
    installExtension: 'Installa l\'estensione Chrome',
    installDesc: 'Accedi con lo stesso account nell\'estensione per usare il tuo abbonamento.',
    logout: 'Esci',
    footer: 'Tutti i diritti riservati',
  },
  en: {
    title: 'My account',
    subscription: 'Subscription',
    currentPlan: 'Current plan',
    free: 'No active subscription',
    freeDesc: 'Choose a plan to unlock all features.',
    choosePlan: 'Choose a plan',
    manageSub: 'Manage subscription',
    manageSubDesc: 'Change, upgrade, or cancel your subscription on Stripe.',
    credits: 'Credits',
    creditsAvailable: 'credits available',
    email: 'Email',
    installExtension: 'Install Chrome Extension',
    installDesc: 'Sign in with the same account in the extension to use your subscription.',
    logout: 'Sign out',
    footer: 'All rights reserved',
  },
  es: {
    title: 'Mi cuenta',
    subscription: 'Suscripción',
    currentPlan: 'Plan actual',
    free: 'Sin suscripción activa',
    freeDesc: 'Elige un plan para desbloquear todas las funcionalidades.',
    choosePlan: 'Elegir un plan',
    manageSub: 'Gestionar suscripción',
    manageSubDesc: 'Modifica, actualiza o cancela tu suscripción en Stripe.',
    credits: 'Créditos',
    creditsAvailable: 'créditos disponibles',
    email: 'Email',
    installExtension: 'Instalar extensión Chrome',
    installDesc: 'Inicia sesión con la misma cuenta en la extensión para usar tu suscripción.',
    logout: 'Cerrar sesión',
    footer: 'Todos los derechos reservados',
  },
  fr: {
    title: 'Mon compte',
    subscription: 'Abonnement',
    currentPlan: 'Plan actuel',
    free: 'Aucun abonnement actif',
    freeDesc: 'Choisissez un plan pour débloquer toutes les fonctionnalités.',
    choosePlan: 'Choisir un plan',
    manageSub: 'Gérer l\'abonnement',
    manageSubDesc: 'Modifiez, mettez à jour ou annulez votre abonnement sur Stripe.',
    credits: 'Crédits',
    creditsAvailable: 'crédits disponibles',
    email: 'Email',
    installExtension: 'Installer l\'extension Chrome',
    installDesc: 'Connectez-vous avec le même compte dans l\'extension pour utiliser votre abonnement.',
    logout: 'Se déconnecter',
    footer: 'Tous droits réservés',
  },
  ru: {
    title: 'Мой аккаунт',
    subscription: 'Подписка',
    currentPlan: 'Текущий план',
    free: 'Нет активной подписки',
    freeDesc: 'Выберите план, чтобы разблокировать все функции.',
    choosePlan: 'Выбрать план',
    manageSub: 'Управление подпиской',
    manageSubDesc: 'Измените, обновите или отмените подписку на Stripe.',
    credits: 'Кредиты',
    creditsAvailable: 'кредитов доступно',
    email: 'Email',
    installExtension: 'Установить расширение Chrome',
    installDesc: 'Войдите с тем же аккаунтом в расширении, чтобы использовать подписку.',
    logout: 'Выйти',
    footer: 'Все права защищены',
  },
  uk: {
    title: 'Мій акаунт',
    subscription: 'Підписка',
    currentPlan: 'Поточний план',
    free: 'Немає активної підписки',
    freeDesc: 'Оберіть план, щоб розблокувати всі функції.',
    choosePlan: 'Обрати план',
    manageSub: 'Керування підпискою',
    manageSubDesc: 'Змініть, оновіть або скасуйте підписку на Stripe.',
    credits: 'Кредити',
    creditsAvailable: 'кредитів доступно',
    email: 'Email',
    installExtension: 'Встановити розширення Chrome',
    installDesc: 'Увійдіть з тим самим акаунтом у розширенні, щоб використовувати підписку.',
    logout: 'Вийти',
    footer: 'Всі права захищені',
  },
};

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/getnearme-%E2%80%93-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia';

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('free');
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace(`/${locale}/checkout/agency`);
        return;
      }

      setUserEmail(session.user.email || '');

      try {
        const { data } = await supabase
          .from('user_credits')
          .select('subscription_type, credits')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          setSubscriptionType(data.subscription_type || 'free');
          setCredits(data.credits || 0);
        }
      } catch {
        // No record - user is free tier
      }

      setLoading(false);
    }

    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
  }

  const isPaid = subscriptionType && subscriptionType !== 'free';
  const tierLabel = TIER_LABELS[subscriptionType] || subscriptionType;
  const tierColor = TIER_COLORS[subscriptionType] || TIER_COLORS.free;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <Navbar locale={locale} />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="max-w-2xl mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

        {/* Subscription card */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{t.subscription}</h2>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold">{t.currentPlan}:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${tierColor}`}>
              {tierLabel}
            </span>
          </div>

          {isPaid ? (
            <div className="mt-4">
              <p className="text-slate-500 text-sm mb-4">{t.manageSubDesc}</p>
              <a
                href={STRIPE_BILLING_PORTAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-xl neo-border neo-btn font-bold text-sm transition-all"
                style={{ boxShadow: '4px 4px 0px #f59e0b' }}
              >
                {t.manageSub}
              </a>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-slate-500 text-sm mb-4">{t.freeDesc}</p>
              <a
                href={`/${locale}#pricing`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-[#1a1a2e] rounded-xl neo-border neo-btn font-bold text-sm transition-all hover:bg-amber-600"
                style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
              >
                {t.choosePlan}
              </a>
            </div>
          )}
        </div>

        {/* Credits card */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{t.credits}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-500">{credits.toLocaleString()}</span>
            <span className="text-slate-500">{t.creditsAvailable}</span>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{t.email}</h2>
          <p className="text-lg font-medium">{userEmail}</p>
        </div>

        {/* Extension install */}
        <div className="bg-blue-50 neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <p className="text-slate-600 text-sm mb-4">{t.installDesc}</p>
          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl neo-border neo-btn font-bold text-sm transition-all hover:bg-blue-600"
            style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
          >
            {t.installExtension}
          </a>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
        >
          {t.logout}
        </button>
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
