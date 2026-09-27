import { agenteImmobiliare } from './agente-immobiliare';
import { comeDiventare, provvigione, software, homeStaging } from './cluster';
import { intelligenzaArtificiale, videoSocial, acquisireIncarichi } from './crescita';
import type { Guide } from './types';

// Pilastro per primo; le satelliti rimandano al pilastro e tra loro (link "Leggi anche").
export const GUIDES: Guide[] = [agenteImmobiliare, acquisireIncarichi, intelligenzaArtificiale, videoSocial, homeStaging, software, comeDiventare, provvigione];
export const guideBySlug = (slug: string) => GUIDES.find(g => g.slug === slug);
export type { Guide };
