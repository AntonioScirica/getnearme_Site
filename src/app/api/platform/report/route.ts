import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamUserIds } from '@/lib/teamScope'
import { reportHtmlFor, reportSig } from '@/lib/reportFor'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 40

// Report PDF di un immobile dalla pagina dell'immobile in piattaforma (anche non pubblicato, anche senza sito):
// stesso documento di "Scarica il report" sul sito, con i dati del profilo e del sito dell'agente. GET ?id=
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const u = data.user
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = (req.nextUrl.searchParams.get('id') ?? '').slice(0, 64)
  if (!/^[\w-]+$/.test(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const team = await getTeamUserIds(admin, u.id)
  // ?link=1: indirizzo pubblico firmato della scheda, per mandarla al cliente su WhatsApp (solo immobili propri)
  if (req.nextUrl.searchParams.get('link') === '1') {
    const { data: own } = await admin.from('projects').select('id').eq('id', id).in('user_id', team).maybeSingle()
    return own ? NextResponse.json({ url: `${req.nextUrl.origin}/api/s/${id}?k=${reportSig(id)}` }) : NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const html = await reportHtmlFor(id, team, req.nextUrl.origin)
  if (!html) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } })
}
