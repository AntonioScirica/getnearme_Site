import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { unsubSig } from '@/lib/marketingEmail'

// Link in fondo alle email promozionali: toglie il consenso al marketing (user_metadata.marketing_consent) e lo conferma.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const page = (msg: string) => new NextResponse(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agente Immo</title><body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f7f7;display:flex;min-height:100vh;align-items:center;justify-content:center"><div style="background:#fff;border-radius:28px;padding:40px;max-width:420px;text-align:center;box-shadow:0 8px 24px -12px rgba(0,0,0,.15)"><img src="https://agenteimmo.me/immo/logo-mark.png" width="48" height="48" alt=""><p style="font-size:17px;color:#222;line-height:1.5">${msg}</p><a href="https://agenteimmo.me/it" style="color:#537eec">Torna ad Agente Immo</a></div></body>`, { headers: { 'content-type': 'text/html; charset=utf-8' } })

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? '', s = req.nextUrl.searchParams.get('s') ?? ''
  const ok = /^[0-9a-f-]{36}$/.test(u) && s.length === 32 && timingSafeEqual(Buffer.from(s), Buffer.from(unsubSig(u)))
  if (!ok) return page('Link non valido.')
  const { data } = await admin.auth.admin.getUserById(u)
  if (data.user) await admin.auth.admin.updateUserById(u, { user_metadata: { ...data.user.user_metadata, marketing_consent: false } })
  return page('Fatto: non riceverai più email promozionali da Agente Immo.')
}
