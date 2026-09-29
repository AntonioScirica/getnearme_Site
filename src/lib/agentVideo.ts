import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3 } from '@/lib/s3'
import { uploadFile, uploadJpeg } from '@/lib/r2'
import { logUsage } from '@/lib/ai'
import { alignTo, measureShift } from '@/lib/align'
import { spawn } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { fal, ffmpeg, markPending, sign } from '@/lib/videoJob'

// Template "Con te in video" (29/09, prova in ~/Desktop/prove-video-template/agente): l'agente parla in camera, esce
// dall'inquadratura e la stanza si arreda. La parte con l'agente e' il suo video vero (voce compresa); l'AI lavora solo
// sulla stanza: fotogramma dopo l'uscita -> foto nel nuovo stile (photo-edit, come le altre) -> Kling 2.5 Turbo dalla
// stanza vera a quella arredata -> montaggio (videoJob.pollVideo chiama montageAgent per i lavori -ka).
// Fasi: upload (URL firmato) e prepare (conversione) in sottofondo; exit (punto di uscita da una griglia fatta dal
// browser, Haiku); la foto della stanza la fa il browser dal suo video; render (Kling) aspetta la conversione.

const KLING_TURBO_URL = 'https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
const STEP = 0.5 // un fotogramma ogni mezzo secondo per cercare l'uscita
const MAX_SECONDS = 40
const TRANSFORM = 'Magical real-estate home staging transformation of this exact empty room, locked tripod camera, identical framing the whole time. The furniture of the final image materializes smoothly piece by piece: each piece grows from the floor into its exact final place, largest first, then rugs, lamps, plants and decor. Walls, ceiling, windows, radiators and floor stay identical; only furniture and decor appear. By the end the room is identical to the final image. Photorealistic, warm, satisfying.'
const TRANSFORM_NEG = 'camera movement, zoom, pan, people, hands, morphing walls, flicker, blur, text'

const key = (owner: string, name: string) => `videos/${owner}/${name}`
const token = (owner: string, name: string) => `${name.replace('/', '~')}.${sign(owner, `agent.${name}`)}`
export function parseAgent(owner: string, t: string): string | null {
  const [tilde, sig] = (t ?? '').split('.')
  const name = (tilde ?? '').replace('~', '/')
  return /^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+$/.test(name) && sig === sign(owner, `agent.${name}`) ? name : null
}

