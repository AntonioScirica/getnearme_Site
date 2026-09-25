import { NextRequest, NextResponse } from 'next/server'
import { buildStagingPrompt, roomKey, type SceneType } from '@/lib/stagingPrompts'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { createClient } from '@supabase/supabase-js'
import { uploadJpeg, uploadMarker } from '@/lib/r2'
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const runtime = 'nodejs'
export const maxDuration = 300

// "Sistema con AI": modifica una foto con Qwen-Image 2.1 sul nostro endpoint RunPod
// (repo getnearme-qwen-image-worker). Risultato salvato su R2, costo in ai_usage.
// Solo foto dei CDN dei portali o del nostro R2: il worker non scarica URL arbitrari.
const ALLOWED = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
const RUNPOD = 'https://api.runpod.ai/v2'
const allowedUrl = (u: string) => ALLOWED.test(u) || (!!process.env.R2_PUBLIC_URL && u.startsWith(`${process.env.R2_PUBLIC_URL}/`)) || isPublicHttpsUrl(u)

type RunpodJob = { id?: string; status?: string; output?: { image_base64?: string; error?: string; seconds?: number }; error?: string }

async function runJob(input: Record<string, unknown>): Promise<RunpodJob> {
  const id = process.env.AI_IMAGE_ENDPOINT_ID
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` }
  // runsync attende fino a ~90 s; se il lavoro non e' finito (avvio a freddo) si prosegue con /status.
  let job: RunpodJob = await fetch(`${RUNPOD}/${id}/runsync`, { method: 'POST', headers, body: JSON.stringify({ input }), signal: AbortSignal.timeout(120_000) }).then(r => r.json())
  const deadline = Date.now() + 240_000
  while (job.id && (job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS') && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    job = await fetch(`${RUNPOD}/${id}/status/${job.id}`, { headers, signal: AbortSignal.timeout(20_000) }).then(r => r.json())
  }
  return job
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Foto: URL (annunci, R2) oppure caricata dal computer (imageBase64, data URL gia' ridimensionata).
  // Modifica: testo libero e/o i preset di home staging (stile, vista, scena, planimetria).
  let body: { imageUrl?: string; imageBase64?: string; prompt?: string; style?: string; angle?: string; scene?: SceneType; planimetria?: boolean; seed?: number; region?: { x: number; y: number; w: number; h: number; poly?: { x: number; y: number }[] }; projectId?: string; room?: string; points?: { x: number; y: number }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const custom = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : ''
  const scene: SceneType = body.scene === 'esterno' || body.scene === 'giardino' ? body.scene : 'interno'
  const hasPreset = !!(body.style || body.angle || body.planimetria)
  if ((!custom && !hasPreset) || (!imageBase64 && !allowedUrl(imageUrl))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const prompt = buildStagingPrompt({ customPrompt: custom, style: body.style, angle: body.angle, planimetria: !!body.planimetria, scene, room: roomKey(typeof body.room === 'string' ? body.room : '') })
  // Testo libero: il worker lo traduce in inglese (Qwen-Image ignora quasi l'italiano) dentro la stessa cornice.
  const usesText = !!custom && !body.angle && !body.planimetria
  const translation: { request?: string; prompt_template?: string } = usesText ? { request: custom, prompt_template: buildStagingPrompt({ customPrompt: '{REQUEST}', scene }) } : {}
  // Zona selezionata dall'agente (0..1): il worker modifica solo li'. Prompt dedicato: si lavora su un ritaglio.
  const r = body.region
  // Forma libera (lazo): poligono in 0..1, max 300 punti; senza, e' un rettangolo
  const poly = Array.isArray(r?.poly) ? r.poly.filter(p => p && [p.x, p.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)).slice(0, 300).map(p => ({ x: p.x, y: p.y })) : []
  const region = r && [r.x, r.y, r.w, r.h].every(v => typeof v === 'number' && v >= 0 && v <= 1) && r.w > 0.02 && r.h > 0.02 ? { x: r.x, y: r.y, w: r.w, h: r.h, ...(poly.length >= 3 ? { poly } : {}) } : null
  // Clic sugli oggetti (maschera SAM nel worker)
  const points = Array.isArray(body.points) ? body.points.filter(p => p && [p.x, p.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)).slice(0, 10) : []
  // Senza zona ne' clic: se la richiesta parla di pareti, pavimento o soffitto si modifica solo quell'elemento
  // (riconosciuto nel worker), cosi' "pareti bianche" non tocca i mobili bianchi.
  const labels = !region && !points.length && usesText ? [
    ...(/\b(pareti|parete|muri|muro|muratura)\b/i.test(custom) ? ['wall'] : []),
    ...(/\b(pavimento|pavimenti|parquet)\b/i.test(custom) ? ['floor'] : []),
    ...(/\b(soffitto|soffitti)\b/i.test(custom) ? ['ceiling'] : []),
  ] : []
  // Rettangolo: al modello vanno la foto e la stessa foto con un rettangolo rosso sulla zona (disegnato
  // dal worker, "mark"); fuori dalla zona il worker rimette la foto originale.
  if (region && usesText) {
    const mk = region.poly ? 'red outline' : 'red rectangle'
    translation.prompt_template = `Edit the first image: {REQUEST}. The request refers to what is inside the area marked by the ${mk} in the second image: change only that area; if it asks to remove, erase the whole object inside the ${mk} completely, including all its parts, and show the floor and walls behind it. Do not add any new object, decoration or wall art that was not requested. Fill any freed area naturally, continuing the same floor, walls and light around it. Keep everything outside the ${mk} exactly the same, same framing and perspective. The result must not contain any red rectangle or outline. Photorealistic.`
  } else if (points.length && usesText) {
    translation.prompt_template = 'In this close-up crop of a room photo: {REQUEST}. Do not add anything that was not requested. Fill any freed area naturally, continuing the same floor, walls and light around it. Keep the rest of the crop unchanged. Photorealistic.'
  }
  // Seme casuale: la stessa richiesta ripetuta da' ogni volta un risultato diverso (iterare, rigenerare).
  const seed = typeof body.seed === 'number' ? body.seed : Math.floor(Math.random() * 1_000_000)

  // Modalita' finta: nessuna GPU, torna la stessa foto.
  if (AI_MOCK) { await mockDelay(2000); return NextResponse.json({ url: imageUrl || imageBase64, mock: true }) }
  if (!process.env.AI_IMAGE_ENDPOINT_ID || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const t0 = Date.now()
  let job: RunpodJob
  try {
    job = await runJob({ ...(imageBase64 ? { image_base64: imageBase64 } : { image_url: imageUrl }), prompt, ...translation, ...(region ? { mark: region } : {}), ...(points.length ? { points } : {}), ...(labels.length ? { labels } : {}), seed, steps: 12 }) // 12 passaggi: ~8 s invece di 17 a 25, qualita' simile nel confronto del 24/09
  } catch (e) {
    console.error('photo-edit runpod error:', e)
    await logUsage({ userId, kind: 'photo_edit' }, true, Date.now() - t0, {}, false, 'qwen-image-2.1')
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
  const ms = Date.now() - t0
  const b64 = job.output?.image_base64
  await logUsage({ userId, kind: 'photo_edit' }, true, ms, {}, !!b64, 'qwen-image-2.1')
  if (!b64) {
    console.error('photo-edit failed:', job.status, job.error || job.output?.error)
    return NextResponse.json({ error: job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS' ? 'timeout' : 'ai_failed' }, { status: 502 })
  }
  if (process.env.NODE_ENV !== 'production') await debugDump({ imageBase64, imageUrl, region, prompt: (translation.prompt_template ?? prompt), request: translation.request, outB64: b64, translated: (job.output as { translated?: string } | undefined)?.translated, worker: (job as { workerId?: string }).workerId })
  // foto di un immobile (scelta dalla vetrina): cartella casa-<id>, la Galleria le raggruppa per casa
  const projectId = typeof body.projectId === 'string' && /^[\w-]{1,64}$/.test(body.projectId) ? body.projectId : ''
  const key = `edits/${userId}/${projectId ? `casa-${projectId}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const url = await uploadJpeg(await matchInputShape(Buffer.from(b64, 'base64'), imageBase64, imageUrl), `${key}.jpg`)
  // Media: accanto al risultato si salva anche il "prima" (<chiave>-prima.jpg), cosi' la pagina Media
  // mostra ogni modifica con prima e dopo leggendo solo la cartella su R2 (niente tabella).
  await savePrima(imageBase64, imageUrl, `${key}-prima.jpg`)
  // Dati per la Galleria (richiesta, stanza, foto di partenza) nel NOME di un file vuoto accanto al risultato:
  // un file per modifica, quindi nessun conflitto anche con piu' foto generate insieme, e la Galleria li legge
  // tutti con il solo elenco della cartella.
  const room = typeof body.room === 'string' ? body.room.slice(0, 40) : ''
  const what = custom || [body.style, body.angle, body.planimetria ? 'planimetria' : ''].filter(Boolean).join(' ')
  const mine = `${process.env.R2_PUBLIC_URL}/edits/${userId}/`
  const from = imageUrl.startsWith(mine) ? imageUrl.slice(`${process.env.R2_PUBLIC_URL}/`.length) : undefined
  const meta = Buffer.from(JSON.stringify({ t: what.slice(0, 160), r: room, ...(from ? { f: from } : {}) })).toString('base64url')
  await uploadMarker(`${key}.meta.${meta}`).catch(e => console.error('media meta', e))
  return NextResponse.json({ url, seconds: job.output?.seconds })
}

async function savePrima(imageBase64: string, imageUrl: string, key: string) {
  try {
    const src = imageBase64
      ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64')
      : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
    await uploadJpeg(await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(), key)
  } catch (e) { console.error('savePrima', e) } // senza "prima" il risultato resta comunque nei Media
}

// Il modello genera a ~1 MP con lati multipli di 32: le proporzioni cambiano di poco (es. 1920x1440 ->
// 1184x896) e nel prima/dopo la foto sembra spostata. Riporto il risultato alle proporzioni esatte
// dell'originale (lato lungo max 1600 px). Se l'originale non si legge, resta com'e'.
async function matchInputShape(out: Buffer, imageBase64: string, imageUrl: string): Promise<Buffer> {
  try {
    const src = imageBase64
      ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64')
      : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).metadata()
    if (!width || !height) return out
    const k = Math.min(1, 1600 / Math.max(width, height))
    return await sharp(out).resize(Math.round(width * k), Math.round(height * k), { fit: 'fill' }).jpeg({ quality: 90 }).toBuffer()
  } catch {
    return out
  }
}

// Solo in sviluppo: salva in /tmp/gnm-debug cosa e' stato mandato al modello (foto, foto con il rettangolo
// rosso, prompt, traduzione, risultato) per controllare le modifiche di una zona.
async function debugDump(d: { imageBase64: string; imageUrl: string; region: { x: number; y: number; w: number; h: number } | null; prompt: string; request?: string; outB64: string; translated?: string; worker?: string }) {
  try {
    const { mkdir, writeFile } = await import('fs/promises')
    const dir = `/tmp/gnm-debug/${Date.now()}`
    await mkdir(dir, { recursive: true })
    const src = d.imageBase64 ? Buffer.from(d.imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(d.imageUrl)).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).metadata()
    await writeFile(`${dir}/1-foto.jpg`, await sharp(src).jpeg().toBuffer())
    if (d.region && width && height) {
      const r = d.region
      const svg = `<svg width="${width}" height="${height}"><rect x="${r.x * width}" y="${r.y * height}" width="${r.w * width}" height="${r.h * height}" fill="none" stroke="red" stroke-width="${Math.max(4, Math.floor(width / 200))}"/></svg>`
      // stessa immagine segnata che disegna il worker (draw_mark): rettangolo rosso pieno
      await writeFile(`${dir}/2-foto-con-rettangolo.jpg`, await sharp(src).composite([{ input: Buffer.from(svg) }]).jpeg().toBuffer())
    }
    await writeFile(`${dir}/3-risultato.jpg`, Buffer.from(d.outB64, 'base64'))
    await writeFile(`${dir}/prompt.txt`, `richiesta: ${d.request ?? ''}\ntradotta: ${d.translated ?? '(worker vecchio, nessuna traduzione)'}\nzona: ${JSON.stringify(d.region)}\nworker: ${d.worker ?? '?'}\n\nprompt:\n${d.prompt}\n`)
  } catch (e) { console.error('debugDump', e) }
}
