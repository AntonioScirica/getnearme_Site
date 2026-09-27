'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDisposableEmail } from '@/lib/disposableEmails';
import { CheckCircle, Loader2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { isBuy, startCheckout } from '@/lib/startCheckout';

// Plan ID mapping: homepage IDs → internal subscription IDs
const PLAN_ID_MAP: Record<string, string> = {
  starter_monthly: 'starter_monthly',
  individual_monthly: 'individual_monthly',
  individual_annual: 'individual_annual',
  agency_monthly: 'agency_monthly',
  agency_annual: 'agency_annual',
};

interface PlanData {
  name: string;
  price_monthly: number;
  price_annual: number;
  original_price: number;
  payment_link_monthly: string;
  payment_link_annual: string | null;
  features_key: string;
  popular: boolean;
}

const PLANS: Record<string, PlanData> = {
  // Starter (€14,99/mese, no annuale)
  starter_monthly: {
    name: 'Starter',
    price_monthly: 14.99,
    price_annual: 14.99,
    original_price: 0,
    payment_link_monthly: 'https://buy.stripe.com/00w14n5Oz7rBcHu8xGak00K',
    payment_link_annual: null,
    features_key: 'starter',
    popular: false,
  },
  // Individuale (€59/€590)
  individual_monthly: {
    name: 'Individuale Mensile',
    price_monthly: 59,
    price_annual: 59,
    original_price: 150,
    payment_link_monthly: 'https://buy.stripe.com/fZucN5dh17rB5f2bJSak00G',
    payment_link_annual: null,
    features_key: 'pro',
    popular: false,
  },
  individual_annual: {
    name: 'Individuale Annuale',
    price_monthly: 590,
    price_annual: 590,
    original_price: 1800,
    payment_link_monthly: 'https://buy.stripe.com/bJe4gzdh19zJgXK9BKak00H',
    payment_link_annual: null,
    features_key: 'pro',
    popular: false,
  },
  // Agenzia (€399/mese, €3588/anno) — prezzo totale team (5 utenti)
  agency_monthly: {
    name: 'Agenzia Mensile',
    price_monthly: 399,
    price_annual: 399,
    original_price: 0,
    payment_link_monthly: 'https://buy.stripe.com/cNifZh7WH5jt6j65luak00I',
    payment_link_annual: null,
    features_key: 'pro',
    popular: false,
  },
  agency_annual: {
    name: 'Agenzia Annuale',
    price_monthly: 3588,
    price_annual: 3588,
    original_price: 0,
    payment_link_monthly: 'https://buy.stripe.com/cNi9AT7WH27h9vidS0ak00J',
    payment_link_annual: null,
    features_key: 'pro',
    popular: true,
  },
};

const PLAN_DISPLAY_ORDER = ['individual_monthly', 'individual_annual', 'agency_monthly', 'agency_annual'];

const TIER_LABELS: Record<string, Record<string, string>> = {
  starter_monthly:    { it: 'Starter',              en: 'Starter',             es: 'Starter',             fr: 'Starter',             ru: 'Starter',         uk: 'Starter' },
  user_lite:          { it: 'Lite',                en: 'Lite',                es: 'Lite',                fr: 'Lite',                ru: 'Lite',            uk: 'Lite' },
  individual_monthly: { it: 'Individuale Mensile', en: 'Individual Monthly',  es: 'Individual Mensual',  fr: 'Individuel Mensuel',  ru: 'Индив. месяц',    uk: 'Індив. місяць' },
  individual_annual:  { it: 'Individuale Annuale', en: 'Individual Annual',   es: 'Individual Anual',    fr: 'Individuel Annuel',   ru: 'Индив. год',      uk: 'Індив. рік' },
  agency_monthly:     { it: 'Agenzia Mensile',     en: 'Agency Monthly',      es: 'Agencia Mensual',     fr: 'Agence Mensuel',      ru: 'Агентство месяц', uk: 'Агенція місяць' },
  agency_annual:      { it: 'Agenzia Annuale',     en: 'Agency Annual',       es: 'Agencia Anual',       fr: 'Agence Annuel',       ru: 'Агентство год',   uk: 'Агенція рік' },
};

const translations: Record<string, Record<string, string | string[]>> = {
  it: {
    pageTitle: 'Scegli il tuo piano',
    monthly: 'Mensile',
    annual: 'Annuale',
    perMonth: '/mese',
    perYear: '/anno',
    save: 'Risparmi',
    subscribe: 'Abbonati ora',
    loginTitle: 'Accedi per continuare',
    loginSubtitle: "Accedi con il tuo account o creane uno nuovo\nin pochi secondi.",
    loginButton: 'Continua con Google',
    orDivider: 'oppure',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    emailLoginButton: 'Accedi con email',
    emailSignupButton: 'Crea account',
    noAccount: 'Non hai un account?',
    hasAccount: 'Hai già un account?',
    loading: 'Caricamento...',
    redirecting: 'Reindirizzamento al pagamento...',
    errorDefault: 'Si è verificato un errore. Riprova.',
    errorInvalidCredentials: 'Email o password non corretti. Non hai un account? Clicca su "Crea account".',
    alreadySubscribed: 'Hai già un abbonamento attivo',
    currentPlan: 'Piano attuale',
    manageSub: 'Gestisci abbonamento',
    popular: 'Più popolare',
    footer: 'Tutti i diritti riservati',
    features_lite: JSON.stringify(['Calcolo prezzo al m² in tempo reale']),
    features_starter: JSON.stringify(['Calcolo prezzo al m² in tempo reale']),
    features_agency: JSON.stringify(['Calcolo prezzo al m² in tempo reale', 'Template Post & Stories Social', 'AI Rendering & Homestaging', '5 utenti inclusi']),
    features_pro: JSON.stringify(['Calcolo prezzo al m² in tempo reale', 'Template Post & Stories Social', 'AI Rendering & Homestaging', 'Editor Video per i social', 'Supporto prioritario', '5 utenti inclusi']),
    users_lite: '1 utente',
    users_starter: '1 utente',
    users_agency: '5 utenti inclusi',
    users_pro: '5 utenti inclusi',
    securePayment: 'Pagamento sicuro con Stripe',
    cancelAnytime: 'Cancella in qualsiasi momento',
    acceptTerms: 'Accetto i',
    termsOfService: 'Termini di Servizio',
    andThe: 'e la',
    privacyPolicy: 'Privacy Policy',
    marketingConsent: 'Accetto di ricevere email su novità e promozioni',
    termsRequired: 'Devi accettare i termini per continuare',
    checkEmail: 'Registrazione completata!',
    checkEmailDesc: 'Controlla la tua email per confermare l\'account.',
    loggedInAs: 'Accesso effettuato come',
    proceedToPayment: 'Procedi al pagamento',
    yourAccount: 'Il tuo account',
    installExtension: 'Installa l\'estensione Chrome',
    alreadyInstalled: 'Hai già l\'estensione? Aprila e accedi con lo stesso account.',
    syncHint: 'Se l\'abbonamento non risulta subito visibile, prova a fare logout e login nell\'estensione.',
    logout: 'Esci',
    deleteAccount: 'Elimina account',
    deleteConfirm: 'Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.',
  },
  en: {
    pageTitle: 'Choose your plan',
    monthly: 'Monthly',
    annual: 'Annual',
    perMonth: '/month',
    perYear: '/year',
    save: 'Save',
    subscribe: 'Subscribe now',
    loginTitle: 'Sign in to continue',
    loginSubtitle: 'Sign in with your account or create a new one in seconds.',
    loginButton: 'Continue with Google',
    orDivider: 'or',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    emailLoginButton: 'Sign in with email',
    emailSignupButton: 'Create account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loading: 'Loading...',
    redirecting: 'Redirecting to payment...',
    errorDefault: 'An error occurred. Please try again.',
    errorInvalidCredentials: 'Incorrect email or password. Don\'t have an account? Click "Create account".',
    alreadySubscribed: 'You already have an active subscription',
    currentPlan: 'Current plan',
    manageSub: 'Manage subscription',
    popular: 'Most popular',
    footer: 'All rights reserved',
    features_lite: JSON.stringify(['Real-time price per sqm']),
    features_starter: JSON.stringify(['Real-time price per sqm']),
    features_agency: JSON.stringify(['Real-time price per sqm', 'Social Post & Stories Templates', 'AI Rendering & Homestaging', '5 users included']),
    features_pro: JSON.stringify(['Real-time price per sqm', 'Social Post & Stories Templates', 'AI Rendering & Homestaging', 'Social Video Editor', 'Priority support', '5 users included']),
    users_lite: '1 user',
    users_starter: '1 user',
    users_agency: '5 users included',
    users_pro: '5 users included',
    securePayment: 'Secure payment via Stripe',
    cancelAnytime: 'Cancel anytime',
    acceptTerms: 'I accept the',
    termsOfService: 'Terms of Service',
    andThe: 'and the',
    privacyPolicy: 'Privacy Policy',
    marketingConsent: 'I agree to receive emails about news and promotions',
    termsRequired: 'You must accept the terms to continue',
    checkEmail: 'Registration complete!',
    checkEmailDesc: 'Check your email to confirm your account.',
    loggedInAs: 'Signed in as',
    proceedToPayment: 'Proceed to payment',
    yourAccount: 'Your account',
    installExtension: 'Install Chrome Extension',
    alreadyInstalled: 'Already have the extension? Open it and sign in with the same account.',
    syncHint: 'If the subscription doesn\'t appear right away, try logging out and back in.',
    logout: 'Sign out',
    deleteAccount: 'Delete account',
    deleteConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
  },
  es: {
    pageTitle: 'Elige tu plan',
    monthly: 'Mensual',
    annual: 'Anual',
    perMonth: '/mes',
    perYear: '/año',
    save: 'Ahorras',
    subscribe: 'Suscríbete ahora',
    loginTitle: 'Inicia sesión para continuar',
    loginSubtitle: 'Accede con tu cuenta o crea una nueva en pocos segundos.',
    loginButton: 'Continuar con Google',
    orDivider: 'o',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Contraseña',
    emailLoginButton: 'Acceder con email',
    emailSignupButton: 'Crear cuenta',
    noAccount: '¿No tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    loading: 'Cargando...',
    redirecting: 'Redirigiendo al pago...',
    errorDefault: 'Se produjo un error. Inténtalo de nuevo.',
    errorInvalidCredentials: 'Email o contraseña incorrectos. ¿No tienes cuenta? Haz clic en "Crear cuenta".',
    alreadySubscribed: 'Ya tienes una suscripción activa',
    currentPlan: 'Plan actual',
    manageSub: 'Gestionar suscripción',
    popular: 'Más popular',
    footer: 'Todos los derechos reservados',
    features_lite: JSON.stringify(['Cálculo precio por m² en tiempo real']),
    features_starter: JSON.stringify(['Cálculo precio por m² en tiempo real']),
    features_agency: JSON.stringify(['Cálculo precio por m² en tiempo real', 'Plantillas Post & Stories Social', 'AI Rendering & Homestaging', '5 usuarios incluidos']),
    features_pro: JSON.stringify(['Cálculo precio por m² en tiempo real', 'Plantillas Post & Stories Social', 'AI Rendering & Homestaging', 'Editor de Video para redes', 'Soporte prioritario', '5 usuarios incluidos']),
    users_lite: '1 usuario',
    users_starter: '1 usuario',
    users_agency: '5 usuarios incluidos',
    users_pro: '5 usuarios incluidos',
    securePayment: 'Pago seguro con Stripe',
    cancelAnytime: 'Cancela cuando quieras',
    acceptTerms: 'Acepto los',
    termsOfService: 'Términos de Servicio',
    andThe: 'y la',
    privacyPolicy: 'Política de Privacidad',
    marketingConsent: 'Acepto recibir emails sobre novedades y promociones',
    termsRequired: 'Debes aceptar los términos para continuar',
    checkEmail: '¡Registro completado!',
    checkEmailDesc: 'Revisa tu email para confirmar la cuenta.',
    loggedInAs: 'Sesión iniciada como',
    proceedToPayment: 'Proceder al pago',
    yourAccount: 'Tu cuenta',
    installExtension: 'Instalar extensión Chrome',
    alreadyInstalled: '¿Ya tienes la extensión? Ábrela e inicia sesión con la misma cuenta.',
    syncHint: 'Si la suscripción no aparece de inmediato, prueba a cerrar sesión y volver a iniciarla.',
    logout: 'Cerrar sesión',
    deleteAccount: 'Eliminar cuenta',
    deleteConfirm: '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.',
  },
  fr: {
    pageTitle: 'Choisissez votre plan',
    monthly: 'Mensuel',
    annual: 'Annuel',
    perMonth: '/mois',
    perYear: '/an',
    save: 'Économisez',
    subscribe: "S'abonner maintenant",
    loginTitle: 'Connectez-vous pour continuer',
    loginSubtitle: "Connectez-vous ou créez un compte en quelques secondes.",
    loginButton: 'Continuer avec Google',
    orDivider: 'ou',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Mot de passe',
    emailLoginButton: 'Se connecter avec email',
    emailSignupButton: 'Créer un compte',
    noAccount: "Pas encore de compte ?",
    hasAccount: 'Déjà un compte ?',
    loading: 'Chargement...',
    redirecting: 'Redirection vers le paiement...',
    errorDefault: 'Une erreur s\'est produite. Veuillez réessayer.',
    errorInvalidCredentials: 'Email ou mot de passe incorrect. Pas de compte ? Cliquez sur "Créer un compte".',
    alreadySubscribed: 'Vous avez déjà un abonnement actif',
    currentPlan: 'Plan actuel',
    manageSub: "Gérer l'abonnement",
    popular: 'Le plus populaire',
    footer: 'Tous droits réservés',
    features_lite: JSON.stringify(['Calcul prix au m² en temps réel']),
    features_starter: JSON.stringify(['Calcul prix au m² en temps réel']),
    features_agency: JSON.stringify(['Calcul prix au m² en temps réel', 'Templates Post & Stories Social', 'AI Rendering & Homestaging', '5 utilisateurs inclus']),
    features_pro: JSON.stringify(['Calcul prix au m² en temps réel', 'Templates Post & Stories Social', 'AI Rendering & Homestaging', 'Éditeur Vidéo pour les réseaux', 'Support prioritaire', '5 utilisateurs inclus']),
    users_lite: '1 utilisateur',
    users_starter: '1 utilisateur',
    users_agency: '5 utilisateurs inclus',
    users_pro: '5 utilisateurs inclus',
    securePayment: 'Paiement sécurisé via Stripe',
    cancelAnytime: "Annulez à tout moment",
    acceptTerms: "J'accepte les",
    termsOfService: "Conditions d'Utilisation",
    andThe: 'et la',
    privacyPolicy: 'Politique de Confidentialité',
    marketingConsent: "J'accepte de recevoir des emails sur les nouveautés et promotions",
    termsRequired: 'Vous devez accepter les conditions pour continuer',
    checkEmail: 'Inscription terminée !',
    checkEmailDesc: 'Vérifiez votre email pour confirmer le compte.',
    loggedInAs: 'Connecté en tant que',
    proceedToPayment: 'Procéder au paiement',
    yourAccount: 'Votre compte',
    installExtension: 'Installer l\'extension Chrome',
    alreadyInstalled: 'Vous avez déjà l\'extension ? Ouvrez-la et connectez-vous avec le même compte.',
    syncHint: 'Si l\'abonnement n\'apparaît pas immédiatement, essayez de vous déconnecter puis de vous reconnecter.',
    logout: 'Se déconnecter',
    deleteAccount: 'Supprimer le compte',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
  },
  ru: {
    pageTitle: 'Выберите план',
    monthly: 'Ежемесячно',
    annual: 'Ежегодно',
    perMonth: '/месяц',
    perYear: '/год',
    save: 'Экономия',
    subscribe: 'Подписаться',
    loginTitle: 'Войдите, чтобы продолжить',
    loginSubtitle: 'Войдите в аккаунт или создайте новый за несколько секунд.',
    loginButton: 'Продолжить с Google',
    orDivider: 'или',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Пароль',
    emailLoginButton: 'Войти с email',
    emailSignupButton: 'Создать аккаунт',
    noAccount: 'Нет аккаунта?',
    hasAccount: 'Уже есть аккаунт?',
    loading: 'Загрузка...',
    redirecting: 'Перенаправление на оплату...',
    errorDefault: 'Произошла ошибка. Попробуйте ещё раз.',
    errorInvalidCredentials: 'Неверный email или пароль. Нет аккаунта? Нажмите "Создать аккаунт".',
    alreadySubscribed: 'У вас уже есть активная подписка',
    currentPlan: 'Текущий план',
    manageSub: 'Управление подпиской',
    popular: 'Самый популярный',
    footer: 'Все права защищены',
    features_lite: JSON.stringify(['Расчёт цены за м² в реальном времени']),
    features_starter: JSON.stringify(['Расчёт цены за м² в реальном времени']),
    features_agency: JSON.stringify(['Расчёт цены за м² в реальном времени', 'Шаблоны постов и сторис', 'AI Рендеринг и Хоумстейджинг', '5 пользователей включено']),
    features_pro: JSON.stringify(['Расчёт цены за м² в реальном времени', 'Шаблоны постов и сторис', 'AI Рендеринг и Хоумстейджинг', 'Видеоредактор для соцсетей', 'Приоритетная поддержка', '5 пользователей включено']),
    users_lite: '1 пользователь',
    users_starter: '1 пользователь',
    users_agency: '5 пользователей включено',
    users_pro: '5 пользователей включено',
    securePayment: 'Безопасная оплата через Stripe',
    cancelAnytime: 'Отмена в любой момент',
    acceptTerms: 'Я принимаю',
    termsOfService: 'Условия использования',
    andThe: 'и',
    privacyPolicy: 'Политику конфиденциальности',
    marketingConsent: 'Я согласен получать письма о новостях и акциях',
    termsRequired: 'Необходимо принять условия для продолжения',
    checkEmail: 'Регистрация завершена!',
    checkEmailDesc: 'Проверьте email для подтверждения аккаунта.',
    loggedInAs: 'Вы вошли как',
    proceedToPayment: 'Перейти к оплате',
    yourAccount: 'Ваш аккаунт',
    installExtension: 'Установить расширение Chrome',
    alreadyInstalled: 'Уже есть расширение? Откройте его и войдите с тем же аккаунтом.',
    syncHint: 'Если подписка не отображается сразу, попробуйте выйти и войти снова.',
    logout: 'Выйти',
    deleteAccount: 'Удалить аккаунт',
    deleteConfirm: 'Вы уверены, что хотите удалить аккаунт? Это действие необратимо.',
  },
  uk: {
    pageTitle: 'Оберіть план',
    monthly: 'Щомісячно',
    annual: 'Щорічно',
    perMonth: '/місяць',
    perYear: '/рік',
    save: 'Економія',
    subscribe: 'Підписатися',
    loginTitle: 'Увійдіть, щоб продовжити',
    loginSubtitle: 'Увійдіть в акаунт або створіть новий за кілька секунд.',
    loginButton: 'Продовжити з Google',
    orDivider: 'або',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Пароль',
    emailLoginButton: 'Увійти з email',
    emailSignupButton: 'Створити акаунт',
    noAccount: 'Немає акаунту?',
    hasAccount: 'Вже є акаунт?',
    loading: 'Завантаження...',
    redirecting: 'Перенаправлення на оплату...',
    errorDefault: 'Сталася помилка. Спробуйте ще раз.',
    errorInvalidCredentials: 'Невірний email або пароль. Немає акаунту? Натисніть "Створити акаунт".',
    alreadySubscribed: 'У вас вже є активна підписка',
    currentPlan: 'Поточний план',
    manageSub: 'Керування підпискою',
    popular: 'Найпопулярніший',
    footer: 'Всі права захищені',
    features_lite: JSON.stringify(['Розрахунок ціни за м² в реальному часі']),
    features_starter: JSON.stringify(['Розрахунок ціни за м² в реальному часі']),
    features_agency: JSON.stringify(['Розрахунок ціни за м² в реальному часі', 'Шаблони постів та сторіс', 'AI Рендеринг та Хоумстейджинг', '5 користувачів включено']),
    features_pro: JSON.stringify(['Розрахунок ціни за м² в реальному часі', 'Шаблони постів та сторіс', 'AI Рендеринг та Хоумстейджинг', 'Відеоредактор для соцмереж', 'Пріоритетна підтримка', '5 користувачів включено']),
    users_lite: '1 користувач',
    users_starter: '1 користувач',
    users_agency: '5 користувачів включено',
    users_pro: '5 користувачів включено',
    securePayment: 'Безпечна оплата через Stripe',
    cancelAnytime: 'Скасування в будь-який момент',
    acceptTerms: 'Я приймаю',
    termsOfService: 'Умови використання',
    andThe: 'та',
    privacyPolicy: 'Політику конфіденційності',
    marketingConsent: 'Я погоджуюсь отримувати листи про новини та акції',
    termsRequired: 'Необхідно прийняти умови для продовження',
    checkEmail: 'Реєстрацію завершено!',
    checkEmailDesc: 'Перевірте email для підтвердження акаунта.',
    loggedInAs: 'Ви увійшли як',
    proceedToPayment: 'Перейти до оплати',
    yourAccount: 'Ваш акаунт',
    installExtension: 'Встановити розширення Chrome',
    alreadyInstalled: 'Вже маєте розширення? Відкрийте його та увійдіть з тим самим акаунтом.',
    syncHint: 'Якщо підписка не з\'являється одразу, спробуйте вийти та увійти знову.',
    logout: 'Вийти',
    deleteAccount: 'Видалити акаунт',
    deleteConfirm: 'Ви впевнені, що хочете видалити акаунт? Цю дію неможливо скасувати.',
  },
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

export default function CheckoutAgencyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <CheckoutAgencyContent />
    </Suspense>
  );
}

function CheckoutAgencyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as Locale) || 'it';
  const t = translations[locale] || translations.it;

  // Dopo l'accesso si torna dove si era (es. /it/dashboard#/piano?buy=pro_yearly). Solo pagine della piattaforma.
  const nextParam = searchParams.get('next') ?? '';
  // ?plan= dei vecchi piani GetNearMe: niente prezzi vecchi, dopo l'accesso si va ai piani di Agente Immo
  const oldPlan = !!searchParams.get('plan');
  const dest = /^\/(it|en)\/dashboard(?![^#?/])/.test(nextParam) ? nextParam : `/${locale}/dashboard${oldPlan ? '#/piano' : ''}`;
  // ?buy= (piano scelto sulla landing): dopo l'accesso dritti a Stripe; se non riesce, pagina dei piani
  const buyParam = searchParams.get('buy');
  const buy = isBuy(buyParam) ? buyParam : null;
  const go = async () => {
    if (buy) { setIsRedirecting(true); if (await startCheckout(buy, { replace: true, back: locale === 'en' ? 'en' : 'it' })) return; }
    window.location.replace(buy ? `/${locale}/dashboard#/piano` : dest);
  };
  const rawPlanParam = null as string | null;
  const hasPlan = false;
  const selectedPlanId = PLAN_ID_MAP[rawPlanParam || 'agency_monthly'] || 'agency_monthly';
  const intervalParam = searchParams.get('interval');

  const [interval, setInterval] = useState<'monthly' | 'annual'>(
    intervalParam === 'annual' || selectedPlanId.endsWith('_annual') ? 'annual' : 'monthly'
  );
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [existingSubscription, setExistingSubscription] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  // Nuovo utente via Google senza consenso pregresso: mostra i checkbox una volta.
  const [needsConsent, setNeedsConsent] = useState(false);
  const consentRef = useRef<HTMLDivElement>(null);

  const plan = PLANS[selectedPlanId];

  // Agenzia seat-based (slider 2-10 dalla pricing): checkout dinamico con quantity,
  // via edge function (i payment link fissi non supportano la quantity).
  const seatsRaw = Number(searchParams.get('seats'));
  const seats = Number.isFinite(seatsRaw) && seatsRaw >= 2 && seatsRaw <= 10 ? Math.round(seatsRaw) : null;
  const isSeatCheckout = !!seats && (selectedPlanId === 'agency_monthly' || selectedPlanId === 'agency_annual');

  async function redirectToPayment(userId: string, userEmail: string) {
    if (isSeatCheckout) {
      setIsRedirecting(true);
      try {
        // Fetch diretto con token da getSession (auto-refresh incluso).
        // Niente supabase.functions.invoke (deadlock storico, vedi aiVideo.ts) e
        // niente token raw da localStorage (se scaduto il refresh manuale fallisce).
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('no session');
        const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageId: selectedPlanId === 'agency_annual' ? 'agency-seat-annual' : 'agency-seat-monthly',
            seats,
            successUrl: 'https://agenteimmo.me?checkout=success',
            cancelUrl: window.location.href.startsWith('https://agenteimmo.me') || window.location.href.startsWith('https://agenteimmo.me')
              ? window.location.href
              : 'https://agenteimmo.me?checkout=cancelled',
          }),
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok || !data?.url) throw new Error(data?.error || `HTTP ${resp.status}`);
        window.location.href = data.url;
      } catch (e) {
        console.error('seat checkout error:', e);
        setIsRedirecting(false);
        setError('Errore nella creazione del pagamento. Riprova.');
      }
      return;
    }

    const paymentLink = interval === 'annual' && plan.payment_link_annual
      ? plan.payment_link_annual
      : plan.payment_link_monthly;
    if (!paymentLink) { setError('Piano non ancora disponibile per l\'acquisto.'); return; }
    setIsRedirecting(true);

    const url = new URL(paymentLink);
    url.searchParams.set('client_reference_id', userId);
    url.searchParams.set('prefilled_email', userEmail);
    window.location.href = url.toString();
  }

  async function saveConsent(userId: string, userEmail: string, terms: boolean, marketing: boolean) {
    try {
      if (terms) {
        await supabase.auth.updateUser({
          data: {
            terms_accepted_at: new Date().toISOString(),
            marketing_consent: marketing,
          },
        });
      }

      if (marketing) {
        await supabase.from('newsletter').upsert({
          email: userEmail,
          user_id: userId,
          marketing_consent: true,
          source: 'website_checkout',
          language: locale,
        }, { onConflict: 'email' });
      }
    } catch {
      // Non-blocking: consent save failure shouldn't block checkout
    }
  }

  async function proceedAfterLogin(userId: string, userEmail: string, terms: boolean, marketing: boolean) {
    setCheckingSubscription(true);

    await saveConsent(userId, userEmail, terms, marketing);

    try {
      const { data } = await supabase
        .from('user_credits')
        .select('subscription_type')
        .eq('user_id', userId)
        .single();

      if (data?.subscription_type && data.subscription_type !== 'free' && data.subscription_type !== 'ambassador') {
        void go();
        return;
      }
    } catch {
      // No record yet - trigger will create it
    }

    setCheckingSubscription(false);

    if (!hasPlan) {
      // No plan selected - redirect to dashboard
      void go();
      return;
    }

    redirectToPayment(userId, userEmail);
  }

  useEffect(() => {
    async function checkSession() {
      const isOAuthCallback = window.location.hash.includes('access_token');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Validate token server-side (catches deleted accounts)
      const { data: { user: validUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !validUser) {
        await supabase.auth.signOut();
        return;
      }

      const userId = validUser.id;
      const userEmail = validUser.email || '';

      if (isOAuthCallback) {
        // Ritorno da Google OAuth. Il consenso non si chiede PRIMA del login
        // (estenuante per chi ha gia' un account): si controlla DOPO.
        setUser({ id: userId, email: userEmail });
        const meta = validUser.user_metadata;
        if (meta?.terms_accepted_at) {
          // Utente di ritorno: consenso gia' dato in passato, niente checkbox.
          setTermsAccepted(true);
          if (meta.marketing_consent) setMarketingAccepted(true);
          await proceedAfterLogin(userId, userEmail, true, !!meta.marketing_consent);
        } else {
          // Nuovo utente via Google: deve accettare i termini una volta sola.
          setNeedsConsent(true);
        }
      } else {
        // Existing session (not OAuth callback). Se non c'e' un piano selezionato
        // siamo in modalita' LOGIN (non checkout) → vai dritto alla dashboard.
        if (!hasPlan) { void go(); return; }
        setUser({ id: userId, email: userEmail });

        // Check if user already accepted terms (from previous login/consent)
        const meta = validUser.user_metadata;
        if (meta?.terms_accepted_at) {
          setTermsAccepted(true);
          if (meta.marketing_consent) setMarketingAccepted(true);
          // Auto-proceed since consent was already given
          await proceedAfterLogin(userId, userEmail, true, !!meta.marketing_consent);
          return;
        }

        // Check if already subscribed
        try {
          const { data } = await supabase
            .from('user_credits')
            .select('subscription_type')
            .eq('user_id', userId)
            .single();

          if (data?.subscription_type && data.subscription_type !== 'free' && data.subscription_type !== 'ambassador') {
            void go();
            return;
          }
        } catch {
          // No record
        }
      }
    }

    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleLogin() {
    // Niente gate sui checkbox prima dell'OAuth: il consenso si gestisce dopo il
    // login (solo per i nuovi account, via needsConsent). Chi ha gia' accettato
    // non rivede piu' i checkbox.
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDefault as string);
      setIsLoading(false);
    }
  }

  // Conferma consenso per nuovo utente Google (post-login, una volta sola).
  function handleConsentContinue() {
    if (!termsAccepted) {
      setError(t.termsRequired as string);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!user) return;
    setError(null);
    setNeedsConsent(false);
    proceedAfterLogin(user.id, user.email, true, marketingAccepted);
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (isSignup && !termsAccepted) {
      setError(t.termsRequired as string);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsEmailLoading(true);
    setError(null);

    try {
      if (isSignup) {
        if (isDisposableEmail(email)) {
          setError(locale === 'it'
            ? 'Usa un indirizzo email reale: le email temporanee non sono ammesse.'
            : 'Please use a real email address: temporary emails are not allowed.');
          setIsEmailLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.href,
            data: {
              marketing_consent: marketingAccepted,
              terms_accepted_at: new Date().toISOString(),
              signup_source: 'site',
            },
          },
        });
        if (error) throw error;

        const needsConfirmation = !data.session;

        if (needsConfirmation) {
          // Email confirmation required - show "check your email" message
          setEmailSent(true);
          setIsEmailLoading(false);
          return;
        }

        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          await proceedAfterLogin(data.user.id, data.user.email || '', termsAccepted, marketingAccepted);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(t.errorInvalidCredentials as string);
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          await proceedAfterLogin(data.user.id, data.user.email || '', termsAccepted, marketingAccepted);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorDefault as string);
    }
    setIsEmailLoading(false);
  }

  const currentPrice = isSeatCheckout && seats
    ? (selectedPlanId === 'agency_annual' ? 720 * seats : 80 * seats)
    : plan ? (interval === 'annual' ? plan.price_annual : plan.price_monthly) : 0;
  const periodLabel = interval === 'annual' || selectedPlanId === 'agency_annual' ? t.perYear : t.perMonth;

  const en = locale === 'en';
  const box = (on: boolean) => `mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ease-smooth transition-colors ${on ? 'bg-ink ring-ink text-white' : 'bg-white ring-black/15'}`;
  const tick = <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3" /></svg>;
  const input = 'h-12 w-full rounded-2xl bg-canvas px-4 text-[15px] text-ink outline-none ring-1 ring-black/5 placeholder:text-muted/70 focus:bg-white focus:ring-2 focus:ring-brand disabled:opacity-50';
  const primary = 'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-black disabled:opacity-40';
  const errBox = (m: string) => <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{m}</div>;

  function renderConsentBoxes() {
    return (
      <div ref={consentRef} className="mt-6 space-y-3 border-t border-line pt-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setError(null); }} className="peer sr-only" />
          <span className={box(termsAccepted)}>{termsAccepted && tick}</span>
          <span className="text-sm leading-snug text-muted">
            {t.acceptTerms}{' '}
            <a href={`/${locale}/termini`} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">{t.termsOfService}</a>
            {' '}{t.andThe}{' '}
            <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">{t.privacyPolicy}</a>
            {' *'}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={marketingAccepted} onChange={(e) => setMarketingAccepted(e.target.checked)} className="peer sr-only" />
          <span className={box(marketingAccepted)}>{marketingAccepted && tick}</span>
          <span className="text-sm leading-snug text-muted">{t.marketingConsent}</span>
        </label>
        {!termsAccepted && error === (t.termsRequired as string) && errBox(t.termsRequired as string)}
      </div>
    );
  }

  const cont = hasPlan ? t.proceedToPayment : (en ? 'Continue' : 'Continua');
  return (
    <div className={`${platformFontVars} dots-bg flex min-h-screen flex-col font-body text-ink antialiased`}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-5">
        <a href={`/${locale === 'en' ? 'en' : 'it'}`} className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/immo/logo-mark.png" alt="" className="h-8 w-8" />
          <span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span>
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="blur-in w-full max-w-md rounded-[32px] bg-white p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,.25)] ring-1 ring-black/5 sm:p-8">

          {hasPlan && (
            <div className="mb-6 rounded-[20px] bg-canvas p-5 text-center">
              <div className="text-sm font-semibold text-muted">{plan.name}</div>
              <div className="mt-1"><span className="font-display text-4xl font-extrabold tracking-tight">€{currentPrice}</span><span className="text-muted">{periodLabel}</span></div>
              {plan.payment_link_annual && (
                <div className="mt-4 inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">
                  {(['monthly', 'annual'] as const).map(iv => (
                    <button key={iv} onClick={() => setInterval(iv)} className={`h-8 rounded-full px-4 text-xs font-semibold ease-smooth transition-colors ${interval === iv ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{iv === 'monthly' ? t.monthly : t.annual}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {emailSent ? (
            <div className="py-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand"><CheckCircle className="h-6 w-6" /></span>
              <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{t.checkEmail}</h1>
              <p className="mt-2 text-muted">{t.checkEmailDesc}</p>
              <div className="mt-4 rounded-2xl bg-canvas px-4 py-3 font-medium">{email}</div>
              <a
                href={
                  email.endsWith('@gmail.com') ? 'https://mail.google.com' :
                  email.endsWith('@outlook.com') || email.endsWith('@hotmail.com') || email.endsWith('@live.com') ? 'https://outlook.live.com' :
                  email.endsWith('@yahoo.com') || email.endsWith('@yahoo.it') ? 'https://mail.yahoo.com' :
                  email.endsWith('@icloud.com') ? 'https://www.icloud.com/mail' :
                  `mailto:${email}`
                }
                target="_blank" rel="noopener noreferrer" className={`${primary} mt-5`}
              >{en ? 'Open your email' : 'Apri la tua email'}</a>
              <button onClick={() => { setEmailSent(false); setIsSignup(false); setPassword(''); setError(null); }} className="mt-3 h-11 w-full rounded-full text-sm font-semibold text-ink ring-1 ring-black/10 hover:ring-ink">
                {en ? 'Go to sign in' : 'Vai all\'accesso'}
              </button>
              <p className="mt-4 text-sm text-muted">{en ? 'Check your spam folder too.' : 'Controlla anche la cartella spam.'}</p>
            </div>
          ) : user && existingSubscription ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle className="h-6 w-6" /></span>
              <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{t.alreadySubscribed}</h1>
              <p className="mt-2 text-muted">{t.currentPlan}: <strong className="text-ink">{TIER_LABELS[existingSubscription]?.[locale] || existingSubscription}</strong></p>
              <a href="https://billing.stripe.com/p/login/9B68wP7WH3blfTG15eak000" target="_blank" rel="noopener noreferrer" className={`${primary} mt-6`}>{t.manageSub}</a>
            </div>
          ) : isRedirecting || checkingSubscription ? (
            <div className="py-6 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand" />
              <p className="mt-3 text-sm text-muted">{hasPlan ? t.redirecting : t.loading}</p>
            </div>
          ) : user && needsConsent ? (
            <>
              <h1 className="text-center font-display text-2xl font-extrabold tracking-tight">{en ? 'One last step' : 'Ultimo passaggio'}</h1>
              <p className="mt-2 text-center text-sm text-muted">{t.loggedInAs} <strong className="text-ink">{user.email}</strong></p>
              {renderConsentBoxes()}
              <button onClick={handleConsentContinue} disabled={checkingSubscription} className={`${primary} mt-6`}>{cont}</button>
              {error && error !== (t.termsRequired as string) && errBox(error)}
            </>
          ) : user && !existingSubscription ? (
            <>
              <p className="text-center text-sm text-muted">{t.loggedInAs} <strong className="text-ink">{user.email}</strong></p>
              <button onClick={() => { setError(null); proceedAfterLogin(user.id, user.email, true, false); }} disabled={checkingSubscription} className={`${primary} mt-5`}>{cont}</button>
              {error && errBox(error)}
            </>
          ) : !user ? (
            <>
              <h1 className="text-center font-display text-2xl font-extrabold tracking-tight">{isSignup ? (en ? 'Create your account' : 'Crea il tuo account') : (en ? 'Welcome back' : 'Bentornato')}</h1>
              <p className="mt-2 text-center text-sm text-muted">{isSignup ? (en ? 'Free, no credit card needed.' : 'Gratis, senza carta di credito.') : (en ? 'Sign in to Agente Immo.' : 'Accedi ad Agente Immo.')}</p>

              <button onClick={handleGoogleLogin} disabled={isLoading || isEmailLoading} className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-[15px] font-semibold text-ink ring-1 ring-black/10 ease-smooth transition-shadow hover:ring-ink disabled:opacity-50">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}<span>{t.loginButton}</span>
              </button>

              <div className="my-5 flex items-center gap-4 text-xs font-medium text-muted"><span className="h-px flex-1 bg-line" />{t.orDivider}<span className="h-px flex-1 bg-line" /></div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder as string} required autoComplete="email" disabled={isLoading || isEmailLoading} className={input} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passwordPlaceholder as string} required autoComplete={isSignup ? 'new-password' : 'current-password'} disabled={isLoading || isEmailLoading} className={input} />
                {!isSignup && <div className="text-right"><a href={`/${locale}/forgot-password`} className="text-sm font-medium text-muted hover:text-ink">{en ? 'Forgot your password?' : 'Password dimenticata?'}</a></div>}
                <button type="submit" disabled={isLoading || isEmailLoading || !email.trim() || !password} className={primary}>
                  {isEmailLoading && <Loader2 className="h-5 w-5 animate-spin" />}<span>{isSignup ? t.emailSignupButton : t.emailLoginButton}</span>
                </button>
              </form>

              {error && error !== (t.termsRequired as string) && errBox(error)}

              <p className="mt-5 text-center text-sm text-muted">
                {isSignup ? (t.hasAccount as string) : (t.noAccount as string)}{' '}
                <button onClick={() => { setIsSignup(!isSignup); setError(null); }} className="font-semibold text-ink underline underline-offset-4">
                  {isSignup ? (en ? 'Sign in' : 'Accedi') : (en ? 'Create account' : 'Crea account')}
                </button>
              </p>

              {isSignup && renderConsentBoxes()}

              {hasPlan && <div className="mt-6 flex items-center justify-center gap-1 text-xs text-muted"><ShieldIcon /> {t.securePayment}</div>}
            </>
          ) : null}
        </div>
      </main>

      <footer className="pb-8 text-center text-xs text-muted">© {new Date().getFullYear()} Agente Immo · <a href={`/${locale}/privacy`} className="hover:text-ink">Privacy</a> · <a href={`/${locale}/termini`} className="hover:text-ink">{en ? 'Terms' : 'Termini'}</a></footer>
    </div>
  );
}
