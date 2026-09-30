import { createHmac } from 'crypto'

// Firma per il link "non ricevere piu' email" (niente login per disiscriversi, ma nessuno puo' disiscrivere altri)
export const unsubSig = (uid: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').update(`unsub:${uid}`).digest('hex').slice(0, 32)
export const unsubUrl = (uid: string) => `https://agenteimmo.me/api/unsubscribe-marketing?u=${uid}&s=${unsubSig(uid)}`
