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
  it: 'GetNearMe — Assistente AI per Agenti Immobiliari | Foto, Video, Report',
  en: 'GetNearMe — AI Assistant for Real Estate Agents | Photos, Video, Reports',
  es: 'GetNearMe — Asistente IA para Agentes Inmobiliarios | Fotos, Vídeo, Informes',
  fr: 'GetNearMe — Assistant IA pour Agents Immobiliers | Photos, Vidéo, Rapports',
  ru: 'GetNearMe — ИИ-ассистент для риелторов | Фото, видео, отчёты',
  uk: 'GetNearMe — ШІ-асистент для ріелторів | Фото, відео, звіти',
};

// Descrizioni SEO localizzate (≤155 caratteri ideali)
export const seoDescriptions: Record<Locale, string> = {
  it: 'L\'assistente AI per agenti immobiliari: home staging, video, post social, report col tuo brand e analisi di zona per ogni immobile, in pochi minuti. Provalo gratis, senza carta.',
  en: "The AI assistant for real estate agents: home staging, video, social posts, branded reports and area analysis for every listing, in minutes. What takes you hours today, you do from one place. Try it free, no card.",
  es: "El asistente IA para agentes inmobiliarios: home staging, vídeos, posts sociales, informes con tu marca y análisis de zona para cada inmueble, en minutos. Lo que hoy te lleva horas, lo haces desde un solo sitio. Pruébalo gratis, sin tarjeta.",
  fr: "L'assistant IA pour les agents immobiliers : home staging, vidéos, posts sociaux, rapports à ton image et analyse de quartier pour chaque bien, en quelques minutes. Ce qui te prend des heures aujourd'hui, tu le fais depuis un seul endroit. Essaie-le gratuitement, sans carte.",
  ru: "ИИ-ассистент для риелторов: хоумстейджинг, видео, посты для соцсетей, отчёты с твоим брендом и анализ района для каждого объекта — за пару минут. То, на что сегодня уходят часы, ты делаешь из одного места. Попробуй бесплатно, без карты.",
  uk: "ШІ-асистент для ріелторів: хоумстейджинг, відео, пости для соцмереж, звіти з твоїм брендом та аналіз району для кожного об'єкта — за кілька хвилин. Те, на що сьогодні йдуть години, ти робиш з одного місця. Спробуй безкоштовно, без картки.",
};

// Alt text per immagini localizzati
export const altTexts: Record<Locale, { hero: string; cards: string[] }> = {
  it: {
    hero: 'GetNearMe — l\'assistente AI per agenti immobiliari',
    cards: [
      'Analisi di zona interattiva dei servizi di quartiere',
      'Prezzo medio di zona al m² per riferimento',
      'Home staging AI: render foto prima/dopo',
      'Video AI per presentazione immobili',
      'Post social per Instagram e TikTok dall\'annuncio',
      'Report PDF col tuo brand per ogni immobile',
    ],
  },
  en: {
    hero: 'GetNearMe — the AI assistant for real estate agents',
    cards: [
      'Interactive area analysis of neighborhood services',
      'Average area price per m² for reference',
      'AI home staging: before/after photo renders',
      'AI videos to present properties',
      'Social posts for Instagram and TikTok from the listing',
      'PDF reports with your brand for every property',
    ],
  },
  es: {
    hero: 'GetNearMe — el asistente IA para agentes inmobiliarios',
    cards: [
      'Análisis de zona interactivo de los servicios del barrio',
      'Precio medio de la zona por m² a título orientativo',
      'Home staging IA: renders de fotos antes/después',
      'Vídeos con IA para presentar inmuebles',
      'Posts sociales para Instagram y TikTok desde el anuncio',
      'Informes PDF con tu marca para cada inmueble',
    ],
  },
  fr: {
    hero: "GetNearMe — l'assistant IA pour les agents immobiliers",
    cards: [
      'Analyse de quartier interactive des services du secteur',
      'Prix moyen du secteur au m² à titre indicatif',
      'Home staging IA : rendus photo avant/après',
      'Vidéos IA pour présenter les biens',
      "Posts sociaux pour Instagram et TikTok depuis l'annonce",
      'Rapports PDF à ton image pour chaque bien',
    ],
  },
  ru: {
    hero: 'GetNearMe — ИИ-ассистент для риелторов',
    cards: [
      'Интерактивный анализ района и его сервисов',
      'Средняя цена по району за м² для ориентира',
      'ИИ-хоумстейджинг: рендеры фото до/после',
      'ИИ-видео для презентации недвижимости',
      'Посты в соцсети для Instagram и TikTok из объявления',
      'PDF-отчёты с твоим брендом для каждого объекта',
    ],
  },
  uk: {
    hero: 'GetNearMe — ШІ-асистент для ріелторів',
    cards: [
      'Інтерактивний аналіз району та його сервісів',
      'Середня ціна по району за м² для орієнтиру',
      'ШІ-хоумстейджинг: рендери фото до/після',
      'ШІ-відео для презентації нерухомості',
      'Пости у соцмережі для Instagram і TikTok з оголошення',
      "PDF-звіти з твоїм брендом для кожного об'єкта",
    ],
  },
};


