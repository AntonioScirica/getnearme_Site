import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { isPlatformAdmin } from '@/lib/platformAdmins'
import { CODE_RE, REASON, loadAffiliates, normCode, saveAffiliates, type AffiliateStore } from '@/lib/affiliates'

// Pagina admin Affiliati: codici, quanti crediti si danno, utilizzi. Solo amministratori.
// GET -> { store, stats: { CODICE: { uses, given } } }   PUT { store } -> salva (codici e numeri controllati)
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const guard = async (req: NextRequest) => { const u = await authUser(req); return u && isPlatformAdmin(u.email) ? u : null }
const n = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null)

export async function GET(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const store = await loadAffiliates()
  const { data } = await admin.from('platform_credit_events').select('reason, delta').or(`reason.like.${REASON}%,reason.like.pacchetto_affiliato_%`).limit(10000)
  const stats: Record<string, { uses: number; given: number }> = {}
  for (const r of data ?? []) {
    const reason = r.reason as string
    const code = reason.startsWith(REASON) ? reason.slice(REASON.length) : reason.slice('pacchetto_affiliato_'.length).replace(/_[^_]*$/, '')
    const s = (stats[code] ??= { uses: 0, given: 0 })
    if (reason.startsWith(REASON)) s.uses++
    s.given += Number(r.delta) || 0
  }
  return NextResponse.json({ store, stats })
}

export async function PUT(req: NextRequest) {
  if (!(await guard(req))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const b = (await req.json().catch(() => null))?.store as AffiliateStore | undefined
  const redeem = n(b?.redeem, 10000), affiliate = n(b?.affiliate, 10000)
  if (!b || redeem === null || affiliate === null || typeof b.codes !== 'object') return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const codes: AffiliateStore['codes'] = {}
  for (const [raw, v] of Object.entries(b.codes)) {
    const code = normCode(raw)
    const owner = typeof v?.owner === 'string' ? v.owner.trim().toLowerCase() : ''
    if (!CODE_RE.test(code) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) return NextResponse.json({ error: 'invalid_code', code: raw }, { status: 400 })
    const max = v.max == null ? undefined : n(v.max, 100000) ?? undefined
    codes[code] = { owner, ...(max ? { max } : {}), ...(v.active === false ? { active: false } : {}) }
  }
  const store = { redeem, affiliate, codes }
  await saveAffiliates(store)
  return NextResponse.json({ store })
}
