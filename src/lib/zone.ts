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
const nomi = (qs: string) => fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&${qs}`, {
  headers: { 'User-Agent': UA, 'Accept-Language': 'it' }, signal: AbortSignal.timeout(8000),
}).then(r => (r.ok ? r.json() : null)).catch(() => null) as Promise<(Hit & { boundingbox?: string[] })[] | null>
export async function geocode(address: string): Promise<Hit | null> {
  const parts = address.split(',').map(x => x.trim()).filter(Boolean)
  const city = parts.length > 1 ? parts[parts.length - 1].replace(/\d+/g, '').trim() : ''
  if (city) {
    const b = (await nomi(`city=${encodeURIComponent(city)}`))?.[0]?.boundingbox
    if (b) {
      const hit = (await nomi(`q=${encodeURIComponent(parts.slice(0, -1).join(', '))}&viewbox=${b[2]},${b[1]},${b[3]},${b[0]}&bounded=1`))?.[0]
      if (hit) return hit
    }
  }
  return (await nomi(`q=${encodeURIComponent(address)}`))?.[0] ?? null
}

export async function lookupZone(address: string, radius = RADIUS): Promise<Zone | null> {
  const g = await geocode(address)
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
