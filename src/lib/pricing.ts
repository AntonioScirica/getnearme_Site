// Prezzi di Agente Immo (euro al mese, forfettario: niente IVA). Usati da landing, FAQ e dati strutturati.
// Conti del 27/09/2026: foto ~0,07 EUR, video ~0,45 EUR; dopo Stripe (2,2% + 0,25), bollo 2 EUR e tasse (78% x (15% + 26,07%))
// restano ~38 EUR/mese (trimestrale) e ~32 EUR/mese (annuale) prima dei costi AI. Foto "illimitate" = uso ragionevole.
// Crediti (come Higgsfield: numeri grandi, ogni azione al suo costo vero). 1 credito ~ 0,013 EUR di costo nostro.
// Costi 27/09: foto con Nano Banana 2 ~0,065 EUR, modifica con la Lite ~0,033 EUR, video Veo 4 s ~0,21 EUR.
// Starter 29 EUR mensile (sotto 77,47: niente bollo), 200 foto: netto 18,8, costo max 13 -> margine min ~5,8 EUR.
// Pro 59 annuale / 69 trimestrale, 500 foto: netto 38,6 / 44,6, costo max 32,5 -> margine min ~6 / ~12 EUR.
export const CREDIT_COST = { luminoso: 0, modifica: 3, arreda: 5, svuota: 5, video: 20 };
export const PRICING = { starter: 29, starterCredits: 1000, quarterly: 69, yearly: 59, credits: 2500 };
export const photosFor = (credits: number) => Math.floor(credits / CREDIT_COST.arreda);
export const videosFor = (credits: number) => Math.floor(credits / CREDIT_COST.video);

// Dicitura del forfettario sulle fatture Stripe: sul cliente gia' prima del pagamento, cosi' c'e' anche sulla prima fattura
export const FORFETTARIO_FOOTER = 'Operazione senza applicazione dell\'IVA ai sensi dell\'art. 1, commi 54-89, L. 190/2014 (regime forfettario). Imposta di bollo assolta sull\'originale per importi superiori a 77,47 euro.'
