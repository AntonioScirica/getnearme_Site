import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { spawn } from 'child_process'
import { mkdtemp, readFile, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import { nanoBanana } from '@/lib/nanoBanana'
import { GNM_CANTIERE_1, GNM_CANTIERE_2, GNM_DAYNIGHT, GNM_EXCAVATION_IMAGE, GNM_NIGHT_IMAGE, GNM_PARTICLES, GNM_STOPMOTION, GNM_STRUCTURE_IMAGE } from '@/lib/gnmVideoPrompts'
import Anthropic from '@anthropic-ai/sdk'
import ffmpegPath from 'ffmpeg-static'
import { runJob, allowedUrl } from '@/lib/runpodImage'
import { uploadFile, uploadJpeg } from '@/lib/r2'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'

// Video "i mobili compaiono" da una foto arredata (risultato AI o foto vera dell'agente).
// Ricetta approvata il 27/09/2026 (vedi memoria popup-video-template):
//   1. foto ritagliata 16:9 (orizzontale) o 9:16 (verticale) = F
//   2. Qwen svuota F = E (stessa inquadratura)
//   3. Opus elenca i pezzi che ci sono in F e non in E
//   4. Veo 3.1 Lite first-last-frame AL CONTRARIO: da F a E, i pezzi spariscono uno alla volta.
//      Veo rispetta sempre il primo fotogramma, mentre l'ultimo lo raggiunge con una dissolvenza:
//      al contrario il video finisce esattamente sulla foto vera.
//   5. (GET) taglio prima della dissolvenza di Veo, video invertito, 2,5 s di fermo, zoom 4% ease-in-out, musica.
// startVideo avvia (~20 s, Veo resta in coda su fal), pollVideo controlla e a fine lavoro monta e salva su R2.
// owner = cartella su R2 e firma del lavoro (id utente, o 'landing' per la prova anonima); logUser = chi paga nei log.

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FAL = 'https://queue.fal.run/fal-ai/veo3.1'
const HOLD = 2.5
// Veo Lite primo/ultimo fotogramma su fal accetta SOLO 8 s (con 4 s rifiuta il lavoro: "Input should be '8s'").
// Provato il 27/09 anche con la sola foto iniziale a 4 e 6 s (0,15-0,21 $): la camera si sposta e il popup
// non viene. Si resta qui: 0,24 $ di Veo a video.
const VEO_SECONDS = 8

// Corto e "remove only": con il blocco lungo della stanza davanti Qwen allargava l'inquadratura (prova del 27/09)
const EMPTY_PROMPT = 'Remove only the movable furniture and loose objects from this room: sofas, armchairs, chairs, tables, beds, freestanding cabinets, rugs, cushions, blankets, lamps, plants, decor and personal items. Keep exactly the same, pixel for pixel: walls, ceiling and lights, windows and doors with their frames, curtains, mirrors and built-in or mirrored wardrobes, the TV wall unit with its shelves, the kitchen, bathroom fixtures, radiators, sockets, the floor with its exact material and color (continue the same floor where the furniture stood), the daylight and the camera position, zoom and framing. Photorealistic.'
const NEG = 'text, letters, numbers, percent signs, captions, watermark, circles, ovals, rings, halos, light arcs, light trails, glowing lines, light beams, lens flare, fast camera movement, camera shake, new parts of the room, dissolve, ghosting, double exposure, semi-transparent objects, duplicated furniture, springs, coils, bouncing platform, ropes, cranes, new objects, extra furniture, extra cushions, extra decor, people, hands, tripod, camera, sliding objects, flying objects, floating objects, fading in, cross-fade, morphing, melting, flicker, exposure change, camera movement, zoom, pan'
// template con i flussi Kling di GetNearMe (vedi gnmVideoPrompts); Popup e Dall'alto restano su Veo
const KLING: Partial<Record<Anim, true>> = { stopmotion: true, particles: true, cantiere: true, daynight: true }
const KLING_URL = 'https://queue.fal.run/fal-ai/kling-video/o3/standard/image-to-video'
const KLING_BASE = 'https://queue.fal.run/fal-ai/kling-video'
const KLING_SECONDS = 5
// Veo lavora AL CONTRARIO (dalla foto arredata alla vuota), poi il video si inverte:
// popup = ogni pezzo si rimpicciolisce sul posto (invertito: spunta e si assesta);
// gravity = ogni pezzo si solleva ed esce dall'alto (invertito: cade dall'alto e si posa).
const VANISH: Record<Anim, string> = {
  popup: 'Each object vanishes on the spot: it swells very slightly for a few frames, then quickly shrinks into a tiny point at its base and is gone, leaving the bare floor and walls exactly as in the last image. Objects never move, slide or fly. ',
  gravity: 'Each object lifts straight up off the floor and quickly rises out through the top of the frame, keeping its shape, size and color, never rotating or tumbling, leaving the bare floor and walls exactly as in the last image. Objects never slide sideways. ',
  // invertito: la polvere converge e compone il mobile
  particles: 'Each object dissolves on the spot into a cloud of fine, soft golden dust particles that drift slightly upward and fade away, leaving the bare floor and walls exactly as in the last image. Objects never slide or fly. ',
  // invertito: i mobili compaiono a scatti, uno per volta, come in stop-motion
  stopmotion: 'Stop-motion style: each object disappears instantly between two frames, with no fading, no shrinking and no motion, one after another in a quick steady rhythm, leaving the bare floor and walls exactly as in the last image. ',
  cantiere: '', daynight: '',
}
const prompt = (order: string, anim: Anim) => 'Elegant, satisfying real-estate animation with a perfectly still, locked-off camera: identical framing for the whole video, no pan, no zoom. Walls, ceiling, curtains, built-in furniture, doors, windows, floor and daylight never change. '
  + `These are the only objects that disappear, in exactly these quantities: ${order}. Nothing new ever appears. The last frame is identical to the final empty image. `
  + 'The camera is exactly the one of the first and last image for the whole video: same lens, same framing, same distance, it never moves. '
  + 'The furnished room is shown perfectly still for half a second. Then the objects vanish one after another in a quick smooth cascade, consecutive objects overlapping slightly in time like a wave: first the small objects on top of the furniture, then the pieces closest to the camera, then the pieces further back. '
  + VANISH[anim]
  + `Order: ${order}. By the fourth second the room is completely empty and identical to the last image; from then on nothing moves or changes at all.`
// dall'alto: i pezzi volano per davvero, niente divieti di volo
const negFor = (anim: Anim) => anim === 'gravity' ? NEG.replace('flying objects, floating objects, ', 'tumbling objects, rotating objects, ')
  : NEG

// Dall'alto, testo esatto dell'anteprima approvata (spike 27/09, popup_video.py STYLE=gravity)
const GRAVITY_PROMPT = (order: string, n: number) => 'Real-estate staging animation with a perfectly still, locked-off camera: identical framing for the whole video, no pan, no zoom. '
  + 'Walls, ceiling, kitchen, doors, windows, floor and daylight never change. '
  + `These are the only objects that ever appear, in exactly these quantities: ${order}. Nothing else appears at any moment and nothing that appears ever disappears. The last frame is identical to the final image. `
  + 'The empty room is shown for one second. Then the furniture falls into the room from above, out of the top of the frame, one piece after another in quick rhythm: '
  + `each piece drops straight down onto its exact final spot, lands with a soft impact and a tiny puff of dust, and stays perfectly still. Order: ${order}. `
  // 28/09: letto e divano comparivano sul posto: ogni pezzo, anche il piu' grande, si deve vedere in volo
  + 'Every piece, even the biggest ones like the bed, the sofa and the wardrobe, is clearly seen falling through the air for about half a second before it lands; nothing appears already in place. '
  // aggiunto il 28/09: Veo in avanti a volte non faceva cadere tutto (all'ultimo fotogramma ci arriva solo dissolvendo)
  + `All ${n} pieces fall, the largest first: none is skipped and none appears without falling. By the fourth second all ${n} pieces have landed and the room is identical to the final image; from then on nothing moves or changes at all.`
const GRAVITY_NEG = 'text, letters, numbers, percent signs, captions, watermark, circles, ovals, rings, halos, light arcs, light trails, glowing lines, light beams, lens flare, fast camera movement, camera shake, new parts of the room, dissolve, ghosting, double exposure, semi-transparent objects, duplicated furniture, springs, coils, bouncing platform, ropes, cranes, objects not in the last frame, extra furniture, extra cushions, extra decor, chairs, lamps, plants that are not in the last frame, people, hands, tripod, camera, springs, coils, sliding objects, objects disappearing, fading in, popping in, appearing out of nowhere, teleporting, cross-fade, morphing, melting, flicker, exposure change, camera movement, zoom, pan'

// Stanza vuota della foto: Qwen (RunPod) "remove only", identica al pixel alla foto (misurato il 28/09: 0 px di scarto).
// Nano Banana ridisegna l'inquadratura (fino a -24% di zoom, 159 px, 2,3 gradi): per il video da una foto all'altra e'
// un disastro (Veo muove la stanza e dissolve), quindi solo di ripiego se la GPU non risponde.
async function emptyRoom(fullUrl: string, logUser: string): Promise<string | null> {
  const t0 = Date.now()
  const job = await runJob({ image_url: fullUrl, prompt: EMPTY_PROMPT, seed: Math.floor(Math.random() * 1_000_000), steps: 12 })
  await logUsage({ userId: logUser, kind: 'video_empty' }, true, Date.now() - t0, {}, !!job.output?.image_base64, 'qwen-image-2.1')
  if (job.output?.image_base64) return job.output.image_base64
  console.error('video: Qwen non ha svuotato, provo Nano Banana', job.status)
  return nanoBanana({ userId: logUser, image: fullUrl, prompt: `${EMPTY_PROMPT} The result must line up exactly with the original photo: same camera, framing and perspective. Photorealistic, no text.`, kind: 'video_empty' })
}

// il lavoro di fal torna al client firmato con l'utente: solo chi l'ha avviato puo' finalizzarlo
const sign = (userId: string, id: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`${userId}:${id}`).digest('base64url').slice(0, 22)
const fal = (url: string, body?: unknown) => fetch(url, {
  method: body ? 'POST' : 'GET', headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
}).then(r => r.json())

export type VideoResult = { job?: string; url?: string; id?: string; status?: number | 'working'; error?: string }
export type Anim = 'popup' | 'gravity' | 'particles' | 'stopmotion' | 'cantiere' | 'daynight'
export const parseAnim = (a: unknown): Anim => (['gravity', 'particles', 'stopmotion', 'cantiere', 'daynight'] as const).find(x => x === a) ?? 'popup'

// empty = stanza gia' svuotata (prova "Svuota" della landing): niente Nano Banana, e il video va IN AVANTI:
// i mobili della foto originale spariscono uno alla volta e resta la stanza vuota.
export async function startVideo(owner: string, logUser: string, o: { imageUrl: string; imageBase64: string; projectId?: string; anim: Anim; empty?: string }): Promise<VideoResult> {
  const { imageUrl, imageBase64, anim } = o
  const pid = o.projectId ?? '' // gia' validato dalla rotta
  if (AI_MOCK) { await mockDelay(2000); return { job: 'mock' } }
  if (!process.env.FAL_API_KEY || !process.env.AI_IMAGE_ENDPOINT_ID || !process.env.RUNPOD_API_KEY) return { error: 'not_configured', status: 503 }

  try {
    // 1. formato dalla foto, ritaglio centrale
    const src = imageBase64 ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).rotate().metadata()
    const landscape = width >= height
    const [W, H] = landscape ? [1280, 720] : [720, 1280]
    const full = await sharp(src).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
    const name = `${pid ? `casa-${pid}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${o.empty ? '-f' : anim === 'gravity' ? '-g' : ''}`
    const key = `videos/${owner}/${name}`
    const fullUrl = await uploadJpeg(full, `${key}-arredata.jpg`)

    // Stop-motion, Particelle, Cantiere e Giorno/notte: gli stessi flussi dei reel di GetNearMe (Kling o3, primo e
    // ultimo fotogramma, 5 s a clip, in avanti). Qui la foto finale e' quella vera dell'agente; i fotogrammi
    // intermedi li fa Nano Banana 2 (come nei reel) partendo dalla foto.
    // (con Svuota la foto e' gia' vuota: resta il flusso Veo in avanti)
    if (KLING[anim] && !o.empty) {
      const frame = async (prompt: string, label: string, ref = fullUrl) => {
        const out = await nanoBanana({ userId: logUser, image: ref, prompt, kind: `video_${anim}` })
        if (!out) return null
        return uploadJpeg(await sharp(Buffer.from(out, 'base64')).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(), `${key}-${label}.jpg`)
      }
      const kling = (image_url: string, end_image_url: string, prompt: string) => fal(KLING_URL, { image_url, end_image_url, prompt, duration: 5, generate_audio: false })
      let ids: string[] = []
      if (anim === 'cantiere') {
        // scavo -> struttura -> casa finita (2 clip montate di seguito)
        const structure = await frame(GNM_STRUCTURE_IMAGE, 'struttura')
        const excavation = structure && await frame(GNM_EXCAVATION_IMAGE, 'scavo', structure)
        if (!structure || !excavation) return { error: 'ai_failed', status: 502 }
        const [a, b] = await Promise.all([kling(excavation, structure, GNM_CANTIERE_1), kling(structure, fullUrl, GNM_CANTIERE_2)])
        ids = [a.request_id, b.request_id]
      } else if (anim === 'daynight') {
        const night = await frame(GNM_NIGHT_IMAGE, 'notte')
        if (!night) return { error: 'ai_failed', status: 502 }
        ids = [(await kling(fullUrl, night, GNM_DAYNIGHT)).request_id]
      } else {
        // stop-motion / particelle: dalla stanza vuota alla foto arredata
        // stanza vuota (vedi emptyRoom): Kling va da questa alla foto vera
        const q = await emptyRoom(fullUrl, logUser)
        const empty = q && await uploadJpeg(await sharp(Buffer.from(q, 'base64')).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(), `${key}-vuota.jpg`)
        if (!empty) return { error: 'ai_failed', status: 502 }
        ids = [(await kling(empty, fullUrl, anim === 'stopmotion' ? GNM_STOPMOTION : GNM_PARTICLES)).request_id]
      }
      if (ids.some(x => !x)) { console.error('video kling submit', ids); return { error: 'ai_failed', status: 502 } }
      const kname = `${name}${ids.length > 1 ? '-kc' : '-k'}`
      const id = ids.join('+')
      return { job: `${id}.${kname.replace('/', '~')}.${sign(owner, `${id}.${kname}`)}` }
    }

    // 2-3. Qwen svuota (stessa inquadratura), Opus elenca i pezzi e controlla che la stanza sia davvero vuota:
    // a volte Qwen lascia un mobile (27/09: letto rimasto con un seme su due), allora si riprova con un altro seme.
    let empty: Buffer | null = null, items: string[] = []
    for (let attempt = 0; attempt < 2; attempt++) {
      // stanza vuota: data da fuori (Svuota, o la foto vera di partenza) oppure Nano Banana dalla foto arredata
      const given = o.empty
      const out = given ? (given.startsWith('data:') ? given.split(',').pop()! : Buffer.from(await (await fetch(given, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')) : await emptyRoom(fullUrl, logUser)
      if (!out) return { error: 'ai_failed', status: 502 }
      // stesso ritaglio della foto arredata (cover): la foto di partenza data da fuori puo' avere un altro formato
      empty = await sharp(Buffer.from(out, 'base64')).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
      // nomi semplici e quantita' esatte: descrizioni sbagliate cambiano la forma ai mobili
      const t1 = Date.now()
      const msg = await new Anthropic().messages.create({
        model: 'claude-sonnet-5', max_tokens: 3000, // come nella prova approvata del 27/09: basta, e costa ~1/3 di Opus
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Image 1 should be an empty room, image 2 is the same room furnished.' },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(empty).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(full).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
          { type: 'text', text: 'List every object that is in image 2 and not in image 1: rugs, furniture, cushions, throws, plants, books, decor. Look carefully and count exactly. For each item write a short description of how it really looks in image 2: its real shape (e.g. rectangular, round, L-shaped, curved) and its main color and material, exactly as you see them, nothing invented. Order as a designer would place them: rug first, then the largest furniture, then smaller furniture, then cushions, then small decor last. Group identical small items with their exact count. Also check image 1: "empty" is false if it still contains any bed, sofa, armchair, table, chair or other freestanding furniture (built-in wardrobes, kitchens, TV wall units, curtains and radiators are fine), or if its framing or zoom differs from image 2. Reply with JSON only: {"items": ["..."], "empty": true}' },
        ] }],
      })
      await logUsage({ userId: logUser, kind: 'video_items' }, false, Date.now() - t1, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, 'claude-sonnet-5')
      const txt = msg.content.find(c => c.type === 'text')?.text ?? '' // i modelli nuovi possono mettere prima un blocco di ragionamento
      const r = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { items?: string[]; empty?: boolean }
      items = r.items ?? []
      // stanza vuota data da fuori (Svuota): si usa com'e'
      if (r.empty !== false || o.empty) break
    }
    if (!items.length || !empty) return { error: 'nothing_to_animate', status: 422 }
    const emptyUrl = await uploadJpeg(empty, `${key}-vuota.jpg`)
    // Dall'alto: in avanti, dalla vuota all'arredata, i mobili cadono dall'alto (ricetta dell'anteprima approvata F9_gravity,
    // 27/09: al contrario, con i mobili che "salgono via", sembravano comparire sul posto). Gli altri al contrario.
    const down = anim === 'gravity' && !o.empty
    const order = down ? items.join(', then ') : [...items].reverse().join(', then ') // al contrario: spariscono prima i piccoli oggetti

    // 4. Veo: al contrario (dalla foto arredata alla vuota) o in avanti per Dall'alto
    const q = await fal(`${FAL}/lite/first-last-frame-to-video`, {
      first_frame_url: down ? emptyUrl : fullUrl, last_frame_url: down ? fullUrl : emptyUrl,
      prompt: down ? GRAVITY_PROMPT(order, items.length) : prompt(order, anim), negative_prompt: down ? GRAVITY_NEG : negFor(anim),
      duration: `${VEO_SECONDS}s`, aspect_ratio: landscape ? '16:9' : '9:16', resolution: '720p', generate_audio: false, seed: Math.floor(Math.random() * 1_000_000),
    })
    if (!q.request_id) { console.error('video fal submit', q); return { error: 'ai_failed', status: 502 } }
    // il nome va nel lavoro firmato: a fine montaggio il video si salva accanto alla sua foto (copertina in Galleria)
    return { job: `${q.request_id}.${name.replace('/', '~')}.${sign(owner, `${q.request_id}.${name}`)}` }
  } catch (e) {
    console.error('video start', e)
    return { error: 'ai_failed', status: 502 }
  }
}


// url pronto; fresh = montato adesso (la piattaforma scala i crediti una volta sola, con l'id di fal)
export async function pollVideo(owner: string, job: string): Promise<VideoResult & { fresh?: boolean }> {
  if (job === 'mock' && AI_MOCK) return { url: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili/F12_rianima.mp4' }
  const [id, tilde, sig] = job.split('.')
  const name = (tilde ?? '').replace('~', '/')
  if (!id || !/^[\w-]{8,64}(\+[\w-]{8,64})?$/.test(id) || !/^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+(-f|-k|-kc|-g)?$/.test(name) || !sig || sig.length !== 22 || !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(owner, `${id}.${name}`)))) return { error: 'bad_request', status: 400 }

  const key = `videos/${owner}/${name}.mp4`
  const url = `${process.env.R2_PUBLIC_URL}/${key}`
  if ((await fetch(url, { method: 'HEAD' })).ok) return { url } // gia' montato

  // Kling (flussi GetNearMe): una clip, o due per il cantiere (scavo -> struttura, struttura -> casa)
  const kling = /-kc?$/.test(name)
  const base = kling ? KLING_BASE : FAL
  const ids = id.split('+')
  const st = await Promise.all(ids.map(r => fal(`${base}/requests/${r}/status`)))
  if (st.some(x => x.status === 'IN_QUEUE' || x.status === 'IN_PROGRESS')) return { status: 'working' }
  if (st.some(x => x.status !== 'COMPLETED')) { console.error('video fal status', st); return { error: 'ai_failed', status: 502 } }
  const outs = await Promise.all(ids.map(r => fal(`${base}/requests/${r}`)))
  if (outs.some(x => !x.video?.url)) { console.error('video fal result', outs); return { error: 'ai_failed', status: 502 } }

  const dir = await mkdtemp(join(tmpdir(), 'vid-'))
  try {
    const raw = join(dir, 'veo.mp4'), music = join(dir, 'music.mp3'), final = join(dir, 'out.mp4')
    const parts = outs.map((_, k) => join(dir, `clip${k}.mp4`))
    const tracks = MUSIC_CATALOG['property-reveal']
    const track = tracks[Math.floor(Math.random() * tracks.length)]
    await Promise.all([
      ...outs.map((o, k) => fetch(o.video.url).then(r => r.arrayBuffer()).then(b => writeFile(parts[k], Buffer.from(b)))),
      fetch(`https://pub-cd3d5947375c4207af2dc57da61686ee.r2.dev/music/property-reveal/${encodeURIComponent(track)}`).then(r => r.arrayBuffer()).then(b => writeFile(music, Buffer.from(b))),
    ])
    // due clip del cantiere una dopo l'altra (ricodifica leggera, crf 14)
    if (parts.length > 1) await ffmpeg(['-y', '-i', parts[0], '-i', parts[1], '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]', '-c:v', 'libx264', '-crf', '14', raw])
    else await rename(parts[0], raw)
    // Kling e Svuota vanno in avanti (tutta la clip); gli altri Veo al contrario, tagliati prima della dissolvenza di Veo
    // in avanti: Svuota (-f), Kling (-k, -kc) e Dall'alto (-g)
    const forward = /-(f|k|kc|g)$/.test(name)
    // Dall'alto: clip INTERA, mai fermata a meta' (un fotogramma di Veo a mobili appena atterrati puo' avere pezzi
    // trasparenti, e il fermo lo mostrava: 28/09). L'ultimo fotogramma di Veo e' l'immagine arredata vera: il fermo e' su quella.
    const cut = kling ? KLING_SECONDS * parts.length : forward ? VEO_SECONDS : cutPoint(await ffmpeg(['-i', raw, '-vf', 'scale=320:180,format=gray', '-f', 'rawvideo', '-']), 320 * 180)
    // Dall'alto un po' piu' veloce (1,2x; a 1,4x le cadute diventavano istantanee)
    const speed = name.endsWith('-g') ? 1.2 : 1
    const total = cut / speed + HOLD, n = Math.round(total * 30)
    // zoom 4% ease-in-out su tutto il video, sub-pixel (perspective con interpolazione: niente tremolio)
    const z = `(1+0.04*(0.5-0.5*cos(PI*min(in/${n}\\,1))))`, o = `(1-1/${z})/2`
    await ffmpeg(['-y', '-i', raw, '-i', music, '-filter_complex',
      `[0:v]trim=end=${cut.toFixed(2)},setpts=(PTS-STARTPTS)/${speed},${forward ? '' : 'reverse,'}fps=30,tpad=stop_mode=clone:stop_duration=${HOLD},`
      + `perspective=x0='W*${o}':y0='H*${o}':x1='W-W*${o}':y1='H*${o}':x2='W*${o}':y2='H-H*${o}':x3='W-W*${o}':y3='H-H*${o}':interpolation=cubic:eval=frame,format=yuv420p[v];`
      + `[1:a]atrim=end=${total.toFixed(2)},afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,volume=0.8[a]`,
      '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    await uploadFile(await readFile(final), key, 'video/mp4')
    return { url, id, fresh: true }
  } catch (e) {
    console.error('video montaggio', e)
    return { error: 'ai_failed', status: 502 }
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
function cutPoint(raw: Buffer, px: number, fps = 24, minSec = 0): number {
  const n = Math.floor(raw.length / px)
  const fr = (i: number) => raw.subarray(i * px, (i + 1) * px)
  const diff = (a: Buffer, b: Buffer) => { let s = 0; for (let k = 0; k < px; k++) s += Math.abs(a[k] - b[k]); return s / px }
  // movimento = quota di pixel che cambiano davvero (non la media): un cuscino che cade e' piccolo e la media lo perdeva,
  // il taglio arrivava con il cuscino a mezz'aria (28/09)
  const moving = (a: Buffer, b: Buffer) => { let c = 0; for (let k = 0; k < px; k++) if (Math.abs(a[k] - b[k]) > 14) c++; return c / px }
  const mv = [0], dl: number[] = [], last = fr(n - 1)
  for (let i = 1; i < n; i++) mv.push(moving(fr(i), fr(i - 1)))
  for (let i = 0; i < n; i++) dl.push(diff(fr(i), last))
  const still = (i: number) => Math.max(...mv.slice(i, i + 12)) < 0.0005
  const peak = mv.indexOf(Math.max(...mv))
  let calm = -1
  for (let i = Math.max(peak, Math.round(minSec * fps)); i < n - 12; i++) if (still(i)) { calm = i; break }
  if (calm < 0) return Math.max(4, minSec) // ponytail: nessun fermo trovato, taglio fisso (il prompt chiede tutto finito entro il quarto secondo)
  let diss = n - 1
  for (let i = calm + 6; i < n - 12; i++) if (dl[i] - dl[i + 12] > 0.6 && still(i)) { diss = i; break }
  return Math.max(calm + 6, Math.min(diss - 2, calm + 24)) / fps
}
