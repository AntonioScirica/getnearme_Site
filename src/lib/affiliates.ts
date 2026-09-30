// Codici affiliato: un agente (l'affiliato) passa il suo codice ad altri agenti. Chi ha un piano a pagamento lo
// inserisce nella pagina Il tuo piano: riceve REDEEM_CREDITS crediti, l'affiliato AFFILIATE_CREDITS per ogni persona.
// Un codice per account, per sempre; il proprio codice non vale. I crediti regalati non scadono con il mese
// (stesso motivo "pacchetto_" dei pacchetti comprati, vedi packLeft in credits.ts).
// ponytail: codici in questo file (niente tabella, niente DDL su prod); nuovo affiliato = una riga qui + deploy.
// Se gli affiliati diventano tanti: tabella affiliate_codes con pannello admin.
export const REDEEM_CREDITS = 200
export const AFFILIATE_CREDITS = 400

// CODICE (maiuscolo) -> email dell'account dell'affiliato su Agente Immo. max = persone al massimo (facoltativo).
export const AFFILIATE_CODES: Record<string, { owner: string; max?: number }> = {
  // 'MARIO-IMMO': { owner: 'mario.rossi@example.com', max: 100 },
}

export const normCode = (s: unknown) => (typeof s === 'string' ? s.trim().toUpperCase() : '')
export const codeOf = (email: string) => Object.entries(AFFILIATE_CODES).find(([, v]) => v.owner.toLowerCase() === email.toLowerCase())?.[0] ?? null
