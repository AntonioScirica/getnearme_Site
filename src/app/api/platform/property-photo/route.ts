import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamUserIds } from '@/lib/teamScope'
import { listKeys } from '@/lib/r2'
import { STYLE_LOOK } from '@/lib/stagingPrompts'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/.test(v) && v.length < 2000

// Foto di un immobile: aggiungi una foto AI accanto all'originale (o al posto suo), togli una foto, scegli la
// copertina. Le foto stanno in import_data.photos; import_data.prima ricorda per ogni foto AI la sua originale,
// cosi' il sito puo' mostrare il prima/dopo. Niente tabelle nuove.
// order: nuovo ordine delle foto (le stesse foto, solo spostate); la prima diventa la copertina
type Body = { projectId?: string; mode?: 'add' | 'replace' | 'remove' | 'cover' | 'order'; before?: string; after?: string; photo?: string; order?: unknown }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: Body
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (typeof b.projectId !== 'string' || !b.mode) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const { data: p } = await admin.from('projects').select('id, cover, thumb, import_data').eq('id', b.projectId).in('user_id', await getTeamUserIds(admin, userId)).maybeSingle()
  if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const d = (p.import_data && typeof p.import_data === 'object' ? p.import_data : {}) as Record<string, unknown>
  let photos = Array.isArray(d.photos) ? d.photos.filter(isUrl) : (isUrl(p.cover) ? [p.cover] : [])
  const prima: Record<string, string> = d.prima && typeof d.prima === 'object' ? Object.fromEntries(Object.entries(d.prima as Record<string, unknown>).filter((e): e is [string, string] => isUrl(e[1]))) : {}
  let cover: string = p.cover ?? ''
  // foto AI -> tipo per il bollino del sito (AI Act): arredata, modificata o "no" (Luminoso, senza AI)
  const ai: Record<string, string> = d.ai && typeof d.ai === 'object' ? Object.fromEntries(Object.entries(d.ai as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === 'string')) : {}

  if (b.mode === 'add' || b.mode === 'replace') {
    if (!isUrl(b.after)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const before = isUrl(b.before) ? b.before : ''
    const i = before ? photos.indexOf(before) : -1
    if (b.mode === 'replace' && i >= 0) photos[i] = b.after
    else if (i >= 0) photos.splice(i + 1, 0, b.after)
    else photos.push(b.after)
    // l'originale del prima/dopo e' la foto di partenza; se anche quella era AI, si risale alla vera originale
    // Prima e dopo: la nuova si confronta con l'originale. Sostituisci: la nuova prende il posto, niente confronto
    if (before && b.mode === 'add') prima[b.after] = prima[before] ?? before
    if (b.mode === 'replace') { delete prima[b.after]; delete prima[before] }
    if (b.mode === 'replace' && cover === before) cover = b.after
    photos = [...new Set(photos)].slice(0, 40)
    const k = await aiKindOf(b.after)
    if (k) ai[b.after] = k
  } else if (b.mode === 'remove') {
    if (!isUrl(b.photo)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    photos = photos.filter(x => x !== b.photo)
    delete prima[b.photo]
    if (cover === b.photo) cover = photos[0] ?? ''
  } else if (b.mode === 'cover') {
    if (!isUrl(b.photo) || !photos.includes(b.photo)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    cover = b.photo
    photos = [b.photo, ...photos.filter(x => x !== b.photo)] // la copertina diventa anche la prima foto della galleria
  } else if (b.mode === 'order') {
    const order = Array.isArray(b.order) ? b.order.filter(isUrl) : []
    if (order.length !== photos.length || new Set(order).size !== order.length || order.some(x => !photos.includes(x))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    photos = order
    cover = order[0] ?? cover
  }
  if (!cover && photos.length) cover = photos[0] // immobile salvato senza foto: la prima aggiunta diventa la copertina
  // solo coppie ancora presenti
  for (const k of Object.keys(prima)) if (!photos.includes(k)) delete prima[k]
  for (const k of Object.keys(ai)) if (!photos.includes(k)) delete ai[k]
  const import_data = { ...d, photos, prima, ai }
  const { error } = await admin.from('projects').update({ import_data, cover, updated_at: new Date().toISOString() }).eq('id', p.id)
  if (error) return NextResponse.json({ error: 'failed' }, { status: 500 })
  return NextResponse.json({ photos, prima, cover })
}

// Che lavoro AI e' una foto della piattaforma (edits/<utente>/<nome>.jpg): lo dice il file vuoto "<nome>.meta.<json>"
// scritto da photo-edit (a = arreda, svuota, modifica, luminoso...). Marker vecchi senza "a": dal testo della richiesta.
// null = non e' un risultato AI della piattaforma (foto caricata, annuncio) o non si sa: decide il sito (aiPhotoKinds).
async function aiKindOf(url: string): Promise<'arredata' | 'modificata' | 'no' | null> {
  const base = `${process.env.R2_PUBLIC_URL}/`
  const m = url.startsWith(base) ? url.slice(base.length).match(/^(edits\/[\w-]+\/[^?#]+?)\.jpg(\?.*)?$/) : null
  if (!m || m[1].endsWith('-prima')) return null
  try {
    const [hit] = await listKeys(`${m[1]}.meta.`, 1)
    if (!hit) return m[1].endsWith('-prova') ? 'arredata' : 'modificata' // prova della landing: arredo
    const meta = JSON.parse(Buffer.from(hit.key.slice(`${m[1]}.meta.`.length), 'base64url').toString()) as { t?: string; a?: string }
    if (meta.a) return meta.a === 'luminoso' ? 'no' : meta.a === 'arreda' ? 'arredata' : 'modificata'
    const t = (meta.t ?? '').trim()
    if (t === 'day') return 'no'
    return STYLE_LOOK[t.split(' ')[0]] ? 'arredata' : 'modificata'
  } catch { return null }
}
