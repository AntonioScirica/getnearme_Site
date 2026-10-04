// Stima indicativa del valore di una casa per i proprietari (pagina /it/quanto-vale-la-mia-casa).
// Base: quotazioni OMI dell'Agenzia delle Entrate (min e max in euro al metro quadro per zona e tipologia, stato
// conservativo normale), poi pochi coefficienti semplici e dichiarati (piano, ascensore, stato, extra, classe energetica).
// Non e' una perizia: il risultato e' un intervallo, con la spiegazione di ogni correzione.

import { geocode } from '@/lib/zone'
import { findOmiQuote, type OmiQuote } from '@/lib/omi'

export type ValuationInput = {
  address: string
  tipo: 'appartamento' | 'attico' | 'villa' | 'schiera'
  mq: number
  locali: number // 1..5 (5 = 5 o piu')
  bagni: number // 1..3 (3 = 3 o piu')
  piano: 'terra' | 'rialzato' | 'primo' | 'intermedio' | 'ultimo'
  ascensore: boolean
  stato: 'da_ristrutturare' | 'buono' | 'ristrutturato' | 'nuovo'
  finitura: 'economica' | 'civile' | 'signorile'
  extra: ('box' | 'posto_auto' | 'balcone' | 'terrazzo' | 'giardino' | 'cantina')[]
  energia: 'ab' | 'cd' | 'efg' | 'non_so'
}

export type Factor = { label: string; pct: number }
export type ValuationResult = {
  min: number // euro, arrotondati
  max: number
  value: number // valore centrale
  eurMqMin: number
  eurMqMax: number
  eurMq: number
  mq: number
  factors: Factor[] // correzioni applicate (pct = +5 vuol dire +5%)
  omi: OmiQuote // da dove vengono i prezzi (zona, tipologia, semestre, livello: zona o comune)
}

export type Place = { lat: number; lon: number; luogo: string; comune: string; prov: string }

const ENUMS = {
  tipo: ['appartamento', 'attico', 'villa', 'schiera'],
  piano: ['terra', 'rialzato', 'primo', 'intermedio', 'ultimo'],
  stato: ['da_ristrutturare', 'buono', 'ristrutturato', 'nuovo'],
  finitura: ['economica', 'civile', 'signorile'],
  energia: ['ab', 'cd', 'efg', 'non_so'],
  extra: ['box', 'posto_auto', 'balcone', 'terrazzo', 'giardino', 'cantina'],
} as const

// dati dal browser -> input pulito (null se manca qualcosa o e' fuori scala)
export function parseInput(b: Record<string, unknown>): ValuationInput | null {
  const pick = <T extends string>(v: unknown, list: readonly T[]) => (list as readonly unknown[]).includes(v) ? v as T : null
  const address = typeof b.address === 'string' ? b.address.trim().slice(0, 200) : ''
  const mq = Math.round(Number(b.mq)), locali = Math.round(Number(b.locali)), bagni = Math.round(Number(b.bagni))
  const tipo = pick(b.tipo, ENUMS.tipo), piano = pick(b.piano, ENUMS.piano), stato = pick(b.stato, ENUMS.stato)
  const finitura = pick(b.finitura, ENUMS.finitura), energia = pick(b.energia, ENUMS.energia)
  const extra = Array.isArray(b.extra) ? [...new Set(b.extra.map(x => pick(x, ENUMS.extra)).filter((x): x is ValuationInput['extra'][number] => !!x))] : []
  if (address.length < 6 || !tipo || !piano || !stato || !finitura || !energia) return null
  if (!(mq >= 15 && mq <= 2000) || !(locali >= 1 && locali <= 5) || !(bagni >= 1 && bagni <= 3)) return null
  return { address, tipo, mq, locali, bagni, piano, ascensore: b.ascensore === true, stato, finitura, extra, energia }
}

