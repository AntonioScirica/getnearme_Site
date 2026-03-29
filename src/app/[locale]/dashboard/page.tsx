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

const PLAN_FEATURES: Record<string, Record<string, string[]>> = {
  free: {
    it: ['500 crediti iniziali', 'Analisi immobiliari base'],
    en: ['500 initial credits', 'Basic property analysis'],
    es: ['500 créditos iniciales', 'Análisis inmobiliario básico'],
    fr: ['500 crédits initiaux', 'Analyse immobilière de base'],
    ru: ['500 начальных кредитов', 'Базовый анализ недвижимости'],
    uk: ['500 початкових кредитів', 'Базовий аналіз нерухомості'],
  },
  user_lite: {
    it: ['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF (brand GetNearMe)'],
    en: ['Unlimited property analysis', 'Real-time price per sqm', 'PDF Export (GetNearMe brand)'],
    es: ['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Export PDF (marca GetNearMe)'],
    fr: ['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Export PDF (marque GetNearMe)'],
    ru: ['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Экспорт PDF (бренд GetNearMe)'],
    uk: ['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Експорт PDF (бренд GetNearMe)'],
  },
  agency_starter: {
    it: ['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF illimitati (brand GetNearMe)'],
    en: ['Unlimited property analysis', 'Real-time price per sqm', 'Unlimited PDF exports (GetNearMe brand)'],
    es: ['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Exports PDF ilimitados (marca GetNearMe)'],
    fr: ['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Exports PDF illimités (marque GetNearMe)'],
    ru: ['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Безлимитные PDF экспорты (бренд GetNearMe)'],
    uk: ['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Безлімітні PDF експорти (бренд GetNearMe)'],
  },
  agency: {
    it: ['Tutto di Starter, più:', 'Template Post & Stories Social', 'AI Rendering & Homestaging', '5 utenti inclusi'],
    en: ['Everything in Starter, plus:', 'Social Post & Stories Templates', 'AI Rendering & Homestaging', '5 users included'],
    es: ['Todo de Starter, más:', 'Plantillas Post & Stories Social', 'AI Rendering & Homestaging', '5 usuarios incluidos'],
    fr: ['Tout de Starter, plus :', 'Templates Post & Stories Social', 'AI Rendering & Homestaging', '5 utilisateurs inclus'],
    ru: ['Всё из Starter, плюс:', 'Шаблоны постов и сторис', 'AI Рендеринг и Хоумстейджинг', '5 пользователей включено'],
    uk: ['Все зі Starter, плюс:', 'Шаблони постів та сторіс', 'AI Рендеринг та Хоумстейджинг', '5 користувачів включено'],
  },
  agency_premium: {
    it: ['Tutto di Agency, più:', 'Export PDF con il TUO logo', 'Editor Video per i social', 'Supporto prioritario', '5 utenti inclusi'],
    en: ['Everything in Agency, plus:', 'PDF Export with YOUR logo', 'Social Video Editor', 'Priority support', '5 users included'],
    es: ['Todo de Agency, más:', 'Export PDF con TU logo', 'Editor de Video para redes', 'Soporte prioritario', '5 usuarios incluidos'],
    fr: ['Tout de Agency, plus :', 'Export PDF avec VOTRE logo', 'Éditeur Vidéo pour les réseaux', 'Support prioritaire', '5 utilisateurs inclus'],
    ru: ['Всё из Agency, плюс:', 'Экспорт PDF с ВАШИМ логотипом', 'Видеоредактор для соцсетей', 'Приоритетная поддержка', '5 пользователей включено'],
    uk: ['Все з Agency, плюс:', 'Експорт PDF з ВАШИМ логотипом', 'Відеоредактор для соцмереж', 'Пріоритетна підтримка', '5 користувачів включено'],
  },
  agency_pro: {
    it: ['Tutto di Agency, più:', 'Export PDF con il TUO logo', 'Editor Video per i social', 'Supporto prioritario', '5 utenti inclusi'],
    en: ['Everything in Agency, plus:', 'PDF Export with YOUR logo', 'Social Video Editor', 'Priority support', '5 users included'],
    es: ['Todo de Agency, más:', 'Export PDF con TU logo', 'Editor de Video para redes', 'Soporte prioritario', '5 usuarios incluidos'],
    fr: ['Tout de Agency, plus :', 'Export PDF avec VOTRE logo', 'Éditeur Vidéo pour les réseaux', 'Support prioritaire', '5 utilisateurs inclus'],
    ru: ['Всё из Agency, плюс:', 'Экспорт PDF с ВАШИМ логотипом', 'Видеоредактор для соцсетей', 'Приоритетная поддержка', '5 пользователей включено'],
    uk: ['Все з Agency, плюс:', 'Експорт PDF з ВАШИМ логотипом', 'Відеоредактор для соцмереж', 'Пріоритетна підтримка', '5 користувачів включено'],
  },
};

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
    planIncludes: 'Il tuo piano include',
    email: 'Email',
    installExtension: 'Installa l\'estensione Chrome',
    installDesc: 'Accedi con lo stesso account nell\'estensione per usare il tuo abbonamento.',
    logout: 'Esci',
    dangerZone: 'Zona pericolosa',
    deleteAccount: 'Elimina account',
    deleteAccountDesc: 'Questa azione è irreversibile. Tutti i tuoi dati, crediti e abbonamento verranno eliminati permanentemente.',
    deleteConfirmTitle: 'Sei sicuro?',
    deleteConfirmDesc: 'Digita la tua email per confermare l\'eliminazione dell\'account:',
    deleteConfirmButton: 'Elimina definitivamente',
    cancel: 'Annulla',
    deleting: 'Eliminazione in corso...',
    deleteError: 'Errore durante l\'eliminazione. Riprova.',
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
    planIncludes: 'Your plan includes',
    email: 'Email',
    installExtension: 'Install Chrome Extension',
    installDesc: 'Sign in with the same account in the extension to use your subscription.',
    logout: 'Sign out',
    dangerZone: 'Danger zone',
    deleteAccount: 'Delete account',
    deleteAccountDesc: 'This action is irreversible. All your data, credits, and subscription will be permanently deleted.',
    deleteConfirmTitle: 'Are you sure?',
    deleteConfirmDesc: 'Type your email to confirm account deletion:',
    deleteConfirmButton: 'Delete permanently',
    cancel: 'Cancel',
    deleting: 'Deleting...',
    deleteError: 'Error deleting account. Please try again.',
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
    planIncludes: 'Tu plan incluye',
    email: 'Email',
    installExtension: 'Instalar extensión Chrome',
    installDesc: 'Inicia sesión con la misma cuenta en la extensión para usar tu suscripción.',
    logout: 'Cerrar sesión',
    dangerZone: 'Zona peligrosa',
    deleteAccount: 'Eliminar cuenta',
    deleteAccountDesc: 'Esta acción es irreversible. Todos tus datos, créditos y suscripción se eliminarán permanentemente.',
    deleteConfirmTitle: '¿Estás seguro?',
    deleteConfirmDesc: 'Escribe tu email para confirmar la eliminación de la cuenta:',
    deleteConfirmButton: 'Eliminar definitivamente',
    cancel: 'Cancelar',
    deleting: 'Eliminando...',
    deleteError: 'Error al eliminar la cuenta. Inténtalo de nuevo.',
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
    planIncludes: 'Votre plan inclut',
    email: 'Email',
    installExtension: 'Installer l\'extension Chrome',
    installDesc: 'Connectez-vous avec le même compte dans l\'extension pour utiliser votre abonnement.',
    logout: 'Se déconnecter',
    dangerZone: 'Zone dangereuse',
    deleteAccount: 'Supprimer le compte',
    deleteAccountDesc: 'Cette action est irréversible. Toutes vos données, crédits et abonnement seront supprimés définitivement.',
    deleteConfirmTitle: 'Êtes-vous sûr ?',
    deleteConfirmDesc: 'Saisissez votre email pour confirmer la suppression du compte :',
    deleteConfirmButton: 'Supprimer définitivement',
    cancel: 'Annuler',
    deleting: 'Suppression en cours...',
    deleteError: 'Erreur lors de la suppression. Veuillez réessayer.',
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
    planIncludes: 'Ваш план включает',
    email: 'Email',
    installExtension: 'Установить расширение Chrome',
    installDesc: 'Войдите с тем же аккаунтом в расширении, чтобы использовать подписку.',
    logout: 'Выйти',
    dangerZone: 'Опасная зона',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountDesc: 'Это действие необратимо. Все ваши данные, кредиты и подписка будут удалены навсегда.',
    deleteConfirmTitle: 'Вы уверены?',
    deleteConfirmDesc: 'Введите вашу почту для подтверждения удаления аккаунта:',
    deleteConfirmButton: 'Удалить навсегда',
    cancel: 'Отмена',
    deleting: 'Удаление...',
    deleteError: 'Ошибка при удалении. Попробуйте ещё раз.',
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
    planIncludes: 'Ваш план включає',
    email: 'Email',
    installExtension: 'Встановити розширення Chrome',
    installDesc: 'Увійдіть з тим самим акаунтом у розширенні, щоб використовувати підписку.',
    logout: 'Вийти',
    dangerZone: 'Небезпечна зона',
    deleteAccount: 'Видалити акаунт',
    deleteAccountDesc: 'Ця дія незворотня. Всі ваші дані, кредити та підписка будуть видалені назавжди.',
    deleteConfirmTitle: 'Ви впевнені?',
    deleteConfirmDesc: 'Введіть вашу пошту для підтвердження видалення акаунту:',
    deleteConfirmButton: 'Видалити назавжди',
    cancel: 'Скасувати',
    deleting: 'Видалення...',
    deleteError: 'Помилка при видаленні. Спробуйте ще раз.',
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
          .select('subscription_type')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          setSubscriptionType(data.subscription_type || 'free');
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

  async function handleDeleteAccount() {
    if (deleteConfirmEmail !== userEmail) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;

      await supabase.auth.signOut();
      router.replace(`/${locale}`);
    } catch {
      setDeleteError(t.deleteError);
      setIsDeleting(false);
    }
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
                href={`${STRIPE_BILLING_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-xl neo-border neo-btn font-bold text-sm transition-all"
                style={{ boxShadow: '4px 4px 0px #3B83F6' }}
              >
                {t.manageSub}
              </a>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-slate-500 text-sm mb-4">{t.freeDesc}</p>
              <a
                href={`/${locale}#pricing`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl neo-border neo-btn font-bold text-sm transition-all hover:bg-blue-600"
                style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
              >
                {t.choosePlan}
              </a>
            </div>
          )}
        </div>

        {/* Plan features card */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{t.planIncludes}</h2>
          <ul className="space-y-2">
            {(PLAN_FEATURES[subscriptionType]?.[locale] || PLAN_FEATURES.free[locale] || PLAN_FEATURES.free.it).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
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

        {/* Danger zone */}
        <div className="bg-white border-2 border-red-300 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-4">{t.dangerZone}</h2>
          <p className="text-slate-500 text-sm mb-4">{t.deleteAccountDesc}</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl neo-border neo-btn font-bold text-sm transition-all hover:bg-red-600"
            style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
          >
            {t.deleteAccount}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
        >
          {t.logout}
        </button>
      </main>

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white neo-border rounded-2xl p-8 max-w-md w-full" style={{ boxShadow: '8px 8px 0px #1a1a2e' }}>
            <h3 className="text-xl font-bold text-red-600 mb-2">{t.deleteConfirmTitle}</h3>
            <p className="text-slate-600 text-sm mb-4">{t.deleteConfirmDesc}</p>

            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={userEmail}
              className="w-full px-4 py-3 border-2 border-[#1a1a2e] rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />

            {deleteError && (
              <p className="text-red-500 text-sm mb-4">{deleteError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmEmail(''); setDeleteError(null); }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmEmail !== userEmail || isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t.deleting : t.deleteConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}

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
