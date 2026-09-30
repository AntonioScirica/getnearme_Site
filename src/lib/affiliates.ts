import { createHash } from 'crypto'
import { readText, uploadFile } from '@/lib/r2'

// Codici affiliato: un agente (l'affiliato) passa il suo codice ad altri agenti. Chi ha un piano a pagamento lo
// inserisce nella pagina Il tuo piano: riceve `redeem` crediti, l'affiliato `affiliate` per ogni persona.
// Piu' codici per account, ognuno una volta sola; il proprio codice non vale. I crediti regalati non scadono con il mese
// (stesso motivo "pacchetto_" dei pacchetti comprati, vedi packLeft in credits.ts).
// I codici si gestiscono dalla pagina admin Affiliati (#/affiliati). Stanno in un file JSON su R2, senza tabelle:
// ponytail: il bucket e' pubblico, il nome del file e' ricavato dalla chiave di servizio (non indovinabile). Tanti
// affiliati o piu' amministratori insieme: tabella affiliate_codes.
export type AffiliateCode = { owner: string; max?: number; active?: boolean }
export type AffiliateStore = { redeem: number; affiliate: number; codes: Record<string, AffiliateCode> }

const KEY = `private/affiliati-${createHash('sha256').update(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').digest('hex').slice(0, 24)}.json`
const DEFAULTS: AffiliateStore = { redeem: 200, affiliate: 400, codes: {} }

export async function loadAffiliates(): Promise<AffiliateStore> {
  const t = await readText(KEY)
  try { return t ? { ...DEFAULTS, ...JSON.parse(t) } : DEFAULTS } catch { return DEFAULTS }
}
export async function saveAffiliates(s: AffiliateStore) {
  await uploadFile(Buffer.from(JSON.stringify(s)), KEY, 'application/json')
}

// evento di chi usa il codice: + CODICE ("pacchetto_" = non scade con il mese); all'affiliato pacchetto_affiliato_CODICE_...
export const REASON = 'pacchetto_codice_'

export const normCode = (s: unknown) => (typeof s === 'string' ? s.trim().toUpperCase() : '')
export const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,39}$/
export const codeOf = (store: AffiliateStore, email: string) => Object.entries(store.codes).find(([, v]) => v.owner.toLowerCase() === email.toLowerCase())?.[0] ?? null
