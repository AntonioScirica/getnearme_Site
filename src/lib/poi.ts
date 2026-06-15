// Analisi di zona (POI) — port fedele dell'estensione.
// Categorie OSM, query Overpass, geocoding Nominatim, distanza haversine.
// Nessuna dipendenza chrome.*/DOM: usabile lato client.

export type PoiQuery = { tag: string; value: string };
export type PoiCategoryDef = {
  key: string;
  label: string;       // IT
  icon: string;        // lucide kebab name (mappato in ui.tsx)
  color: string;       // marker + accenti
  queries: PoiQuery[];
};

// Ordine di visualizzazione (uguale all'estensione).
export const POI_CATEGORIES: PoiCategoryDef[] = [
  {
    key: 'transport', label: 'Trasporti Pubblici', icon: 'train-front', color: '#A855F7',
    queries: [
      { tag: 'public_transport', value: 'station' },
      { tag: 'public_transport', value: 'stop_position' },
      { tag: 'public_transport', value: 'platform' },
      { tag: 'railway', value: 'station' },
      { tag: 'railway', value: 'halt' },
      { tag: 'highway', value: 'bus_stop' },
      { tag: 'station', value: 'subway' },
      { tag: 'amenity', value: 'bus_station' },
    ],
  },
  {
    key: 'supermarkets', label: 'Supermercati', icon: 'shopping-bag', color: '#F97316',
    queries: [
      { tag: 'shop', value: 'supermarket' },
      { tag: 'shop', value: 'grocery' },
      { tag: 'shop', value: 'convenience' },
    ],
  },
  {
    key: 'pharmacies', label: 'Farmacie', icon: 'plus', color: '#EF4444',
    queries: [{ tag: 'amenity', value: 'pharmacy' }],
  },
  {
    key: 'healthcare', label: 'Strutture Sanitarie', icon: 'activity', color: '#EF4444',
    queries: [
      { tag: 'amenity', value: 'hospital' },
      { tag: 'amenity', value: 'clinic' },
      { tag: 'amenity', value: 'doctors' },
      { tag: 'healthcare', value: 'hospital' },
      { tag: 'healthcare', value: 'clinic' },
    ],
  },
  {
    key: 'schools', label: 'Scuole', icon: 'school', color: '#3B82F6',
    queries: [
      { tag: 'amenity', value: 'school' },
      { tag: 'amenity', value: 'kindergarten' },
    ],
  },
  {
    key: 'parks', label: 'Parchi', icon: 'tree-pine', color: '#22C55E',
    queries: [
      { tag: 'leisure', value: 'park' },
      { tag: 'leisure', value: 'garden' },
      { tag: 'landuse', value: 'grass' },
      { tag: 'leisure', value: 'playground' },
    ],
  },
  {
    key: 'restaurants', label: 'Ristoranti e Bar', icon: 'coffee', color: '#EAB308',
    queries: [
      { tag: 'amenity', value: 'restaurant' },
      { tag: 'amenity', value: 'cafe' },
      { tag: 'amenity', value: 'bar' },
      { tag: 'amenity', value: 'fast_food' },
    ],
  },
  {
    key: 'dogAreas', label: 'Aree Cani', icon: 'dog', color: '#D97706',
    queries: [
      { tag: 'leisure', value: 'dog_park' },
      { tag: 'animal', value: 'dog' },
      { tag: 'dog', value: 'yes' },
    ],
  },
  {
    key: 'nightlife', label: 'Vita Notturna', icon: 'music', color: '#7C3AED',
    queries: [
      { tag: 'amenity', value: 'nightclub' },
      { tag: 'amenity', value: 'pub' },
      { tag: 'leisure', value: 'dance' },
      { tag: 'amenity', value: 'bar' },
    ],
  },
];

export const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
];
export const DEFAULT_RADIUS = 1000;

// Tag che esistono solo come node (ottimizzazione: query node-only).
const NODE_ONLY_TAGS = new Set([
  'highway:bus_stop',
  'public_transport:stop_position', 'public_transport:platform', 'public_transport:station',
  'railway:halt', 'railway:station', 'station:subway',
  'amenity:pharmacy', 'amenity:restaurant', 'amenity:cafe', 'amenity:bar',
  'amenity:fast_food', 'amenity:nightclub', 'amenity:pub', 'amenity:bus_station',
  'leisure:dance', 'leisure:dog_park',
  'animal:dog', 'dog:yes',
]);

export type Poi = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  distance: number; // metri (haversine)
  category: string;
};

export type ZonaResult = Record<string, Poi[]>;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Distanza in linea d'aria (haversine), in metri arrotondati.
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// Geocoding indirizzo → coordinate (Nominatim, no API key). Bias Italia.
export type GeocodeHit = { lat: number; lng: number; label: string };
export async function geocodeAddress(address: string): Promise<GeocodeHit | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'it');
  url.searchParams.set('addressdetails', '0');
  const resp = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'it' },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const h = data[0];
  return { lat: parseFloat(h.lat), lng: parseFloat(h.lon), label: h.display_name };
}

