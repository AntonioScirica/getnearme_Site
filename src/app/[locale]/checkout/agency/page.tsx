'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Loader2 } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Plan ID mapping: homepage IDs → internal subscription IDs
const PLAN_ID_MAP: Record<string, string> = {
  starter: 'agency_starter',
  agency: 'agency',
  pro: 'agency_premium',
  user_lite: 'user_lite',
  agency_starter: 'agency_starter',
  agency_premium: 'agency_premium',
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
  user_lite: {
    name: 'Lite',
    price_monthly: 4.99,
    price_annual: 49.99,
    original_price: 9.99,
    payment_link_monthly: 'https://buy.stripe.com/8x27sLgtdh2b9vi29iak00n',
    payment_link_annual: 'https://buy.stripe.com/28EeVdb8TeU37na3dmak00o',
    features_key: 'lite',
    popular: false,
  },
  agency_starter: {
    name: 'Starter',
    price_monthly: 24,
    price_annual: 245,
    original_price: 60,
    payment_link_monthly: 'https://buy.stripe.com/cNiaEX2Cn7rBfTG3dmak00i',
    payment_link_annual: 'https://buy.stripe.com/6oUeVd0ufcLV4aY8xGak00l',
    features_key: 'starter',
    popular: false,
  },
  agency: {
    name: 'Agency',
    price_monthly: 99,
    price_annual: 1010,
    original_price: 150,
    payment_link_monthly: 'https://buy.stripe.com/8x25kD3Gr3blbDq01aak00h',
    payment_link_annual: 'https://buy.stripe.com/fZubJ11yj7rBazm4hqak00k',
    features_key: 'agency',
    popular: true,
  },
  agency_premium: {
    name: 'Pro',
    price_monthly: 149,
    price_annual: 1520,
    original_price: 199,
    payment_link_monthly: 'https://buy.stripe.com/dRm28rel5eU38re5luak00j',
    payment_link_annual: 'https://buy.stripe.com/aFa28rfp99zJ22QcNWak00m',
    features_key: 'pro',
    popular: false,
  },
};

const PLAN_DISPLAY_ORDER = ['user_lite', 'agency_starter', 'agency', 'agency_premium'];

