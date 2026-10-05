// Testi dei video: prezzi it-IT, misure, giorni. Campi vuoti -> null, cosi' il layout li salta.
export type Contract = 'vendita' | 'affitto'

// niente trattini lunghi nei testi (regola della piattaforma): diventano virgole
export const clean = (s: string | undefined) => (s ?? '').replace(/\s*[–—]\s*/g, ', ').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim()

export function truncate(s: string, max: number): string {
  const t = clean(s)
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:]+$/, '')}…`
}

export const groupIt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const euro = (n: number) => `€ ${groupIt(n)}`

// prezzo come lo scrive l'agente: "340000", "340.000 €", "€ 340.000,00", "Trattativa riservata"
export type Price = { kind: 'num'; value: number; suffix: string } | { kind: 'text'; text: string }
export function parsePrice(p: string, contract: Contract): Price | null {
  const s = clean(p).slice(0, 40)
  if (!s) return null
  if (/^[€\s\d.,']+(€|eur|euro)?(\s*\/\s*mese)?$/i.test(s) && /\d/.test(s)) {
    const n = Number(s.replace(/\/\s*mese/i, '').replace(/[,]\d{1,2}\s*(€|eur|euro)?\s*$/i, '').replace(/[^\d]/g, '').slice(0, 10))
    if (Number.isFinite(n) && n > 0) return { kind: 'num', value: n, suffix: contract === 'affitto' ? '/mese' : '' }
  }
  return { kind: 'text', text: s }
}

const digits = (s: string) => clean(s).replace(/[^\d.,]/g, '').slice(0, 6)
export type Fact = { key: 'mq' | 'rooms'; label: string; value: string; unit: string }
export function facts(mq: string, rooms: string): Fact[] {
  const out: Fact[] = []
  const m = digits(mq), r = digits(rooms)
  if (m && Number(m.replace(',', '.')) > 0) out.push({ key: 'mq', label: 'Superficie', value: m, unit: 'm²' })
  if (r && Number(r.replace(',', '.')) > 0) out.push({ key: 'rooms', label: 'Locali', value: r, unit: r === '1' ? 'locale' : 'locali' })
  return out
}

export function daysText(d: string): string {
  const n = Number(clean(d).replace(/[^\d]/g, '').slice(0, 4))
  return n > 0 ? `in ${n} ${n === 1 ? 'giorno' : 'giorni'}` : ''
}

export const contractWord = (c: Contract) => (c === 'affitto' ? 'In affitto' : 'In vendita')
export const doneWord = (c: Contract) => (c === 'affitto' ? 'Affittato' : 'Venduto')

// "rossimmobiliare.it/" e "https://www..." -> "rossimmobiliare.it"
export const siteText = (s: string) => clean(s).replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
