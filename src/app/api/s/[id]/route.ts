import { NextRequest } from 'next/server'
import { reportHtmlFor, reportSigOk } from '@/lib/reportFor'

export const maxDuration = 40

// Scheda pubblica di un immobile (link di Manda al cliente): /api/s/<id>?k=<firma>. Senza firma giusta: 404.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const k = req.nextUrl.searchParams.get('k') ?? ''
  if (!/^[\w-]{1,64}$/.test(id) || !reportSigOk(id, k)) return new Response('Scheda non trovata', { status: 404 })
  const html = await reportHtmlFor(id, null, req.nextUrl.origin)
  if (!html) return new Response('Scheda non trovata', { status: 404 })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex' } })
}
