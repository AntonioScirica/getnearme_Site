import { agenteImmobiliare } from './agente-immobiliare';
import { comeDiventare, provvigione, software, homeStaging } from './cluster';
import { intelligenzaArtificiale, videoSocial, acquisireIncarichi } from './crescita';
import { gestionale, crm, sitoWeb } from './strumenti';
import { scrivereAnnuncio, descrizioneEsempi, fotoSmartphone, migliorareFoto, reelImmobiliari } from './annunci';
import { letteraAcquisizione, scriptTelefonata, valutazioneAcquisizione } from './acquisizione';
import { virtualStagingLegale, homeStagingCosto, apeAnnunci } from './norme';
import { casaCheNonSiVende, annuncioSenzaContatti, homeStagingEsempi, arredareFotoConAi } from './vendere';
import { costoPortaliAgenzie, contattiSenzaPortali, gestionaleGratuito, alternativeGetrixMiogest } from './portali';
import { messaggiAcquisire, trovareClienti, agenteIndipendente, personalBranding } from './clienti';
import { videoMarketing, cosaPubblicareInstagram, planimetriaAnnuncio, presentazioneAcquisizione } from './marketing';
import { whatsappBusinessAgenzia, agenziaGoogleMaps, recensioniGoogleAgenzia, vetrinaAgenziaImmobiliare, chatgptAgentiImmobiliari } from './semplici';
import { comeValutareCasa, quotazioniOmi, superficieCommerciale } from './proprietari-valore';
import { quantoCostaVendere, documentiVendereCasa, plusvalenzaVenditaCasa } from './proprietari-costi';
import { vendereCasaVelocemente, vendereSenzaAgenzia, quandoConvieneVendere, cosaFarePrimaDiVendere } from './proprietari-vendita';
import type { Guide } from './types';

// Pilastro per primo; le satelliti rimandano al pilastro e tra loro ("Leggi anche": le 6 che seguono in quest'ordine,
// quindi temi vicini stanno vicini).
export const GUIDES: Guide[] = [
  agenteImmobiliare, acquisireIncarichi, presentazioneAcquisizione, letteraAcquisizione, messaggiAcquisire, scriptTelefonata,
  valutazioneAcquisizione, trovareClienti, provvigione,
  casaCheNonSiVende, annuncioSenzaContatti,
  intelligenzaArtificiale, chatgptAgentiImmobiliari, homeStaging, homeStagingEsempi, arredareFotoConAi, virtualStagingLegale,
  homeStagingCosto, migliorareFoto, fotoSmartphone, planimetriaAnnuncio,
  scrivereAnnuncio, descrizioneEsempi, apeAnnunci, videoSocial, videoMarketing, reelImmobiliari, cosaPubblicareInstagram,
  personalBranding, recensioniGoogleAgenzia, agenziaGoogleMaps, whatsappBusinessAgenzia, vetrinaAgenziaImmobiliare,
  software, gestionale, gestionaleGratuito, alternativeGetrixMiogest, crm, sitoWeb, contattiSenzaPortali, costoPortaliAgenzie,
  comeDiventare, agenteIndipendente,
  // per chi vende casa (audience 'proprietari'): "Leggi anche" a giro solo tra queste, nell'ordine del percorso
  comeValutareCasa, quotazioniOmi, superficieCommerciale, quantoCostaVendere, documentiVendereCasa, plusvalenzaVenditaCasa,
  quandoConvieneVendere, cosaFarePrimaDiVendere, vendereCasaVelocemente, vendereSenzaAgenzia,
];
export const guideBySlug = (slug: string) => GUIDES.find(g => g.slug === slug);
export type { Guide };