// 1. URL firmato per caricare il video dal browser (i video superano il limite delle richieste di Vercel)
export async function uploadUrl(owner: string, type: string): Promise<{ url: string; key: string }> {
  const ext = type === 'video/quicktime' ? 'mov' : type === 'video/webm' ? 'webm' : 'mp4'
  const k = `uploads/${owner}/agente-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: k, ContentType: type }), { expiresIn: 900 })
  return { url, key: k }
}

// 2a. in sottofondo (mentre l'agente sceglie): video caricato -> mp4 720p con la voce, per il montaggio.
// Il punto di uscita e la foto della stanza li fa il browser dal video che ha gia' (vedi exitFromGrid): niente attesa.
export async function prepare(owner: string, srcKey: string, projectId: string): Promise<{ token?: string; video?: string; error?: string }> {
  if (!new RegExp(`^uploads/${owner}/agente-[\\w-]+\\.(mov|mp4|webm)$`).test(srcKey)) return { error: 'bad_request' }
  const dir = await mkdtemp(join(tmpdir(), 'agente-'))
  try {
    const src = join(dir, 'src'), out = join(dir, 'agente.mp4')
    await writeFile(src, Buffer.from(await (await fetch(`${process.env.R2_PUBLIC_URL}/${srcKey}`)).arrayBuffer()))
    // la rotazione del telefono la applica ffmpeg da solo; senza audio si mette il silenzio (il montaggio mescola voce e musica)
    const hasAudio = await ffmpeg(['-i', src, '-map', '0:a:0', '-t', '0.1', '-f', 'null', '-']).then(() => true, () => false)
    await ffmpeg(['-y', '-i', src, ...(hasAudio ? [] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v:0', '-map', '1:a', '-shortest']), '-t', String(MAX_SECONDS), '-vf',
      "scale='if(gt(iw,ih),1280,720)':'if(gt(iw,ih),720,1280)':force_original_aspect_ratio=increase,crop='if(gt(iw,ih),1280,720)':'if(gt(iw,ih),720,1280)',fps=30,setsar=1",
      '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', out])
    const name = `${projectId ? `casa-${projectId}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const video = await uploadFile(await readFile(out), `${key(owner, name)}-agente.mp4`, 'video/mp4')
    return { token: token(owner, name), video }
  } catch (e) {
    console.error('agente conversione', e)
    return { error: 'ai_failed' }
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// 2b. punto di uscita da una griglia di fotogrammi fatta dal browser (uno ogni mezzo secondo, piccoli): Haiku dice dove
// c'e' una persona; il telefono e' fermo se lo sfondo non si sposta (mediana sotto il 2,5%)
export async function exitFromGrid(logUser: string, grid: Buffer, n: number, cols: number, tw: number, th: number): Promise<{ at?: number; exit?: boolean; steady?: boolean; duration?: number; error?: string }> {
  if (!(n >= 4 && n <= MAX_SECONDS / STEP + 2 && cols > 0 && tw > 0 && th > 0)) return { error: 'too_short' }
  const frames = await Promise.all(Array.from({ length: n }, (_, k) => sharp(grid).extract({ left: (k % cols) * tw, top: Math.floor(k / cols) * th, width: tw, height: th }).png().toBuffer()))
  const person = await whoIsThere(frames, logUser)
  if (!person) return { error: 'ai_failed' }
  let exit = -1
  for (let i = 1; i < n; i++) if (person.slice(0, i).some(Boolean) && !person[i] && !person[i + 1]) { exit = i; break }
  const ref = frames[exit < 0 ? Math.floor(n / 2) : exit]
  const shifts = (await Promise.all(frames.filter((_, k) => k % 2 === 0).map(f => measureShift(ref, f, 0.08).catch(() => ({ dx: 0, dy: 0, gain: 0 }))))).map(x => Math.hypot(x.dx, x.dy)).sort((a, b) => a - b)
  return { at: exit < 0 ? Math.round(n * STEP * 5) / 10 : Math.round(exit * STEP * 10) / 10, exit: exit >= 0, steady: (shifts[Math.floor(shifts.length / 2)] ?? 0) < 0.025, duration: n * STEP }
}

// immagini PNG una dopo l'altra (image2pipe): si separano sulla firma PNG
function splitPng(buf: Buffer): Buffer[] {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const out: Buffer[] = []
  let i = buf.indexOf(sig)
  while (i >= 0) { const j = buf.indexOf(sig, i + 8); out.push(buf.subarray(i, j < 0 ? buf.length : j)); i = j }
  return out
}

// C'e' una persona? Una griglia numerata letta da Sonnet (~0,01 $), un solo sguardo per tutto il video. Haiku la
// sbagliava (persona in tutti i riquadri, anche nella stanza vuota e scura: prova del 29/09); Sonnet giusto al riquadro.
async function whoIsThere(frames: Buffer[], logUser: string): Promise<boolean[] | null> {
  const cols = 8, rows = Math.ceil(frames.length / cols)
  const { width: w = 90, height: h = 160 } = await sharp(frames[0]).metadata()
  const label = (n: number) => Buffer.from(`<svg width="${w}" height="22"><rect width="34" height="22" fill="black"/><text x="4" y="16" font-size="15" font-family="Arial" fill="white">${n}</text></svg>`)
  const grid = await sharp({ create: { width: cols * w, height: rows * h, channels: 3, background: '#000' } })
    .composite(frames.flatMap((f, k) => [{ input: f, left: (k % cols) * w, top: Math.floor(k / cols) * h }, { input: label(k + 1), left: (k % cols) * w, top: Math.floor(k / cols) * h }]))
    .jpeg({ quality: 80 }).toBuffer()
  const t0 = Date.now()
  try {
    const resp = await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: grid.toString('base64') } },
        { type: 'text', text: `These are ${frames.length} numbered frames of a video, left to right, top to bottom. For each frame, is a person (or part of a person: body, arm, face) visible? Reply only with JSON {"person": [numbers of the frames with a person]}.` },
      ] }],
    })
    await logUsage({ userId: logUser, kind: 'agente_uscita' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, true, 'claude-sonnet-5').catch(() => {})
    const txt = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    const nums = (JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { person?: number[] }).person ?? []
    return frames.map((_, k) => nums.includes(k + 1))
  } catch (e) {
    console.error('agente persona', e)
    return null
  }
}

// 4. Kling dalla stanza vera alla foto nel nuovo stile; il lavoro (-ka) lo chiude pollVideo con montageAgent
export async function renderAgent(owner: string, t: string, at: number, styled: string, roomUrl: string): Promise<{ job?: string; error?: string }> {
  const name = parseAgent(owner, t)
  if (!name || !(at >= 0 && at <= MAX_SECONDS)) return { error: 'bad_request' }
  // foto della stanza fatta dal browser allo stesso istante, alla misura del video convertito
  const { width: VW = 720, height: VH = 1280 } = await sharp(await ffmpeg(['-i', `${process.env.R2_PUBLIC_URL}/${key(owner, name)}-agente.mp4`, '-frames:v', '1', '-f', 'image2', '-c:v', 'png', '-'])).metadata()
  const room = await sharp(Buffer.from(await (await fetch(roomUrl)).arrayBuffer())).rotate().resize(VW, VH, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
  await uploadJpeg(room, `${key(owner, name)}-stanza.jpg`)
  const { width = 720, height = 1280 } = await sharp(room).metadata()
  const st = Buffer.from(await (await fetch(styled)).arrayBuffer())
  const after = await alignTo(room, await sharp(st).rotate().resize(width, height, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer())
  const afterUrl = await uploadJpeg(after, `${key(owner, name)}-arredata.jpg`)
  await uploadFile(Buffer.from(JSON.stringify({ at })), `${key(owner, name)}.agent.json`, 'application/json')
  const q = await fal(KLING_TURBO_URL, { image_url: `${process.env.R2_PUBLIC_URL}/${key(owner, name)}-stanza.jpg`, tail_image_url: afterUrl, prompt: TRANSFORM, negative_prompt: TRANSFORM_NEG, duration: '5' })
  if (!q.request_id) { console.error('agente kling', q); return { error: 'ai_failed' } }
  const kname = `${name}-ka`
  const job = `${q.request_id}.${kname.replace('/', '~')}.${sign(owner, `${q.request_id}.${kname}`)}`
  await markPending(owner, kname, job)
  return { job }
}

// Montaggio (prova del 29/09): video dell'agente fino all'uscita con la sua voce, trasformazione di Kling senza il
// primo pezzo fermo (0,6 s) a 1,5x, dissolvenza sulla foto arredata e 2,5 s di fermo; zoom lento e costante dall'uscita
// alla fine; musica dall'uscita in poi sotto la voce.
export async function montageAgent(o: { dir: string; raw: string; music: string; final: string; owner: string; name: string }) {
  const base = key(o.owner, o.name.replace(/-ka$/, ''))
  const agent = join(o.dir, 'agente.mp4'), photo = join(o.dir, 'arredata.jpg')
  const [a, p, meta] = await Promise.all([
    fetch(`${process.env.R2_PUBLIC_URL}/${base}-agente.mp4`).then(r => r.arrayBuffer()),
    fetch(`${process.env.R2_PUBLIC_URL}/${base}-arredata.jpg`).then(r => r.arrayBuffer()),
    fetch(`${process.env.R2_PUBLIC_URL}/${base}.agent.json`).then(r => r.json() as Promise<{ at: number }>),
  ])
  await Promise.all([writeFile(agent, Buffer.from(a)), writeFile(photo, Buffer.from(p))])
  const { width: W = 720, height: H = 1280 } = await sharp(Buffer.from(p)).metadata()
  const CUT = meta.at, SKIP = 0.6, SPD = 1.5, XF = 0.4, HOLD = 2.5
  // voce: se c'e' (picco sopra -35 dB) si porta a un volume da reel (-16 LUFS), se no si lascia com'e' (alzarla alzerebbe
  // solo il fruscio). 29/09: un video girato col telefono lontano aveva la voce a -43 dB e sembrava "abbassata"
  const peak = await new Promise<number>(res => {
    const p = spawn(ffmpegPath as unknown as string, ['-hide_banner', '-t', CUT.toFixed(2), '-i', agent, '-af', 'volumedetect', '-vn', '-f', 'null', '-'])
    let err = ''; p.stderr.on('data', c => { err += c }); p.on('close', () => res(Number(err.match(/max_volume: (-?[\d.]+) dB/)?.[1] ?? -99)))
  })
  const voice = peak > -35 ? 'loudnorm=I=-16:TP=-1.5:LRA=11,' : ''
  const K = (5 - SKIP) / SPD, T = CUT + K + HOLD
  const z = `(1+0.05*max(in/30-${CUT}\\,0)/${(K + HOLD).toFixed(2)})`, off = `((1-1/${z})/2)`
  const zoom = `perspective=x0='W*${off}':y0='H*${off}':x1='W-W*${off}':y1='H*${off}':x2='W*${off}':y2='H-H*${off}':x3='W-W*${off}':y3='H-H*${off}':interpolation=cubic:eval=frame`
  await ffmpeg(['-y', '-i', agent, '-i', o.raw, '-loop', '1', '-t', String(HOLD + XF), '-i', photo, '-i', o.music, '-filter_complex',
    `[0:v]trim=end=${CUT},setpts=PTS-STARTPTS,fps=30,scale=${W}:${H},setsar=1,format=yuv420p[a];` +
    `[1:v]trim=start=${SKIP},setpts=(PTS-STARTPTS)/${SPD},fps=30,scale=${W}:${H},setsar=1,format=yuv420p[k];[2:v]fps=30,scale=${W}:${H},setsar=1,format=yuv420p[p];` +
    `[k][p]xfade=transition=fade:duration=${XF}:offset=${(K - XF).toFixed(2)}[kp];[a][kp]concat=n=2:v=1:a=0,${zoom},format=yuv420p[v];` +
    `[0:a]atrim=end=${CUT},asetpts=PTS-STARTPTS,${voice}aresample=48000,apad[vo];[3:a]atrim=end=${(K + HOLD).toFixed(2)},afade=t=in:d=0.3,afade=t=out:st=${(K + HOLD - 1.2).toFixed(2)}:d=1.2,volume=0.8,adelay=${Math.round(CUT * 1000)}|${Math.round(CUT * 1000)}[mu];[vo][mu]amix=inputs=2:duration=longest:normalize=0,atrim=end=${T.toFixed(2)}[au]`,
    '-map', '[v]', '-map', '[au]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', T.toFixed(2), o.final])
}
