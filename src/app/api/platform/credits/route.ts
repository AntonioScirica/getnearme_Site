import { NextRequest, NextResponse } from 'next/server'
import { authUser } from '@/lib/platformAuth'
import { getCredits, grantWelcome } from '@/lib/credits'

// Saldo crediti e piano dell'utente (con la ricarica mensile se e' passato il mese).
export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // prima volta: crediti di benvenuto (welcome: true una volta sola, la piattaforma mostra il popup)
  // (solo se sembra non avere niente: chi ha gia' una riga non riprova l'inserimento a ogni lettura)
  const c = await getCredits(u.id)
  if (c.plan !== 'none' || c.balance > 0 || c.until || c.unlimited || !(await grantWelcome(u.id))) return NextResponse.json(c)
  return NextResponse.json({ ...(await getCredits(u.id)), welcome: true })
}