// Reverse geocoding: coordinate → indirizzo (via + città). Nominatim.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  const resp = await fetch(url.toString(), { headers: { 'Accept-Language': 'it' } });
  if (!resp.ok) return null;
  const data = await resp.json();
  const a = data?.address;
  if (!a) return data?.display_name || null;
  const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || '';
  const num = a.house_number ? ` ${a.house_number}` : '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const parts = [road ? `${road}${num}` : '', city].filter(Boolean);
  return parts.join(', ') || data?.display_name || null;
}

export type LatLng = { lat: number; lng: number };

// Centroide medio dei vertici (sufficiente per aree piccole).
export function centroid(points: LatLng[]): LatLng {
  const n = points.length || 1;
  const lat = points.reduce((s, p) => s + p.lat, 0) / n;
  const lng = points.reduce((s, p) => s + p.lng, 0) / n;
  return { lat, lng };
}

function buildPolyQuery(points: LatLng[]): string {
  // Overpass poly filter: "lat lng lat lng ..."
  const poly = points.map((p) => `${p.lat} ${p.lng}`).join(' ');
  const parts: string[] = [];
  for (const cat of POI_CATEGORIES) {
    for (const q of cat.queries) {
      const type = NODE_ONLY_TAGS.has(`${q.tag}:${q.value}`) ? 'node' : 'nwr';
      parts.push(`${type}["${q.tag}"="${q.value}"](poly:"${poly}");`);
    }
  }
  // Niente [maxsize]: il default server (~512MB) serve, il filtro poly è
  // memory-heavy e con 2MB Overpass va in "out of memory" → 0 risultati.
  return `[out:json][timeout:25];\n(\n  ${parts.join('\n  ')}\n);\nout center tags qt;`;
}

function buildQuery(lat: number, lng: number, radius: number): string {
  const parts: string[] = [];
  for (const cat of POI_CATEGORIES) {
    for (const q of cat.queries) {
      const type = NODE_ONLY_TAGS.has(`${q.tag}:${q.value}`) ? 'node' : 'nwr';
      parts.push(`${type}["${q.tag}"="${q.value}"](around:${radius},${lat},${lng});`);
    }
  }
  return `[out:json][timeout:25];\n(\n  ${parts.join('\n  ')}\n);\nout center tags qt;`;
}

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// Mappa un elemento OSM alla categoria corretta (prima che matcha, in ordine).
function categoryOf(tags: Record<string, string>): string | null {
  for (const cat of POI_CATEGORIES) {
    for (const q of cat.queries) {
      if (tags[q.tag] === q.value) return cat.key;
    }
  }
  return null;
}

async function runOverpass(query: string): Promise<OverpassElement[]> {
  const body = `data=${encodeURIComponent(query)}`;
  const attempt = (endpoint: string) =>
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((json: { elements?: OverpassElement[]; remark?: string }) => {
      // Overpass risponde 200 anche su errori runtime (es. out of memory):
      // body con `remark` e nessun elemento. Va trattato come fallimento, così
      // Promise.any preferisce un endpoint sano invece di accettare 0 risultati.
      if (json.remark && /runtime error|out of memory|timed out/i.test(json.remark)) {
        throw new Error(`overpass_remark: ${json.remark}`);
      }
      return json;
    });
  let json: { elements?: OverpassElement[] };
  try {
    json = await Promise.any(OVERPASS_ENDPOINTS.map(attempt));
  } catch {
    throw new Error('overpass_unreachable');
  }
  return json.elements || [];
}

// Parsing comune: named-only, dedup per nome, distanza dal punto di riferimento.
function parseElements(elements: OverpassElement[], refLat: number, refLng: number): ZonaResult {
  const result: ZonaResult = {};
  for (const cat of POI_CATEGORIES) result[cat.key] = [];
  const norm = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const bestByName = new Map<string, Poi>();
  for (const el of elements) {
    const tags = el.tags || {};
    const cat = categoryOf(tags);
    if (!cat) continue;
    const rawName = tags.name;
    if (!rawName) continue;
    const elat = el.lat ?? el.center?.lat;
    const elng = el.lon ?? el.center?.lon;
    if (typeof elat !== 'number' || typeof elng !== 'number') continue;
    const distance = haversine(refLat, refLng, elat, elng);
    const key = `${cat}|${norm(rawName)}`;
    const prev = bestByName.get(key);
    if (prev && prev.distance <= distance) continue;
    bestByName.set(key, { id: el.id, name: rawName, lat: elat, lng: elng, distance, category: cat });
  }
  for (const poi of bestByName.values()) result[poi.category].push(poi);
  for (const key of Object.keys(result)) result[key].sort((a, b) => a.distance - b.distance);
  return result;
}

// Analisi per raggio attorno a un punto.
export async function fetchZona(lat: number, lng: number, radius: number): Promise<ZonaResult> {
  const elements = await runOverpass(buildQuery(lat, lng, radius));
  return parseElements(elements, lat, lng);
}

// Analisi dentro un'area disegnata (poligono). Distanza dal centroide.
export async function fetchZonaArea(points: LatLng[]): Promise<ZonaResult> {
  const c = centroid(points);
  const elements = await runOverpass(buildPolyQuery(points));
  return parseElements(elements, c.lat, c.lng);
}
