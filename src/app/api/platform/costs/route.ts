import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAiCosts } from '@/lib/aiCosts'
import { isPlatformAdmin } from '@/lib/platformAdmins'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Costi AI in tempo reale: solo account admin della piattaforma.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!isPlatformAdmin(data.user?.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  return NextResponse.json(await getAiCosts())
}
