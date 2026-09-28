// Foto con Nano Banana 2 (Gemini 3.1 Flash Image, Google diretto): una chiamata per foto, niente GPU nostra.
// Scelto il 27/09/2026: costo reale ~0,067 $ a foto a 1K contro ~0,09-0,10 $ di Qwen + piano Opus (fattura RunPod
// compresa di accensioni e minuti a vuoto), 15-20 s invece di 70-100, la stanza resta quella vera.
// Prompt a 5 regole provato su cantiere, cucina e camera (prove in ~/Desktop/prove-nanobanana).
// Esce a 1K: l'ingrandimento lo fa matchInputShape (sharp), gratis.
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'

const MODEL = 'gemini-3.1-flash-image'
// Lite per le modifiche mirate (zona, clic, richiesta scritta): stesso risultato nella prova del 27/09, meta' prezzo
export const LITE = 'gemini-3.1-flash-lite-image'
const USD_PER_IMAGE_1K = 0.067

export type StageTask = 'furnish' | 'empty' | 'edit'

const FRAMING = 'photographed from the identical camera position, with the same lens and framing. The result must line up with the original photo: every corner, wall edge, window and door stays at the same position in the frame (do not move, rotate, zoom out, widen or crop the view).'
const ARCHITECTURE = 'Same architecture: every wall (including half-height walls, low partition walls, counter walls and ledges, which are masonry and must stay), window, door, beam, column, staircase, radiator and fireplace stays exactly where it is, with the same shape and size. Keep the existing window and door frames. Never add or remove windows, doors or rooms, and never invent a kitchen, stairs or other spaces that are not visible in the photo.'
const LIGHT = 'Light: bright natural daylight through the windows, soft interior lights on, balanced exposure, no burnt highlights, straight vertical lines.'
const OUTPUT = 'Output one photorealistic photo, believable and magazine-quality, no text, no watermark.'

export function stagePrompt(o: { task: StageTask; room: string; style: string; styleRef?: boolean }): string {
  const room = o.room || 'room (recognize what kind of room it is from the photo)'
  const ref = o.styleRef ? ' The second image is only a style reference chosen by the agent (it is not this room): take from it the furniture types, colors, materials and mood, never its layout or architecture.' : ''
  if (o.task === 'edit') {
    return `You are a professional real estate photo editor. This room is a ${room}. Edit this exact photo as requested by the agent (in Italian): "${o.style}". Change only what is requested; everything else stays exactly the same, ${FRAMING} When something is removed, remove also everything it causes (its shadow and, for a lamp, its light and glow) and fill the freed area continuing the same floor, walls and light. ${ARCHITECTURE}${ref} ${OUTPUT}`
  }
  if (o.task === 'empty') {
    return `You are a professional real estate photographer. This room is a ${room}. Show this exact room completely empty, ${FRAMING}
Rules:
1. ${ARCHITECTURE} Keep built-in wardrobes.
2. Remove everything else: all furniture, rugs, lamps, curtains, decorations, personal items, clutter, people, and also kitchen units, appliances and bathroom fixtures. Where they were, show clean, finished, freshly painted walls and the same floor: no marks, holes, pipes, sockets left hanging or broken tiles, as if the room had just been prepared for sale.
3. Surfaces: keep the existing floor exactly as it is (same material, same tiles with the same size, color and pattern, never replace tiles with wood or another floor) and the same wall finishes, only cleaned; if the room is unfinished, show plastered walls and a clean floor.
4. ${LIGHT}
${OUTPUT}`
  }
  return `You are a professional real estate photographer and interior stager. This room is a ${room}. Show this exact room ready to be listed for sale, ${FRAMING}
Rules:
1. ${ARCHITECTURE} Keep bathroom fixtures and built-in wardrobes exactly as they are, in the same position and finish. A fitted kitchen keeps exactly its position, layout, size and appliances in the same places, but its fronts, handles, worktop and backsplash get restyled in the chosen style (decided the 28/09: the style applies to the kitchen too).
2. Clear the room: remove people, clutter, personal items, construction tools and materials, and replace all old or worn loose furniture and rugs with new pieces. Outside the windows show a clean, finished view (no scaffolding, no building site).
3. Surfaces: if the room is unfinished or damaged, show it finished with plastered, freshly painted walls and a clean finished floor; otherwise keep the existing floor, tiles and wall finishes exactly as they are, only cleaned.
4. Furnish it as a ${room} in this style: ${o.style}. Always include the main pieces a buyer expects in this room (a living room has a sofa and a coffee table, a bedroom a bed with bedside tables, a kitchen or open space a dining table with chairs), then a rug, a plant and a few decorative objects. Real, well-proportioned furniture placed only on the floor that is visible in the photo, never blocking windows, doors or passages; if there is not enough free floor for a piece, choose a smaller one (a loveseat instead of a large sofa). Never change the view to make room for furniture.${ref}
5. ${LIGHT}
${OUTPUT}`
}

