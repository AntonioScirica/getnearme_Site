import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { spawn } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import ffmpegPath from 'ffmpeg-static'
import { runJob, allowedUrl } from '@/lib/runpodImage'
import { uploadFile, uploadJpeg } from '@/lib/r2'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'

export const runtime = 'nodejs'
export const maxDuration = 300

// Video "i mobili compaiono" da una foto arredata (risultato AI o foto vera dell'agente).
// Ricetta approvata il 27/09/2026 (vedi memoria popup-video-template):
//   1. foto ritagliata 16:9 (orizzontale) o 9:16 (verticale) = F
//   2. Qwen svuota F = E (stessa inquadratura)
//   3. Opus elenca i pezzi che ci sono in F e non in E
//   4. Veo 3.1 Lite first-last-frame AL CONTRARIO: da F a E, i pezzi spariscono uno alla volta.
//      Veo rispetta sempre il primo fotogramma, mentre l'ultimo lo raggiunge con una dissolvenza:
//      al contrario il video finisce esattamente sulla foto vera.
//   5. (GET) taglio prima della dissolvenza di Veo, video invertito, 2,5 s di fermo, zoom 4% ease-in-out, musica.
// POST avvia (~20 s, Veo resta in coda su fal), GET controlla e a fine lavoro monta e salva su R2.

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FAL = 'https://queue.fal.run/fal-ai/veo3.1'
const HOLD = 2.5

// Corto e "remove only": con il blocco lungo della stanza davanti Qwen allargava l'inquadratura (prova del 27/09)
const EMPTY_PROMPT = 'Remove only the movable furniture and loose objects from this room: sofas, armchairs, chairs, tables, beds, freestanding cabinets, rugs, cushions, blankets, lamps, plants, decor and personal items. Keep exactly the same, pixel for pixel: walls, ceiling and lights, windows and doors with their frames, curtains, mirrors and built-in or mirrored wardrobes, the TV wall unit with its shelves, the kitchen, bathroom fixtures, radiators, sockets, the floor with its exact material and color (continue the same floor where the furniture stood), the daylight and the camera position, zoom and framing. Photorealistic.'
const NEG = 'text, letters, numbers, percent signs, captions, watermark, circles, ovals, rings, halos, light arcs, light trails, glowing lines, light beams, lens flare, fast camera movement, camera shake, new parts of the room, dissolve, ghosting, double exposure, semi-transparent objects, duplicated furniture, springs, coils, bouncing platform, ropes, cranes, new objects, extra furniture, extra cushions, extra decor, people, hands, tripod, camera, sliding objects, flying objects, floating objects, fading in, cross-fade, morphing, melting, flicker, exposure change, camera movement, zoom, pan'
type Anim = 'popup' | 'gravity'
// Veo lavora AL CONTRARIO (dalla foto arredata alla vuota), poi il video si inverte:
// popup = ogni pezzo si rimpicciolisce sul posto (invertito: spunta e si assesta);
// gravity = ogni pezzo si solleva ed esce dall'alto (invertito: cade dall'alto e si posa).
const VANISH: Record<Anim, string> = {
  popup: 'Each object vanishes on the spot: it swells very slightly for a few frames, then quickly shrinks into a tiny point at its base and is gone, leaving the bare floor and walls exactly as in the last image. Objects never move, slide or fly. ',
  gravity: 'Each object lifts straight up off the floor and quickly rises out through the top of the frame, keeping its shape, size and color, never rotating or tumbling, leaving the bare floor and walls exactly as in the last image. Objects never slide sideways. ',
}
const prompt = (order: string, anim: Anim) => 'Elegant, satisfying real-estate animation with a perfectly still, locked-off camera: identical framing for the whole video, no pan, no zoom. Walls, ceiling, curtains, built-in furniture, doors, windows, floor and daylight never change. '
  + `These are the only objects that disappear, in exactly these quantities: ${order}. Nothing new ever appears. The last frame is identical to the final empty image. `
  + 'The camera is exactly the one of the first and last image for the whole video: same lens, same framing, same distance, it never moves. '
  + 'The furnished room is shown perfectly still for half a second. Then the objects vanish one after another in a quick smooth cascade, consecutive objects overlapping slightly in time like a wave: first the small objects on top of the furniture, then the pieces closest to the camera, then the pieces further back. '
  + VANISH[anim]
  + `Order: ${order}. By the fourth second the room is completely empty and identical to the last image; from then on nothing moves or changes at all.`
// dall'alto: i pezzi volano per davvero, niente divieti di volo
const negFor = (anim: Anim) => (anim === 'gravity' ? NEG.replace('flying objects, floating objects, ', 'tumbling objects, rotating objects, ') : NEG)

