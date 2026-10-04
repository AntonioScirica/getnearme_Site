// Pagine "Prezzo case <città> al metro quadro" (/it/prezzi-case/<slug>): dati da src/data/omiCitta.json
// (generato da scripts/omi-citta.mjs dalle quotazioni OMI) e testi che cambiano con i numeri di ogni città.
// Fonte: Agenzia delle Entrate, OMI, licenza CC BY 4.0.
import data from '@/data/omiCitta.json'

export type Range = [number, number]
export type CityZone = { c: string; d: string; f: string; civ: Range | null; sig: Range | null; eco: Range | null; vil: Range | null; netta?: boolean }
export type City = {
  slug: string; nome: string; prov: string; regione: string; cod: string; lat: number; lon: number
  zone: CityZone[]
  vicine: string[]
  s: { n: number; nCiv: number; nSig: number; min: number; max: number; avgMin: number; avgMax: number; centro: number | null; semicentro: number | null; periferia: number | null; cheap: string[]; dear: string[]; rank: number }
}

export const OMI_SEMESTRE = data.semestre // "2° semestre 2025"
export const OMI_ANNO = data.sem.slice(0, 4)
export const OMI_CREDIT = `Fonte: Agenzia delle Entrate, OMI, ${OMI_SEMESTRE}, CC BY 4.0`
export const OMI_SOURCE_URL = 'https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi/banche-dati/quotazioni-immobiliari'
export const CITIES = data.citta as unknown as City[]
export const cityBySlug = (slug: string) => CITIES.find(c => c.slug === slug)
export const cityUrl = (slug: string) => `https://agenteimmo.me/it/prezzi-case/${slug}`
export const valuationHref = (c?: City) => `/it/quanto-vale-la-mia-casa${c ? `?citta=${encodeURIComponent(c.nome)}` : ''}#valuta`

export const FASCE: Record<string, string> = { B: 'Centro', C: 'Semicentro', D: 'Periferia', E: 'Zone suburbane', R: 'Zone extraurbane e rurali' }

// 4500 -> "4.500" (punto delle migliaia anche sotto 10.000, come si scrive in italiano)
export const eur = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const k = (n: number) => Math.round(n / 1000) * 1000
export const mid = (r: Range) => (r[0] + r[1]) / 2
export const zoneOf = (c: City, code: string) => c.zone.find(z => z.c === code)!
export const worth = (c: City, mq: number): Range => [k(c.s.avgMin * mq), k(c.s.avgMax * mq)]

export function cityTitle(c: City) {
  const t = `Prezzo case ${c.nome} al m²: quotazioni per zona ${OMI_ANNO}`
  return t.length <= 60 ? t : `Prezzo case ${c.nome} al m²: zone e valori ${OMI_ANNO}`
}

// description 140-155 caratteri: si prova la versione più ricca, poi le più corte
export function cityDescription(c: City) {
  const r = `${eur(c.s.avgMin)}-${eur(c.s.avgMax)} €/m²`
  const opts = [
    `Prezzo delle case ${aCity(c)} al metro quadro: in media ${r}, zona per zona, dalle quotazioni OMI ${OMI_ANNO}. Scopri gratis quanto vale la tua casa.`,
    `Prezzo case ${aCity(c)} al metro quadro: in media ${r}, zona per zona, con le quotazioni OMI ${OMI_ANNO}. Scopri gratis quanto vale la tua casa.`,
    `Prezzo case ${aCity(c)} al m²: in media ${r}, zona per zona, dalle quotazioni OMI ${OMI_ANNO}. Calcola gratis quanto vale la tua casa.`,
    `Prezzo case ${c.nome} al m²: in media ${r} per zona, quotazioni OMI ${OMI_ANNO}. Calcola gratis il valore della tua casa.`,
  ]
  return opts.find(d => d.length >= 140 && d.length <= 155) ?? opts.find(d => d.length <= 155) ?? opts[opts.length - 1]
}

const pct = (a: number, b: number) => Math.round((a / b - 1) * 100)
// "a Milano", "ad Ancona"; "il 24%", "l'81%"
export const aCity = (c: City) => `${/^[aA]/.test(c.nome) ? 'ad' : 'a'} ${c.nome}`
const thePct = (n: number) => `${/^8/.test(String(n)) || n === 11 ? "l'" : 'il '}${n}%`
// descrizione della zona senza le parentesi (vie di riferimento): per le frasi, la tabella ha quella completa
export const short = (z: CityZone) => z.d.replace(/\s*\([^()]*\)/g, '').replace(/\s*\([^()]*\)/g, '').trim() || z.d

