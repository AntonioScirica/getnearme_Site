import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canAfford } from '@/lib/credits'
import { CREDIT_COST } from '@/lib/pricing'
import { allowedUrl } from '@/lib/safeUrl'
import { exitFromGrid, prepare, renderAgent, renderWalk, uploadUrl } from '@/lib/agentVideo'

export const runtime = 'nodejs'
export const maxDuration = 300

// "Con te in video" (vedi lib/agentVideo): upload + prepare in sottofondo, exit (griglia dal browser), render. Il video pronto si controlla e si
// consegna con GET /api/platform/video?job=... come gli altri (crediti video_agent alla consegna).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const userId = token ? (await admin.auth.getUser(token)).data.user?.id : null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => null) as { phase?: string; type?: string; key?: string; projectId?: string; token?: string; at?: number; styled?: string; room?: string; grid?: string; n?: number; cols?: number; tw?: number; th?: number; end?: number } | null
  if (!b) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const bad = (r: { error?: string }, ok: object) => NextResponse.json(r.error ? r : ok, r.error ? { status: r.error === 'bad_request' ? 400 : r.error === 'no_exit' || r.error === 'too_short' ? 422 : 502 } : undefined)
  if (b.phase === 'upload') {
    if (!/^video\/(quicktime|mp4|webm)$/.test(b.type ?? '')) return NextResponse.json({ error: 'bad_type' }, { status: 400 })
    if (!(await canAfford(userId, 'video_agent'))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST.video_agent }, { status: 402 })
    return NextResponse.json(await uploadUrl(userId, b.type!))
  }
  if (b.phase === 'prepare') {
    const pid = typeof b.projectId === 'string' && /^[\w-]{1,64}$/.test(b.projectId) ? b.projectId : ''
    const r = await prepare(userId, String(b.key ?? ''), pid)
    return bad(r, r)
  }
  if (b.phase === 'exit') {
    const m = typeof b.grid === 'string' ? b.grid.match(/^data:image\/jpeg;base64,(.+)$/) : null
    if (!m || m[1].length > 3_000_000) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const r = await exitFromGrid(userId, Buffer.from(m[1], 'base64'), Number(b.n), Number(b.cols), Number(b.tw), Number(b.th), typeof b.end === 'number' ? b.end : undefined)
    return bad(r, r)
  }
  if (b.phase === 'render') {
    if (typeof b.styled !== 'string' || !allowedUrl(b.styled) || typeof b.room !== 'string' || !allowedUrl(b.room)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    if (!(await canAfford(userId, 'video_agent'))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST.video_agent }, { status: 402 })
    const r = await renderAgent(userId, String(b.token ?? ''), Number(b.at), b.styled, b.room)
    return bad(r, r)
  }
  if (b.phase === 'walk') {
    if (typeof b.styled !== 'string' || !allowedUrl(b.styled)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    if (!(await canAfford(userId, 'video_walk'))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST.video_walk }, { status: 402 })
    const r = await renderWalk(userId, String(b.token ?? ''), b.styled)
    return bad(r, r)
  }
  return NextResponse.json({ error: 'bad_request' }, { status: 400 })
}
