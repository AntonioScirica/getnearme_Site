"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://ecrnpyksnfyykqwnutwa.supabase.co/functions/v1";

interface Page {
  page_id: string;
  page_name: string;
  page_picture_url: string | null;
  has_ig_business: boolean;
  ig_username: string | null;
  ig_avatar_url: string | null;
}

interface Props {
  sessionId: string;
  locale: string;
}

const i18n: Record<string, {
  title: string;
  desc: string;
  igBadge: string;
  noIg: string;
  selecting: string;
  done: string;
  doneDesc: string;
  error: string;
  expired: string;
  loading: string;
  close: string;
}> = {
  it: {
    title: "Scegli la Pagina",
    desc: "Seleziona la Pagina Facebook da collegare. Se ha un profilo Instagram Business collegato, verrà associato automaticamente.",
    igBadge: "IG Business collegato",
    noIg: "Nessun IG Business",
    selecting: "Collegamento in corso...",
    done: "Account collegato!",
    doneDesc: "Puoi chiudere questa pagina e tornare all'estensione GetNearMe.",
    error: "Errore durante il collegamento. Riprova.",
    expired: "Sessione scaduta. Riprova dall'estensione.",
    loading: "Caricamento pagine...",
    close: "Chiudi questa pagina",
  },
  en: {
    title: "Choose a Page",
    desc: "Select the Facebook Page to connect. If it has a linked Instagram Business profile, it will be associated automatically.",
    igBadge: "IG Business linked",
    noIg: "No IG Business",
    selecting: "Connecting...",
    done: "Account connected!",
    doneDesc: "You can close this page and return to the GetNearMe extension.",
    error: "Error during connection. Please retry.",
    expired: "Session expired. Please retry from the extension.",
    loading: "Loading pages...",
    close: "Close this page",
  },
  es: {
    title: "Elige una Página",
    desc: "Selecciona la Página de Facebook a conectar. Si tiene un perfil de Instagram Business vinculado, se asociará automáticamente.",
    igBadge: "IG Business vinculado",
    noIg: "Sin IG Business",
    selecting: "Conectando...",
    done: "Cuenta conectada!",
    doneDesc: "Puedes cerrar esta página y volver a la extensión GetNearMe.",
    error: "Error durante la conexión. Inténtalo de nuevo.",
    expired: "Sesión expirada. Inténtalo de nuevo desde la extensión.",
    loading: "Cargando páginas...",
    close: "Cerrar esta página",
  },
  fr: {
    title: "Choisissez une Page",
    desc: "Sélectionnez la Page Facebook à connecter. Si elle a un profil Instagram Business lié, il sera associé automatiquement.",
    igBadge: "IG Business lié",
    noIg: "Pas de IG Business",
    selecting: "Connexion en cours...",
    done: "Compte connecté !",
    doneDesc: "Vous pouvez fermer cette page et retourner à l'extension GetNearMe.",
    error: "Erreur lors de la connexion. Veuillez réessayer.",
    expired: "Session expirée. Veuillez réessayer depuis l'extension.",
    loading: "Chargement des pages...",
    close: "Fermer cette page",
  },
  ru: {
    title: "Выберите Страницу",
    desc: "Выберите Страницу Facebook для подключения. Если к ней привязан профиль Instagram Business, он будет подключён автоматически.",
    igBadge: "IG Business подключён",
    noIg: "Нет IG Business",
    selecting: "Подключение...",
    done: "Аккаунт подключён!",
    doneDesc: "Вы можете закрыть эту страницу и вернуться к расширению GetNearMe.",
    error: "Ошибка при подключении. Попробуйте снова.",
    expired: "Сессия истекла. Попробуйте снова из расширения.",
    loading: "Загрузка страниц...",
    close: "Закрыть страницу",
  },
  uk: {
    title: "Оберіть Сторінку",
    desc: "Оберіть Сторінку Facebook для підключення. Якщо до неї прив'язаний профіль Instagram Business, він буде підключений автоматично.",
    igBadge: "IG Business підключено",
    noIg: "Немає IG Business",
    selecting: "Підключення...",
    done: "Акаунт підключено!",
    doneDesc: "Ви можете закрити цю сторінку і повернутися до розширення GetNearMe.",
    error: "Помилка при підключенні. Спробуйте ще раз.",
    expired: "Сесія закінчилася. Спробуйте ще раз з розширення.",
    loading: "Завантаження сторінок...",
    close: "Закрити сторінку",
  },
};

export default function PagePicker({ sessionId, locale }: Props) {
  const t = i18n[locale] || i18n.it;
  const [pages, setPages] = useState<Page[]>([]);
  const [status, setStatus] = useState<"loading" | "picking" | "selecting" | "done" | "error" | "expired">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ ig_connected: boolean; fb_connected: boolean; ig_business_missing: boolean } | null>(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/social-oauth-pages?session=${sessionId}`)
      .then((r) => {
        if (r.status === 410) {
          setStatus("expired");
          return null;
        }
        if (!r.ok) throw new Error("Failed to load pages");
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPages(data.pages || []);
        setStatus("picking");
      })
      .catch((e) => {
        setErrorMsg(e.message);
        setStatus("error");
      });
  }, [sessionId]);

  async function selectPage(pageId: string) {
    setStatus("selecting");
    try {
      const res = await fetch(`${SUPABASE_URL}/social-oauth-finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId, page_id: pageId }),
      });
      if (res.status === 410) {
        setStatus("expired");
        return;
      }
      if (!res.ok) throw new Error("Finalize failed");
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStatus("done");
      } else {
        throw new Error("Save failed");
      }
    } catch (e: any) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500">{t.loading}</p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center gap-4">
        <XCircle className="w-14 h-14 text-amber-500" />
        <p className="text-slate-600 text-lg">{t.expired}</p>
        <a
          href="https://getnearme.it"
          className="mt-4 inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          {t.close}
        </a>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-4">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.done}</h2>
        <p className="text-slate-600 text-lg">{t.doneDesc}</p>
        {result && !result.ig_connected && result.ig_business_missing && (
          <p className="text-amber-600 text-sm max-w-md text-center">
            {i18n[locale]?.noIg || "No IG Business linked to this page."}
          </p>
        )}
        <a
          href="https://getnearme.it"
          className="mt-4 inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          {t.close}
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4">
        <XCircle className="w-14 h-14 text-red-500" />
        <p className="text-slate-600 text-lg">{t.error}</p>
        {errorMsg && <p className="text-red-400 text-xs font-mono">{errorMsg}</p>}
        <a
          href="https://getnearme.it"
          className="mt-4 inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          {t.close}
        </a>
      </div>
    );
  }

  if (status === "selecting") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500">{t.selecting}</p>
      </div>
    );
  }

  // Picking
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t.title}</h2>
      <p className="text-slate-500 text-center">{t.desc}</p>

      <div className="w-full flex flex-col gap-3">
        {pages.map((page) => (
          <button
            key={page.page_id}
            onClick={() => selectPage(page.page_id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left cursor-pointer"
          >
            {page.page_picture_url ? (
              <img
                src={page.page_picture_url}
                alt={page.page_name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-lg">
                  {page.page_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{page.page_name}</p>
              {page.has_ig_business ? (
                <p className="text-green-600 text-sm flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t.igBadge}
                  {page.ig_username && (
                    <span className="text-slate-500 ml-1">{page.ig_username}</span>
                  )}
                </p>
              ) : (
                <p className="text-slate-400 text-sm">{t.noIg}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
