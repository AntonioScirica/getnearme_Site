import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { spawn } from 'child_process'
import { mkdtemp, readFile, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import { stagePrompt } from '@/lib/nanoBanana'
import { gptImage } from '@/lib/gptImage'
import { FAKE_VIDEO, isFakeUser } from '@/lib/fakeAi'
import { DAYNIGHT_INTERIOR, WALK_EXTERIOR, WALK_EXTERIOR_NEG, WALK_INTERIOR, WALK_INTERIOR_NEG, GNM_CANTIERE_1, GNM_CANTIERE_2, GNM_DAYNIGHT, GNM_EXCAVATION_IMAGE, GNM_NIGHT_IMAGE, GNM_STOPMOTION, GNM_STRUCTURE_IMAGE, NIGHT_IMAGE_INTERIOR } from '@/lib/gnmVideoPrompts'
import Anthropic from '@anthropic-ai/sdk'
import ffmpegPath from 'ffmpeg-static'
import { deleteKeys, uploadFile, uploadJpeg } from '@/lib/r2'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'
import { measureShift } from '@/lib/align'
import { montageAgent, montageWalk } from '@/lib/agentVideo'

// Video "i mobili compaiono" da una foto arredata (risultato AI o foto vera dell'agente).
// Ricetta del 28/09/2026 (prove su Veo 3.1 standard e fast, misurate fotogramma per fotogramma):
//   1. foto ritagliata 16:9 (orizzontale) o 9:16 (verticale) = F (con lo stile: F = foto nel nuovo stile)
//   2. Nano Banana svuota F = E (un solo prompt: prima ce n'erano due in contrasto e il risultato cambiava a caso)
//   3. Sonnet elenca i pezzi che ci sono in F e non in E
//   4. Veo 3.1 primo/ultimo fotogramma. Veo rispetta sempre il PRIMO fotogramma; l'ultimo e' solo un obiettivo:
//      - Dall'alto IN AVANTI (E -> F): i pezzi entrano dal bordo alto e sono proprio quelli di F, ultimo fotogramma
//        raggiunto a 1-2 punti di distanza (nessuna dissolvenza visibile);
//      - Popup e Particelle AL CONTRARIO (F -> E): "compaiono sul posto" in avanti faceva inventare i mobili a Veo
//        (3 prove su 3, anche con Veo standard); da F i pezzi che spariscono sono quelli veri e la stanza che resta e' E.
//      Lite (0,03 $/s) inventava i mobili e poi dissolveva anche in avanti: per Popup e Dall'alto serve fast
//      (0,10 $/s, provato su Dall'alto uguale a standard) o standard (0,20 $/s, VEO_FAST=0).
//      Sempre 8 s: a 6 s Fast inventava un divano a meta' clip e poi dissolveva (prova su fal del 28/09).
//   5. (GET) Dall'alto: clip fino al fermo (max 6 s) a 1,2x; Popup e Particelle: clip fino a stanza vuota (tempo morto tolto), invertita.
//      Poi passaggio di 0,35 s alla foto vera e 2 s di fermo su di essa: il video finisce SEMPRE sulla foto
//      dell'agente, qualunque cosa abbia fatto Veo. Zoom 3% solo nel fermo finale, musica.
// startVideo avvia (~30 s, Veo resta in coda su fal), pollVideo controlla e a fine lavoro monta e salva su R2.
// owner = cartella su R2 e firma del lavoro (id utente, o 'landing' per la prova anonima); logUser = chi paga nei log.

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const FAL = 'https://queue.fal.run/fal-ai/veo3.1'
// Popup, Dall'alto e Particelle: Veo 3.1 fast (0,10 $/s; standard con VEO_FAST=0, 0,20 $/s). Svuota (landing) resta su Lite.
const VEO_FLF = `${FAL}/${process.env.VEO_FAST === '0' ? '' : 'fast/'}first-last-frame-to-video`
const HOLD = 2 // fermo finale sulla foto vera
const XFADE = 0.35 // passaggio dall'ultimo fotogramma di Veo alla foto vera
// Veo Lite primo/ultimo fotogramma su fal accetta SOLO 8 s (con 4 s rifiuta il lavoro: "Input should be '8s'").
const VEO_SECONDS = 8

// Stanza vuota: GPT Image con il prompt Svuota della piattaforma (nanoBanana.stagePrompt).
// Svuota (landing, Veo Lite in avanti F -> E): prompt e negativi della ricetta del 27/09, invariati
const NEG = 'text, letters, numbers, percent signs, captions, watermark, circles, ovals, rings, halos, light arcs, light trails, glowing lines, light beams, lens flare, fast camera movement, camera shake, new parts of the room, dissolve, ghosting, double exposure, semi-transparent objects, duplicated furniture, springs, coils, bouncing platform, ropes, cranes, new objects, extra furniture, extra cushions, extra decor, people, hands, tripod, camera, sliding objects, flying objects, floating objects, fading in, cross-fade, morphing, melting, flicker, exposure change, camera movement, zoom, pan'
// Popup e Dall'alto (Veo 3.1 standard/fast), negativi provati il 28/09
const NEG_VEO = 'camera movement, pan, tilt, zoom, dolly, camera shake, different camera angle, dissolve, cross-fade, fade in, double exposure, morphing, ghosting, semi-transparent objects, duplicated furniture, extra furniture, replaced furniture, objects sliding, objects floating, bouncing ball, springs, people, hands, tripod, camera equipment, text, letters, captions, watermark, lens flare, light trails, exposure change, flicker'
// niente "tripod": Veo lo disegnava nella stanza (Particelle, 28/09)
const STILL = 'The camera is completely static for the whole video: identical framing from the first frame to the last, no pan, no tilt, no zoom, no shake, never a different view of the room. '
// Dall'alto (29/09): KLING o3 in avanti, dalla stanza vuota alla foto. Veo in avanti inventava mobili suoi (segue poco
// l'ultimo fotogramma) e la dissolvenza finale li cambiava tutti; al contrario (mobili che salgono, poi clip invertita)
// su alcune stanze li faceva ruotare o comparire di colpo. Kling rispetta l'ultimo fotogramma: i pezzi cadono
// dall'alto e atterrano esattamente sui mobili della foto (prova del 29/09 sulla stanza dell'agente). 5 s, 0,42 $.
const GRAVITY_PROMPT = (items: string) => `Satisfying real-estate home staging animation. ${STILL}The room starts completely empty, exactly as the first image, and stays perfectly still for half a second. Then the furniture drops in from above in a fast rhythm, several pieces in quick succession: each piece enters from the top edge of the frame already in its final size and orientation, falls straight down fast under gravity, and lands heavily in its exact final position with a tiny firm settle, then never moves again. Pictures fall the same way and hook onto the wall. First the big pieces, then the small items drop onto them, in this order: ${items}. Everything has landed by the fourth second; from then on nothing moves or changes at all, and the final frame is exactly the last image. Nothing slides, nothing fades in, nothing morphs. Walls, ceiling, windows, curtains, mirror, built-in furniture, floor and lights never change.`
const NEG_GRAVITY = 'camera movement, pan, tilt, zoom, camera shake, dissolve, cross-fade, fade in, morphing, ghosting, semi-transparent objects, duplicated furniture, extra furniture, objects sliding, objects floating, people, hands, text, watermark, flicker'
// Popup e Particelle, al contrario: i piccoli spariscono prima, poi i mobili (invertito: mobili prima, poi gli oggetti sopra)
const POPUP_PROMPT = (items: string) => `Satisfying real-estate animation. ${STILL}The furnished room is shown perfectly still for half a second. Then the objects vanish one after another in a quick steady rhythm, popping out of existence on the spot: each object swells very slightly for a few frames, then shrinks fast into a tiny point at its base and is gone, leaving the bare floor and walls exactly as in the second image. Objects never move, slide, fall or fly; nothing new ever appears. First the small items, then the furniture, in this order: ${items}. By the fifth second the room is completely empty and identical to the second image, and from then on nothing moves or changes at all. Walls, ceiling, windows, curtains, built-in furniture, floor and daylight never change.`
const PARTICLES_PROMPT = (items: string) => `Magical real-estate animation. ${STILL}The furnished room is shown perfectly still for half a second. Then, one after another in a quick steady rhythm, each object transforms on the spot: its surface turns into a shimmering silhouette of glowing golden particles with exactly its shape, and that silhouette unravels into a few graceful swirling ribbons of golden sparkles that rise a short way into the air above it and fade out within a second, leaving the bare floor and walls exactly as in the second image. Only the objects change: everything else in the frame stays exactly as it is, and the objects still waiting for their turn stay perfectly still and unchanged. Objects never slide or fall; nothing new ever appears. First the small items, then the furniture, in this order: ${items}. By the sixth second the room is completely empty and identical to the second image, and from then on nothing moves or changes at all.`
const NEG_REVERSE = `${NEG_VEO}, falling objects, flying objects, new furniture appearing`
// Particelle (invertito: le scie dorate entrano e formano i mobili, come nel reel di GetNearMe): niente divieti su scie e bagliori
const NEG_PARTICLES = 'camera movement, pan, tilt, zoom, dolly, camera shake, different camera angle, cross-fade, double exposure, ghosting, transparent walls, morphing, duplicated furniture, extra furniture, new furniture appearing, replaced furniture, objects sliding, falling objects, people, hands, tripod, camera equipment, text, letters, captions, watermark, exposure change, flicker, smoke, fire, flames, explosion, large debris'
// template con i flussi Kling di GetNearMe (vedi gnmVideoPrompts); Popup, Dall'alto e Particelle su Veo
const KLING: Partial<Record<Anim, true>> = { stopmotion: true, cantiere: true, daynight: true, camera: true, fpv: true }
// Volo nel cantiere (30/09, prove in ~/Desktop/prove-video-template/costruzione-fpv, versione 21): intro FPV fissa nel
// cantiere fino allo scavo (templates/volo-cantiere su R2, fatta una volta), poi la camera esce dallo scavo e si ribalta
// scoprendo il palazzo dell'agente quasi finito, che si completa fino alla foto vera. Verticale (-kf) o, con una foto
// orizzontale, 16:9 (-kh, intro-16x9 e scavo-16x9 con le stesse inquadrature).
const FPV_ASSETS = `${process.env.R2_PUBLIC_URL}/templates/volo-cantiere`
const FPV_ALMOST = 'Show this exact same building, same camera position, same framing, same sky, street, trees and neighbouring buildings, but almost finished: the last steel scaffolding still on part of the facade, a few details missing (some shutters, railings and plants), a construction site fence at the base, a little dust. Photorealistic, sharp.'
const FPV_FLIP = 'First-person camera view only, no drone visible: the camera shoots up out of the foundation trench and the whole picture rolls over backwards, the sky sweeping through the frame, until the view comes down facing this building almost finished with the last scaffolding on it, seen from the street. One continuous take, constant speed, never stops. Sharp, photorealistic.'
const FPV_FINISH = 'Construction time-lapse with a slow steady push-in: the last shutters, railings, windows and plants appear and the scaffolding and the fence disappear, until the building is identical to the final image. The street, the trees and the neighbouring buildings never change. Photorealistic.'
const KLING_URL = 'https://queue.fal.run/fal-ai/kling-video/o3/standard/image-to-video'
// Giorno e notte: Kling 2.5 Turbo Pro con foto finale (0,07 $/s = 0,35 $, meta' dell'o3); Movimento camera: Kling 1.6
// standard da una foto, la "passeggiata" dei video di GetNearMe (0,056 $/s = 0,28 $, prompt e negativi uguali)
const KLING_TURBO_URL = 'https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video'
const KLING16_URL = 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video'
const KLING_BASE = 'https://queue.fal.run/fal-ai/kling-video'
const KLING_SECONDS = 5
// Svuota (o.empty, landing): Veo Lite in avanti dalla foto alla stanza gia' svuotata, i pezzi spariscono
const VANISH: Record<Anim, string> = {
  popup: 'Each object vanishes on the spot: it swells very slightly for a few frames, then quickly shrinks into a tiny point at its base and is gone, leaving the bare floor and walls exactly as in the last image. Objects never move, slide or fly. ',
  gravity: 'Each object lifts straight up off the floor and quickly rises out through the top of the frame, keeping its shape, size and color, never rotating or tumbling, leaving the bare floor and walls exactly as in the last image. Objects never slide sideways. ',
  // invertito: la polvere converge e compone il mobile
  particles: 'Each object dissolves on the spot into a cloud of fine, soft golden dust particles that drift slightly upward and fade away, leaving the bare floor and walls exactly as in the last image. Objects never slide or fly. ',
  // invertito: i mobili compaiono a scatti, uno per volta, come in stop-motion
  stopmotion: 'Stop-motion style: each object disappears instantly between two frames, with no fading, no shrinking and no motion, one after another in a quick steady rhythm, leaving the bare floor and walls exactly as in the last image. ',
  cantiere: '', daynight: '', camera: '', fpv: '',
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

// Stanza vuota della foto: GPT Image 2.5 Sunburst senza maschera (0,014 $ a qualita' bassa, misurato il 28/09): tiene
// pilastri, muretti e pavimento da solo. Sempre e solo GPT per le foto (scelta del 28/09). Il formato lo prende dalla foto.
async function emptyRoom(fullUrl: string, logUser: string): Promise<string | null> {
  return gptImage({ userId: logUser, image: fullUrl, prompt: stagePrompt({ task: 'empty', room: '', style: '' }), kind: 'svuota', quality: process.env.GPT_EDIT_QUALITY || 'low' })
}

// il lavoro di fal torna al client firmato con l'utente: solo chi l'ha avviato puo' finalizzarlo
export const sign = (userId: string, id: string) => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`${userId}:${id}`).digest('base64url').slice(0, 22)
// listino fal senza audio (29/09/2026), $ al secondo di video
// Veo: prezzo per risoluzione e audio (Lite 720p 0,03/0,05, 1080p 0,05/0,08; Fast 0,10/0,15; standard 0,20/0,40)
const veoRate = (url: string, b?: Record<string, unknown>) => {
  const audio = b?.generate_audio !== false, hd = b?.resolution === '1080p'
  return /\/lite\//.test(url) ? (hd ? (audio ? 0.08 : 0.05) : (audio ? 0.05 : 0.03)) : /\/fast\//.test(url) ? (audio ? 0.15 : 0.10) : (audio ? 0.40 : 0.20)
}
const FAL_USD_PER_S: [RegExp, number, string][] = [
  [/veo3\.1\/fast\//, 0, 'veo3.1-fast'], [/veo3\.1\/lite\//, 0, 'veo3.1-lite'], [/veo3\.1\//, 0, 'veo3.1'],
  [/kling-video\/o3\/standard\/video-to-video/, 0.14, 'kling-o3-edit'], [/kling-video\/o3\//, 0.14, 'kling-o3'],
  [/kling-video\/v2\.5-turbo/, 0.07, 'kling-2.5-turbo'], [/kling-video\/v1\.6/, 0.056, 'kling-1.6'],
]
// bill: chi paga il video; si registra in ai_usage appena fal accetta il lavoro (anche se poi il montaggio fallisce)
export const fal = async (url: string, body?: { duration?: unknown } & Record<string, unknown>, bill?: { userId: string; kind: string; seconds?: number }) => {
  // account di prova: lavoro finto (id fake-...), pronto subito con un video d'esempio; il montaggio vero gira lo stesso
  const fakeId = url.match(/\/requests\/(fake-[\w-]+)(\/status)?$/)
  if (fakeId) return fakeId[2] ? { status: 'COMPLETED' } : { video: { url: FAKE_VIDEO } }
  if (body && bill && await isFakeUser(bill.userId)) return { request_id: `fake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  const j = await fetch(url, {
    method: body ? 'POST' : 'GET', headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30_000),
  }).then(r => r.json())
  const rate = bill && j?.request_id ? FAL_USD_PER_S.find(([re]) => re.test(url)) : undefined
  if (bill && rate) {
    const s = bill.seconds ?? (parseFloat(String(body?.duration ?? 5)) || 5)
    const usd = (rate[2].startsWith('veo') ? veoRate(url, body) : rate[1]) * s
    await logUsage({ userId: bill.userId, kind: bill.kind }, false, 0, { usd }, true, `fal-${rate[2]}`).catch(() => {})
  }
  return j
}

export type VideoResult = { job?: string; url?: string; id?: string; status?: number | 'working'; error?: string }
export type Anim = 'popup' | 'gravity' | 'particles' | 'stopmotion' | 'cantiere' | 'daynight' | 'camera' | 'fpv'
export const parseAnim = (a: unknown): Anim => (['gravity', 'particles', 'stopmotion', 'cantiere', 'daynight', 'camera', 'fpv'] as const).find(x => x === a) ?? 'popup'

// empty = stanza gia' svuotata (prova "Svuota" della landing): niente foto vuota da fare, e il video va IN AVANTI:
// i mobili della foto originale spariscono uno alla volta e resta la stanza vuota.
export async function startVideo(owner: string, logUser: string, o: { imageUrl: string; imageBase64: string; projectId?: string; anim: Anim; empty?: string; styled?: string; framesOnly?: boolean; interior?: boolean }): Promise<VideoResult & FramesResult> {
  const { imageUrl, imageBase64, anim } = o
  const pid = o.projectId ?? '' // gia' validato dalla rotta
  if (AI_MOCK) { await mockDelay(2000); return { job: 'mock' } }
  if (!process.env.FAL_API_KEY || !process.env.OPENAI_API_KEY) return { error: 'not_configured', status: 503 } // GPT Image + fal

  try {
    // 1. formato dalla foto, ritaglio centrale
    const src = imageBase64 ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).rotate().metadata()
    const landscape = width >= height
    const [W, H] = landscape ? [1280, 720] : [720, 1280]
    const full = await sharp(src).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
    const name = `${pid ? `casa-${pid}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${o.empty ? '-f' : anim === 'popup' ? '-p' : anim === 'particles' ? '-d' : KLING[anim] ? '' : '-g'}` // Kling: il suffisso (-k, -kc, -km) si aggiunge dopo
    const key = `videos/${owner}/${name}`
    const fullUrl = await uploadJpeg(full, `${key}-arredata.jpg`)

    // Stop-motion, Particelle, Cantiere e Giorno/notte: gli stessi flussi dei reel di GetNearMe (Kling o3, primo e
    // ultimo fotogramma, 5 s a clip, in avanti). Qui la foto finale e' quella vera dell'agente; i fotogrammi
    // intermedi li fa GPT Image 2.5 Sunburst (0,014 $ l'uno) partendo dalla foto.
    // (con Svuota la foto e' gia' vuota: resta il flusso Veo in avanti)
    if (KLING[anim] && !o.empty) {
      const frame = async (prompt: string, label: string, ref = fullUrl) => {
        const out = await gptImage({ userId: logUser, image: ref, prompt, kind: `video_${anim}`, quality: process.env.GPT_EDIT_QUALITY || 'low' })
        if (!out) return null
        return uploadJpeg(await sharp(Buffer.from(out, 'base64')).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(), `${key}-${label}.jpg`)
      }
      const kling = (image_url: string, end_image_url: string | undefined, prompt: string) => fal(KLING_URL, { image_url, ...(end_image_url ? { end_image_url } : {}), prompt, duration: 5, generate_audio: false }, { userId: logUser, kind: `video_${anim}` })
      let ids: string[] = []
      if (anim === 'cantiere') {
        // scavo -> struttura -> casa finita (2 clip montate di seguito)
        const structure = await frame(GNM_STRUCTURE_IMAGE, 'struttura')
        const excavation = structure && await frame(GNM_EXCAVATION_IMAGE, 'scavo', structure)
        if (!structure || !excavation) return { error: 'ai_failed', status: 502 }
        const [a, b] = await Promise.all([kling(excavation, structure, GNM_CANTIERE_1), kling(structure, fullUrl, GNM_CANTIERE_2)])
        ids = [a.request_id, b.request_id]
      } else if (anim === 'daynight') {
        // interni: la stanza di sera con le sue luci accese; esterni: la casa di notte (reel di GetNearMe)
        const night = await frame(o.interior ? NIGHT_IMAGE_INTERIOR : GNM_NIGHT_IMAGE, 'notte')
        if (!night) return { error: 'ai_failed', status: 502 }
        ids = [(await fal(KLING_TURBO_URL, { image_url: fullUrl, tail_image_url: night, prompt: o.interior ? DAYNIGHT_INTERIOR : GNM_DAYNIGHT, duration: '5' }, { userId: logUser, kind: 'video_daynight' })).request_id]
      } else if (anim === 'camera') {
        // movimento di camera: solo la foto di partenza (niente foto da generare); dentro si cammina nella stanza, fuori verso la casa
        ids = [(await fal(KLING16_URL, { image_url: fullUrl, prompt: o.interior ? WALK_INTERIOR : WALK_EXTERIOR, negative_prompt: o.interior ? WALK_INTERIOR_NEG : WALK_EXTERIOR_NEG, duration: '5', cfg_scale: 0.65 }, { userId: logUser, kind: 'video_camera' })).request_id]
      } else if (anim === 'fpv') {
        // il palazzo quasi finito (dalla foto), poi insieme: flip dallo scavo dell'intro al palazzo, e chiusura fino alla foto
        const almost = await frame(FPV_ALMOST, 'quasi')
        if (!almost) return { error: 'ai_failed', status: 502 }
        const [a, b] = await Promise.all([
          fal(KLING_TURBO_URL, { image_url: `${FPV_ASSETS}/scavo${landscape ? '-16x9' : ''}.jpg`, tail_image_url: almost, prompt: FPV_FLIP, negative_prompt: 'a drone visible in the picture, flying object, fisheye, distortion, blur, pause, cut, flying far away, people, text', duration: '5' }, { userId: logUser, kind: 'video_fpv' }),
          fal(KLING_TURBO_URL, { image_url: almost, tail_image_url: fullUrl, prompt: FPV_FINISH, negative_prompt: 'camera shake, morphing into a different building, people, text', duration: '5' }, { userId: logUser, kind: 'video_fpv' }),
        ])
        ids = [a.request_id, b.request_id]
      } else {
        // stop-motion: dalla stanza vuota alla foto arredata
        // stanza vuota (vedi emptyRoom): Kling va da questa alla foto vera
        const q = await emptyRoom(fullUrl, logUser)
        const empty = q && await uploadJpeg(await sharp(Buffer.from(q, 'base64')).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(), `${key}-vuota.jpg`)
        if (!empty) return { error: 'ai_failed', status: 502 }
        ids = [(await kling(empty, fullUrl, GNM_STOPMOTION)).request_id]
      }
      if (ids.some(x => !x)) { console.error('video kling submit', ids); return { error: 'ai_failed', status: 502 } }
      const kname = `${name}${anim === 'fpv' ? (landscape ? '-kh' : '-kf') : ids.length > 1 ? '-kc' : anim === 'camera' ? '-km' : '-k'}`
      const id = ids.join('+')
      const job = `${id}.${kname.replace('/', '~')}.${sign(owner, `${id}.${kname}`)}`
      await markPending(owner, kname, job)
      return { job }
    }

    // Popup e Dall'alto: due fasi. prepareFrames fa e salva Prima (stanza vuota) e Dopo (foto vera o nel nuovo stile),
    // la chat le mostra e l'agente approva; renderVideo fa partire Veo. Qui (landing, Svuota) le due fasi di seguito.
    const f = await prepareFrames(owner, logUser, { name, full, landscape, styled: o.styled, empty: o.empty })
    if (!f.frames || o.framesOnly) return f
    return renderVideo(owner, logUser, f.frames, anim, !!o.empty)
  } catch (e) {
    console.error('video start', e)
    return { error: 'ai_failed', status: 502 }
  }
}


export type FramesResult = { frames?: string; before?: string; after?: string; status?: number | 'working'; error?: string }
const frameSig = (owner: string, name: string) => sign(owner, `frames.${name}`)
const framesToken = (owner: string, name: string) => `${name.replace('/', '~')}.${frameSig(owner, name)}`
export const parseFrames = (owner: string, token: string): string | null => {
  const [tilde, sig] = token.split('.')
  const name = (tilde ?? '').replace('~', '/')
  if (!/^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+(-f|-g|-p|-d)$/.test(name) || !sig || sig.length !== 22 || !timingSafeEqual(Buffer.from(sig), Buffer.from(frameSig(owner, name)))) return null
  return name
}

// Fase 1: Prima e Dopo. Dopo = foto vera (o nel nuovo stile, fatta da photo-edit); Prima = Dopo svuotata da Nano Banana
// (stesse pareti, stessa inquadratura). Salvate su R2 accanto al lavoro (-finale.jpg, -vuota.jpg); il token firmato
// lega il nome all'utente. Con Svuota (landing) la vuota arriva gia' fatta. Niente Veo qui: l'agente prima approva.
export async function prepareFrames(owner: string, logUser: string, o: { name: string; full: Buffer; landscape: boolean; styled?: string; empty?: string }): Promise<FramesResult> {
  const { name, landscape } = o
  const [W, H] = landscape ? [1280, 720] : [720, 1280]
  const key = `videos/${owner}/${name}`
  try {
    const toJpeg = async (b64: string) => sharp(Buffer.from(b64, 'base64')).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
    const b64Of = async (src: string) => (src.startsWith('data:') ? src.split(',').pop()! : Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64'))
    const furnished = o.styled ? await toJpeg(await b64Of(o.styled)) : o.full
    const after = await uploadJpeg(furnished, `${key}-finale.jpg`)
    let emptyBuf: Buffer
    if (o.empty) emptyBuf = await toJpeg(await b64Of(o.empty))
    else {
      const e = await emptyRoom(after, logUser)
      if (!e) return { error: 'ai_failed', status: 502 }
      emptyBuf = await toJpeg(e)
    }
    const before = await uploadJpeg(emptyBuf, `${key}-vuota.jpg`)
    return { frames: framesToken(owner, name), before, after }
  } catch (e) {
    console.error('video frames', e)
    return { error: 'ai_failed', status: 502 }
  }
}

// Fase 2: elenco dei pezzi (Sonnet), poi il modello. Svuota (fromEmpty, landing): Lite in avanti dalla foto alla vuota.
// Dall'alto: Kling in avanti dalla vuota alla foto, pezzi grandi prima (id del lavoro con prefisso k_). Popup e
// Particelle: Veo al contrario dalla foto alla vuota, oggetti piccoli prima (invertito: mobili prima, poi gli oggetti sopra).
export async function renderVideo(owner: string, logUser: string, frames: string, anim: Anim, fromEmpty = false): Promise<VideoResult> {
  const name = parseFrames(owner, frames)
  if (!name) return { error: 'bad_request', status: 400 }
  if (!process.env.FAL_API_KEY || !process.env.ANTHROPIC_API_KEY) return { error: 'not_configured', status: 503 }
  try {
    const key = `videos/${owner}/${name}`
    const get = async (suffix: string) => Buffer.from(await (await fetch(`${process.env.R2_PUBLIC_URL}/${key}-${suffix}.jpg`, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const [furnished, emptyBuf] = await Promise.all([get('finale'), get('vuota')])
    const { width = 0, height = 0 } = await sharp(furnished).metadata()
    const landscape = width >= height
    const furnishedUrl = `${process.env.R2_PUBLIC_URL}/${key}-finale.jpg`, emptyUrl = `${process.env.R2_PUBLIC_URL}/${key}-vuota.jpg`
    // pezzi che ci sono nella foto arredata e non nella vuota: nomi semplici, quantita' esatte
    const t1 = Date.now()
    const fake = await isFakeUser(logUser) // account di prova: elenco fisso, niente Sonnet
    const msg = fake ? null : await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 3000,
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Image 1 is a room before, image 2 is the same room after home staging.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(emptyBuf).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(furnished).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
        { type: 'text', text: 'List every object that is in image 2 and not in image 1: rugs, furniture, cushions, throws, plants, books, decor. Look carefully and count exactly, largest pieces first. Use short simple names, no adjectives about shape. Reply only with JSON {"items": ["..."]}.' },
      ] }],
    })
    if (msg) await logUsage({ userId: logUser, kind: 'video_items' }, false, Date.now() - t1, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, 'claude-sonnet-5')
    const txt = msg ? msg.content.find(c => c.type === 'text')?.text ?? '' : '{"items":["divano","tavolino","tappeto","lampada"]}'
    const items = ((JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { items?: string[] }).items ?? []).filter(x => typeof x === 'string')
    if (!items.length) return { error: 'nothing_to_animate', status: 422 }

    const big = items.join(', then '), small = [...items].reverse().join(', then ') // i piccoli spariscono prima, poi i mobili (invertito: mobili prima, poi gli oggetti sopra)
    const gravity = !fromEmpty && anim === 'gravity'
    // Popup e Particelle al contrario (foto arredata -> vuota, poi invertito nel montaggio): l'ultimo fotogramma e' la foto vera
    const [first, last] = [furnishedUrl, emptyUrl]
    const text = fromEmpty ? prompt(small, anim) : anim === 'particles' ? PARTICLES_PROMPT(small) : POPUP_PROMPT(small)
    const negative = fromEmpty ? negFor(anim) : anim === 'particles' ? NEG_PARTICLES : NEG_REVERSE
    const q = gravity
      ? await fal(KLING_URL, { image_url: emptyUrl, end_image_url: furnishedUrl, prompt: GRAVITY_PROMPT(big), negative_prompt: NEG_GRAVITY, duration: KLING_SECONDS, generate_audio: false }, { userId: logUser, kind: `video_${anim}` })
      : await fal(fromEmpty ? `${FAL}/lite/first-last-frame-to-video` : VEO_FLF, {
        first_frame_url: first, last_frame_url: last, prompt: text, negative_prompt: negative,
        duration: `${VEO_SECONDS}s`, aspect_ratio: landscape ? '16:9' : '9:16', resolution: '720p', generate_audio: false, seed: Math.floor(Math.random() * 1_000_000),
      }, { userId: logUser, kind: `video_${anim}`, seconds: VEO_SECONDS })
    if (!q.request_id) { console.error('video fal submit', q); return { error: 'ai_failed', status: 502 } }
    // il nome va nel lavoro firmato: a fine montaggio il video si salva accanto alla sua foto (copertina in Galleria).
    // k_ davanti all'id: il lavoro e' su Kling (stesso nome e stessi fotogrammi di prima/dopo)
    const rid = gravity ? `k_${q.request_id}` : q.request_id
    const job = `${rid}.${name.replace('/', '~')}.${sign(owner, `${rid}.${name}`)}`
    await markPending(owner, name, job)
    return { job }
  } catch (e) {
    console.error('video render', e)
    return { error: 'ai_failed', status: 502 }
  }
}

// Segnaposto del video in lavorazione (videos/<owner>/<nome>.job.json): la Galleria lo lista come "in lavorazione" e
// ne segue il lavoro anche se la chat e' andata persa; sparisce a video montato (o dopo 30 minuti, se e' fallito).
// Volo nel cantiere: intro fissa, flip (2,2x), chiusura (1,6x) di seguito senza dissolvenze, poi la foto ferma
async function montageFpv(o: { intro: string; flip: string; finish: string; music: string; final: string; size: [number, number] }) {
  const HOLD = 1.5
  const INTRO = 5.1 // durata dell'intro fissa su R2 (templates/volo-cantiere/intro.mp4)
  const total = INTRO + 5 / 2.2 + 5 / 1.6 + HOLD
  const [w, h] = o.size
  const norm = `fps=30,scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,format=yuv420p,settb=1/30`
  await ffmpeg(['-y', '-i', o.intro, '-i', o.flip, '-i', o.finish, '-i', o.music, '-filter_complex',
    `[0:v]${norm}[a];[1:v]setpts=PTS/2.2,${norm}[b];[2:v]setpts=PTS/1.6,${norm}[c];[a][b][c]concat=n=3:v=1:a=0,tpad=stop_mode=clone:stop_duration=${HOLD}[v];` +
    `[3:a]atrim=end=${total.toFixed(2)},afade=t=in:d=0.2,afade=t=out:st=${(total - 1).toFixed(2)}:d=1[au]`,
    '-map', '[v]', '-map', '[au]', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-t', total.toFixed(2), '-movflags', '+faststart', o.final])
}

export async function markPending(owner: string, name: string, job: string) {
  await uploadFile(Buffer.from(JSON.stringify({ job, at: Date.now() })), `videos/${owner}/${name}.job.json`, 'application/json').catch(e => console.error('video segnaposto', e))
}

// url pronto; fresh = montato adesso (la piattaforma scala i crediti una volta sola, con l'id di fal)
export async function pollVideo(owner: string, job: string): Promise<VideoResult & { fresh?: boolean }> {
  if (job === 'mock' && AI_MOCK) return { url: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili/F12_rianima.mp4' }
  const [id, tilde, sig] = job.split('.')
  const name = (tilde ?? '').replace('~', '/')
  if (!id || !/^[\w-]{8,64}(\+[\w-]{8,64})?$/.test(id) || !/^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+(-f|-k|-kc|-km|-ka|-kw|-kf|-kh|-g|-p|-d)?$/.test(name) || !sig || sig.length !== 22 || !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(owner, `${id}.${name}`)))) return { error: 'bad_request', status: 400 }

  const key = `videos/${owner}/${name}.mp4`
  const url = `${process.env.R2_PUBLIC_URL}/${key}`
  if ((await fetch(url, { method: 'HEAD' })).ok) return { url } // gia' montato

  // Kling (flussi GetNearMe): una clip, o due per il cantiere (scavo -> struttura, struttura -> casa).
  // Dall'alto (-g) e' su Kling con l'id k_...: clip in avanti, poi dissolvenza sulla foto vera come i video Veo.
  const gk = id.startsWith('k_')
  const kling = /-k[cmawfh]?$/.test(name) || gk
  const base = kling ? KLING_BASE : FAL
  const ids = id.replace(/^k_/, '').split('+')
  const st = await Promise.all(ids.map(r => fal(`${base}/requests/${r}/status`)))
  if (st.some(x => x.status === 'IN_QUEUE' || x.status === 'IN_PROGRESS')) return { status: 'working' }
  if (st.some(x => x.status !== 'COMPLETED')) { console.error('video fal status', st); return { error: 'ai_failed', status: 502 } }
  const outs = await Promise.all(ids.map(r => fal(`${base}/requests/${r}`)))
  if (outs.some(x => !x.video?.url)) { console.error('video fal result', outs); return { error: 'ai_failed', status: 502 } }

  const dir = await mkdtemp(join(tmpdir(), 'vid-'))
  try {
    const raw = join(dir, 'veo.mp4'), music = join(dir, 'music.mp3'), final = join(dir, 'out.mp4')
    const parts = outs.map((_, k) => join(dir, `clip${k}.mp4`))
    // musica secondo il video (30/09, energia misurata su 10 brani per categoria): Volo nel cantiere dinamica, Cantiere e
    // Prima e dopo a meta', Giorno e notte e Camminata tranquille, Con te in video niente (solo la voce dell'agente)
    const mood = /-ka$/.test(name) ? null : /-k[fh]$/.test(name) ? ['open-house-vibes', 'property-reveal'] as const
      : /-kc$/.test(name) || !kling || gk ? ['virtual-tour', 'smart-home-tour'] as const : ['ambient-walkthrough', 'luxury-showcase'] as const
    const cat = mood ? mood[Math.floor(Math.random() * mood.length)] : null
    const track = cat ? MUSIC_CATALOG[cat][Math.floor(Math.random() * MUSIC_CATALOG[cat].length)] : null
    await Promise.all([
      ...outs.map((o, k) => fetch(o.video.url).then(r => r.arrayBuffer()).then(b => writeFile(parts[k], Buffer.from(b)))),
      cat && track
        ? fetch(`https://pub-cd3d5947375c4207af2dc57da61686ee.r2.dev/music/${cat}/${encodeURIComponent(track)}`).then(r => r.arrayBuffer()).then(b => writeFile(music, Buffer.from(b)))
        : ffmpeg(['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '60', music]), // silenzio: il montaggio resta uguale
    ])
    // Volo nel cantiere (-kf verticale, -kh orizzontale): intro fissa + flip + chiusura, montaggio suo
    if (/-k[fh]$/.test(name)) {
      const wide = /-kh$/.test(name), intro = join(dir, 'intro.mp4')
      await writeFile(intro, Buffer.from(await (await fetch(`${FPV_ASSETS}/intro${wide ? '-16x9' : ''}.mp4`)).arrayBuffer()))
      await montageFpv({ intro, flip: parts[0], finish: parts[1], music, final, size: wide ? [1920, 1080] : [1080, 1920] })
      await uploadFile(await readFile(final), key, 'video/mp4')
      await deleteKeys([`${key.replace(/\.mp4$/, '')}.job.json`]).catch(() => {})
      return { url, id, fresh: true }
    }
    // due clip del cantiere una dopo l'altra (ricodifica leggera, crf 14)
    if (parts.length > 1) await ffmpeg(['-y', '-i', parts[0], '-i', parts[1], '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]', '-c:v', 'libx264', '-crf', '14', raw])
    else await rename(parts[0], raw)
    // Con te in video (-ka): montaggio suo (video dell'agente + trasformazione), vedi agentVideo
    if (/-k[aw]$/.test(name)) {
      if (/-kw$/.test(name)) await montageWalk({ raw, music, final }); else await montageAgent({ dir, raw, music, final, owner, name })
      await uploadFile(await readFile(final), key, 'video/mp4')
      await deleteKeys([`${key.replace(/\.mp4$/, '')}.job.json`]).catch(() => {})
      return { url, id, fresh: true }
    }
    // Kling e Svuota (-f) vanno in avanti, clip intera, fermo sull'ultimo fotogramma.
    // Popup (-p), Dall'alto (-g) e Particelle (-d): Veo al contrario, clip fino a stanza vuota e ferma (il tempo morto
    // finale di Veo diventerebbe un inizio fermo), poi invertita: l'ultimo fotogramma e' la foto arredata. Poi il video
    // passa in 0,35 s alla foto vera e ci resta 2 s: finisce SEMPRE sulla foto dell'agente.
    // Dall'alto (-g, Kling): in avanti, taglio dove i pezzi si sono posati, poi la stessa dissolvenza sulla foto vera.
    const veo = /-(p|g|d)$/.test(name) // finisce con la dissolvenza sulla foto vera
    const popup = veo && !gk // al contrario
    // taglio dove l'animazione si ferma (stanza vuota per i video al contrario, mobili posati per Dall'alto)
    const gray = veo ? await ffmpeg(['-i', raw, '-vf', 'scale=320:180,format=gray', '-f', 'rawvideo', '-']) : Buffer.alloc(0)
    const cut = gk ? Math.min(KLING_SECONDS, calmPoint(gray, 320 * 180)) : kling ? KLING_SECONDS * parts.length : !veo ? VEO_SECONDS : calmPoint(gray, 320 * 180)
    // Giorno e notte (-k): 1,6x, il cambio di luce di Kling e' lento (29/09); gli altri a velocita' vera
    const speed = /-k$/.test(name) ? 1.6 : 1
    const shown = cut / speed // durata della clip nel video finale
    const total = shown + HOLD, n = Math.round(total * 30)
    // zoom 3% ease-in-out solo nel finale, dal passaggio alla foto vera in poi (Kling e Svuota: ultimi 2 s);
    // sub-pixel (perspective con interpolazione: niente tremolio)
    const z0 = Math.round((veo ? shown - XFADE : shown) * 30)
    // Giorno e notte (-k): zoom lento e costante (6%) dal primo all'ultimo fotogramma, come un livello sopra il video
    const z = /-k$/.test(name) ? `(1+0.06*in/${n})` : `(1+0.03*(0.5-0.5*cos(PI*min(max(in-${z0}\\,0)/${n - z0}\\,1))))`, o = `(1-1/${z})/2`
    const zoom = `perspective=x0='W*${o}':y0='H*${o}':x1='W-W*${o}':y1='H*${o}':x2='W*${o}':y2='H-H*${o}':x3='W-W*${o}':y3='H-H*${o}':interpolation=cubic:eval=frame,format=yuv420p[v];`
    const audio = `atrim=end=${total.toFixed(2)},afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,volume=0.8[a]`
    const clip = `[0:v]trim=end=${cut.toFixed(2)},setpts=(PTS-STARTPTS)/${speed},${popup ? 'reverse,' : ''}fps=30,format=yuv420p`
    if (veo) {
      const photo = join(dir, 'finale.jpg')
      const photoBuf = Buffer.from(await (await fetch(`${process.env.R2_PUBLIC_URL}/videos/${owner}/${name}-finale.jpg`)).arrayBuffer())
      // Veo a fine animazione ha la camera un po' spostata rispetto alla foto vera (Dall'alto: fino al 5-6% in verticale,
      // 29/09): la foto compariva piu' in alto e poi "scattava". Si misura lo spostamento sull'ultimo fotogramma tenuto,
      // la foto entra spostata come Veo e durante il fermo scivola al suo posto (ease), insieme allo zoom.
      const last = await ffmpeg(['-ss', (popup ? 0.02 : Math.max(0, cut - 0.05)).toFixed(2), '-i', raw, '-frames:v', '1', '-f', 'image2', '-c:v', 'png', '-'])
      const sh = await measureShift(photoBuf, last, 0.08).catch(() => ({ dx: 0, dy: 0, gain: 0 }))
      const { width: PW = 1280, height: PH = 720 } = await sharp(photoBuf).metadata()
      const px = sh.gain > 0.02 ? Math.round(sh.dx * PW) : 0, py = sh.gain > 0.02 ? Math.round(sh.dy * PH) : 0
      const L = Math.abs(px), T = Math.abs(py)
      await writeFile(photo, L || T ? await sharp(photoBuf).extend({ left: L, right: L, top: T, bottom: T, extendWith: 'copy' }).jpeg({ quality: 95 }).toBuffer() : photoBuf)
      const ease = `(0.5-0.5*cos(PI*min(max((t-${XFADE})/${HOLD}\\,0)\\,1)))`
      const slide = L || T ? `crop=${PW}:${PH}:'${L}-(${px})*(1-${ease})':'${T}-(${py})*(1-${ease})',` : ''
      await ffmpeg(['-y', '-i', raw, '-loop', '1', '-t', (HOLD + XFADE).toFixed(2), '-i', photo, '-i', music, '-filter_complex',
        // clip alla misura della foto (Kling non esce sempre a 1280x720 / 720x1280, e xfade vuole la stessa misura);
        // niente scale2ref: con ffmpeg 7 resta appeso
        `${clip},scale=${PW}:${PH}:flags=bicubic,setsar=1[c];[1:v]fps=30,${slide}format=yuv420p[p];[c][p]xfade=transition=fade:duration=${XFADE}:offset=${(shown - XFADE).toFixed(2)},${zoom}[2:a]${audio}`,
        '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    } else {
      await ffmpeg(['-y', '-i', raw, '-i', music, '-filter_complex',
        `${clip},tpad=stop_mode=clone:stop_duration=${HOLD},${zoom}[1:a]${audio}`,
        '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    }
    await uploadFile(await readFile(final), key, 'video/mp4')
    await deleteKeys([`${key.replace(/\.mp4$/, '')}.job.json`]).catch(() => {}) // via il segnaposto "in lavorazione"
    return { url, id, fresh: true }
  } catch (e) {
    console.error('video montaggio', e)
    return { error: 'ai_failed', status: 502 }
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

export function ffmpeg(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath as unknown as string, ['-v', 'error', ...args])
    const chunks: Buffer[] = [], err: Buffer[] = []
    p.stdout.on('data', c => chunks.push(c)); p.stderr.on('data', c => err.push(c))
    p.on('error', reject)
    p.on('close', code => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(Buffer.concat(err).toString().slice(-800)))))
  })
}

// Popup (Veo al contrario, 24 fps, fotogrammi grigi 320x180): fine dell'animazione = dopo il picco di movimento,
// primo istante in cui per 0,75 s meno dello 0,5% dei pixel cambia (nella prova del 28/09: 3,5 s), piu' 0,5 s di
// stanza vuota ferma. Movimento = quota di pixel che cambiano davvero, non la media: un cuscino e' piccolo.
function calmPoint(raw: Buffer, px: number, fps = 24): number {
  const n = Math.floor(raw.length / px)
  const fr = (i: number) => raw.subarray(i * px, (i + 1) * px)
  const moving = (a: Buffer, b: Buffer) => { let c = 0; for (let k = 0; k < px; k++) if (Math.abs(a[k] - b[k]) > 14) c++; return c / px }
  const mv = [0]
  for (let i = 1; i < n; i++) mv.push(moving(fr(i), fr(i - 1)))
  const peak = mv.indexOf(Math.max(...mv))
  for (let i = peak; i < n - 18; i++) if (Math.max(...mv.slice(i, i + 18)) < 0.005) return Math.min(n - 1, i + fps / 2) / fps
  return n / fps // nessun fermo: clip intera
}
