// Eventi di conversione verso Meta Pixel (fbq) e Google Analytics 4 (gtag), solo col consenso ai cookie.
// Gli script partono in lazyOnload e spesso dopo un evento c'e' un redirect: l'evento resta in coda nel browser
// (localStorage) e parte appena il tag e' pronto, anche alla pagina dopo (flush da AnalyticsEvents, su ogni pagina).
//
// Eventi:
//   Lead                 → clic su "prenota una demo" (Cal.com)
//   CompleteRegistration → account nuovo, con email o con Google (checkout/agency, proceedAfterLogin)
//   StartTrial           → prima foto della prova gratis (landing)
//   Purchase             → piano o pacchetto pagato su Stripe (ritorno a #/piano?ok=1&sid=...), eventID = sessione Stripe,
//                          lo stesso che manda il server con la Conversions API (lib/metaCapi): Meta li conta una volta
//   Subscribe            → vecchie pagine di successo (checkout/success)
import { readConsent } from '@/components/Trackers'

type FbEvent = 'Lead' | 'CompleteRegistration' | 'StartTrial' | 'Purchase' | 'Subscribe'
const GA_NAME: Record<FbEvent, string> = {
  Lead: 'generate_lead',
  CompleteRegistration: 'sign_up',
  StartTrial: 'start_trial',
  Purchase: 'purchase',
  Subscribe: 'purchase',
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}

type Item = { e: FbEvent; p: Record<string, unknown>; id: string; at: number; fb?: 1; ga?: 1 }
const Q = 'agenteimmo:events'
const DONE = 'agenteimmo:events-done'
const UID = 'agenteimmo:uid'
let uidSet = false
const load = (k: string) => { try { return JSON.parse(localStorage.getItem(k) ?? '[]') } catch { return [] } }

// manda quello che si puo' (Pixel col consenso marketing, GA4 con quello statistiche); il resto aspetta, al massimo 1 giorno
export function flush() {
  if (typeof window === 'undefined') return
  const c = readConsent()
  // account collegato (identify): GA4 lega gli eventi all'utente (user_id = id interno, niente email)
  const uid = localStorage.getItem(UID)
  if (uid && c?.stats && window.gtag && !uidSet) { try { window.gtag('set', { user_id: uid }); uidSet = true } catch { /* ga non pronto */ } }
  const left = (load(Q) as Item[]).filter(it => {
    if (Date.now() - it.at > 86_400_000) return false
    if (!it.fb && c?.ads && window.fbq) { try { window.fbq('track', it.e, it.p, { eventID: it.id }); it.fb = 1 } catch { /* pixel non pronto */ } }
    if (!it.ga && c?.stats && window.gtag) { try { window.gtag('event', GA_NAME[it.e], it.p); it.ga = 1 } catch { /* ga non pronto */ } }
    return !((it.fb || !c?.ads) && (it.ga || !c?.stats))
  })
  try { localStorage.setItem(Q, JSON.stringify(left)) } catch { /* niente storage */ }
}

// once: chiave per mandare l'evento una volta sola in questo browser (es. id utente, sessione Stripe)
export function track(event: FbEvent, params: Record<string, unknown> = {}, once?: string) {
  if (typeof window === 'undefined') return
  const c = readConsent()
  if (!c?.ads && !c?.stats) return // senza consenso niente coda
  const id = once ?? `${event}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  if (once) {
    const done = load(DONE) as string[]
    if (done.includes(once)) return
    try { localStorage.setItem(DONE, JSON.stringify([...done, once].slice(-50))) } catch { /* niente storage */ }
  }
  try { localStorage.setItem(Q, JSON.stringify([...load(Q), { e: event, p: params, id, at: Date.now() }])) } catch { /* niente storage */ }
  flush()
}

// cookie del Pixel per la Conversions API (migliorano l'abbinamento dell'utente lato server)
export const fbCookies = () => {
  if (typeof document === 'undefined') return {}
  const get = (n: string) => document.cookie.match(new RegExp(`(?:^|; )${n}=([^;]+)`))?.[1]
  return { fbp: get('_fbp'), fbc: get('_fbc') }
}

// da mandare al checkout: consenso marketing e cookie del Pixel, cosi' il server sa se puo' mandare l'acquisto a Meta
export const adsInfo = () => (readConsent()?.ads ? { ads: true, ...fbCookies() } : {})

// account entrato in piattaforma: da qui gli eventi GA4 portano il suo id (per sapere quale account ha fatto cosa)
export function identify(userId: string) {
  if (typeof window === 'undefined' || !userId) return
  try { if (localStorage.getItem(UID) !== userId) { localStorage.setItem(UID, userId); uidSet = false } } catch { /* niente storage */ }
  flush()
}
