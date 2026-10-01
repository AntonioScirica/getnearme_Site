// Copertine del blog: immagini col marchio Agente Immo su R2 (blog/covers/), composte con sharp dalle foto
// della landing (prima e dopo, reel dei modelli video) con un titolo breve. Una per articolo; gli articoli
// nuovi del cron senza copertina propria prendono quella del loro tema (pillar-<tema>.jpg).
const R2 = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/blog/covers';

const COVER_SLUGS = new Set([
  'home-staging-virtuale-prezzi-confronto-staging-fisico',
  'video-annunci-immobiliari-ai-creare-senza-videomaker',
  'costo-video-immobiliare-ai',
  'calendario-editoriale-social-agenti-immobiliari',
  'template-post-immobiliari-instagram',
  'lead-generation-agenzia-immobiliare-social',
  'report-analisi-zona-immobiliare-automatici',
  'analisi-mercato-immobiliare-2026-dati-zona',
  'strumenti-ai-agenzia-immobiliare-team-collaborazione',
  'tempo-perde-agenzia-senza-ai-produttivita',
  'onboarding-agenti-immobiliari-standardizzare-contenuti-report',
  'migliori-strumenti-ai-agenzie-immobiliari-2026',
  'agente-immo-vs-canva-strumenti-agenti-immobiliari',
  'ai-immobiliare-italia-strumenti-agenzie-2026',
  'avatar-ai-agente-immobiliare-presentare-immobile',
  'report-valutazione-immobiliare-pdf-cosa-deve-contenere',
  'home-staging-virtuale-agenzie-immobiliari-2026',
  '5-errori-video-presentazione-immobili',
]);

const PILLARS = new Set(['ai-staging', 'ai-video', 'social-media', 'reports-analytics', 'ai-avatar', 'agency-productivity', 'comparison-geo']);

/** URL assoluto della copertina (va bene anche per og:image e JSON-LD). */
export function getCoverImage(pillar: string, slug: string): string {
  if (COVER_SLUGS.has(slug)) return `${R2}/${slug}.jpg`;
  return `${R2}/pillar-${PILLARS.has(pillar) ? pillar : 'ai-staging'}.jpg`;
}
