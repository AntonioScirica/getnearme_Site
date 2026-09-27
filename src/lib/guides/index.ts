import { agenteImmobiliare } from './agente-immobiliare';
import { comeDiventare, provvigione, software, homeStaging } from './cluster';
import type { Guide } from './types';

// Pilastro per primo; le satelliti rimandano al pilastro e tra loro (link "Leggi anche").
export const GUIDES: Guide[] = [agenteImmobiliare, comeDiventare, provvigione, software, homeStaging];
export const guideBySlug = (slug: string) => GUIDES.find(g => g.slug === slug);
export type { Guide };