// Indirizzo -> coordinate, comune e sigla della provincia (Nominatim reverse: "ISO3166-2-lvl6" = IT-RM).
export async function locate(address: string): Promise<Place | null> {
  const g = await geocode(address)
  if (!g) return null
  const lat = Number(g.lat), lon = Number(g.lon)
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&addressdetails=1&lat=${lat}&lon=${lon}`, {
    headers: { 'User-Agent': 'Agente Immo/1.0 (https://agenteimmo.me)', 'Accept-Language': 'it' }, signal: AbortSignal.timeout(8000),
  }).then(r => (r.ok ? r.json() : null)).catch(() => null) as { address?: Record<string, string> } | null
  const a = r?.address ?? {}
  const comune = a.city || a.town || a.village || a.municipality || ''
  const prov = (a['ISO3166-2-lvl6'] ?? '').replace(/^IT-/, '') // sigla della provincia (per i comuni omonimi)
  if (!comune) return null
  return { lat, lon, luogo: g.display_name, comune, prov }
}

// Coefficienti: correzioni percentuali tipiche delle stime sintetiche (quotazione OMI = stato normale, piano medio).
// Piccoli e dichiarati: servono a spostare la stima dentro e poco fuori dall'intervallo OMI, non a inventare prezzi.
// Gli stessi numeri sono nella tabella della pagina (FACTOR_TABLE): si cambiano solo qui.
export const PCT = {
  signorile: 15, economica: -12, schiera: -8, attico: 8,
  terra: -8, rialzato: -5, primoSenza: -2, altoSenza: -8, ultimoCon: 3, ultimoSenza: -10, atticoSenza: -8,
  daRistrutturare: -15, ristrutturato: 8, nuovo: 15,
  piccolo: 5, grande: -5, doppiServizi: 2, unBagno: -3,
  box: 5, postoAuto: 2, terrazzo: 4, balcone: 2, giardino: 5, cantina: 1,
  ab: 5, efg: -4,
} as const

// righe per la pagina: [fattore, correzione]
export const FACTOR_TABLE: [string, string][] = [
  ['Piano terra / rialzato', `${PCT.terra}% / ${PCT.rialzato}%`],
  ['Piano alto senza ascensore', `${PCT.altoSenza}%`],
  ['Ultimo piano con ascensore / senza', `+${PCT.ultimoCon}% / ${PCT.ultimoSenza}%`],
  ['Attico', `+${PCT.attico}%`],
  ['Da ristrutturare', `${PCT.daRistrutturare}%`],
  ['Ristrutturata da poco / nuova', `+${PCT.ristrutturato}% / +${PCT.nuovo}%`],
  ['Box auto / posto auto', `+${PCT.box}% / +${PCT.postoAuto}%`],
  ['Terrazzo / balcone', `+${PCT.terrazzo}% / +${PCT.balcone}%`],
  ['Giardino privato (appartamento)', `+${PCT.giardino}%`],
  ['Classe energetica A o B / E, F o G', `+${PCT.ab}% / ${PCT.efg}%`],
  ['Casa sotto 50 m² / appartamento sopra 150 m²', `+${PCT.piccolo}% / ${PCT.grande}%`],
]

export function factorsFor(i: ValuationInput, omi: OmiQuote): Factor[] {
  const f: Factor[] = []
  const add = (label: string, pct: number) => { if (pct) f.push({ label, pct }) }
  const house = i.tipo === 'villa' || i.tipo === 'schiera'

  // tipologia: se l'OMI non ha la quotazione della finitura scelta (signorile/economica) si corregge a percentuale
  if (omi.tipologiaFallback) {
    if (i.finitura === 'signorile') add('Palazzo o zona di pregio', PCT.signorile)
    if (i.finitura === 'economica') add('Edilizia popolare', PCT.economica)
  }
  if (i.tipo === 'schiera' && omi.tipologia.toLowerCase().includes('vill')) add('Villetta a schiera (non isolata)', PCT.schiera)
  if (i.tipo === 'attico') add('Attico', PCT.attico)

  if (!house && i.tipo !== 'attico') {
    const p = i.piano, lift = i.ascensore
    if (p === 'terra') add('Piano terra', PCT.terra)
    if (p === 'rialzato') add('Piano rialzato', PCT.rialzato)
    if (p === 'primo' && !lift) add('Primo piano senza ascensore', PCT.primoSenza)
    if (p === 'intermedio' && !lift) add('Piano alto senza ascensore', PCT.altoSenza)
    if (p === 'ultimo') add(lift ? 'Ultimo piano con ascensore' : 'Ultimo piano senza ascensore', lift ? PCT.ultimoCon : PCT.ultimoSenza)
  }
  if (i.tipo === 'attico' && !i.ascensore) add('Senza ascensore', PCT.atticoSenza)

  if (i.stato === 'da_ristrutturare') add('Da ristrutturare', PCT.daRistrutturare)
  if (i.stato === 'ristrutturato') add('Ristrutturata da poco', PCT.ristrutturato)
  if (i.stato === 'nuovo') add('Nuova costruzione', PCT.nuovo)

  if (i.mq < 50) add('Taglio piccolo (sotto 50 m²)', PCT.piccolo)
  else if (i.mq > 150 && !house) add('Taglio grande (sopra 150 m²)', PCT.grande)
  if (i.bagni >= 2 && i.locali <= 3) add('Doppi servizi', PCT.doppiServizi)
  if (i.bagni === 1 && i.locali >= 4) add('Un solo bagno per una casa grande', PCT.unBagno)

  if (i.extra.includes('box')) add('Box auto', PCT.box)
  else if (i.extra.includes('posto_auto')) add('Posto auto', PCT.postoAuto)
  if (i.extra.includes('terrazzo') && i.tipo !== 'attico') add('Terrazzo', PCT.terrazzo)
  else if (i.extra.includes('balcone')) add('Balcone', PCT.balcone)
  if (i.extra.includes('giardino') && !house) add('Giardino privato', PCT.giardino)
  if (i.extra.includes('cantina')) add('Cantina', PCT.cantina)

  if (i.energia === 'ab') add('Classe energetica A o B', PCT.ab)
  if (i.energia === 'efg') add('Classe energetica E, F o G', PCT.efg)
  return f
}

const round = (n: number, to: number) => Math.round(n / to) * to

export function computeValuation(i: ValuationInput, omi: OmiQuote): ValuationResult {
  const factors = factorsFor(i, omi)
  // correzioni sommate (non moltiplicate: piu' facili da leggere) e tenute tra -35% e +35%
  const k = 1 + Math.max(-35, Math.min(35, factors.reduce((s, x) => s + x.pct, 0))) / 100
  const eurMqMin = round(omi.min * k, 10), eurMqMax = round(omi.max * k, 10)
  const eurMq = round((eurMqMin + eurMqMax) / 2, 10)
  return {
    min: round(eurMqMin * i.mq, 1000), max: round(eurMqMax * i.mq, 1000), value: round(eurMq * i.mq, 1000),
    eurMqMin, eurMqMax, eurMq, mq: i.mq, factors, omi,
  }
}

// tutto insieme: indirizzo -> luogo -> quotazione OMI -> stima. null = indirizzo non trovato o zona senza quotazioni.
export async function valuate(i: ValuationInput, place?: Place | null) {
  const p = place ?? await locate(i.address)
  if (!p) return { place: null, result: null }
  const omi = await findOmiQuote({ lat: p.lat, lon: p.lon, comune: p.comune, prov: p.prov, tipo: i.tipo, finitura: i.finitura })
  return { place: p, result: omi ? computeValuation(i, omi) : null }
}

export const DISCLAIMER = 'Stima indicativa basata sulle quotazioni OMI dell\'Agenzia delle Entrate, non è una perizia.'
export const eur = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`
