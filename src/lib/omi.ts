// Quotazioni OMI (Osservatorio del Mercato Immobiliare, Agenzia delle Entrate) per la valutazione casa.
// Fonte: Agenzia delle Entrate - OMI, licenza CC BY 4.0 (https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi/forniture-dati-omi).
//
// Due livelli:
// 1. ZONA (preciso): file preparati da scripts/omi-import.mjs a partire dalla fornitura "Perimetri delle zone OMI"
//    (QIP<n>_<codicefiscale>.zip, scaricata dal proprietario con SPID ogni semestre). Si leggono da data/omi/ in locale
//    (o OMI_DIR) oppure da R2 (R2_PUBLIC_URL/omi/...): latest.json -> <sem>/valori.json + <sem>/zone/<codcom>.json.
//    L'indirizzo cade in un poligono della zona: si prende min e max di quella zona per la tipologia.
// 2. COMUNE (riserva, finche' i file sopra non ci sono): prezzo medio OMI del comune (2° semestre 2025, media elaborata
//    da Evitalya, CC BY 4.0) in src/data/omiComuni.json, con un margine dichiarato del 15% sopra e sotto.
import comuniAvg from '@/data/omiComuni.json'

export type OmiQuote = {
  level: 'zona' | 'comune'
  comune: string
  zona: string // codice zona OMI (es. B12), vuoto a livello comune
  zonaDescr: string
  tipologia: string // "Abitazioni civili", "Ville e villini", ...
  tipologiaFallback: boolean // true = quotazione della finitura scelta non disponibile (si corregge a percentuale)
  min: number // euro al m²
  max: number
  superficie: 'lorda' | 'netta'
  semestre: string // "2° semestre 2025"
  fonte: string
  media?: number // solo riserva comunale: prezzo medio del comune da cui viene l'intervallo (+-15%)
}

// formato dei file preparati da scripts/omi-import.mjs
type Q = [number, number, 'L' | 'N'] // min, max, superficie
type ValoriFile = { semestre: string; comuni: Record<string, { n: string; p: string; z: Record<string, { d: string; f: string; q: Record<string, Q> }> }> }
type ZoneFile = { z: string; b: [number, number, number, number]; r: number[][] }[]

const FONTE = 'Agenzia delle Entrate - OMI, CC BY 4.0'
const TIP: Record<string, string> = { '20': 'Abitazioni civili', '19': 'Abitazioni signorili', '21': 'Abitazioni di tipo economico', '1': 'Ville e villini', '22': 'Abitazioni tipiche dei luoghi' }
const TTL = 12 * 3600_000
export const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const semLabel = (s: string) => `${s.slice(4)}° semestre ${s.slice(0, 4)}` // 20252 -> 2° semestre 2025

