import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/platformAuth'
import { getCredits } from '@/lib/credits'

// Saldo crediti e piano dell'utente (con la ricarica mensile se e' passato il mese).
export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json(await getCredits(u.id))
}
