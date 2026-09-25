import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listKeys, publicUrl } from '@/lib/r2'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Media: tutte le foto create in chat (edits/<utente>/), ognuna con il suo "prima" se salvato.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const keys = await listKeys(`edits/${userId}/`)
    const all = new Set(keys.map(k => k.key))
    const items = keys
      .filter(k => k.key.endsWith('.jpg') && !k.key.endsWith('-prima.jpg'))
      .map(k => {
        const prima = k.key.replace(/\.jpg$/, '-prima.jpg')
        return { dopo: publicUrl(k.key), prima: all.has(prima) ? publicUrl(prima) : null, at: k.at }
      })
      .sort((a, b) => b.at - a.at)
    return NextResponse.json({ items })
  } catch (e) {
    console.error('media list', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
