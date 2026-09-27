import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const API = 'https://api.unsplash.com'

// Ispirazione per lo stile dalla chat: ricerca di foto d'interni su Unsplash (la chiave resta sul server).
// GET ?q=...&page=  -> { results: [{ id, thumb, url, author, authorUrl, download }] }
// POST { download } -> segnala l'uso della foto a Unsplash (richiesto dalle loro regole quando la foto si usa)
async function userOf(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return (await admin.auth.getUser(token)).data.user?.id ?? null
}

export async function GET(req: NextRequest) {
  if (!(await userOf(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, Math.min(20, Number(req.nextUrl.searchParams.get('page')) || 1))
  if (!q) return NextResponse.json({ results: [] })
  if (!process.env.UNSPLASH_ACCESS_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  // si scrive in italiano: lang=it lo traduce Unsplash (senza, "cucina moderna rovere" dava 0 risultati).
  // Sempre dentro gli interni: "cucina moderna" -> interni, non cucine all'aperto o piatti
  const r = await fetch(`${API}/search/photos?query=${encodeURIComponent(`${q} interior`)}&per_page=24&page=${page}&content_filter=high&lang=it`, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' }, signal: AbortSignal.timeout(15_000),
  }).catch(() => null)
  if (!r?.ok) return NextResponse.json({ error: 'failed' }, { status: 502 })
  type Photo = { id: string; urls: { small: string; regular: string }; user: { name: string; links: { html: string } }; links: { download_location: string }; alt_description?: string }
  const d = await r.json() as { results: Photo[] }
  return NextResponse.json({
    results: d.results.map(p => ({ id: p.id, thumb: p.urls.small, url: p.urls.regular, author: p.user.name, authorUrl: `${p.user.links.html}?utm_source=agenteimmo&utm_medium=referral`, download: p.links.download_location, alt: p.alt_description ?? '' })),
  })
}

export async function POST(req: NextRequest) {
  if (!(await userOf(req))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: { download?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  // solo l'endpoint di Unsplash: niente URL arbitrari chiamati dal server
  if (typeof body.download !== 'string' || !body.download.startsWith(`${API}/photos/`)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  await fetch(body.download, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(10_000) }).catch(() => null)
  return NextResponse.json({ ok: true })
}
