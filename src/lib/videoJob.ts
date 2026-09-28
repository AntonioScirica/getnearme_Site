import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { spawn } from 'child_process'
import { mkdtemp, readFile, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import { nanoBanana, stagePrompt } from '@/lib/nanoBanana'
import { emptyRoomMasked } from '@/lib/emptyRoom'
import { gptImage } from '@/lib/gptImage'
import { GNM_CANTIERE_1, GNM_CANTIERE_2, GNM_DAYNIGHT, GNM_EXCAVATION_IMAGE, GNM_NIGHT_IMAGE, GNM_STOPMOTION, GNM_STRUCTURE_IMAGE } from '@/lib/gnmVideoPrompts'
import Anthropic from '@anthropic-ai/sdk'
import ffmpegPath from 'ffmpeg-static'
import { uploadFile, uploadJpeg } from '@/lib/r2'
import { logUsage } from '@/lib/ai'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'
import { MUSIC_CATALOG } from '@/lib/aiVideoMusic'

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
const GRAVITY_CUT = 6 // Dall'alto: taglio al fermo (calmPoint), mai oltre 6 s (i pezzi si posano entro 3-5 s, prove del 28/09)
const GRAVITY_SPEED = 1.2 // Dall'alto un po' piu' veloce (scelto il 28/09 tra 1x, 1,2x, 1,5x e 2x)
// Veo Lite primo/ultimo fotogramma su fal accetta SOLO 8 s (con 4 s rifiuta il lavoro: "Input should be '8s'").
const VEO_SECONDS = 8

// Stanza vuota: maschera + inpainting (lib/emptyRoom), ripiego sul prompt Svuota della piattaforma (nanoBanana.stagePrompt).
// Svuota (landing, Veo Lite in avanti F -> E): prompt e negativi della ricetta del 27/09, invariati
const NEG = 'text, letters, numbers, percent signs, captions, watermark, circles, ovals, rings, halos, light arcs, light trails, glowing lines, light beams, lens flare, fast camera movement, camera shake, new parts of the room, dissolve, ghosting, double exposure, semi-transparent objects, duplicated furniture, springs, coils, bouncing platform, ropes, cranes, new objects, extra furniture, extra cushions, extra decor, people, hands, tripod, camera, sliding objects, flying objects, floating objects, fading in, cross-fade, morphing, melting, flicker, exposure change, camera movement, zoom, pan'
// Popup e Dall'alto (Veo 3.1 standard/fast), negativi provati il 28/09
const NEG_VEO = 'camera movement, pan, tilt, zoom, dolly, camera shake, different camera angle, dissolve, cross-fade, fade in, double exposure, morphing, ghosting, semi-transparent objects, duplicated furniture, extra furniture, replaced furniture, objects sliding, objects floating, bouncing ball, springs, people, hands, tripod, camera equipment, text, letters, captions, watermark, lens flare, light trails, exposure change, flicker'
// niente "tripod": Veo lo disegnava nella stanza (Particelle, 28/09)
const STILL = 'The camera is completely static for the whole video: identical framing from the first frame to the last, no pan, no tilt, no zoom, no shake, never a different view of the room. '
// Dall'alto, in avanti: pezzi grandi prima, poi i piccoli sopra
const GRAVITY_PROMPT = (items: string) => `Satisfying real-estate home staging animation. ${STILL}The room starts completely empty, exactly as the first image, and stays perfectly still for half a second. Then the furniture drops in from above in a fast rhythm, several pieces in quick succession: each piece enters from the top edge of the frame already in its final size and orientation, falls straight down fast under gravity, and lands heavily in its exact final position with a tiny firm settle, then never moves again. Pictures and wall art fall the same way and hook onto the wall. First the big pieces, then the small items drop onto them, in this order: ${items}. Everything, including the pictures on the walls, has landed by the fourth second; from then on nothing moves or changes at all. Nothing slides, nothing fades in, nothing morphs or changes shape, no object appears in a place other than its final position. Walls, ceiling, windows, curtains, built-in furniture, floor and daylight never change. The last frame is exactly the second image, with every piece in place.`
// Popup e Particelle, al contrario: i piccoli spariscono prima, poi i mobili (invertito: mobili prima, poi gli oggetti sopra)
const POPUP_PROMPT = (items: string) => `Satisfying real-estate animation. ${STILL}The furnished room is shown perfectly still for half a second. Then the objects vanish one after another in a quick steady rhythm, popping out of existence on the spot: each object swells very slightly for a few frames, then shrinks fast into a tiny point at its base and is gone, leaving the bare floor and walls exactly as in the second image. Objects never move, slide, fall or fly; nothing new ever appears. First the small items, then the furniture, in this order: ${items}. By the fifth second the room is completely empty and identical to the second image, and from then on nothing moves or changes at all. Walls, ceiling, windows, curtains, built-in furniture, floor and daylight never change.`
const PARTICLES_PROMPT = (items: string) => `Magical real-estate animation. ${STILL}The furnished room is shown perfectly still for half a second. Then, one after another in a quick steady rhythm, each object transforms on the spot: its surface turns into a shimmering silhouette of glowing golden particles with exactly its shape, and that silhouette unravels into a few graceful swirling ribbons of golden sparkles that rise a short way into the air above it and fade out within a second, leaving the bare floor and walls exactly as in the second image. Only the objects change: everything else in the frame stays exactly as it is, and the objects still waiting for their turn stay perfectly still and unchanged. Objects never slide or fall; nothing new ever appears. First the small items, then the furniture, in this order: ${items}. By the sixth second the room is completely empty and identical to the second image, and from then on nothing moves or changes at all.`
const NEG_REVERSE = `${NEG_VEO}, falling objects, flying objects, new furniture appearing`
// Particelle (invertito: le scie dorate entrano e formano i mobili, come nel reel di GetNearMe): niente divieti su scie e bagliori
const NEG_PARTICLES = 'camera movement, pan, tilt, zoom, dolly, camera shake, different camera angle, cross-fade, double exposure, ghosting, transparent walls, morphing, duplicated furniture, extra furniture, new furniture appearing, replaced furniture, objects sliding, falling objects, people, hands, tripod, camera equipment, text, letters, captions, watermark, exposure change, flicker, smoke, fire, flames, explosion, large debris'
// template con i flussi Kling di GetNearMe (vedi gnmVideoPrompts); Popup, Dall'alto e Particelle su Veo
const KLING: Partial<Record<Anim, true>> = { stopmotion: true, cantiere: true, daynight: true }
const KLING_URL = 'https://queue.fal.run/fal-ai/kling-video/o3/standard/image-to-video'
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

// Stanza vuota della foto (Stop-motion e Particelle, Kling): Nano Banana, come tutte le foto.
// aspect: stesso formato della foto, se no Nano Banana sceglie il suo e il ritaglio zooma la stanza (28/09)
async function emptyRoom(fullUrl: string, logUser: string, aspect: string): Promise<string | null> {
  // GPT Image 2.5 Sunburst senza maschera (EDIT_MODEL=gpt, 0,014 $ a qualita' bassa, misurato il 28/09): tiene pilastri,
  // muretti e pavimento da solo. Se non risponde: maschera + inpainting (lib/emptyRoom), poi Nano Banana.
  const gpt = process.env.EDIT_MODEL === 'gpt' ? await gptImage({ userId: logUser, image: fullUrl, prompt: stagePrompt({ task: 'empty', room: '', style: '' }), kind: 'svuota', quality: process.env.GPT_EDIT_QUALITY || 'low' }) : null
  if (gpt) return gpt
  const masked = await emptyRoomMasked({ userId: logUser, image: fullUrl, kind: 'video_empty' })
  if (masked) return masked.toString('base64')
  return nanoBanana({ userId: logUser, image: fullUrl, aspect, prompt: stagePrompt({ task: 'empty', room: '', style: '' }), kind: 'video_empty' })
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
export async function startVideo(owner: string, logUser: string, o: { imageUrl: string; imageBase64: string; projectId?: string; anim: Anim; empty?: string; styled?: string; framesOnly?: boolean }): Promise<VideoResult & FramesResult> {
  const { imageUrl, imageBase64, anim } = o
  const pid = o.projectId ?? '' // gia' validato dalla rotta
  if (AI_MOCK) { await mockDelay(2000); return { job: 'mock' } }
  if (!process.env.FAL_API_KEY || !process.env.GEMINI_API_KEY) return { error: 'not_configured', status: 503 } // Nano Banana + fal

  try {
    // 1. formato dalla foto, ritaglio centrale
    const src = imageBase64 ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).rotate().metadata()
    const landscape = width >= height
    const [W, H] = landscape ? [1280, 720] : [720, 1280]
    const full = await sharp(src).rotate().resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer()
    const name = `${pid ? `casa-${pid}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${o.empty ? '-f' : anim === 'popup' ? '-p' : anim === 'particles' ? '-d' : '-g'}`
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
        // stop-motion: dalla stanza vuota alla foto arredata
        // stanza vuota (vedi emptyRoom): Kling va da questa alla foto vera
        const q = await emptyRoom(fullUrl, logUser, landscape ? '16:9' : '9:16')
        const empty = q && await uploadJpeg(await sharp(Buffer.from(q, 'base64')).resize(W, H, { fit: 'cover' }).jpeg({ quality: 95 }).toBuffer(), `${key}-vuota.jpg`)
        if (!empty) return { error: 'ai_failed', status: 502 }
        ids = [(await kling(empty, fullUrl, GNM_STOPMOTION)).request_id]
      }
      if (ids.some(x => !x)) { console.error('video kling submit', ids); return { error: 'ai_failed', status: 502 } }
      const kname = `${name}${ids.length > 1 ? '-kc' : '-k'}`
      const id = ids.join('+')
      return { job: `${id}.${kname.replace('/', '~')}.${sign(owner, `${id}.${kname}`)}` }
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
      const e = await emptyRoom(after, logUser, landscape ? '16:9' : '9:16')
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

// Fase 2: elenco dei pezzi (Sonnet) e Veo. Svuota (fromEmpty, landing): Lite in avanti dalla foto alla vuota.
// Dall'alto: in avanti dalla vuota alla foto, pezzi grandi prima. Popup e Particelle: al contrario dalla foto
// alla vuota, oggetti piccoli prima (invertito: mobili prima, poi gli oggetti sopra).
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
    const msg = await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 3000,
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Image 1 is a room before, image 2 is the same room after home staging.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(emptyBuf).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(furnished).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
        { type: 'text', text: 'List every object that is in image 2 and not in image 1: rugs, furniture, cushions, throws, plants, books, decor. Look carefully and count exactly, largest pieces first. Use short simple names, no adjectives about shape. Reply only with JSON {"items": ["..."]}.' },
      ] }],
    })
    await logUsage({ userId: logUser, kind: 'video_items' }, false, Date.now() - t1, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, 'claude-sonnet-5')
    const txt = msg.content.find(c => c.type === 'text')?.text ?? ''
    const items = ((JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { items?: string[] }).items ?? []).filter(x => typeof x === 'string')
    if (!items.length) return { error: 'nothing_to_animate', status: 422 }

    const big = items.join(', then '), small = [...items].reverse().join(', then ')
    const forward = fromEmpty ? false : anim === 'gravity'
    const [first, last] = forward ? [emptyUrl, furnishedUrl] : [furnishedUrl, emptyUrl]
    const text = fromEmpty ? prompt(small, anim) : anim === 'gravity' ? GRAVITY_PROMPT(big) : anim === 'particles' ? PARTICLES_PROMPT(small) : POPUP_PROMPT(small)
    const negative = fromEmpty ? negFor(anim) : anim === 'gravity' ? NEG_VEO : anim === 'particles' ? NEG_PARTICLES : NEG_REVERSE
    const q = await fal(fromEmpty ? `${FAL}/lite/first-last-frame-to-video` : VEO_FLF, {
      first_frame_url: first, last_frame_url: last, prompt: text, negative_prompt: negative,
      duration: `${VEO_SECONDS}s`, aspect_ratio: landscape ? '16:9' : '9:16', resolution: '720p', generate_audio: false, seed: Math.floor(Math.random() * 1_000_000),
    })
    if (!q.request_id) { console.error('video fal submit', q); return { error: 'ai_failed', status: 502 } }
    // il nome va nel lavoro firmato: a fine montaggio il video si salva accanto alla sua foto (copertina in Galleria)
    return { job: `${q.request_id}.${name.replace('/', '~')}.${sign(owner, `${q.request_id}.${name}`)}` }
  } catch (e) {
    console.error('video render', e)
    return { error: 'ai_failed', status: 502 }
  }
}

// url pronto; fresh = montato adesso (la piattaforma scala i crediti una volta sola, con l'id di fal)
export async function pollVideo(owner: string, job: string): Promise<VideoResult & { fresh?: boolean }> {
  if (job === 'mock' && AI_MOCK) return { url: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili/F12_rianima.mp4' }
  const [id, tilde, sig] = job.split('.')
  const name = (tilde ?? '').replace('~', '/')
  if (!id || !/^[\w-]{8,64}(\+[\w-]{8,64})?$/.test(id) || !/^(casa-[\w-]{1,64}\/)?\d+-[a-z0-9]+(-f|-k|-kc|-g|-p|-d)?$/.test(name) || !sig || sig.length !== 22 || !timingSafeEqual(Buffer.from(sig), Buffer.from(sign(owner, `${id}.${name}`)))) return { error: 'bad_request', status: 400 }

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
    // Kling e Svuota (-f) vanno in avanti, clip intera, fermo sull'ultimo fotogramma.
    // Dall'alto (-g): primi 6 s di Veo in avanti. Popup (-p) e Particelle (-d): Veo al contrario, clip fino a stanza vuota e ferma
    // (il tempo morto finale di Veo diventerebbe un inizio fermo), poi invertita. Per tutti e due il video
    // passa in 0,35 s alla foto vera e ci resta 2 s: finisce SEMPRE sulla foto dell'agente.
    const veo = /-(p|g|d)$/.test(name)
    const popup = /-(p|d)$/.test(name) // al contrario
    // Dall'alto: taglio dove l'animazione si ferma, mai oltre 6 s
    const gray = veo ? await ffmpeg(['-i', raw, '-vf', 'scale=320:180,format=gray', '-f', 'rawvideo', '-']) : Buffer.alloc(0)
    const cut = kling ? KLING_SECONDS * parts.length : !veo ? VEO_SECONDS : Math.min(popup ? Infinity : GRAVITY_CUT, calmPoint(gray, 320 * 180))
    const speed = veo && !popup ? GRAVITY_SPEED : 1
    const shown = cut / speed // durata della clip nel video finale
    const total = shown + HOLD, n = Math.round(total * 30)
    // zoom 3% ease-in-out solo nel finale, dal passaggio alla foto vera in poi (Kling e Svuota: ultimi 2 s);
    // sub-pixel (perspective con interpolazione: niente tremolio)
    const z0 = Math.round((veo ? shown - XFADE : shown) * 30)
    const z = `(1+0.03*(0.5-0.5*cos(PI*min(max(in-${z0}\\,0)/${n - z0}\\,1))))`, o = `(1-1/${z})/2`
    const zoom = `perspective=x0='W*${o}':y0='H*${o}':x1='W-W*${o}':y1='H*${o}':x2='W*${o}':y2='H-H*${o}':x3='W-W*${o}':y3='H-H*${o}':interpolation=cubic:eval=frame,format=yuv420p[v];`
    const audio = `atrim=end=${total.toFixed(2)},afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,volume=0.8[a]`
    const clip = `[0:v]trim=end=${cut.toFixed(2)},setpts=(PTS-STARTPTS)/${speed},${popup ? 'reverse,' : ''}fps=30,format=yuv420p`
    if (veo) {
      const photo = join(dir, 'finale.jpg')
      await writeFile(photo, Buffer.from(await (await fetch(`${process.env.R2_PUBLIC_URL}/videos/${owner}/${name}-finale.jpg`)).arrayBuffer()))
      await ffmpeg(['-y', '-i', raw, '-loop', '1', '-t', (HOLD + XFADE).toFixed(2), '-i', photo, '-i', music, '-filter_complex',
        // la foto e' gia' W x H come i fotogrammi di Veo (720p); niente scale2ref: con ffmpeg 7 resta appeso
        `${clip}[c];[1:v]fps=30,format=yuv420p[p];[c][p]xfade=transition=fade:duration=${XFADE}:offset=${(shown - XFADE).toFixed(2)},${zoom}[2:a]${audio}`,
        '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    } else {
      await ffmpeg(['-y', '-i', raw, '-i', music, '-filter_complex',
        `${clip},tpad=stop_mode=clone:stop_duration=${HOLD},${zoom}[1:a]${audio}`,
        '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final])
    }
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