// file dei dati OMI da R2 (caricati da scripts/omi-import.mjs). Niente lettura da disco: col percorso calcolato da
// process.cwd() il tracer di Next metteva tutto il progetto nelle funzioni (oltre 250 MB, deploy fallito il 05/10).
async function readOmi<T>(rel: string): Promise<T | null> {
  const base = process.env.OMI_BASE_URL || (process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL}/omi` : '')
  if (!base) return null
  return fetch(`${base}/${rel}`, { signal: AbortSignal.timeout(15000) }).then(r => (r.ok ? r.json() : null)).catch(() => null)
}

let valori: { at: number; v: (ValoriFile & { byName: Map<string, string[]> }) | null } | null = null
async function loadValori() {
  if (valori && Date.now() - valori.at < TTL) return valori.v
  const latest = await readOmi<{ semestre: string }>('latest.json')
  const v = latest && await readOmi<ValoriFile>(`${latest.semestre}/valori.json`)
  // nome del comune -> codici catastali (i comuni omonimi si distinguono con la provincia)
  const byName = new Map<string, string[]>()
  if (v) for (const [cod, c] of Object.entries(v.comuni)) { const k = norm(c.n); byName.set(k, [...(byName.get(k) ?? []), cod]) }
  valori = { at: v ? Date.now() : Date.now() - TTL + 3600_000, v: v ? { ...v, byName } : null } // senza file si riprova dopo 1 ora
  return valori.v
}

const zoneCache = new Map<string, { at: number; v: ZoneFile | null }>()
async function loadZone(sem: string, cod: string) {
  const k = `${sem}/${cod}`, c = zoneCache.get(k)
  if (c && Date.now() - c.at < TTL) return c.v
  const v = await readOmi<ZoneFile>(`${sem}/zone/${cod}.json`)
  if (zoneCache.size > 300) zoneCache.clear()
  zoneCache.set(k, { at: Date.now(), v })
  return v
}

// punto nel poligono (pari-dispari su tutti gli anelli della zona: i buchi si escludono da soli)
function inside(lon: number, lat: number, rings: number[][]) {
  let ins = false
  for (const r of rings) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ins = !ins
  }
  return ins
}

// nome da Nominatim -> varianti da cercare ("Bolzano - Bozen" -> "bolzano", "Reggio nell'Emilia" -> come scritto)
const nameKeys = (comune: string) => [...new Set([comune, comune.split(/\s[-/]\s|\//)[0]].map(norm))]

// tipologie OMI da provare, in ordine, per tipo di casa e finitura
function tipOrder(tipo: string, finitura: string) {
  if (tipo === 'villa' || tipo === 'schiera') return ['1', '20']
  if (finitura === 'signorile') return ['19', '20']
  if (finitura === 'economica') return ['21', '20']
  return ['20', '21', '19']
}

export async function findOmiQuote(o: { lat: number; lon: number; comune: string; prov: string; tipo: string; finitura: string }): Promise<OmiQuote | null> {
  const wanted = tipOrder(o.tipo, o.finitura)
  const v = await loadValori().catch(() => null)
  if (v) {
    const cods = nameKeys(o.comune).flatMap(k => v.byName.get(k) ?? [])
    const cod = cods.find(c => !o.prov || v.comuni[c].p === o.prov) ?? (cods.length === 1 ? cods[0] : undefined)
    const com = cod ? v.comuni[cod] : undefined
    if (cod && com) {
      const zones = await loadZone(v.semestre, cod).catch(() => null)
      const hit = zones?.find(z => o.lon >= z.b[0] && o.lat >= z.b[1] && o.lon <= z.b[2] && o.lat <= z.b[3] && inside(o.lon, o.lat, z.r))
      const zone = hit && com.z[hit.z]
      const pick = (q: Record<string, Q>) => { const t = wanted.find(t => q[t]); return t ? { t, q: q[t] } : null }
      const p = zone && pick(zone.q)
      if (hit && zone && p) return {
        level: 'zona', comune: com.n, zona: hit.z, zonaDescr: zone.d, tipologia: TIP[p.t] ?? 'Abitazioni', tipologiaFallback: p.t !== wanted[0] || (p.t === '20' && o.finitura !== 'civile'),
        min: p.q[0], max: p.q[1], superficie: p.q[2] === 'N' ? 'netta' : 'lorda', semestre: semLabel(v.semestre), fonte: FONTE,
      }
      // indirizzo fuori dai poligoni (o comune senza perimetri): media delle zone del comune, stessa tipologia
      const all = Object.values(com.z).map(z => pick(z.q)).filter((x): x is NonNullable<typeof x> => !!x)
      const same = all.filter(x => x.t === all[0]?.t)
      if (same.length) return {
        level: 'comune', comune: com.n, zona: '', zonaDescr: '', tipologia: TIP[same[0].t] ?? 'Abitazioni', tipologiaFallback: same[0].t !== wanted[0] || (same[0].t === '20' && o.finitura !== 'civile'),
        min: Math.round(same.reduce((s, x) => s + x.q[0], 0) / same.length), max: Math.round(same.reduce((s, x) => s + x.q[1], 0) / same.length),
        superficie: 'lorda', semestre: semLabel(v.semestre), fonte: FONTE,
      }
    }
  }
  // riserva: prezzo medio del comune (nessuna tipologia: le correzioni per finitura si applicano a percentuale)
  const rows = (comuniAvg as { comuni: Record<string, number> }).comuni
  const keys = nameKeys(o.comune)
  let avg = keys.map(k => rows[`${o.prov}|${k}`]).find(Boolean)
  if (!avg && !o.prov) { const m = Object.entries(rows).filter(([k]) => keys.includes(k.split('|')[1])); if (m.length === 1) avg = m[0][1] }
  if (!avg) return null
  return {
    level: 'comune', comune: o.comune, zona: '', zonaDescr: '', tipologia: 'Abitazioni (media del comune)', tipologiaFallback: true,
    min: Math.round(avg * 0.85), max: Math.round(avg * 1.15), media: avg, superficie: 'lorda', semestre: comuniAvg.semestre,
    fonte: 'Agenzia delle Entrate - OMI, media per comune elaborata da Evitalya (evitalya.com), CC BY 4.0',
  }
}
