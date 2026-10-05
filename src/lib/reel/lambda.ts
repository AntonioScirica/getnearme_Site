import { spawn } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import { deleteRender, getRenderProgress, presignUrl, renderMediaOnLambda, type AwsRegion } from '@remotion/lambda-client'
import { deleteKeys, uploadFile } from '@/lib/r2'
import { lighten, type AgentInfo, type Contract, type Photo } from './render'

// Stili Vivace ed Elegante del Video dell'annuncio e del Video Venduto (05/10/2026): composizioni Remotion
// (cartella remotion/, sito su S3 "agenteimmo-video") renderizzate su AWS Lambda. Qui solo il client leggero.
// start: foto (e logo) su R2 come URL https che Lambda raggiunge, poi il render parte e si torna subito.
// finish: a render finito si scarica l'mp4 da S3 (URL firmato), si mette su R2 con la copertina, si pulisce S3.
// I nomi delle composizioni e i campi delle props sono quelli di remotion/src/schema.ts (Annuncio, Venduto).

const region = (process.env.REMOTION_AWS_REGION || 'eu-central-1') as AwsRegion
const fn = () => process.env.REMOTION_FUNCTION_NAME || 'remotion-render-4-0-421-mem3008mb-disk10240mb-240sec'
export const lambdaReady = () => !!(process.env.REMOTION_AWS_ACCESS_KEY_ID && process.env.REMOTION_AWS_SECRET_ACCESS_KEY && process.env.REMOTION_SERVE_URL)

export type LambdaStyle = 'vivace' | 'elegante'
export type LambdaJob =
  | { kind: 'reel'; photos: Photo[]; title: string; place: string; price: string; mq: string; rooms: string; contract: Contract; style: LambdaStyle; enhance: boolean; agent: AgentInfo }
  | { kind: 'venduto'; photo: Photo; place: string; days: string; contract: Contract; style: LambdaStyle; enhance: boolean; agent: AgentInfo }

// foto per il render: dritta (EXIF), al massimo 2048 px, luce migliorata se richiesto; Lambda la scarica da R2
async function photoForLambda(buf: Buffer, enhance: boolean): Promise<Buffer> {
  let p = sharp(buf, { failOn: 'none' }).rotate().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
  if (enhance) p = lighten(p)
  return p.jpeg({ quality: 90 }).toBuffer()
}

// Avvia il render. dir: cartella R2 temporanea delle foto (si cancella a fine render).
export async function startLambda(j: LambdaJob, dir: string, musicUrl: string | null): Promise<{ renderId: string; bucket: string }> {
  const photos = j.kind === 'reel' ? j.photos : [j.photo]
  const urls = await Promise.all(photos.map(async (p, k) => uploadFile(await photoForLambda(p.buf, j.enhance), `${dir}/${k}.jpg`, 'image/jpeg')))
  const logoUrl = j.agent.logo
    ? await sharp(j.agent.logo, { failOn: 'none' }).resize(1200, 400, { fit: 'inside', withoutEnlargement: true }).png().toBuffer()
      .then(b => uploadFile(b, `${dir}/logo.png`, 'image/png')).catch(() => undefined)
    : undefined
  const agent = { name: j.agent.name, agency: j.agent.agency, phone: j.agent.phone, site: j.agent.site, color: j.agent.color, ...(logoUrl ? { logoUrl } : {}) }
  const music = musicUrl ? { musicUrl } : {}
  const inputProps = j.kind === 'reel'
    ? { style: j.style, contract: j.contract, photos: urls.map((src, k) => ({ src, staged: j.photos[k].staged })), title: j.title, place: j.place, price: j.price, mq: j.mq, rooms: j.rooms, agent, ...music }
    : { style: j.style, contract: j.contract, photo: { src: urls[0], staged: j.photo.staged }, place: j.place, days: j.days, agent, ...music }
  const r = await renderMediaOnLambda({
    region, functionName: fn(), serveUrl: process.env.REMOTION_SERVE_URL!,
    composition: j.kind === 'reel' ? 'Annuncio' : 'Venduto', inputProps,
    codec: 'h264', crf: 18, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 92,
    // pochi Lambda per video: l'account AWS ne permette 10 insieme (piu' 1 che coordina e 1 per ogni controllo).
    // Annuncio ~450-490 fotogrammi in 3 pezzi, Venduto 240 in 2.
    framesPerLambda: j.kind === 'reel' ? 165 : 120, maxRetries: 1, privacy: 'private', outName: 'video.mp4',
  })
  return { renderId: r.renderId, bucket: r.bucketName }
}

type Progress = { done: boolean; renderMetadata?: unknown; fatalErrorEncountered: boolean; overallProgress: number; outKey: string | null; errors: { message?: string }[]; costs: { accruedSoFar: number; displayCost: string }; timeToFinish: number | null }

// null = AWS ha detto "troppe richieste insieme" (anche il controllo usa un Lambda): si riprova al giro dopo
export async function lambdaProgress(renderId: string, bucket: string): Promise<Progress | null> {
  try {
    return (await getRenderProgress({ renderId, bucketName: bucket, functionName: fn(), region })) as unknown as Progress
  } catch (e) {
    if (/TooManyRequests|Rate Exceeded|ConcurrentInvocationLimitExceeded/i.test(`${(e as Error)?.name} ${(e as Error)?.message}`)) return null
    throw e
  }
}

// mp4 finito da S3 (privato: URL firmato per 10 minuti), copertina dal video (scena d'apertura con il titolo)
export async function fetchLambdaVideo(bucket: string, outKey: string, coverAt: number): Promise<{ mp4: Buffer; cover: Buffer }> {
  const url = await presignUrl({ region, bucketName: bucket, objectKey: outKey, expiresInSeconds: 600 })
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!r.ok) throw new Error(`s3 ${r.status}`)
  const mp4 = Buffer.from(await r.arrayBuffer())
  const dir = await mkdtemp(join(tmpdir(), 'reel-l-'))
  try {
    const src = join(dir, 'v.mp4'), out = join(dir, 'c.jpg')
    await writeFile(src, mp4)
    await ff(['-ss', String(coverAt), '-i', src, '-frames:v', '1', '-q:v', '2', out])
    return { mp4, cover: await readFile(out) }
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// pulizia a video salvato (o fallito): render su S3 e foto temporanee su R2
export async function cleanLambda(renderId: string, bucket: string, r2Keys: string[]) {
  await Promise.all([
    deleteRender({ region, bucketName: bucket, renderId }).catch(e => console.warn('video-reel deleteRender', e)),
    r2Keys.length ? deleteKeys(r2Keys).catch(e => console.warn('video-reel deleteKeys', e)) : null,
  ])
}

function ff(args: string[]): Promise<void> {
  return new Promise((ok, ko) => {
    const p = spawn(ffmpegPath as unknown as string, ['-v', 'error', '-y', ...args])
    let err = ''
    p.stderr.on('data', d => { err += d })
    p.on('error', ko)
    p.on('close', c => (c === 0 ? ok() : ko(new Error(`ffmpeg ${c}: ${err.slice(-400)}`))))
  })
}
