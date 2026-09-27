// Foto con Nano Banana 2 (Gemini 3.1 Flash Image, Google diretto): una chiamata per foto, niente GPU nostra.
// Scelto il 27/09/2026: costo reale ~0,067 $ a foto a 1K contro ~0,09-0,10 $ di Qwen + piano Opus (fattura RunPod
// compresa di accensioni e minuti a vuoto), 15-20 s invece di 70-100, la stanza resta quella vera.
// Prompt a 5 regole provato su cantiere, cucina e camera (prove in ~/Desktop/prove-nanobanana).
// Esce a 1K: l'ingrandimento lo fa matchInputShape (sharp), gratis.
import { logUsage } from '@/lib/ai'

const MODEL = 'gemini-3.1-flash-image'
const USD_PER_IMAGE_1K = 0.067

export type StageTask = 'furnish' | 'empty' | 'edit'

const FRAMING = 'photographed from the identical camera position, with the same lens and framing. The result must line up with the original photo: every corner, wall edge, window and door stays at the same position in the frame (do not move, rotate, zoom out, widen or crop the view).'
const ARCHITECTURE = 'Same architecture: every wall, window, door, beam, column, staircase, radiator and fireplace stays exactly where it is, with the same shape and size. Keep the existing window and door frames. Never add or remove windows, doors or rooms, and never invent a kitchen, stairs or other spaces that are not visible in the photo.'
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
3. Surfaces: keep the existing floor, tiles and wall finishes exactly as they are, only cleaned; if the room is unfinished, show plastered walls and a clean floor.
4. ${LIGHT}
${OUTPUT}`
  }
  return `You are a professional real estate photographer and interior stager. This room is a ${room}. Show this exact room ready to be listed for sale, ${FRAMING}
Rules:
1. ${ARCHITECTURE} Keep fitted kitchens, bathroom fixtures and built-in wardrobes exactly as they are, in the same position and finish.
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
export async function nanoBanana(o: { userId: string; image: string; prompt: string; styleRef?: string; kind?: string }): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false
  try {
    const images = [await toInline(o.image), ...(o.styleRef ? [await toInline(o.styleRef)] : [])]
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        contents: [{ parts: [...images.map(inline_data => ({ inline_data })), { text: o.prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '1K' } },
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
    await logUsage({ userId: o.userId, kind: o.kind ?? 'photo_edit' }, false, Date.now() - t0, {}, ok, MODEL).catch(() => {})
  }
}

export { USD_PER_IMAGE_1K }
