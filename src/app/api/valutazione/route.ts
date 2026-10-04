import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { isDisposableEmail } from '@/lib/disposableEmails'
import { deepProfanity } from '@/lib/profanity'
import { locate, parseInput, valuate, type Place } from '@/lib/valuation'
import { valuationEmail } from '@/lib/valuationEmail'

// Valutazione casa dei proprietari (/it/quanto-vale-la-mia-casa).
// GET ?address=  -> controlla l'indirizzo al primo passo (luogo e comune), niente stima.
// POST           -> stima, salva il lead in valuation_leads e manda la valutazione per email (il risultato non torna alla pagina).
// ponytail: limiti in memoria per istanza (come /api/site/lead); rate limit condiviso se arrivano abusi veri
const hits = new Map<string, number[]>()
const places = new Map<string, { at: number; p: Place | null }>() // indirizzo -> luogo, cosi' il POST non rifa' il geocoding
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i

function limited(req: NextRequest, key: string, max: number, windowMs: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'x'
  const k = `${key}:${ip}`, now = Date.now()
  const recent = (hits.get(k) ?? []).filter(t => now - t < windowMs)
  if (recent.length >= max) return true
  hits.set(k, [...recent, now])
  return false
}

async function placeOf(address: string) {
  const key = address.toLowerCase()
  const c = places.get(key)
  if (c && Date.now() - c.at < 86_400_000) return c.p
  const p = await locate(address) // lancia se i servizi di geocoding non rispondono
  places.set(key, { at: Date.now(), p })
  return p
}

export async function GET(req: NextRequest) {
  const address = str(req.nextUrl.searchParams.get('address'), 200)
  if (address.length < 6) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (limited(req, 'check', 30, 600_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 })
  const p = await placeOf(address).catch(() => undefined)
  if (p === undefined) return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ luogo: p.luogo, comune: p.comune })
}

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (str(b.website, 100)) return NextResponse.json({ ok: true }) // bot: campo trappola compilato
  if (deepProfanity({ name: b.name, address: b.address })) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (limited(req, 'send', 5, 600_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 })

  const input = parseInput(b)
  const email = str(b.email, 120).toLowerCase(), name = str(b.name, 80), phone = str(b.phone, 30)
  if (!input || !EMAIL_RE.test(email) || b.privacy !== true || (phone && phone.replace(/\D/g, '').length < 6))
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  if (isDisposableEmail(email)) return NextResponse.json({ error: 'disposable' }, { status: 400 })
  if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const place = await placeOf(input.address).catch(() => undefined)
  if (place === undefined) return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  if (!place) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const { result } = await valuate(input, place)
  const consentAgents = b.consent_agents === true, consentMarketing = b.consent_marketing === true

  // il lead si salva anche senza quotazione (zona non coperta): la mail lo dice e un agente puo' comunque aiutare
  const { address, ...data } = input
  const { error } = await getSupabaseServerClient().from('valuation_leads').insert({
    email, name: name || null, phone: phone || null, address, comune: place.comune,
    data: { ...data, luogo: place.luogo, prov: place.prov, lat: place.lat, lon: place.lon },
    result, consent_agents: consentAgents, consent_marketing: consentMarketing,
  })
  if (error) { console.error('valutazione: insert', error.message); return NextResponse.json({ error: 'server' }, { status: 500 }) }

  const mail = valuationEmail({ input, place, result, name, consentAgents })
  const sent = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Agente Immo <noreply@agenteimmo.me>', to: email, replyTo: 'info@agenteimmo.me',
    subject: mail.subject, html: mail.html, text: mail.text,
  }).catch((e: unknown) => ({ error: e }))
  if (sent.error) { console.error('valutazione: email', sent.error); return NextResponse.json({ error: 'server' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
