import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isSection } from '@/lib/platformSessions'

// Battito della piattaforma: tempo attivo per sessione e per sezione (tabella platform_sessions, letta da /metrics).
// Token nell'header Authorization come le altre rotte, oppure nel corpo JSON (navigator.sendBeacon non manda header).
// Corpo: { sid: uuid della sessione (deciso dal browser), section, seconds, device?, token? }. Risposta 204.
export const runtime = 'nodejs'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SECONDS = 75 // un battito ogni 60 s: oltre e' un numero gonfiato
const empty = (status: number) => new Response(null, { status })

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    const text = await req.text()
    if (text.length > 4000) return empty(413)
    body = JSON.parse(text)
    if (!body || typeof body !== 'object') return empty(400)
  } catch { return empty(400) }

  const token = req.headers.get('authorization')?.replace('Bearer ', '') || (typeof body.token === 'string' ? body.token : '')
  if (!token || token.length > 4000) return empty(401)
  const { data: auth } = await admin.auth.getUser(token)
  const uid = auth.user?.id
  if (!uid) return empty(401)

  const { sid, section } = body
  const seconds = Math.round(Number(body.seconds))
  if (typeof sid !== 'string' || !UUID.test(sid) || !isSection(section) || !Number.isFinite(seconds) || seconds < 0) return empty(400)
  const secs = Math.min(seconds, MAX_SECONDS)
  const device = typeof body.device === 'string' ? body.device.replace(/[^\p{L}\p{N} .,·/()-]/gu, '').slice(0, 60) : null
  const now = new Date().toISOString()

  // ponytail: leggi e riscrivi (non atomico); i battiti di una sessione arrivano uno alla volta, ogni 60 s
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: row, error } = await admin.from('platform_sessions').select('user_id, active_seconds, sections').eq('id', sid).maybeSingle()
    if (error) return empty(500)
    if (row) {
      if (row.user_id !== uid) return empty(403)
      const sections = { ...((row.sections ?? {}) as Record<string, number>) }
      if (secs) sections[section] = (Number(sections[section]) || 0) + secs
      const { error: e } = await admin.from('platform_sessions').update({ last_seen: now, active_seconds: (row.active_seconds ?? 0) + secs, sections }).eq('id', sid)
      return empty(e ? 500 : 204)
    }
    const { error: e } = await admin.from('platform_sessions').insert({ id: sid, user_id: uid, started_at: now, last_seen: now, active_seconds: secs, device, sections: secs ? { [section]: secs } : {} })
    if (!e) return empty(204)
    if (e.code !== '23505') return empty(500) // 23505: creata nel frattempo da un altro battito, si riprova come aggiornamento
  }
  return empty(500)
}
