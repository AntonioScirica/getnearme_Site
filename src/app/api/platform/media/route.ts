import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { listKeys, publicUrl, deleteKeys } from '@/lib/r2'
import { getTeamUserIds } from '@/lib/teamScope'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type Entry = { text: string; room: string; from?: string }

// Galleria: una voce per foto di partenza. Le modifiche fatte una sull'altra (campo "from" nei file .meta)
// diventano una catena: si mostra l'ultima versione, con il prima dell'inizio e tutti i passaggi.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const keys = await listKeys(`edits/${userId}/`)
    // dati di ogni modifica: file vuoti "<risultato>.meta.<json base64url>"
    const idx: Record<string, Entry> = {}
    for (const { key } of keys) {
      const m = key.match(/^(.+)\.meta\.([\w-]+)$/)
      if (!m) continue
      try { const d = JSON.parse(Buffer.from(m[2], 'base64url').toString()); idx[`${m[1]}.jpg`] = { text: d.t ?? '', room: d.r ?? '', from: d.f } } catch { /* nome rovinato: si ignora */ }
    }
    const all = new Set(keys.map(k => k.key))
    const at = new Map(keys.map(k => [k.key, k.at]))
    const results = keys.filter(k => k.key.endsWith('.jpg') && !k.key.endsWith('-prima.jpg')).map(k => k.key)
    // radice di ogni risultato: si risale "from" finche' c'e' (max 50 passi, contro cicli)
    const rootOf = (k: string) => { let r = k; for (let i = 0; i < 50 && idx?.[r]?.from && all.has(idx[r].from!); i++) r = idx[r].from!; return r }
    const chains = new Map<string, string[]>()
    for (const k of results) { const r = rootOf(k); chains.set(r, [...(chains.get(r) ?? []), k]) }
    // foto create prima della Galleria (senza prima ne' dati): non si mostrano, restano su R2
    const items = [...chains.entries()].filter(([root, list]) => all.has(root.replace(/\.jpg$/, '-prima.jpg')) || list.some(k => idx[k])).map(([root, list]) => {
      const last = list.reduce((a, b) => ((at.get(b) ?? 0) > (at.get(a) ?? 0) ? b : a))
      // passaggi fino all'ultima versione (ramo che porta a lei), dal primo al piu' recente
      const path: string[] = []
      for (let k: string | undefined = last, i = 0; k && i < 50; k = idx?.[k]?.from, i++) path.unshift(k)
      const prima = root.replace(/\.jpg$/, '-prima.jpg')
      return {
        id: last,
        dopo: publicUrl(last),
        prima: all.has(prima) ? publicUrl(prima) : null,
        at: at.get(last) ?? 0,
        casa: root.match(/\/casa-([\w-]+)\//)?.[1] ?? null,
        text: idx?.[last]?.text ?? '',
        room: idx?.[root]?.room || idx?.[last]?.room || '',
        steps: path.map(k => ({ url: publicUrl(k), text: idx?.[k]?.text ?? '' })),
        all: list.map(k => idx?.[k]?.text ?? '').join(' '), // per la ricerca
        keys: list, // tutti i risultati della catena, anche i rami: servono per cancellarla intera
      }
    }).sort((a, b) => b.at - a.at)
    return NextResponse.json({ items })
  } catch (e) {
    console.error('media list', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}

// Cancella foto della Galleria: arrivano le chiavi dei risultati (tutti i passaggi di ogni voce scelta);
// si cancellano con il loro "prima" e i file .meta. Solo nella cartella dell'utente. Le foto usate in un
// immobile (salvate tra le sue foto) restano, altrimenti l'annuncio perderebbe l'immagine.
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: { keys?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const mine = `edits/${userId}/`
  const want = (Array.isArray(body.keys) ? body.keys : []).filter((k): k is string => typeof k === 'string' && k.startsWith(mine) && k.endsWith('.jpg') && !k.includes('..')).slice(0, 2000)
  if (!want.length) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  try {
    const { data: projects } = await admin.from('projects').select('cover, import_data').in('user_id', await getTeamUserIds(admin, userId))
    const used = JSON.stringify(projects ?? [])
    const keep = want.filter(k => used.includes(k))
    const del = want.filter(k => !used.includes(k))
    const all = await listKeys(mine)
    const bases = del.map(k => k.replace(/\.jpg$/, ''))
    const keys = all.map(x => x.key).filter(k => bases.some(b => k === `${b}.jpg` || k === `${b}-prima.jpg` || k.startsWith(`${b}.meta.`)))
    if (keys.length) await deleteKeys(keys)
    return NextResponse.json({ deleted: del.length, kept: keep.length })
  } catch (e) {
    console.error('media delete', e)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
