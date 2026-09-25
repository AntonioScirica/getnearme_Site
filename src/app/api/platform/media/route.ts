import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listKeys, publicUrl, getJson } from '@/lib/r2'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type Entry = { text: string; room: string; from?: string }

// Galleria: una voce per foto di partenza. Le modifiche fatte una sull'altra (index.json, campo "from")
// diventano una catena: si mostra l'ultima versione, con il prima dell'inizio e tutti i passaggi.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const [keys, idx] = await Promise.all([listKeys(`edits/${userId}/`), getJson<Record<string, Entry>>(`edits/${userId}/index.json`)])
    const all = new Set(keys.map(k => k.key))
    const at = new Map(keys.map(k => [k.key, k.at]))
    const results = keys.filter(k => k.key.endsWith('.jpg') && !k.key.endsWith('-prima.jpg')).map(k => k.key)
    // radice di ogni risultato: si risale "from" finche' c'e' (max 50 passi, contro cicli)
    const rootOf = (k: string) => { let r = k; for (let i = 0; i < 50 && idx?.[r]?.from && all.has(idx[r].from!); i++) r = idx[r].from!; return r }
    const chains = new Map<string, string[]>()
    for (const k of results) { const r = rootOf(k); chains.set(r, [...(chains.get(r) ?? []), k]) }
    const items = [...chains.entries()].map(([root, list]) => {
      const last = list.reduce((a, b) => ((at.get(b) ?? 0) > (at.get(a) ?? 0) ? b : a))
      // passaggi fino all'ultima versione (ramo che porta a lei), dal primo al piu' recente
      const path: string[] = []
      for (let k: string | undefined = last, i = 0; k && i < 50; k = idx?.[k]?.from, i++) path.unshift(k)
      const prima = root.replace(/\.jpg$/, '-prima.jpg')
      return {
        dopo: publicUrl(last),
        prima: all.has(prima) ? publicUrl(prima) : null,
        at: at.get(last) ?? 0,
        casa: root.match(/\/casa-([\w-]+)\//)?.[1] ?? null,
        text: idx?.[last]?.text ?? '',
        room: idx?.[root]?.room || idx?.[last]?.room || '',
        steps: path.map(k => ({ url: publicUrl(k), text: idx?.[k]?.text ?? '' })),
        all: list.map(k => idx?.[k]?.text ?? '').join(' '), // per la ricerca
      }
    }).sort((a, b) => b.at - a.at)
    return NextResponse.json({ items })
  } catch (e) {
    console.error('media list', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
