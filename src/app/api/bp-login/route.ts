import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { BP_COOKIE, bpToken } from '@/lib/bpAuth'

export async function POST(req: NextRequest) {
  const token = bpToken()
  const { password } = await req.json().catch(() => ({ password: '' }))
  const got = createHash('sha256').update(`agenteimmo-bp:${String(password ?? '')}`).digest('hex')
  if (!token || !timingSafeEqual(Buffer.from(got), Buffer.from(token))) {
    await new Promise(r => setTimeout(r, 800)) // rallenta i tentativi a caso
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(BP_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return res
}