async function userOf(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}
// il lavoro di fal torna al client firmato con l'utente: solo chi l'ha avviato puo' finalizzarlo
const sign = (userId: string, id: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`${userId}:${id}`).digest('base64url').slice(0, 22)
const fal = (url: string, body?: unknown) => fetch(url, {
  method: body ? 'POST' : 'GET', headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
}).then(r => r.json())

export async function POST(req: NextRequest) {
  const userId = await userOf(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: { imageUrl?: string; imageBase64?: string; projectId?: string; anim?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const anim: Anim = body.anim === 'gravity' ? 'gravity' : 'popup'
  if (!imageBase64 && !allowedUrl(imageUrl)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (AI_MOCK) { await mockDelay(2000); return NextResponse.json({ job: 'mock' }) }
  if (!process.env.FAL_API_KEY || !process.env.AI_IMAGE_ENDPOINT_ID || !process.env.RUNPOD_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  try {
    // 1. formato dalla foto, ritaglio centrale
    const src = imageBase64 ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).rotate().metadata()
    const landscape = width >= height
    const [W, H] = landscape ? [1280, 720] : [720, 1280]
    const full = await sharp(src).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
    const key = `videos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const fullUrl = await uploadJpeg(full, `${key}-arredata.jpg`)

    // 2-3. Qwen svuota (stessa inquadratura), Opus elenca i pezzi e controlla che la stanza sia davvero vuota:
    // a volte Qwen lascia un mobile (27/09: letto rimasto con un seme su due), allora si riprova con un altro seme.
    let empty: Buffer | null = null, items: string[] = []
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now()
      const job = await runJob({ image_url: fullUrl, prompt: EMPTY_PROMPT, seed: Math.floor(Math.random() * 1_000_000), steps: 12 })
      await logUsage({ userId, kind: 'video_empty' }, true, Date.now() - t0, {}, !!job.output?.image_base64, 'qwen-image-2.1')
      if (!job.output?.image_base64) return NextResponse.json({ error: job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS' ? 'timeout' : 'ai_failed' }, { status: 502 })
      empty = await sharp(Buffer.from(job.output.image_base64, 'base64')).resize(W, H, { fit: 'fill' }).jpeg({ quality: 95 }).toBuffer()
      // nomi semplici e quantita' esatte: descrizioni sbagliate cambiano la forma ai mobili
      const t1 = Date.now()
      const msg = await new Anthropic().messages.create({
        model: 'claude-opus-5-5', max_tokens: 3000,
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Image 1 should be an empty room, image 2 is the same room furnished.' },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(empty).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(full).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
          { type: 'text', text: 'List every object that is in image 2 and not in image 1: rugs, furniture, cushions, throws, plants, books, decor. Look carefully and count exactly. For each item write a short description of how it really looks in image 2: its real shape (e.g. rectangular, round, L-shaped, curved) and its main color and material, exactly as you see them, nothing invented. Order as a designer would place them: rug first, then the largest furniture, then smaller furniture, then cushions, then small decor last. Group identical small items with their exact count. Also check image 1: "empty" is false if it still contains any bed, sofa, armchair, table, chair or other freestanding furniture (built-in wardrobes, kitchens, TV wall units, curtains and radiators are fine), or if its framing or zoom differs from image 2. Reply with JSON only: {"items": ["..."], "empty": true}' },
        ] }],
      })
      await logUsage({ userId, kind: 'video_items' }, false, Date.now() - t1, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, 'claude-opus-5-5')
      const txt = msg.content.find(c => c.type === 'text')?.text ?? '' // i modelli nuovi possono mettere prima un blocco di ragionamento
      const r = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { items?: string[]; empty?: boolean }
      items = r.items ?? []
      if (r.empty !== false) break
    }
    if (!items.length || !empty) return NextResponse.json({ error: 'nothing_to_animate' }, { status: 422 })
    const emptyUrl = await uploadJpeg(empty, `${key}-vuota.jpg`)
    const order = [...items].reverse().join(', then ') // al contrario: spariscono prima i piccoli oggetti

    // 4. Veo al contrario: dalla foto arredata alla vuota
    const q = await fal(`${FAL}/lite/first-last-frame-to-video`, {
      first_frame_url: fullUrl, last_frame_url: emptyUrl, prompt: prompt(order, anim), negative_prompt: negFor(anim),
      duration: '8s', aspect_ratio: landscape ? '16:9' : '9:16', resolution: '720p', generate_audio: false, seed: Math.floor(Math.random() * 1_000_000),
    })
    if (!q.request_id) { console.error('video fal submit', q); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }
    return NextResponse.json({ job: `${q.request_id}.${sign(userId, q.request_id)}` })
  } catch (e) {
    console.error('video start', e)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  const userId = await userOf(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const [id, sig] = (req.nextUrl.searchParams.get('job') ?? '').split('.')
  if (id === 'mock' && AI_MOCK) return NextResponse.json({ url: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili/F12_rianima.mp4' })
  if (!id || !/^[\w-]{8,64}$/.test(id) || !sig || sig.length !== 22 || !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(userId, id)))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  const key = `videos/${userId}/${id}.mp4`
  const url = `${process.env.R2_PUBLIC_URL}/${key}`
  if ((await fetch(url, { method: 'HEAD' })).ok) return NextResponse.json({ url }) // gia' montato

  const s = await fal(`${FAL}/requests/${id}/status`)
  if (s.status === 'IN_QUEUE' || s.status === 'IN_PROGRESS') return NextResponse.json({ status: 'working' })
  if (s.status !== 'COMPLETED') { console.error('video fal status', s); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }
  const out = await fal(`${FAL}/requests/${id}`)
  if (!out.video?.url) { console.error('video fal result', out); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }

  const dir = await mkdtemp(join(tmpdir(), 'vid-'))
  try {
    const raw = join(dir, 'veo.mp4'), music = join(dir, 'music.mp3'), final = join(dir, 'out.mp4')
    const tracks = MUSIC_CATALOG['property-reveal']
    const track = tracks[Math.floor(Math.random() * tracks.length)]
    await Promise.all([
      fetch(out.video.url).then(r => r.arrayBuffer()).then(b => writeFile(raw, Buffer.from(b))),
      fetch(`https://pub-cd3d5947375c4207af2dc57da61686ee.r2.dev/music/property-reveal/${encodeURIComponent(track)}`).then(r => r.arrayBuffer()).then(b => writeFile(music, Buffer.from(b))),
    ])
    const cut = cutPoint(await ffmpeg(['-i', raw, '-vf', 'scale=160:90,format=gray', '-f', 'rawvideo', '-']), 160 * 90)
    const total = cut + HOLD, n = Math.round(total * 30)
    // zoom 4% ease-in-out su tutto il video, sub-pixel (perspective con interpolazione: niente tremolio)
    const z = `(1+0.04*(0.5-0.5*cos(PI*min(in/${n}\\,1))))`, o = `(1-1/${z})/2`
    await ffmpeg(['-y', '-i', raw, '-i', music, '-filter_complex',
      `[0:v]trim=end=${cut.toFixed(2)},setpts=PTS-STARTPTS,reverse,fps=30,tpad=stop_mode=clone:stop_duration=${HOLD},`
      + `perspective=x0='W*${o}':y0='H*${o}':x1='W-W*${o}':y1='H*${o}':x2='W*${o}':y2='H-H*${o}':x3='W-W*${o}':y3='H-H*${o}':interpolation=cubic:eval=frame,format=yuv420p[v];`
      + `[1:a]atrim=end=${total.toFixed(2)},afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,volume=0.8[a]`,
      '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    await uploadFile(await readFile(final), key, 'video/mp4')
    return NextResponse.json({ url })
  } catch (e) {
    console.error('video montaggio', e)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function ffmpeg(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath as unknown as string, ['-v', 'error', ...args])
    const chunks: Buffer[] = [], err: Buffer[] = []
    p.stdout.on('data', c => chunks.push(c)); p.stderr.on('data', c => err.push(c))
    p.on('error', reject)
    p.on('close', code => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(Buffer.concat(err).toString().slice(-800)))))
  })
}

