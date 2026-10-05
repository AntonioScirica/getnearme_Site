import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canAfford, getCredits, spendOnce } from '@/lib/credits'
import { CREDIT_COST } from '@/lib/pricing'
import { allowedUrl } from '@/lib/safeUrl'
import { deleteKeys, listKeys, uploadFile } from '@/lib/r2'
import { getTeamUserIds } from '@/lib/teamScope'
import { buildViewerPlan } from '@/lib/casa3d/build'
import { CASA3D_ON } from '@/lib/casa3d/flag'
import { recognizeFloor, validRaw } from '@/lib/casa3d/pipeline'
import { pickPhotos } from '@/lib/casa3d/materials'
import type { Casa3d, RawPlan } from '@/lib/casa3d/types'

export const runtime = 'nodejs'
export const maxDuration = 300

// Casa 3D dalla planimetria. Azioni:
//  recognize: una pianta (un piano) -> ritaglio, ridisegno GPT, riconoscimento, controllo Claude; 40 crediti per casa
//             (chiave della casa, fino a 4 piani), scalati una volta sola a pianta riconosciuta
//  build:     piani corretti dall'agente -> piante per il visore su R2 (+ details.casa3d dell'immobile); gratis
//  poster:    vista dall'alto fatta dal visore nel browser -> poster dell'immobile
//  delete:    toglie la casa 3D dall'immobile (e i file su R2)
// Niente tabelle nuove: tutto in import_data.details.casa3d e su R2 sotto casa3d/<utente>/<chiave>/.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const KEY = /^[\w-]{6,40}$/
const MAX_FLOORS = 4

