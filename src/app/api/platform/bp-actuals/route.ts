import { NextRequest, NextResponse } from 'next/server'
import { isPlatformAdmin } from '@/lib/platformAdmins'
import { isMetricsRequest } from '@/lib/metricsAuth'
import { admin, computeBpActuals } from '@/lib/bpActuals'

// Dati reali per il business plan dinamico, SOLO LETTURA. Accesso: token Supabase di un admin
// della piattaforma (#/business-plan) oppure chiave del dashboard /metrics (header x-metrics-key).
// Il calcolo vive in src/lib/bpActuals.ts (condiviso con /api/metrics/agenteimmo).
export async function GET(req: NextRequest) {
  if (!isMetricsRequest(req)) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { data: me } = await admin.auth.getUser(token)
    if (!isPlatformAdmin(me.user?.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return NextResponse.json(await computeBpActuals())
}