// testo introduttivo: frasi scelte e riempite con i numeri della città (nessuna frase uguale per tutte)
export function cityParagraphs(c: City): string[] {
  const s = c.s, all = CITIES.length
  const dear = zoneOf(c, s.dear[0]), cheap = zoneOf(c, s.cheap[0])
  const out: string[] = []

  const tier = s.rank <= 5 ? `è una delle città più care d'Italia: ${s.rank === 1 ? 'la prima' : `la ${s.rank}ª`} delle ${all} grandi città che confrontiamo`
    : s.rank <= 20 ? `ha prezzi sopra la media delle grandi città italiane (${s.rank}ª su ${all} in questo confronto)`
    : s.rank <= all - 20 ? `sta nella fascia di mezzo tra le grandi città italiane (${s.rank}ª su ${all} per prezzo medio)`
    : `è tra le città capoluogo più accessibili per comprare casa (${s.rank}ª su ${all} per prezzo medio)`
  out.push(`Secondo le quotazioni OMI dell'Agenzia delle Entrate (${OMI_SEMESTRE}), ${aCity(c)} un'abitazione civile in stato normale costa in media tra ${eur(s.avgMin)} e ${eur(s.avgMax)} € al metro quadro. Con questi valori ${c.nome} ${tier}.`)

  const ratio = mid(dear.civ!) / mid(cheap.civ!)
  const spread = ratio >= 3 ? `Le differenze tra un quartiere e l'altro sono fortissime: nella zona più cara si paga circa ${Math.round(ratio)} volte il prezzo della più economica`
    : ratio >= 1.8 ? `Tra un quartiere e l'altro la differenza è netta: la zona più cara costa circa ${thePct(pct(mid(dear.civ!), mid(cheap.civ!)))} in più della più economica`
    : `I prezzi sono abbastanza omogenei: tra la zona più cara e la più economica ci sono circa ${eur(Math.round((mid(dear.civ!) - mid(cheap.civ!)) / 10) * 10)} € al metro quadro di differenza`
  out.push(`${spread}. Si va dai ${eur(cheap.civ![0])} € al m² della zona ${cheap.c} (${short(cheap)}) fino ai ${eur(dear.civ![1])} € al m² della zona ${dear.c} (${short(dear)}).`)

  if (s.centro && s.periferia) {
    const d = pct(s.centro, s.periferia)
    out.push(d >= 15 ? `Il centro pesa molto sul prezzo: nelle zone centrali il valore medio è di circa ${eur(s.centro)} € al m², contro i ${eur(s.periferia)} € delle zone periferiche e suburbane, cioè ${thePct(d)} in più.`
      : d <= -5 ? `Qui succede una cosa poco comune: le zone periferiche e suburbane hanno quotazioni medie più alte del centro (circa ${eur(s.periferia)} € al m² contro ${eur(s.centro)} €). Conta più il singolo quartiere che la distanza dal centro.`
      : `Tra centro e periferia la distanza è contenuta: circa ${eur(s.centro)} € al m² nelle zone centrali e ${eur(s.periferia)} € in quelle periferiche e suburbane.`)
  }

  const peers = CITIES.filter(o => o !== c && o.regione === c.regione)
  if (peers.length) {
    const avg = (o: City) => (o.s.avgMin + o.s.avgMax) / 2
    const cheaper = peers.filter(o => avg(o) < avg(c)).length
    const inReg = c.regione === 'Marche' ? 'Nelle Marche' : `In ${c.regione}`
    const names = peers.slice(0, 3).map(o => o.nome).join(', ')
    const list = (xs: City[]) => xs.length === 1 ? xs[0].nome : `${xs.slice(0, -1).map(o => o.nome).join(', ')} e ${xs[xs.length - 1].nome}`
    out.push(cheaper === peers.length ? `${inReg} è la città più cara tra quelle che confrontiamo (${names}${peers.length > 3 ? ' e altre' : ''}).`
      : cheaper === 0 ? `${inReg} è la più economica tra le città che confrontiamo (${names}${peers.length > 3 ? ' e altre' : ''}).`
      : `${inReg} le case di ${c.nome} costano in media più che ${list(peers.filter(o => avg(o) < avg(c)).map(o => ({ ...o, nome: aCity(o) })))}, meno che ${list(peers.filter(o => avg(o) >= avg(c)).map(o => ({ ...o, nome: aCity(o) })))}.`)
  }
  if (s.nSig) out.push(`In ${s.nSig === 1 ? 'una zona' : `${s.nSig} zone`} l'OMI pubblica anche le quotazioni delle abitazioni signorili, cioè palazzi e appartamenti di pregio: le trovi nella tabella accanto a quelle delle case civili.`)
  return out
}

export function cityFaq(c: City): [string, string][] {
  const s = c.s, dear = zoneOf(c, s.dear[0]), cheap = zoneOf(c, s.cheap[0])
  const [a90, b90] = worth(c, 90)
  return [
    [`Quanto costano le case ${aCity(c)} al metro quadro?`, `In media tra ${eur(s.avgMin)} e ${eur(s.avgMax)} € al metro quadro per un'abitazione civile in stato normale, secondo le quotazioni OMI dell'Agenzia delle Entrate del ${OMI_SEMESTRE}. Nelle singole zone si va da ${eur(s.min)} a ${eur(s.max)} € al m².`],
    [`Qual è la zona più cara di ${c.nome}?`, `Per le abitazioni civili è la zona OMI ${dear.c} (${short(dear)}), con quotazioni tra ${eur(dear.civ![0])} e ${eur(dear.civ![1])} € al metro quadro.${dear.sig ? ` Per le case signorili nella stessa zona si arriva a ${eur(dear.sig[1])} € al m².` : ''}`],
    [`Qual è la zona più economica di ${c.nome}?`, `È la zona OMI ${cheap.c} (${short(cheap)}), con quotazioni tra ${eur(cheap.civ![0])} e ${eur(cheap.civ![1])} € al metro quadro per le abitazioni civili.`],
    [`Quanto vale un appartamento di 90 m² ${aCity(c)}?`, `Con le quotazioni medie della città, un appartamento di 90 metri quadri commerciali in stato normale vale indicativamente tra ${eur(a90)} e ${eur(b90)} €. Il valore vero dipende dalla zona, dal piano, dallo stato e dagli extra come box o terrazzo: per una stima sulla tua casa usa la valutazione gratuita.`],
    [`Come faccio a sapere quanto vale la mia casa ${aCity(c)}?`, `Con la valutazione gratuita di Agente Immo: scrivi l'indirizzo, rispondi a poche domande sulla casa e ricevi per email una stima basata sulla quotazione OMI della tua zona, corretta per piano, stato ed extra. È indicativa e non sostituisce una perizia.`],
  ]
}
