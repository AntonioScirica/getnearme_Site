import { GUIDES, guideBySlug, type Guide } from '@/lib/guides';

// "Guide correlate" sotto gli articoli del blog (testo dal database, senza link nel corpo): prima le guide del tema
// dell'articolo (pillar), poi quelle con piu' parole in comune con titolo e descrizione. Nessuna scrittura sul database.
const BY_PILLAR: Record<string, string[]> = {
  'ai-video': ['video-immobiliari-social', 'video-marketing-immobiliare', 'reel-immobiliari-instagram-tiktok'],
  'ai-staging': ['home-staging-virtuale', 'home-staging-costo', 'virtual-staging-legale', 'arredare-foto-con-ai'],
  'reports-analytics': ['valutazione-immobile-acquisizione', 'presentazione-acquisizione-immobile', 'quotazioni-omi'],
  'ai-avatar': ['video-marketing-immobiliare', 'personal-branding-agente-immobiliare', 'intelligenza-artificiale-agenti-immobiliari'],
  'comparison-geo': ['software-agenti-immobiliari', 'intelligenza-artificiale-agenti-immobiliari', 'chatgpt-agenti-immobiliari'],
  'agency-productivity': ['gestionale-immobiliare', 'crm-immobiliare', 'intelligenza-artificiale-agenti-immobiliari'],
  'social-media': ['cosa-pubblicare-instagram-agente-immobiliare', 'reel-immobiliari-instagram-tiktok', 'personal-branding-agente-immobiliare', 'ricevere-contatti-senza-portali'],
};
const STOP = new Set(['agente', 'agenti', 'immobiliare', 'immobiliari', 'agenzia', 'agenzie', 'come', 'cosa', 'della', 'delle', 'degli', 'dalla', 'nella', 'nelle', 'sono', 'senza', 'guida', 'quanto', 'quale', 'quali', 'anche', 'tutti', 'tutto', 'ogni', 'oggi', 'perche', 'questo', 'questa', 'casa', '2026']);
const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w)));

export function guidesForPost(post: { pillar: string; title: string; seo_description: string; slug: string }, n = 5): Guide[] {
  const own = words(`${post.title} ${post.seo_description} ${post.slug.replace(/-/g, ' ')}`);
  const scored = GUIDES.filter(g => g.audience !== 'proprietari' && g.slug !== 'agente-immobiliare')
    .map(g => { const w = words(`${g.label} ${g.title} ${g.slug.replace(/-/g, ' ')}`); return [g, [...w].filter(x => own.has(x)).length] as const; })
    .filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const first = (BY_PILLAR[post.pillar] ?? []).map(s => guideBySlug(s)).filter((g): g is Guide => !!g);
  return [...new Set([...first, ...scored])].slice(0, n);
}
