import { type Locale } from "@/lib/i18n";

// ============================================================================
// TAG CATEGORIES
// ============================================================================

export const tagCategories: Record<
  string,
  { label: Record<Locale, string>; tags: string[] }
> = {
  decisione: {
    label: {
      it: "Decidere",
      en: "Decision",
      es: "Decisión",
      fr: "Décision",
      ru: "Решение",
      uk: "Рішення",
    },
    tags: [
      "decisione",
      "paura-di-sbagliare",
      "confusione",
      "lucidita",
      "rimpianto",
      "emozione",
      "ansia",
      "fretta",
      "criteri",
      "scelta-consapevole",
      "segnali-rossi",
      "pressione",
      "compromessi",
    ],
  },
  spazi: {
    label: {
      it: "Casa & Spazi",
      en: "Home & Spaces",
      es: "Casa & Espacios",
      fr: "Maison & Espaces",
      ru: "Дом & Пространства",
      uk: "Дім & Простори",
    },
    tags: [
      "confronto",
      "spazi",
      "terrazzo",
      "piano",
      "arredo",
      "ristrutturazione",
      "condominio",
      "manutenzione",
      "prima-casa",
    ],
  },
  quartiere: {
    label: {
      it: "Quartiere",
      en: "Neighborhood",
      es: "Barrio",
      fr: "Quartier",
      ru: "Район",
      uk: "Район",
    },
    tags: [
      "quartiere",
      "contesto-urbano",
      "posizione",
      "flussi",
      "servizi",
      "smart-working",
    ],
  },
  comfort: {
    label: {
      it: "Rumore & Comfort",
      en: "Noise & Comfort",
      es: "Ruido & Confort",
      fr: "Bruit & Confort",
      ru: "Шум & Комфорт",
      uk: "Шум & Комфорт",
    },
    tags: [
      "rumore",
      "sonno",
      "privacy",
      "luce",
      "concentrazione",
      "comfort",
      "rientro-serale",
    ],
  },
  routine: {
    label: {
      it: "Routine & Tempo",
      en: "Routine & Time",
      es: "Rutina & Tiempo",
      fr: "Routine & Temps",
      ru: "Рутина & Время",
      uk: "Рутина & Час",
    },
    tags: [
      "routine",
      "mobilita",
      "tempo",
      "spostamenti",
      "box",
      "rientro",
      "stanchezza",
      "visite-casa",
      "weekend",
      "fatica",
      "stress",
      "ricerca-casa",
    ],
  },
  costi: {
    label: {
      it: "Costi & Gestione",
      en: "Costs & Management",
      es: "Costos & Gestión",
      fr: "Coûts & Gestion",
      ru: "Затраты & Управление",
      uk: "Витрати & Управління",
    },
    tags: ["costi", "gestione", "sostenibilita", "energia", "famiglia"],
  },
};

// ============================================================================
// BLOG TEXTS
// ============================================================================

export const blogTexts: Record<
  Locale,
  {
    heading: string;
    subheading: string;
    empty: string;
    filterByTag: string;
    allArticles: string;
    articlesCount: string;
    clearFilter: string;
    loadMore: string;
    loading: string;
  }
> = {
  it: {
    heading: "Blog",
    subheading:
      "Guide, consigli e approfondimenti per orientarti nel mercato immobiliare",
    empty: "Nessun articolo disponibile al momento.",
    filterByTag: "Argomenti",
    allArticles: "Tutti gli articoli",
    articlesCount: "articoli",
    clearFilter: "Rimuovi filtro",
    loadMore: "Carica altri",
    loading: "Caricamento...",
  },
  en: {
    heading: "Blog",
    subheading: "Guides, tips and insights to navigate the real estate market",
    empty: "No articles available at the moment.",
    filterByTag: "Topics",
    allArticles: "All articles",
    articlesCount: "articles",
    clearFilter: "Clear filter",
    loadMore: "Load more",
    loading: "Loading...",
  },
  es: {
    heading: "Blog",
    subheading:
      "Guías, consejos e información para orientarte en el mercado inmobiliario",
    empty: "No hay artículos disponibles en este momento.",
    filterByTag: "Temas",
    allArticles: "Todos los artículos",
    articlesCount: "artículos",
    clearFilter: "Quitar filtro",
    loadMore: "Cargar más",
    loading: "Cargando...",
  },
  fr: {
    heading: "Blog",
    subheading:
      "Guides, conseils et informations pour vous orienter sur le marché immobilier",
    empty: "Aucun article disponible pour le moment.",
    filterByTag: "Sujets",
    allArticles: "Tous les articles",
    articlesCount: "articles",
    clearFilter: "Retirer le filtre",
    loadMore: "Charger plus",
    loading: "Chargement...",
  },
  ru: {
    heading: "Блог",
    subheading:
      "Руководства, советы и информация для навигации на рынке недвижимости",
    empty: "На данный момент статей нет.",
    filterByTag: "Темы",
    allArticles: "Все статьи",
    articlesCount: "статей",
    clearFilter: "Сбросить фильтр",
    loadMore: "Загрузить ещё",
    loading: "Загрузка...",
  },
  uk: {
    heading: "Блог",
    subheading:
      "Посібники, поради та інформація для орієнтування на ринку нерухомості",
    empty: "На даний момент статей немає.",
    filterByTag: "Теми",
    allArticles: "Всі статті",
    articlesCount: "статей",
    clearFilter: "Скинути фільтр",
    loadMore: "Завантажити ще",
    loading: "Завантаження...",
  },
};

