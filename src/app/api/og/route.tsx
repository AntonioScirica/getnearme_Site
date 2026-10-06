import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { ogSign } from '@/lib/ogMeta'
import { immoCard } from '@/lib/ogRender'

// Anteprima dei link delle pagine di Agente Immo: /api/og?t=<titolo>&s=<sottotitolo>&k=<firma> (indirizzi da immoOgImage)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const t = (q.get('t') ?? '').slice(0, 120), s = (q.get('s') ?? '').slice(0, 160), k = q.get('k') ?? ''
  const ok = Buffer.from(ogSign(t, s)), got = Buffer.from(k)
  if (!t || ok.length !== got.length || !timingSafeEqual(ok, got)) return new Response('bad signature', { status: 400 })
  return immoCard(t, s)
}
