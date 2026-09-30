import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authUser } from '@/lib/platformAuth'
import { getCredits, grant } from '@/lib/credits'
import { AFFILIATE_CODES, AFFILIATE_CREDITS, REDEEM_CREDITS, codeOf, normCode } from '@/lib/affiliates'

// Codice affiliato (vedi lib/affiliates.ts).
// GET: se l'utente ha gia' usato un codice e, se e' un affiliato, il suo codice con quante persone l'hanno usato.
// POST { code }: con un piano a pagamento, REDEEM_CREDITS a chi lo inserisce e AFFILIATE_CREDITS all'affiliato.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const REASON = 'pacchetto_codice_' // + CODICE: "pacchetto_" = non scade con il mese

const usedBy = async (userId: string) => {
  const { data } = await admin.from('platform_credit_events').select('reason').eq('user_id', userId).like('reason', `${REASON}%`).limit(1).maybeSingle()
  return data ? (data.reason as string).slice(REASON.length) : null
}
const uses = async (code: string) => {
  const { count } = await admin.from('platform_credit_events').select('id', { count: 'exact', head: true }).eq('reason', REASON + code)
  return count ?? 0
}
// email -> id dell'affiliato (poche migliaia di utenti: si scorrono le pagine)
async function userIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return null
    const u = data.users.find(x => x.email?.toLowerCase() === email.toLowerCase())
    if (u) return u.id
    if (data.users.length < 1000) return null
  }
  return null
}

export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const mine = codeOf(u.email)
  return NextResponse.json({
    used: await usedBy(u.id),
    mine: mine ? { code: mine, uses: await uses(mine), each: AFFILIATE_CREDITS, gives: REDEEM_CREDITS } : null,
    gives: REDEEM_CREDITS,
  })
}

export async function POST(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const code = normCode((await req.json().catch(() => ({})))?.code)
  const aff = AFFILIATE_CODES[code]
  if (!code || code.length > 40 || !aff) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (aff.owner.toLowerCase() === u.email.toLowerCase()) return NextResponse.json({ error: 'own' }, { status: 400 })
  const c = await getCredits(u.id)
  if (c.plan === 'none' && !c.unlimited) return NextResponse.json({ error: 'plan' }, { status: 402 })
  if (await usedBy(u.id)) return NextResponse.json({ error: 'used' }, { status: 409 })
  if (aff.max && (await uses(code)) >= aff.max) return NextResponse.json({ error: 'full' }, { status: 409 })
  const owner = await userIdByEmail(aff.owner)
  if (!owner) { console.error('codice affiliato: account non trovato', code); return NextResponse.json({ error: 'invalid' }, { status: 400 }) }
  // ponytail: controllo e accredito non sono atomici; due invii nello stesso istante darebbero il bonus due volte
  // (il bottone si blocca durante l'invio). Se serve: vincolo unico su (user_id, reason) negli eventi.
  const balance = await grant(u.id, REDEEM_CREDITS, REASON + code, { code, affiliate: owner })
  if (balance < 0) return NextResponse.json({ error: 'server' }, { status: 500 })
  if ((await grant(owner, AFFILIATE_CREDITS, `pacchetto_affiliato_${code}_${u.id.slice(0, 8)}`, { code, from: u.id })) < 0)
    console.error('codice affiliato: accredito all\'affiliato non riuscito, da rifare a mano', code, owner, u.id)
  return NextResponse.json({ ok: true, credits: REDEEM_CREDITS, balance })
}
