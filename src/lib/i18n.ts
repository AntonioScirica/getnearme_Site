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

// Titoli SEO localizzati (≤60 caratteri ideali)
export const seoTitles: Record<Locale, string> = {
  it: 'GetNearMe — AI per Agenti Immobiliari | Analisi Zona, Social, Render',
  en: 'GetNearMe — AI for Real Estate Agents | Area Analysis, Social, Renders',
  es: 'GetNearMe — IA para Agentes Inmobiliarios | Análisis Zona, Social, Renders',
  fr: 'GetNearMe — IA pour Agents Immobiliers | Analyse Zone, Social, Renders',
  ru: 'GetNearMe — ИИ для риелторов | Анализ района, соцсети, рендеры',
  uk: 'GetNearMe — ШІ для ріелторів | Аналіз району, соцмережі, рендери',
};

// Descrizioni SEO localizzate (≤155 caratteri ideali)
export const seoDescriptions: Record<Locale, string> = {
  it: 'L\'estensione Chrome con AI che semplifica il lavoro quotidiano dell\'agenzia immobiliare: analisi di zona, render foto AI, video, post social e report PDF su Immobiliare.it, Idealista, Casa.it, Airbnb e Booking. Non è un sistema di valutazione immobiliare. 7 giorni di prova gratuita.',
  en: 'The Chrome extension with AI that simplifies the daily work of a real estate agency: area analysis, AI photo renders, videos, social posts and PDF reports on Immobiliare.it, Idealista, Casa.it, Airbnb and Booking. Not a property valuation system. 7-day free trial.',
  es: 'La extensión de Chrome con IA que simplifica el trabajo diario de la agencia inmobiliaria: análisis de zona, renders de fotos con IA, vídeos, posts sociales e informes PDF en Idealista, Immobiliare.it, Casa.it, Airbnb y Booking. No es un sistema de tasación inmobiliaria. 7 días de prueba gratis.',
  fr: 'L\'extension Chrome avec IA qui simplifie le travail quotidien de l\'agence immobilière : analyse de zone, rendus photo IA, vidéos, posts sociaux et rapports PDF sur Immobiliare.it, Idealista, Casa.it, Airbnb et Booking. Ce n\'est pas un système d\'évaluation immobilière. 7 jours d\'essai gratuit.',
  ru: 'Расширение Chrome с ИИ, упрощающее ежедневную работу агентства недвижимости: анализ района, ИИ-рендеры фото, видео, посты для соцсетей и PDF-отчёты на Immobiliare.it, Idealista, Casa.it, Airbnb и Booking. Не является системой оценки недвижимости. 7 дней бесплатно.',
  uk: 'Розширення Chrome зі ШІ, що спрощує щоденну роботу агентства нерухомості: аналіз району, ШІ-рендери фото, відео, пости для соцмереж та PDF-звіти на Immobiliare.it, Idealista, Casa.it, Airbnb і Booking. Не є системою оцінки нерухомості. 7 днів безкоштовно.',
};

// Alt text per immagini localizzati
export const altTexts: Record<Locale, { hero: string; cards: string[] }> = {
  it: {
    hero: 'GetNearMe — estensione Chrome con AI per agenti immobiliari',
    cards: [
      'Analisi di zona interattiva dei servizi di quartiere',
      'Prezzo medio di zona al m² per riferimento',
      'Homestaging AI: render foto before/after',
      'Video AI per presentazione immobili',
      'Post social per Instagram e TikTok dall\'annuncio',
      'Report PDF white-label con brand dell\'agenzia',
    ],
  },
  en: {
    hero: 'GetNearMe — Chrome extension with AI for real estate agents',
    cards: [
      'Interactive area analysis of neighborhood services',
      'Average €/m² area price for reference',
      'AI home staging: before/after photo renders',
      'AI videos for property presentation',
      'Social posts for Instagram and TikTok from the listing',
      'White-label PDF reports with agency brand',
    ],
  },
  es: {
    hero: 'GetNearMe — extensión Chrome con IA para agentes inmobiliarios',
    cards: [
      'Análisis interactivo del barrio y sus servicios',
      'Precio medio por m² de la zona a título orientativo',
      'Home staging IA: renders de fotos antes/después',
      'Vídeos con IA para presentar inmuebles',
      'Posts sociales para Instagram y TikTok desde el anuncio',
      'Informes PDF white-label con la marca de la agencia',
    ],
  },
  fr: {
    hero: 'GetNearMe — extension Chrome avec IA pour agents immobiliers',
    cards: [
      'Analyse interactive du quartier et de ses services',
      'Prix moyen au m² du secteur à titre indicatif',
      'Home staging IA : rendus photo avant/après',
      'Vidéos générées par IA pour présenter les biens',
      'Posts sociaux pour Instagram et TikTok depuis l\'annonce',
      'Rapports PDF en marque blanche avec l\'identité de l\'agence',
    ],
  },
  ru: {
    hero: 'GetNearMe — расширение Chrome с ИИ для риелторов',
    cards: [
      'Интерактивный анализ района и сервисов',
      'Средняя цена за м² по району (ориентировочно)',
      'ИИ-хоумстейджинг: рендеры фото до/после',
      'ИИ-видео для презентации недвижимости',
      'Посты в соцсети для Instagram и TikTok из объявления',
      'PDF-отчёты white-label с брендом агентства',
    ],
  },
  uk: {
    hero: 'GetNearMe — розширення Chrome зі ШІ для ріелторів',
    cards: [
      'Інтерактивний аналіз району та сервісів',
      'Середня ціна за м² у районі (орієнтовно)',
      'ШІ-хоумстейджинг: рендери фото до/після',
      'ШІ-відео для презентації нерухомості',
      'Пости у соцмережі для Instagram і TikTok з оголошення',
      'PDF-звіти white-label з брендом агентства',
    ],
  },
};


