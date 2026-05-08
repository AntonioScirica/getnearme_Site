"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/lib/i18n";
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const t: Record<Locale, {
  title: string;
  subtitle: string;
  newPassword: string;
  confirmPassword: string;
  placeholder: string;
  confirmPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  successDesc: string;
  errorMinLength: string;
  errorMismatch: string;
  errorRequired: string;
  errorExpired: string;
  errorGeneric: string;
}> = {
  it: {
    title: "Nuova password",
    subtitle: "Inserisci la nuova password per il tuo account.",
    newPassword: "Nuova password",
    confirmPassword: "Conferma password",
    placeholder: "Minimo 8 caratteri",
    confirmPlaceholder: "Ripeti la password",
    submit: "Aggiorna password",
    submitting: "Aggiornamento...",
    success: "Password aggiornata",
    successDesc: "Puoi chiudere questa pagina e accedere dall'estensione con la nuova password.",
    errorMinLength: "La password deve avere almeno 8 caratteri.",
    errorMismatch: "Le password non corrispondono.",
    errorRequired: "Inserisci la nuova password.",
    errorExpired: "Il link è scaduto o non valido. Richiedi un nuovo reset dall'estensione.",
    errorGeneric: "Errore durante l'aggiornamento. Riprova.",
  },
  en: {
    title: "New password",
    subtitle: "Enter a new password for your account.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    placeholder: "Minimum 8 characters",
    confirmPlaceholder: "Repeat password",
    submit: "Update password",
    submitting: "Updating...",
    success: "Password updated",
    successDesc: "You can close this page and sign in from the extension with your new password.",
    errorMinLength: "Password must be at least 8 characters.",
    errorMismatch: "Passwords don't match.",
    errorRequired: "Enter your new password.",
    errorExpired: "This link has expired or is invalid. Request a new reset from the extension.",
    errorGeneric: "Error updating password. Please try again.",
  },
  es: {
    title: "Nueva contraseña",
    subtitle: "Introduce una nueva contraseña para tu cuenta.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    placeholder: "Mínimo 8 caracteres",
    confirmPlaceholder: "Repite la contraseña",
    submit: "Actualizar contraseña",
    submitting: "Actualizando...",
    success: "Contraseña actualizada",
    successDesc: "Puedes cerrar esta página e iniciar sesión desde la extensión con tu nueva contraseña.",
    errorMinLength: "La contraseña debe tener al menos 8 caracteres.",
    errorMismatch: "Las contraseñas no coinciden.",
    errorRequired: "Introduce tu nueva contraseña.",
    errorExpired: "El enlace ha caducado o no es válido. Solicita un nuevo restablecimiento desde la extensión.",
    errorGeneric: "Error al actualizar la contraseña. Inténtalo de nuevo.",
  },
  fr: {
    title: "Nouveau mot de passe",
    subtitle: "Entrez un nouveau mot de passe pour votre compte.",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    placeholder: "Minimum 8 caractères",
    confirmPlaceholder: "Répétez le mot de passe",
    submit: "Mettre à jour",
    submitting: "Mise à jour...",
    success: "Mot de passe mis à jour",
    successDesc: "Vous pouvez fermer cette page et vous connecter depuis l'extension avec votre nouveau mot de passe.",
    errorMinLength: "Le mot de passe doit comporter au moins 8 caractères.",
    errorMismatch: "Les mots de passe ne correspondent pas.",
    errorRequired: "Entrez votre nouveau mot de passe.",
    errorExpired: "Ce lien a expiré ou n'est pas valide. Demandez une nouvelle réinitialisation depuis l'extension.",
    errorGeneric: "Erreur lors de la mise à jour. Veuillez réessayer.",
  },
  ru: {
    title: "Новый пароль",
    subtitle: "Введите новый пароль для вашего аккаунта.",
    newPassword: "Новый пароль",
    confirmPassword: "Подтвердите пароль",
    placeholder: "Минимум 8 символов",
    confirmPlaceholder: "Повторите пароль",
    submit: "Обновить пароль",
    submitting: "Обновление...",
    success: "Пароль обновлён",
    successDesc: "Вы можете закрыть эту страницу и войти из расширения с новым паролем.",
    errorMinLength: "Пароль должен содержать не менее 8 символов.",
    errorMismatch: "Пароли не совпадают.",
    errorRequired: "Введите новый пароль.",
    errorExpired: "Ссылка истекла или недействительна. Запросите новый сброс из расширения.",
    errorGeneric: "Ошибка при обновлении пароля. Попробуйте ещё раз.",
  },
  uk: {
    title: "Новий пароль",
    subtitle: "Введіть новий пароль для вашого акаунту.",
    newPassword: "Новий пароль",
    confirmPassword: "Підтвердіть пароль",
    placeholder: "Мінімум 8 символів",
    confirmPlaceholder: "Повторіть пароль",
    submit: "Оновити пароль",
    submitting: "Оновлення...",
    success: "Пароль оновлено",
    successDesc: "Ви можете закрити цю сторінку та увійти з розширення з новим паролем.",
    errorMinLength: "Пароль повинен містити щонайменше 8 символів.",
    errorMismatch: "Паролі не збігаються.",
    errorRequired: "Введіть новий пароль.",
    errorExpired: "Посилання закінчилося або недійсне. Запросіть новий скид з розширення.",
    errorGeneric: "Помилка при оновленні пароля. Спробуйте ще раз.",
  },
};

export default function ResetPasswordForm({ locale }: { locale: Locale }) {
  const s = t[locale] || t.it;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    async function initSession() {
      // PKCE flow: Supabase redirects with ?code= query param
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[reset-password] code exchange result:', { data: data?.session ? 'session OK' : 'no session', error: error?.message });
        if (error) {
          setErrorDetail(error.message);
          setSessionError(true);
        } else {
          setSessionReady(true);
        }
        return;
      }

      // Implicit flow: token in URL hash
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) {
            setSessionError(true);
          } else {
            setSessionReady(true);
          }
          return;
        }
      }

      // Fallback: check existing session
      console.log('[reset-password] no code/hash, checking existing session');
      const { data } = await supabase.auth.getSession();
      console.log('[reset-password] existing session:', data.session ? 'found' : 'none');
      if (data.session) {
        setSessionReady(true);
      } else {
        setSessionError(true);
      }
    }
    initSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!password) { setError(s.errorRequired); return; }
    if (password.length < 8) { setError(s.errorMinLength); return; }
    if (password !== confirm) { setError(s.errorMismatch); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch {
      setError(s.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  if (sessionError) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h1>
        <p className="text-gray-500 text-sm">{s.errorExpired}</p>
        {errorDetail && <p className="text-red-400 text-xs mt-2 font-mono">{errorDetail}</p>}
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{s.success}</h1>
        <p className="text-gray-500 text-sm">{s.successDesc}</p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{s.title}</h1>
      <p className="text-gray-500 text-sm mb-6">{s.subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            {s.newPassword}
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={s.placeholder}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            {s.confirmPassword}
          </label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={s.confirmPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {s.submitting}
            </>
          ) : (
            s.submit
          )}
        </button>
      </form>
    </div>
  );
}
