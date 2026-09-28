// Prezzi di Agente Immo (euro al mese, forfettario: niente IVA). Usati da landing, FAQ e dati strutturati.
// Conti del 27/09/2026: foto ~0,07 EUR, video ~0,45 EUR; dopo Stripe (2,2% + 0,25), bollo 2 EUR e tasse (78% x (15% + 26,07%))
// restano ~38 EUR/mese (trimestrale) e ~32 EUR/mese (annuale) prima dei costi AI. Foto "illimitate" = uso ragionevole.
// Crediti (come Higgsfield: numeri grandi, ogni azione al suo costo vero). 1 credito ~ 0,013 EUR di costo nostro.
// Costi 27/09: foto con Nano Banana 2 ~0,065 EUR, modifica con la Lite ~0,033 EUR, video Veo 4 s ~0,21 EUR.
// Starter 29 EUR mensile (sotto 77,47: niente bollo), 200 foto: netto 18,8, costo max 13 -> margine min ~5,8 EUR.
// Pro 59 annuale / 69 trimestrale, 500 foto: netto 38,6 / 44,6, costo max 32,5 -> margine min ~6 / ~12 EUR.
// Video: crediti in proporzione al costo (28/09/2026, incasso al credito peggiore 0,0236 € col Pro annuale, margine ~45%):
// Popup / Dall'alto (Veo, ~0,34 $) e Stop-motion / Particelle / Giorno-notte (Nano Banana + Kling, ~0,37 $) = 25;
// Cantiere (2 Nano Banana + 2 Kling, ~0,73 $) = 50.
// Modifiche (28/09/2026): con GPT Image 2.5 a qualita' bassa costano ~0,014 $; tetto giornaliero per utente in api/platform/photo-edit.
// modifica: le prime 3 su una foto sono gratis, dalla quarta 1 credito (modifica_extra), che e' il nostro costo (0,014 $).
// Video (28/09/2026): Prima e dopo con Veo 3.1 Fast ~0,83 $ tutto compreso -> 75 crediti (1 credito ~0,013 $ di costo);
// Cantiere (2 Kling o3 da 5 s + 2 GPT, ~0,87 $) 150; Giorno e notte (1 Kling da 5 s + 1 GPT, ~0,43 $) 50.
export const CREDIT_COST = { luminoso: 0, modifica: 0, modifica_extra: 1, arreda: 5, svuota: 5, video: 75, video_cantiere: 150, video_daynight: 50, riscrivi: 1 };
// Pacchetti di crediti extra (una tantum, non scadono col mese): per chi finisce i crediti prima del rinnovo.
// Prezzi Stripe con lookup key ai_pack_<crediti>; stesso margine dei piani (~0,024 EUR a credito).
export const PACKS = [{ id: 'pack500', credits: 500, eur: 12 }, { id: 'pack1500', credits: 1500, eur: 30 }] as const;
export type PackId = (typeof PACKS)[number]['id'];
export const FREE_EDITS = 3;
export const PRICING = { starter: 29, starterCredits: 1000, quarterly: 69, yearly: 59, credits: 2500 };
export const photosFor = (credits: number) => Math.floor(credits / CREDIT_COST.arreda);
export const videosFor = (credits: number) => Math.floor(credits / CREDIT_COST.video);

// Dicitura del forfettario sulle fatture Stripe: sul cliente gia' prima del pagamento, cosi' c'e' anche sulla prima fattura
export const FORFETTARIO_FOOTER = 'Operazione senza applicazione dell\'IVA ai sensi dell\'art. 1, commi 54-89, L. 190/2014 (regime forfettario). Imposta di bollo assolta sull\'originale per importi superiori a 77,47 euro.'
