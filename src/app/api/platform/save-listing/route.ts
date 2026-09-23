import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rehostImage } from '@/lib/r2'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export const runtime = 'nodejs'
export const maxDuration = 60

// "Salva nei miei immobili" da Migliora annuncio: copia TUTTE le foto su R2 (non
// dipendiamo piu' dal CDN del portale) e salva tutti i dati letti dall'estensione.
// Solo URL dei CDN dei portali: il server non scarica indirizzi arbitrari (SSRF).
const PHOTO_RE = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
const MAX_PHOTOS = 40
const PARALLEL = 6

const toNum = (v: unknown) => {
  const m = String(v ?? '').match(/\d[\d.]*/)
  return m ? Number(m[0].replace(/\./g, '')) || 0 : 0
}
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')

type Body = {
  titolo?: string; descrizione?: string; score?: number; suggerimenti?: string[]
  listing?: { url?: string; title?: string; address?: string; propertyInfo?: Record<string, unknown>; photos?: string[] }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let b: Body
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const l = b.listing
  const titolo = str(b.titolo, 200)
  if (!l || !titolo) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const info = l.propertyInfo && typeof l.propertyInfo === 'object' ? l.propertyInfo : {}
  if (JSON.stringify(info).length > 30000) return NextResponse.json({ error: 'too_large' }, { status: 400 })

  // Foto: copia su R2 a 1600px, a gruppi di PARALLEL, mantenendo l'ordine.
  const sources = (Array.isArray(l.photos) ? l.photos : []).filter(u => typeof u === 'string' && PHOTO_RE.test(u)).slice(0, MAX_PHOTOS)
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const photos: string[] = []
  for (let i = 0; i < sources.length; i += PARALLEL) {
    const batch = await Promise.all(sources.slice(i, i + PARALLEL).map((u, j) => rehostImage(u, `properties/${userId}/${stamp}-${i + j}.jpg`, 1600, 82)))
    photos.push(...batch.filter((u): u is string => !!u))
  }
  const thumb = sources[0] ? await rehostImage(sources[0], `covers/${userId}/${stamp}-thumb.jpg`, 100, 80) : null

  const { data: project, error } = await admin.from('projects').insert({
    user_id: userId,
    nome: titolo,
    titolo,
    descrizione: str(b.descrizione, 10000),
    addr: str(l.address, 300),
    tipologia: str(info.type, 100),
    prezzo: toNum(info.price),
    mq: toNum(info.surface),
    locali: toNum(info.rooms) || null,
    camere: toNum(info.bedrooms),
    bagni: toNum(info.bathrooms),
    cover: photos[0] ?? '',
    thumb: thumb ?? '',
    import_data: {
      source: 'portal',
      url: str(l.url, 500),
      photos,
      score: typeof b.score === 'number' ? b.score : null,
      suggerimenti: Array.isArray(b.suggerimenti) ? b.suggerimenti.slice(0, 20).map(s => str(s, 1000)) : [],
      piano: str(info.floor, 50),
      classe: str(info.energyClass, 20),
      caratteristiche: Array.isArray(info.features) ? info.features.slice(0, 50) : [],
      originale: { titolo: str(l.title, 300), descrizione: str(info.description, 10000) },
      info, // tutto quello che ha letto l'estensione (spese, riscaldamento, anno, esposizione, box...)
    },
  }).select('id').single()

  if (error) {
    console.error('save-listing error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
  return NextResponse.json({ id: project.id, photos: photos.length, skipped: sources.length - photos.length })
}
