export const locales = ['it', 'en', 'es', 'fr', 'ru', 'uk'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'it';

export const localeNames: Record<Locale, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  uk: 'Українська',
};

export const localeFlags: Record<Locale, string> = {
  it: '🇮🇹',
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  ru: '🇷🇺',
  uk: '🇺🇦',
};

// Mapping per hreflang (ISO 639-1)
export const hreflangMap: Record<Locale, string> = {
  it: 'it',
  en: 'en',
  es: 'es',
  fr: 'fr',
  ru: 'ru',
  uk: 'uk',
};

// Mapping per og:locale
export const ogLocaleMap: Record<Locale, string> = {
  it: 'it_IT',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  ru: 'ru_RU',
  uk: 'uk_UA',
};

// Titoli SEO localizzati
export const seoTitles: Record<Locale, string> = {
  it: 'GetNearMe - Analisi Immobiliare Intelligente',
  en: 'GetNearMe - Smart Real Estate Analysis',
  es: 'GetNearMe - Análisis Inmobiliario Inteligente',
  fr: 'GetNearMe - Analyse Immobilière Intelligente',
  ru: 'GetNearMe - Интеллектуальный Анализ Недвижимости',
  uk: 'GetNearMe - Інтелектуальний Аналіз Нерухомості',
};

// Descrizioni SEO localizzate
export const seoDescriptions: Record<Locale, string> = {
  it: 'Estensione Chrome per l\'analisi immobiliare. Confronta immobili, analizza quartieri, prezzi e servizi della zona direttamente dai portali immobiliari.',
  en: 'Chrome extension for real estate analysis. Compare properties, analyze neighborhoods, prices and local services directly from real estate portals.',
  es: 'Extensión de Chrome para análisis inmobiliario. Compara inmuebles, analiza barrios, precios y servicios de la zona directamente desde portales inmobiliarios.',
  fr: 'Extension Chrome pour l\'analyse immobilière. Comparez les biens, analysez les quartiers, les prix et les services locaux directement depuis les portails immobiliers.',
  ru: 'Расширение Chrome для анализа недвижимости. Сравнивайте объекты, анализируйте районы, цены и местные услуги прямо с порталов недвижимости.',
  uk: 'Розширення Chrome для аналізу нерухомості. Порівнюйте об\'єкти, аналізуйте райони, ціни та місцеві послуги безпосередньо з порталів нерухомості.',
};

// Alt text per immagini localizzati
export const altTexts: Record<Locale, { hero: string; cards: string[] }> = {
  it: {
    hero: 'GetNearMe - Anteprima dell\'applicazione per analisi immobiliare',
    cards: [
      'Analisi dati immobile',
      'Contesto del quartiere',
      'Confronto prezzi zona',
      'Report comparativo',
    ],
  },
  en: {
    hero: 'GetNearMe - Real estate analysis application preview',
    cards: [
      'Property data analysis',
      'Neighborhood context',
      'Area price comparison',
      'Comparative report',
    ],
  },
  es: {
    hero: 'GetNearMe - Vista previa de la aplicación de análisis inmobiliario',
    cards: [
      'Análisis de datos del inmueble',
      'Contexto del barrio',
      'Comparación de precios de la zona',
      'Informe comparativo',
    ],
  },
  fr: {
    hero: 'GetNearMe - Aperçu de l\'application d\'analyse immobilière',
    cards: [
      'Analyse des données immobilières',
      'Contexte du quartier',
      'Comparaison des prix du secteur',
      'Rapport comparatif',
    ],
  },
  ru: {
    hero: 'GetNearMe - Предпросмотр приложения для анализа недвижимости',
    cards: [
      'Анализ данных объекта',
      'Контекст района',
      'Сравнение цен в районе',
      'Сравнительный отчет',
    ],
  },
  uk: {
    hero: 'GetNearMe - Попередній перегляд додатку для аналізу нерухомості',
    cards: [
      'Аналіз даних об\'єкта',
      'Контекст району',
      'Порівняння цін у районі',
      'Порівняльний звіт',
    ],
  },
};

