// Servizi nella zona di un indirizzo, da OpenStreetMap (gratis): Nominatim per le
// coordinate, Overpass per i punti di interesse entro RADIUS. Stessa fonte usata
// dall'estensione. Risultato: poche righe pronte per l'AI e per la pagina della casa.

const RADIUS = 1200
const UA = 'Agente Immo/1.0 (https://agenteimmo.me)'
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']

export type Poi = { categoria: string; nome: string; distanza: number; lat?: number; lon?: number }
export type Zone = { lat: number; lon: number; luogo: string; pois: Poi[] }

const CATS: { key: string; label: string; filter: string; max: number }[] = [
  { key: 'metro', label: 'Metro', filter: '["station"="subway"]', max: 3 },
  { key: 'treno', label: 'Stazione', filter: '["railway"="station"]["station"!="subway"]', max: 2 },
  { key: 'tram', label: 'Tram', filter: '["railway"="tram_stop"]', max: 2 },
  { key: 'super', label: 'Supermercato', filter: '["shop"="supermarket"]', max: 3 },
  { key: 'scuola', label: 'Scuola', filter: '["amenity"~"^(school|kindergarten)$"]', max: 3 },
  { key: 'uni', label: 'Università', filter: '["amenity"="university"]', max: 2 },
  { key: 'parco', label: 'Parco', filter: '["leisure"="park"]', max: 3 },
  { key: 'ospedale', label: 'Ospedale', filter: '["amenity"="hospital"]', max: 2 },
  { key: 'farmacia', label: 'Farmacia', filter: '["amenity"="pharmacy"]', max: 2 },
]

const dist = (a: number, b: number, c: number, d: number) => {
  const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)))
}

// Indirizzo -> coordinate (Nominatim). "Via Mazzini 20, Verona" a testo libero finiva a Villafranca di Verona: con la
// citta' in fondo si cerca prima la via dentro i confini della citta', poi a testo libero.
type Hit = { lat: string; lon: string; display_name: string }
// null = servizio non raggiungibile o limitato (429), [] = nessun risultato: sono due cose diverse
const nomi = (qs: string) => fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&${qs}`, {
  headers: { 'User-Agent': UA, 'Accept-Language': 'it' }, signal: AbortSignal.timeout(8000),
}).then(r => (r.ok ? r.json() : null)).catch(() => null) as Promise<(Hit & { boundingbox?: string[] })[] | null>

// Riserva quando Nominatim non risponde o ci limita: Photon (komoot, stessi dati OpenStreetMap). Si cerca dentro i
// confini della citta' e si accetta solo un risultato con la stessa via (civico se c'e', altrimenti la via): Photon a
// testo libero restituisce anche fontane o chiese col nome simile.
type PhotonF = { geometry: { coordinates: [number, number] }; properties: { name?: string; street?: string; housenumber?: string; city?: string; countrycode?: string; extent?: number[] } }
const photon = (qs: string) => fetch(`https://photon.komoot.io/api/?limit=5&${qs}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })
  .then(r => (r.ok ? r.json() : null)).then(d => (d?.features ?? null) as PhotonF[] | null).catch(() => null)
const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
// "Via Roma 5, Milano", "Via Roma, 5, Centro, Milano", "Via Roma, 5" (senza citta'): via, civico e citta'.
// La citta' e' l'ultima parte solo se ha lettere (prima "120" finiva come citta' vuota e il civico si perdeva).
function parseAddr(address: string) {
  const parts = address.split(',').map(x => x.trim()).filter(Boolean)
  const isNum = (x: string) => /^\d+\s*[a-z]?(\/\w+)?$/i.test(x)
  const last = parts[parts.length - 1] ?? ''
  const city = parts.length > 1 && !isNum(last) ? last.replace(/\d+/g, '').trim() : ''
  const m = (parts[0] ?? '').match(/^(.*?)[\s,]+(\d+\s*[a-z]?)$/i)
  const street = (m ? m[1] : parts[0] ?? '').trim()
  const num = (m?.[2] ?? parts.slice(1).find(isNum) ?? '').replace(/\s+/g, '').split('/')[0]
  return { parts, city, street, num }
}