// Fine dell'animazione di Veo (24 fps, fotogrammi grigi 160x90): dopo il picco di movimento, primo istante
// in cui il moto resta basso per 0,5 s; poi Veo "corregge" verso l'ultima immagine con una dissolvenza
// (la distanza dalla finale scende a immagine ferma): si taglia prima, tra 0,25 e 1 s dopo la fine del moto.
function cutPoint(raw: Buffer, px: number, fps = 24): number {
  const n = Math.floor(raw.length / px)
  const fr = (i: number) => raw.subarray(i * px, (i + 1) * px)
  const diff = (a: Buffer, b: Buffer) => { let s = 0; for (let k = 0; k < px; k++) s += Math.abs(a[k] - b[k]); return s / px }
  const mv = [0], dl: number[] = [], last = fr(n - 1)
  for (let i = 1; i < n; i++) mv.push(diff(fr(i), fr(i - 1)))
  for (let i = 0; i < n; i++) dl.push(diff(fr(i), last))
  const still = (i: number) => Math.max(...mv.slice(i, i + 12)) < 0.8
  const peak = mv.indexOf(Math.max(...mv))
  let calm = -1
  for (let i = peak; i < n - 12; i++) if (still(i)) { calm = i; break }
  if (calm < 0) return 4 // ponytail: nessun fermo trovato, taglio fisso a 4 s (Veo finisce entro i 4 s come da prompt)
  let diss = n - 1
  for (let i = calm + 6; i < n - 12; i++) if (dl[i] - dl[i + 12] > 0.6 && still(i)) { diss = i; break }
  return Math.max(calm + 6, Math.min(diss - 2, calm + 24)) / fps
}
