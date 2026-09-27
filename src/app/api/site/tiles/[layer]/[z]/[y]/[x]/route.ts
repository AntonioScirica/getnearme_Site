import { NextRequest } from 'next/server'

// Tile della mappa grigia Esri passate dal nostro server: il browser dei visitatori (siti degli agenti)
// non manda il suo IP a Esri. La CDN le tiene 30 giorni, cosi' Esri vede poche richieste.
const LAYERS: Record<string, string> = { base: 'Base', reference: 'Reference' }

export async function GET(_: NextRequest, { params }: { params: Promise<{ layer: string; z: string; y: string; x: string }> }) {
  const { layer, z, y, x } = await params
  const l = LAYERS[layer]
  if (!l || ![z, y, x].every(n => /^\d{1,7}$/.test(n)) || Number(z) > 19) return new Response('bad request', { status: 400 })
  const r = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_${l}/MapServer/tile/${z}/${y}/${x}`, { signal: AbortSignal.timeout(10000) }).catch(() => null)
  if (!r?.ok) return new Response('not found', { status: r?.status ?? 502 })
  return new Response(r.body, { headers: { 'Content-Type': r.headers.get('content-type') ?? 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=2592000, immutable' } })
}