const b64 = (s: string) => s.includes(',') ? s.split(',').pop() ?? '' : s
async function toInline(src: string): Promise<{ mime_type: string; data: string }> {
  if (src.startsWith('data:')) return { mime_type: src.slice(5, src.indexOf(';')) || 'image/jpeg', data: b64(src) }
  const r = await fetch(src, { signal: AbortSignal.timeout(20_000) })
  return { mime_type: r.headers.get('content-type') || 'image/jpeg', data: Buffer.from(await r.arrayBuffer()).toString('base64') }
}

// Ritorna la foto (base64 JPEG/PNG) o null. userId '' = prova anonima dalla landing.
export async function nanoBanana(o: { userId: string; image: string; prompt: string; styleRef?: string; extra?: string[]; kind?: string; lite?: boolean; aspect?: string }): Promise<string | null> {
  const model = o.lite ? LITE : MODEL
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false
  try {
    const images = [await toInline(o.image), ...(o.styleRef ? [await toInline(o.styleRef)] : []), ...(await Promise.all((o.extra ?? []).map(toInline)))]
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        contents: [{ parts: [...images.map(inline_data => ({ inline_data })), { text: o.prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '1K', aspectRatio: o.aspect ?? await nearestAspect(images[0].data) } },
      }),
    })
    const d = await r.json() as { candidates?: { content?: { parts?: { inlineData?: { data: string }; inline_data?: { data: string } }[] } }[]; error?: { message?: string } }
    const part = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData || p.inline_data)
    const out = (part?.inlineData ?? part?.inline_data)?.data ?? null
    ok = !!out
    if (!out) console.error('nano banana: nessuna immagine', r.status, d.error?.message ?? JSON.stringify(d).slice(0, 300))
    return out
  } catch (e) {
    console.error('nano banana', e)
    return null
  } finally {
    await logUsage({ userId: o.userId, kind: o.kind ?? 'photo_edit' }, false, Date.now() - t0, {}, ok, model).catch(() => {})
  }
}

// formato della foto di partenza: se no Nano Banana sceglie il suo e il ritaglio dopo zooma la stanza (28/09)
const ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']
async function nearestAspect(b64data: string): Promise<string> {
  const { width = 1, height = 1, orientation = 1 } = await sharp(Buffer.from(b64data, 'base64')).metadata()
  const r = orientation >= 5 ? height / width : width / height
  const d = (x: string) => Math.abs(Math.log(r * +x.split(':')[1] / +x.split(':')[0]))
  return ASPECTS.reduce((a, b) => (d(b) < d(a) ? b : a))
}

// Modifica su una zona o su oggetti cliccati: alla foto si aggiunge una copia con la zona segnata in rosso
// (rettangolo, lazo o cerchi sui clic). Il modello modifica solo li' e restituisce la foto senza segni.
type Pt = { x: number; y: number }
export async function markedCopy(src: string, zone: { x: number; y: number; w: number; h: number; poly?: Pt[] } | null, points: Pt[]): Promise<string> {
  const buf = src.startsWith('data:') ? Buffer.from(b64(src), 'base64') : Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
  const img = sharp(buf).rotate()
  const { width: W = 1024, height: H = 768 } = await img.metadata()
  const sw = Math.max(4, Math.round(Math.min(W, H) * 0.006))
  const shapes = [
    zone?.poly ? `<polygon points="${zone.poly.map(p => `${Math.round(p.x * W)},${Math.round(p.y * H)}`).join(' ')}" fill="none" stroke="#ff0000" stroke-width="${sw}"/>`
      : zone ? `<rect x="${Math.round(zone.x * W)}" y="${Math.round(zone.y * H)}" width="${Math.round(zone.w * W)}" height="${Math.round(zone.h * H)}" fill="none" stroke="#ff0000" stroke-width="${sw}"/>` : '',
    ...points.map(p => `<circle cx="${Math.round(p.x * W)}" cy="${Math.round(p.y * H)}" r="${Math.round(Math.min(W, H) * 0.04)}" fill="none" stroke="#ff0000" stroke-width="${sw}"/>`),
  ].join('')
  const out = await img.composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${shapes}</svg>`) }]).jpeg({ quality: 88 }).toBuffer()
  return `data:image/jpeg;base64,${out.toString('base64')}`
}

export function zonePrompt(request: string, room: string, marks: 'zone' | 'points'): string {
  const what = marks === 'zone' ? 'inside the area marked by the red outline' : 'on the objects marked by the red circles'
  return `You are a professional real estate photo editor. This room is a ${room || 'room'}. The first image is the photo to edit. The second image is the same photo with marks in red showing where to work. Request of the agent (in Italian): "${request}". Apply it only ${what}; if it asks to remove something, remove the whole object there, including its shadow and, for a lamp, its light and glow, and fill the freed area continuing the same floor, walls and light. Everything else stays exactly the same, ${FRAMING} The output is the first image edited: it must not contain any red line, circle or mark. ${OUTPUT}`
}

export { USD_PER_IMAGE_1K }
