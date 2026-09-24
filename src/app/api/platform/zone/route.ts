import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { lookupZone } from '@/lib/zone'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 40

// Servizi nella zona di un indirizzo (OpenStreetMap). Solo utenti loggati: Nominatim e
// Overpass hanno limiti di uso, non esponiamo il proxy al pubblico.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const address = (req.nextUrl.searchParams.get('address') ?? '').trim().slice(0, 200)
  if (address.length < 6) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const r = Number(req.nextUrl.searchParams.get('radius'))
  const radius = Number.isFinite(r) && r > 0 ? Math.min(3000, Math.max(300, Math.round(r))) : undefined
  const zone = await lookupZone(address, radius)
  return NextResponse.json(zone ?? { pois: [] })
}
