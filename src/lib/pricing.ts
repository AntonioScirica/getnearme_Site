// Prezzi di Agente Immo (euro al mese, forfettario: niente IVA). Usati da landing, FAQ e dati strutturati.
// Conti del 27/09/2026: foto ~0,07 EUR, video ~0,45 EUR; dopo Stripe (2,2% + 0,25), bollo 2 EUR e tasse (78% x (15% + 26,07%))
// restano ~38 EUR/mese (trimestrale) e ~32 EUR/mese (annuale) prima dei costi AI. Foto "illimitate" = uso ragionevole.
export const PRICING = { quarterly: 59, yearly: 49, videos: 15, trialDays: 7 };
