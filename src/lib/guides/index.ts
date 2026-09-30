import { agenteImmobiliare } from './agente-immobiliare';
import { comeDiventare, provvigione, software, homeStaging } from './cluster';
import { intelligenzaArtificiale, videoSocial, acquisireIncarichi } from './crescita';
import { gestionale, crm, sitoWeb } from './strumenti';
import { scrivereAnnuncio, descrizioneEsempi, fotoSmartphone, migliorareFoto, reelImmobiliari } from './annunci';
import { letteraAcquisizione, scriptTelefonata, valutazioneAcquisizione } from './acquisizione';
import { virtualStagingLegale, homeStagingCosto, apeAnnunci } from './norme';
import type { Guide } from './types';

// Pilastro per primo; le satelliti rimandano al pilastro e tra loro ("Leggi anche": le 6 che seguono in quest'ordine,
// quindi temi vicini stanno vicini).
export const GUIDES: Guide[] = [
  agenteImmobiliare, acquisireIncarichi, letteraAcquisizione, scriptTelefonata, valutazioneAcquisizione, provvigione,
  intelligenzaArtificiale, homeStaging, virtualStagingLegale, homeStagingCosto, migliorareFoto, fotoSmartphone,
  scrivereAnnuncio, descrizioneEsempi, apeAnnunci, videoSocial, reelImmobiliari,
  software, gestionale, crm, sitoWeb, comeDiventare,
];
export const guideBySlug = (slug: string) => GUIDES.find(g => g.slug === slug);
export type { Guide };
