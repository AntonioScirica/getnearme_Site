// Prezzi di Agente Immo (euro al mese, forfettario: niente IVA). Usati da landing, FAQ e dati strutturati.
// Conti del 27/09/2026: foto ~0,07 EUR, video ~0,45 EUR; dopo Stripe (2,2% + 0,25), bollo 2 EUR e tasse (78% x (15% + 26,07%))
// restano ~38 EUR/mese (trimestrale) e ~32 EUR/mese (annuale) prima dei costi AI. Foto "illimitate" = uso ragionevole.
// Crediti (come Higgsfield: numeri grandi, ogni azione al suo costo vero; 1 credito ~ 1 centesimo di costo nostro).
// Costi misurati 27/09: arreda ~0,045 EUR, video ~0,45 EUR. 1.500 crediti = al massimo ~15 EUR di costo.
export const CREDIT_COST = { luminoso: 0, modifica: 3, arreda: 5, svuota: 10, video: 50 };
// Starter: 19 EUR mensile (sotto 77,47 EUR: niente bollo), netto ~12,25 EUR/mese, costo max 5 EUR.
export const PRICING = { starter: 19, starterCredits: 500, quarterly: 59, yearly: 49, credits: 1500, trialDays: 7, trialCredits: 300 };
export const photosFor = (credits: number) => Math.floor(credits / CREDIT_COST.arreda);
export const videosFor = (credits: number) => Math.floor(credits / CREDIT_COST.video);
