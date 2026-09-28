import { lookupZone, type Poi } from '@/lib/zone'

// Servizi vicini per il report (stessa fonte di "Cosa c'e' vicino": OSM, 1 km). Cache in memoria per istanza (24 h):
// Nominatim e Overpass sono lenti e con limiti d'uso. Un errore di OSM non resta in cache.
const cache = new Map<string, { at: number; pois: Poi[] }>()

export async function reportPois(addr: string | null | undefined, details: unknown): Promise<Poi[]> {
  if (!addr || (details as { distanze_auto?: boolean } | null | undefined)?.distanze_auto === false) return []
  const hit = cache.get(addr)
  if (hit && Date.now() - hit.at < 86_400_000) return hit.pois
  const z = await lookupZone(addr, 1000).catch(() => null)
  const pois = z?.pois ?? []
  if (pois.length) cache.set(addr, { at: Date.now(), pois })
  return pois
}