async function viaPhoton(address: string): Promise<Hit | 'down' | null> {
  const { city, street, num } = parseAddr(address)
  let bbox = ''
  if (city) {
    const c = await photon(`q=${encodeURIComponent(city)}&layer=city`)
    if (!c) return 'down'
    const e = c.find(f => f.properties.countrycode === 'IT')?.properties.extent
    if (e) bbox = `&bbox=${e[0]},${e[3]},${e[2]},${e[1]}`
  }
  const hit = (f: PhotonF): Hit => ({ lat: String(f.geometry.coordinates[1]), lon: String(f.geometry.coordinates[0]), display_name: [f.properties.street ?? f.properties.name, f.properties.housenumber, f.properties.city].filter(Boolean).join(', ') })
  // stessa via: tutte le parole cercate ci sono ("Via Mazzini" trova "Via Giuseppe Mazzini")
  const same = (v?: string) => { const w = new Set(norm(v).split(' ')); return !!v && norm(street).split(' ').every(x => w.has(x)) }
  const it = (f: PhotonF) => f.properties.countrycode === 'IT' && (!city || norm(f.properties.city) === norm(city))
  if (num) {
    const h = await photon(`q=${encodeURIComponent(`${street} ${num}`)}&layer=house${bbox}`)
    if (!h) return 'down'
    const f = h.find(f => it(f) && same(f.properties.street) && norm(f.properties.housenumber) === norm(num))
    if (f) return hit(f)
  }
  const st = await photon(`q=${encodeURIComponent(street)}&layer=street${bbox}`)
  if (!st) return 'down'
  const f = st.find(f => it(f) && same(f.properties.name))
  return f ? hit(f) : null
}

// Indirizzo -> coordinate (Nominatim). "Via Mazzini 20, Verona" a testo libero finiva a Villafranca di Verona: con la
// citta' in fondo si cerca prima la via dentro i confini della citta', poi a testo libero; se Nominatim non risponde, Photon.
// Lancia un errore solo se nessuno dei due servizi risponde (cosi' non si scambia un limite per "indirizzo inesistente").
export async function geocode(address: string): Promise<Hit | null> {
  const { parts, city } = parseAddr(address)
  let down = false
  if (city) {
    const c = await nomi(`city=${encodeURIComponent(city)}`)
    if (!c) down = true
    const b = c?.[0]?.boundingbox
    if (b) {
      const r = await nomi(`q=${encodeURIComponent(parts.slice(0, -1).join(', '))}&viewbox=${b[2]},${b[1]},${b[3]},${b[0]}&bounded=1`)
      if (!r) down = true
      if (r?.[0]) return r[0]
    }
  }
  if (!down) {
    const r = await nomi(`q=${encodeURIComponent(address)}`)
    if (r?.[0]) return r[0]
    if (!r) down = true
  }
  const p = await viaPhoton(address)
  if (p === 'down') { if (down) throw new Error('geocode_down'); return null }
  return p
}

export async function lookupZone(address: string, radius = RADIUS): Promise<Zone | null> {
  const g = await geocode(address).catch(() => null)
  if (!g) return null
  const lat = Number(g.lat), lon = Number(g.lon)

  const q = `[out:json][timeout:25];(${CATS.map(c => `nwr${c.filter}(around:${radius},${lat},${lon});`).join('')});out center tags;`
  // Overpass pubblico risponde 429 quando e' carico: provo i mirror in ordine
  let data: { elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] } | null = null
  for (const url of OVERPASS) {
    data = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(25000),
    }).then(r => (r.ok ? r.json() : null)).catch(() => null)
    if (data) break
  }
  if (!data) return { lat, lon, luogo: g.display_name, pois: [] }

  const pois: Poi[] = []
  for (const c of CATS) {
    const seen = new Set<string>()
    const items = data.elements
      .filter(e => e.tags && matches(e.tags, c.key))
      .map(e => { const y = e.lat ?? e.center!.lat, x = e.lon ?? e.center!.lon; return { nome: e.tags!.name || c.label, d: dist(lat, lon, y, x), y, x } })
      .filter(x => { if (seen.has(x.nome)) return false; seen.add(x.nome); return true })
      .sort((a, b) => a.d - b.d).slice(0, c.max)
    for (const it of items) pois.push({ categoria: c.label, nome: it.nome, distanza: it.d, lat: it.y, lon: it.x })
  }
  return { lat, lon, luogo: g.display_name, pois }
}

// Ri-applica il filtro della categoria sui tag (Overpass restituisce tutto insieme).
function matches(t: Record<string, string>, key: string): boolean {
  switch (key) {
    case 'metro': return t.station === 'subway'
    case 'treno': return t.railway === 'station' && t.station !== 'subway'
    case 'tram': return t.railway === 'tram_stop'
    case 'super': return t.shop === 'supermarket'
    case 'scuola': return t.amenity === 'school' || t.amenity === 'kindergarten'
    case 'uni': return t.amenity === 'university'
    case 'parco': return t.leisure === 'park'
    case 'ospedale': return t.amenity === 'hospital'
    case 'farmacia': return t.amenity === 'pharmacy'
    default: return false
  }
}

// "Metro Romolo a 350 m": righe compatte per prompt e chip.
export const poiLine = (p: Poi) => `${p.categoria}${p.nome !== p.categoria ? ` ${p.nome}` : ''} a ${p.distanza >= 1000 ? `${(p.distanza / 1000).toFixed(1)} km` : `${p.distanza} m`}`
