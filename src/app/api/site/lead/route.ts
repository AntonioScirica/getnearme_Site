import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getBrand, getSite } from '@/lib/portfolio'

// Richiesta di contatto dal sito vetrina: arriva per email all'agente (reply-to = chi scrive).
// ponytail: limite in memoria per istanza, 5 invii ogni 10 minuti per IP; tabella lead + rate limit condiviso se serve lo storico
const hits = new Map<string, number[]>()
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!))
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (str(b.website, 100)) return NextResponse.json({ ok: true }) // bot: campo trappola compilato

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'x'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 600_000)
  if (recent.length >= 5) return NextResponse.json({ error: 'too_many' }, { status: 429 })
  hits.set(ip, [...recent, now])

  const name = str(b.name, 80), email = str(b.email, 120), phone = str(b.phone, 30), message = str(b.message, 2000), slug = str(b.slug, 60)
  if (name.length < 2 || !/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email) || phone.replace(/\D/g, '').length < 6 || !b.privacy)
    return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const brand = slug ? await getBrand(slug) : null
  if (!brand) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const cfg = await getSite(brand)
  const to = cfg.email || brand.company_email
  if (!to || !process.env.RESEND_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const row = (k: string, v: string) => v ? `<tr><td style="padding:8px 0;color:#666;width:120px;vertical-align:top"><b>${k}</b></td><td style="padding:8px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>` : ''
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Agente Immo <noreply@agenteimmo.me>',
    to,
    replyTo: email,
    subject: `Nuova richiesta dal sito: ${name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="margin:0 0 12px">Nuova richiesta dal tuo sito</h2><table style="width:100%;border-collapse:collapse">${row('Nome', name)}${row('Email', email)}${row('Telefono', phone)}${row('Immobile', str(b.propertyId, 60) ? `${req.nextUrl.origin}/it/a/${slug}/${str(b.propertyId, 60)}` : '')}${row('Messaggio', message)}</table><p style="color:#999;font-size:12px;margin-top:20px">Rispondi a questa email per scrivere direttamente a ${esc(name)}.</p></div>`,
  })
  return NextResponse.json({ ok: true })
}
