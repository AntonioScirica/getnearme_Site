// Servizi nella zona di un indirizzo, da OpenStreetMap (gratis): Nominatim per le
// coordinate, Overpass per i punti di interesse entro RADIUS. Stessa fonte usata
// dall'estensione. Risultato: poche righe pronte per l'AI e per la pagina della casa.

const RADIUS = 1200
const UA = 'GetNearMe/1.0 (https://getnearme.it)'

export type Poi = { categoria: string; nome: string; distanza: number }
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

export async function lookupZone(address: string): Promise<Zone | null> {
  const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(address)}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'it' }, signal: AbortSignal.timeout(8000),
  }).then(r => r.json()).catch(() => null) as { lat: string; lon: string; display_name: string }[] | null
  if (!geo?.[0]) return null
  const lat = Number(geo[0].lat), lon = Number(geo[0].lon)

  const q = `[out:json][timeout:20];(${CATS.map(c => `nwr${c.filter}(around:${RADIUS},${lat},${lon});`).join('')});out center tags;`
  const data = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(25000),
  }).then(r => r.json()).catch(() => null) as { elements: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] } | null
  if (!data) return { lat, lon, luogo: geo[0].display_name, pois: [] }

  const pois: Poi[] = []
  for (const c of CATS) {
    const seen = new Set<string>()
    const items = data.elements
      .filter(e => e.tags && matches(e.tags, c.key))
      .map(e => ({ nome: e.tags!.name || c.label, d: dist(lat, lon, e.lat ?? e.center!.lat, e.lon ?? e.center!.lon) }))
      .filter(x => { if (seen.has(x.nome)) return false; seen.add(x.nome); return true })
      .sort((a, b) => a.d - b.d).slice(0, c.max)
    for (const it of items) pois.push({ categoria: c.label, nome: it.nome, distanza: it.d })
  }
  return { lat, lon, luogo: geo[0].display_name, pois }
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