const TIER_LABELS: Record<string, Record<string, string>> = {
  user_lite: { it: 'Lite', en: 'Lite', es: 'Lite', fr: 'Lite', ru: 'Lite', uk: 'Lite' },
  agency_starter: { it: 'Starter', en: 'Starter', es: 'Starter', fr: 'Starter', ru: 'Starter', uk: 'Starter' },
  agency: { it: 'Agency', en: 'Agency', es: 'Agency', fr: 'Agency', ru: 'Agency', uk: 'Agency' },
  agency_premium: { it: 'Pro', en: 'Pro', es: 'Pro', fr: 'Pro', ru: 'Pro', uk: 'Pro' },
  agency_pro: { it: 'Pro', en: 'Pro', es: 'Pro', fr: 'Pro', ru: 'Pro', uk: 'Pro' },
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
    features_lite: JSON.stringify(['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF (brand GetNearMe)']),
    features_starter: JSON.stringify(['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF illimitati (brand GetNearMe)']),
    features_agency: JSON.stringify(['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF illimitati (brand GetNearMe)', 'Template Post & Stories Social', 'AI Rendering & Homestaging', '5 utenti inclusi']),
    features_pro: JSON.stringify(['Analisi immobiliari illimitate', 'Calcolo prezzo al m² in tempo reale', 'Export PDF con il TUO logo', 'Template Post & Stories Social', 'AI Rendering & Homestaging', 'Editor Video per i social', 'Supporto prioritario', '5 utenti inclusi']),
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
    checkEmail: 'Registrazione completata! Controlla la tua email per confermare l\'account.',
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
    features_lite: JSON.stringify(['Unlimited property analysis', 'Real-time price per sqm', 'PDF Export (GetNearMe brand)']),
    features_starter: JSON.stringify(['Unlimited property analysis', 'Real-time price per sqm', 'Unlimited PDF exports (GetNearMe brand)']),
    features_agency: JSON.stringify(['Unlimited property analysis', 'Real-time price per sqm', 'Unlimited PDF exports (GetNearMe brand)', 'Social Post & Stories Templates', 'AI Rendering & Homestaging', '5 users included']),
    features_pro: JSON.stringify(['Unlimited property analysis', 'Real-time price per sqm', 'PDF Export with YOUR logo', 'Social Post & Stories Templates', 'AI Rendering & Homestaging', 'Social Video Editor', 'Priority support', '5 users included']),
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
    checkEmail: 'Registration complete! Check your email to confirm your account.',
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
    features_lite: JSON.stringify(['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Export PDF (marca GetNearMe)']),
    features_starter: JSON.stringify(['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Exports PDF ilimitados (marca GetNearMe)']),
    features_agency: JSON.stringify(['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Exports PDF ilimitados (marca GetNearMe)', 'Plantillas Post & Stories Social', 'AI Rendering & Homestaging', '5 usuarios incluidos']),
    features_pro: JSON.stringify(['Análisis inmobiliarios ilimitados', 'Cálculo precio por m² en tiempo real', 'Export PDF con TU logo', 'Plantillas Post & Stories Social', 'AI Rendering & Homestaging', 'Editor de Video para redes', 'Soporte prioritario', '5 usuarios incluidos']),
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
    checkEmail: '¡Registro completado! Revisa tu email para confirmar la cuenta.',
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
    features_lite: JSON.stringify(['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Export PDF (marque GetNearMe)']),
    features_starter: JSON.stringify(['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Exports PDF illimités (marque GetNearMe)']),
    features_agency: JSON.stringify(['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Exports PDF illimités (marque GetNearMe)', 'Templates Post & Stories Social', 'AI Rendering & Homestaging', '5 utilisateurs inclus']),
    features_pro: JSON.stringify(['Analyses immobilières illimitées', 'Calcul prix au m² en temps réel', 'Export PDF avec VOTRE logo', 'Templates Post & Stories Social', 'AI Rendering & Homestaging', 'Éditeur Vidéo pour les réseaux', 'Support prioritaire', '5 utilisateurs inclus']),
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
    checkEmail: 'Inscription terminée ! Vérifiez votre email pour confirmer le compte.',
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
    features_lite: JSON.stringify(['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Экспорт PDF (бренд GetNearMe)']),
    features_starter: JSON.stringify(['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Безлимитные PDF экспорты (бренд GetNearMe)']),
    features_agency: JSON.stringify(['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Безлимитные PDF экспорты (бренд GetNearMe)', 'Шаблоны постов и сторис', 'AI Рендеринг и Хоумстейджинг', '5 пользователей включено']),
    features_pro: JSON.stringify(['Безлимитный анализ недвижимости', 'Расчёт цены за м² в реальном времени', 'Экспорт PDF с ВАШИМ логотипом', 'Шаблоны постов и сторис', 'AI Рендеринг и Хоумстейджинг', 'Видеоредактор для соцсетей', 'Приоритетная поддержка', '5 пользователей включено']),
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
    checkEmail: 'Регистрация завершена! Проверьте email для подтверждения аккаунта.',
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
    features_lite: JSON.stringify(['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Експорт PDF (бренд GetNearMe)']),
    features_starter: JSON.stringify(['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Безлімітні PDF експорти (бренд GetNearMe)']),
    features_agency: JSON.stringify(['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Безлімітні PDF експорти (бренд GetNearMe)', 'Шаблони постів та сторіс', 'AI Рендеринг та Хоумстейджинг', '5 користувачів включено']),
    features_pro: JSON.stringify(['Безлімітний аналіз нерухомості', 'Розрахунок ціни за м² в реальному часі', 'Експорт PDF з ВАШИМ логотипом', 'Шаблони постів та сторіс', 'AI Рендеринг та Хоумстейджинг', 'Відеоредактор для соцмереж', 'Пріоритетна підтримка', '5 користувачів включено']),
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
    checkEmail: 'Реєстрацію завершено! Перевірте email для підтвердження акаунта.',
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

  const rawPlanParam = searchParams.get('plan');
  const hasPlan = !!rawPlanParam;
  const selectedPlanId = PLAN_ID_MAP[rawPlanParam || 'agency'] || 'agency';
  const intervalParam = searchParams.get('interval');

  const [interval, setInterval] = useState<'monthly' | 'annual'>(
    intervalParam === 'annual' ? 'annual' : 'monthly'
  );
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [existingSubscription, setExistingSubscription] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const consentRef = useRef<HTMLDivElement>(null);

  const plan = PLANS[selectedPlanId];

  function redirectToPayment(userId: string, userEmail: string) {
    setIsRedirecting(true);
    const paymentLink = interval === 'annual' && plan.payment_link_annual
      ? plan.payment_link_annual
      : plan.payment_link_monthly;

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

      if (data?.subscription_type && data.subscription_type !== 'free') {
        window.location.href = `/${locale}/dashboard`;
        return;
      }
    } catch {
      // No record yet - trigger will create it
    }

    setCheckingSubscription(false);

    if (!hasPlan) {
      // No plan selected - redirect to dashboard
      window.location.href = `/${locale}/dashboard`;
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
        // Returning from Google OAuth - restore consent from sessionStorage
        const saved = sessionStorage.getItem('gnm_checkout_consent');
        let terms = false;
        let marketing = false;
        if (saved) {
          const parsed = JSON.parse(saved);
          terms = parsed.terms;
          marketing = parsed.marketing;
          sessionStorage.removeItem('gnm_checkout_consent');
        }
        setUser({ id: userId, email: userEmail });
        setTermsAccepted(terms);
        setMarketingAccepted(marketing);
        await proceedAfterLogin(userId, userEmail, terms, marketing);
      } else {
        // Existing session (not OAuth callback)
        // If no plan selected, just go to dashboard
        if (!hasPlan) {
          window.location.href = `/${locale}/dashboard`;
          return;
        }

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

          if (data?.subscription_type && data.subscription_type !== 'free') {
            window.location.href = `/${locale}/dashboard`;
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
    if (!termsAccepted) {
      setError(t.termsRequired as string);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsLoading(true);
    setError(null);

    // Save consent before OAuth redirect (state is lost on page reload)
    sessionStorage.setItem('gnm_checkout_consent', JSON.stringify({
      terms: termsAccepted,
      marketing: marketingAccepted,
    }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
    } catch (err) {
      sessionStorage.removeItem('gnm_checkout_consent');
      setError(err instanceof Error ? err.message : t.errorDefault as string);
      setIsLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      setError(t.termsRequired as string);
      consentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsEmailLoading(true);
    setError(null);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.href,
            data: {
              marketing_consent: marketingAccepted,
              terms_accepted_at: new Date().toISOString(),
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

  const currentPrice = interval === 'annual' ? plan.price_annual : plan.price_monthly;
  const periodLabel = interval === 'annual' ? t.perYear : t.perMonth;

  return (
    <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full">
          <div className="bg-white neo-border rounded-2xl p-8" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>

            {/* Logo + Plan summary */}
            <div className="text-center mb-6">
              <span className="text-2xl font-bold text-blue-500">GetNearMe</span>
            </div>

            {hasPlan && (
              <div className="bg-[#fafaf8] neo-border rounded-xl p-6 mb-6" style={{ boxShadow: '4px 4px 0px #1a1a2e' }}>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1a1a2e]">{plan.name}</div>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-blue-500">€{currentPrice}</span>
                    <span className="text-slate-500">{periodLabel}</span>
                  </div>
                  {plan.original_price > plan.price_monthly && (
                    <p className="text-sm text-slate-400 line-through mt-1">
                      €{plan.original_price}{t.perMonth}
                    </p>
                  )}
                </div>

                {/* Billing interval toggle */}
                {plan.payment_link_annual && (
                  <div className="flex justify-center mt-4">
                    <div className="inline-flex bg-white neo-border rounded-lg p-0.5">
                      <button
                        onClick={() => setInterval('monthly')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          interval === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {t.monthly}
                      </button>
                      <button
                        onClick={() => setInterval('annual')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          interval === 'annual'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {t.annual}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email confirmation sent */}
            {emailSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 neo-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] mb-2">{t.checkEmail}</p>
                <p className="text-sm text-slate-500">{email}</p>
              </div>
            ) : /* Already subscribed */
            user && existingSubscription ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 neo-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">{t.alreadySubscribed}</h2>
                <p className="text-slate-500 mb-6">
                  {t.currentPlan}: <strong>{TIER_LABELS[existingSubscription]?.[locale] || existingSubscription}</strong>
                </p>
                <a
                  href="https://billing.stripe.com/p/login/9B68wP7WH3blfTG15eak000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-[#1a1a2e] text-white rounded-xl neo-border neo-btn font-bold hover:bg-[#2a2a3e] transition-all"
                  style={{ boxShadow: '4px 4px 0px #3B83F6' }}
                >
                  {t.manageSub}
                </a>
              </div>
            ) : isRedirecting || checkingSubscription ? (
              /* Redirecting to Stripe or checking subscription */
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">{t.redirecting}</p>
              </div>
            ) : user && !existingSubscription ? (
              /* Logged in, no subscription - proceed directly */
              <>
                <div className="text-center mb-6">
                  <p className="text-slate-500 text-sm">{t.loggedInAs} <strong>{user.email}</strong></p>
                </div>

                <button
                  onClick={() => {
                    setError(null);
                    proceedAfterLogin(user.id, user.email, true, false);
                  }}
                  disabled={checkingSubscription}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 rounded-xl neo-border neo-btn text-white font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
                >
                  {checkingSubscription ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.loading}</span>
                    </>
                  ) : (
                    <span>{t.proceedToPayment}</span>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 neo-border rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><ShieldIcon /> {t.securePayment}</span>
                </div>
              </>
            ) : !user ? (
              /* Not logged in - show auth UI */
              <>
                <h2 className="text-xl font-bold text-center mb-6">{t.loginTitle}</h2>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isEmailLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white neo-border rounded-xl text-[#1a1a2e] font-bold hover:bg-slate-50 transition-all neo-btn disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
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

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-[#1a1a2e]/20" />
                  <span className="text-slate-400 text-sm font-bold">{t.orDivider}</span>
                  <div className="flex-1 h-px bg-[#1a1a2e]/20" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder as string}
                    required
                    disabled={isLoading || isEmailLoading}
                    className="w-full px-4 py-3 neo-border rounded-xl text-[#1a1a2e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder as string}
                    required
                    disabled={isLoading || isEmailLoading}
                    className="w-full px-4 py-3 neo-border rounded-xl text-[#1a1a2e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || isEmailLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500 rounded-xl neo-border neo-btn text-white font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
                  >
                    {isEmailLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t.loading}</span>
                      </>
                    ) : (
                      <span>{isSignup ? t.emailSignupButton : t.emailLoginButton}</span>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-4">
                  {isSignup ? (t.hasAccount as string) : (t.noAccount as string)}{' '}
                  <button
                    onClick={() => { setIsSignup(!isSignup); setError(null); }}
                    className="text-blue-500 font-bold hover:underline"
                  >
                    {isSignup ? (t.emailLoginButton as string) : (t.emailSignupButton as string)}
                  </button>
                </p>

                {/* Consent checkboxes */}
                <div ref={consentRef} className="mt-6 pt-6 border-t-2 border-[#1a1a2e]/20 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative shrink-0">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setError(null); }}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-[#1a1a2e] rounded bg-white peer-checked:bg-blue-500 peer-checked:border-[#1a1a2e] transition-all flex items-center justify-center" style={{ boxShadow: '2px 2px 0px #1a1a2e' }}>
                          {termsAccepted && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 leading-tight">
                        {t.acceptTerms}{' '}
                        <a href={`/${locale}/termini`} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-semibold hover:underline">{t.termsOfService}</a>
                        {' '}{t.andThe}{' '}
                        <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-semibold hover:underline">{t.privacyPolicy}</a>
                        {' *'}
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative shrink-0">
                        <input
                          type="checkbox"
                          checked={marketingAccepted}
                          onChange={(e) => setMarketingAccepted(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 border-2 border-[#1a1a2e] rounded bg-white peer-checked:bg-blue-500 peer-checked:border-[#1a1a2e] transition-all flex items-center justify-center" style={{ boxShadow: '2px 2px 0px #1a1a2e' }}>
                          {marketingAccepted && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 leading-tight">
                        {t.marketingConsent}
                      </span>
                    </label>

                    {!termsAccepted && error === (t.termsRequired as string) && (
                      <p className="text-red-500 text-xs font-bold animate-pulse">{t.termsRequired}</p>
                    )}
                  </div>

                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><ShieldIcon /> {t.securePayment}</span>
                </div>
              </>
            ) : null}

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