async function userOf(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}
async function projectOf(userId: string, id: unknown) {
  if (typeof id !== 'string' || !/^[\w-]{1,64}$/.test(id)) return null
  const { data } = await admin.from('projects').select('id, mq, import_data').eq('id', id).in('user_id', await getTeamUserIds(admin, userId)).maybeSingle()
  return data
}
async function saveCasa(p: { id: string; import_data: unknown }, casa: Casa3d | null) {
  const d = (p.import_data && typeof p.import_data === 'object' ? p.import_data : {}) as Record<string, unknown>
  const details = { ...((d.details && typeof d.details === 'object' ? d.details : {}) as Record<string, unknown>) }
  if (casa) details.casa3d = casa; else delete details.casa3d
  const { error } = await admin.from('projects').update({ import_data: { ...d, details }, updated_at: new Date().toISOString() }).eq('id', p.id)
  return !error
}
const paid = async (userId: string, key: string) => {
  const { count } = await admin.from('platform_credit_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('reason', 'casa3d').eq('meta->>job', key)
  return !!count
}
async function imageBuffer(src: unknown): Promise<Buffer | null> {
  if (typeof src !== 'string') return null
  if (/^data:image\/(jpeg|png|webp);base64,/.test(src) && src.length < 12_000_000) return Buffer.from(src.split(',')[1] ?? '', 'base64')
  if (!allowedUrl(src)) return null
  const r = await fetch(src, { signal: AbortSignal.timeout(20_000) }).catch(() => null)
  return r?.ok ? Buffer.from(await r.arrayBuffer()) : null
}

export async function POST(req: NextRequest) {
  if (!CASA3D_ON) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const userId = await userOf(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: Record<string, unknown>
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const key = typeof b.key === 'string' && KEY.test(b.key) ? b.key : ''
  const base = `casa3d/${userId}/${key}`

  if (b.action === 'recognize') {
    const floor = Number(b.floor ?? 0)
    if (!key || !Number.isInteger(floor) || floor < 0 || floor >= MAX_FLOORS) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const already = await paid(userId, key)
    if (!already && !(await canAfford(userId, 'casa3d'))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST.casa3d }, { status: 402 })
    // rifare gratis si', ma non all'infinito sulla stessa casa (ogni giro costa GPT + Claude): al massimo 2 a piano
    if (already && (await listKeys(`${base}/`)).filter(k => k.key.includes('-orig-')).length >= 2 * MAX_FLOORS) return NextResponse.json({ error: 'limit' }, { status: 429 })
    const image = await imageBuffer(b.image)
    if (!image) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    // pianta gia' ridisegnata (prove in locale: niente GPT da ripagare)
    // in locale: pianta ridisegnata passata o gia' pronta su R2 per quell'immagine (casa3d-dev/cad-<sha1>.png), niente GPT
    let cad = process.env.NODE_ENV !== 'production' ? await imageBuffer(b.cad) : null
    if (!cad && process.env.NODE_ENV === 'development') {
      const h = (await import('crypto')).createHash('sha1').update(image).digest('hex')
      const r = await fetch(`${process.env.R2_PUBLIC_URL}/casa3d-dev/cad-${h}.png`).catch(() => null)
      if (r?.ok) cad = Buffer.from(await r.arrayBuffer())
    }
    const areaM2 = typeof b.areaM2 === 'number' && b.areaM2 > 10 && b.areaM2 < 2000 ? b.areaM2 : undefined
    try {
      // foto dell'immobile per i materiali veri: solo al primo piano (una chiamata per casa)
      const proj = floor === 0 ? await projectOf(userId, b.projectId) : null
      const pd = (proj?.import_data ?? {}) as { photos?: unknown; rooms?: Record<string, { scene?: string; room?: string }> }
      const photos = Array.isArray(pd.photos) ? pickPhotos(pd.photos.filter((x): x is string => typeof x === 'string' && allowedUrl(x)), pd.rooms ?? {}) : []
      const r = await recognizeFloor({ userId, image, areaM2, cad: cad ?? undefined, photos, check: !(process.env.NODE_ENV === 'development' && process.env.CASA3D_DEV_NOCHECK) }) // prove in locale senza Claude: CASA3D_DEV_NOCHECK=1
      const v = Date.now().toString(36)
      const [crop, cadUrl, overlay] = await Promise.all([
        uploadFile(await (await import('sharp')).default(r.crop).jpeg({ quality: 85 }).toBuffer(), `${base}/f${floor}-orig-${v}.jpg`, 'image/jpeg'),
        uploadFile(r.cad, `${base}/f${floor}-cad-${v}.png`, 'image/png'),
        uploadFile(r.overlay, `${base}/f${floor}-check-${v}.jpg`, 'image/jpeg'),
      ])
      await uploadFile(Buffer.from(JSON.stringify(r.raw)), `${base}/f${floor}-raw-${v}.json`, 'application/json')
      const credits = already ? (await getCredits(userId)).balance : await spendOnce(userId, 'casa3d', key)
      return NextResponse.json({ raw: r.raw, image: crop, cad: cadUrl, overlay, ms: r.ms, usd: Math.round(r.usd * 1000) / 1000, notes: r.fix?.notes ?? null, scaleNote: r.raw.source.scale_note ?? null, credits })
    } catch (e) {
      console.error('casa3d recognize', e)
      const msg = e instanceof Error ? e.message : ''
      return NextResponse.json({ error: msg === 'no_rooms' ? 'no_rooms' : 'failed' }, { status: 500 })
    }
  }

  if (b.action === 'build') {
    const floors = Array.isArray(b.floors) ? b.floors.slice(0, MAX_FLOORS) as { name?: unknown; raw?: unknown; image?: unknown }[] : []
    if (!key || !floors.length || !floors.every(f => validRaw(f.raw))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    if (!(await paid(userId, key)) && !(await getCredits(userId)).unlimited) return NextResponse.json({ error: 'not_recognized' }, { status: 403 })
    const v = Date.now().toString(36)
    // i materiali letti al primo piano valgono per tutta la casa
    const mats = floors.map(f => (f.raw as RawPlan).materials).find(Boolean)
    if (mats) for (const f of floors) if (!(f.raw as RawPlan).materials) (f.raw as RawPlan).materials = mats
    const out: Casa3d['floors'] = []
    for (const [i, f] of floors.entries()) {
      const name = typeof f.name === 'string' && f.name.trim() ? f.name.trim().slice(0, 40) : `Piano ${i + 1}`
      const raw = f.raw as RawPlan
      const plan = buildViewerPlan(raw, name)
      const [rawUrl, planUrl] = await Promise.all([
        uploadFile(Buffer.from(JSON.stringify(raw)), `${base}/f${i}-raw-${v}.json`, 'application/json'),
        uploadFile(Buffer.from(JSON.stringify(plan)), `${base}/f${i}-plan-${v}.json`, 'application/json'),
      ])
      out.push({ name, raw: rawUrl, plan: planUrl, image: typeof f.image === 'string' && allowedUrl(f.image) ? f.image : '' })
    }
    // elenco dei piani letto dal visore (public/casa3d/v1/index.html?src=...)
    const manifest = await uploadFile(Buffer.from(JSON.stringify({ floors: out.map(f => ({ name: f.name, plan: f.plan, image: f.image })) })), `${base}/casa-${v}.json`, 'application/json')
    const now = new Date().toISOString()
    const p = await projectOf(userId, b.projectId)
    const prev = ((p?.import_data as { details?: { casa3d?: Casa3d } } | null)?.details?.casa3d) ?? null
    const casa: Casa3d = { status: 'ready', key, floors: out, manifest, created: prev?.key === key ? prev.created : now, updated: now, ...(prev?.key === key && prev.poster ? { poster: prev.poster } : {}) }
    if (p && !(await saveCasa(p, casa))) return NextResponse.json({ error: 'failed' }, { status: 500 })
    return NextResponse.json({ casa3d: casa })
  }

  if (b.action === 'poster') {
    const img = typeof b.image === 'string' && /^data:image\/(jpeg|webp);base64,/.test(b.image) && b.image.length < 3_000_000 ? b.image : ''
    if (!key || !img) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const sharp = (await import('sharp')).default
    const webp = await sharp(Buffer.from(img.split(',')[1], 'base64')).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
    const url = await uploadFile(webp, `${base}/poster-${Date.now().toString(36)}.webp`, 'image/webp')
    const p = await projectOf(userId, b.projectId)
    const cur = (p?.import_data as { details?: { casa3d?: Casa3d } } | null)?.details?.casa3d
    if (p && cur?.key === key) await saveCasa(p, { ...cur, poster: url })
    return NextResponse.json({ poster: url })
  }

  if (b.action === 'delete') {
    const p = await projectOf(userId, b.projectId)
    if (!p) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const cur = (p.import_data as { details?: { casa3d?: Casa3d } } | null)?.details?.casa3d
    if (!(await saveCasa(p, null))) return NextResponse.json({ error: 'failed' }, { status: 500 })
    if (cur?.key && KEY.test(cur.key)) await deleteKeys((await listKeys(`casa3d/${userId}/${cur.key}/`)).map(k => k.key)).catch(() => {})
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'bad_request' }, { status: 400 })
}
