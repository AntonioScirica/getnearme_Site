// Stanza vuota con maschera e inpainting (28/09/2026). Nano Banana da solo ridisegnava la stanza: spariva un muretto,
// un pilastro, cambiavano le piastrelle. Qui fuori dalla maschera i pixel sono per costruzione quelli della foto.
//   1. Sonnet elenca i pezzi da togliere (frasi brevi, una per oggetto)
//   2. EVF-SAM (fal) fa la maschera di ogni pezzo; unione, chiusura dei buchi (il rivestimento tra pensili e piano) e dilatazione
//   3. GPT Image 2.5 Sunburst con la maschera (EDIT_MODEL=gpt, ~0,005 $) svuota e ricostruisce pareti e pavimento; senza,
//      LaMa (fal) toglie e Nano Banana Lite pulisce le sbavature
//   4. il risultato si compone SOLO dentro la maschera
// Prova sulla cucina con muretto del 28/09: pilastro, muretto, porta e piastrelle intatti. Costo ~0,04 $ a foto con GPT (Sonnet + maschere + GPT).
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { nanoBanana } from '@/lib/nanoBanana'
import { gptImage } from '@/lib/gptImage'
import { logUsage } from '@/lib/ai'

const FAL = 'https://queue.fal.run'
const MAX_ITEMS = 12

const falRun = async (model: string, body: unknown, timeoutMs = 180_000): Promise<Record<string, unknown> | null> => {
  const headers = { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' }
  const q = await fetch(`${FAL}/${model}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) }).then(r => r.json()).catch(() => null) as { request_id?: string; status_url?: string; response_url?: string } | null
  if (!q?.request_id || !q.status_url || !q.response_url) { console.error('emptyRoom fal submit', model, q); return null }
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    await new Promise(r => setTimeout(r, 2000))
    const st = await fetch(q.status_url, { headers, signal: AbortSignal.timeout(20_000) }).then(r => r.json()).catch(() => null) as { status?: string } | null
    if (!st) continue
    if (st.status === 'COMPLETED') return fetch(q.response_url, { headers, signal: AbortSignal.timeout(20_000) }).then(r => r.json()).catch(() => null)
    if (st.status !== 'IN_QUEUE' && st.status !== 'IN_PROGRESS') { console.error('emptyRoom fal status', model, st); return null }
  }
  return null
}
const dataUrl = (buf: Buffer, mime = 'image/jpeg') => `data:${mime};base64,${buf.toString('base64')}`
const download = async (url: string) => Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(30_000) })).arrayBuffer())

// filtro massimo/minimo separabile su una maschera a un canale (dilatazione / erosione), raggio r
function morph(src: Uint8Array, w: number, h: number, r: number, max: boolean): Uint8Array {
  const pick = max ? Math.max : Math.min
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = src[y * w + x]
    for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < w) v = pick(v, src[y * w + xx]) }
    tmp[y * w + x] = v
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = tmp[y * w + x]
    for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < h) v = pick(v, tmp[yy * w + x]) }
    out[y * w + x] = v
  }
  return out
}

// Foto (data url o url) -> stanza vuota (JPEG), o null se un passaggio non riesce (il chiamante ripiega su Nano Banana).
export async function emptyRoomMasked(o: { userId: string; image: string; kind?: string }): Promise<Buffer | null> {
  if (!process.env.FAL_API_KEY || !process.env.ANTHROPIC_API_KEY || !process.env.GEMINI_API_KEY) return null
  const t0 = Date.now()
  try {
    const src = o.image.startsWith('data:') ? Buffer.from(o.image.split(',')[1] ?? '', 'base64') : await download(o.image)
    const photo = await sharp(src).rotate().jpeg({ quality: 95 }).toBuffer()
    const { width: W = 0, height: H = 0 } = await sharp(photo).metadata()
    if (!W || !H) return null
    const photoUrl = dataUrl(photo)

    // 1. cosa togliere: frasi brevi che individuano ogni pezzo (per la segmentazione con testo)
    const msg = await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (await sharp(photo).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()).toString('base64') } },
        { type: 'text', text: `This is a real estate photo. List everything that should be removed to show the room completely empty: every piece of furniture, the kitchen units with worktop, hood, sink and appliances (as one item), the tiled backsplash behind a kitchen (as its own item), pipes on walls, lamps, rugs, curtains, pictures, mirrors, plants, decor and personal items. Keep walls (including half-height walls), floor, ceiling, doors, windows, radiators and built-in wardrobes. Each item is a short English referring phrase that identifies exactly one region in this photo (for example "the dark bookshelf on the right", "the beige sofa in the foreground"). At most ${MAX_ITEMS} items, biggest first. Reply only with JSON {"items": ["..."]}.` },
      ] }],
    })
    await logUsage({ userId: o.userId, kind: `${o.kind ?? 'empty'}_items` }, false, Date.now() - t0, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, 'claude-sonnet-5').catch(() => {})
    const txt = msg.content.find(c => c.type === 'text')?.text ?? ''
    const items = ((JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { items?: string[] }).items ?? []).filter(x => typeof x === 'string' && x.trim()).slice(0, MAX_ITEMS)
    if (!items.length) return null

    // 2. una maschera per pezzo (in parallelo), unione a risoluzione ridotta
    const mw = 640, mh = Math.round(H * 640 / W)
    const masks = await Promise.all(items.map(async prompt => {
      const r = await falRun('fal-ai/evf-sam', { image_url: photoUrl, prompt })
      const url = (r?.image as { url?: string } | undefined)?.url
      if (!url) return null
      return sharp(await download(url)).resize(mw, mh, { fit: 'fill' }).greyscale().raw().toBuffer()
    }))
    const got = masks.filter((m): m is Buffer => !!m)
    if (!got.length) return null
    let u: Uint8Array = new Uint8Array(mw * mh)
    for (const m of got) for (let i = 0; i < u.length; i++) if (m[i] > 127) u[i] = 255
    const cover = u.reduce((s, v) => s + (v ? 1 : 0), 0) / u.length
    if (cover < 0.01 || cover > 0.85) { console.warn('emptyRoom maschera', cover, items); return null }
    // chiusura (riempie i buchi dentro il blocco cucina) e dilatazione (ombre e bordi)
    u = morph(morph(u, mw, mh, 10, true), mw, mh, 7, false)
    u = morph(u, mw, mh, 5, true)
    const maskPng = await sharp(Buffer.from(u), { raw: { width: mw, height: mh, channels: 1 } }).resize(W, H, { fit: 'fill' }).png().toBuffer()

    // 3. GPT Image 2.5 Sunburst con la maschera (EDIT_MODEL=gpt, ~0,005 $ a qualita' bassa): una chiamata sola, pareti piane e
    // pavimento continuo (prova del 28/09, meglio di LaMa + pulizia). Maschera per OpenAI: trasparente dove modificare.
    let top: Buffer | null = null
    if (process.env.EDIT_MODEL === 'gpt') {
      const alpha = Buffer.alloc(mw * mh * 4)
      for (let i = 0; i < u.length; i++) alpha[i * 4 + 3] = u[i] ? 0 : 255
      const maskAlpha = await sharp(alpha, { raw: { width: mw, height: mh, channels: 4 } }).resize(W, H, { fit: 'fill', kernel: 'nearest' }).png().toBuffer()
      const g = await gptImage({ userId: o.userId, image: dataUrl(photo), mask: maskAlpha, kind: 'svuota', quality: process.env.GPT_EDIT_QUALITY || 'low', prompt: `Show this exact room completely empty: remove everything inside the masked area (${items.join(', ')}) and show in its place only bare, flat, freshly painted walls in the same color as the rest of each wall and the same floor continuing with the same material, tiles and grid. Keep every wall, half-height wall, door, window and radiator. Everything outside the mask stays exactly the same: same camera, same framing, same light. No furniture, no objects, no text.` })
      if (g) top = await sharp(Buffer.from(g, 'base64')).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer()
    }
    if (!top) {
    // 3b. ripiego: LaMa toglie tutto dentro la maschera, Nano Banana Lite pulisce le sbavature
    const lama = await falRun('fal-ai/lama', { image_url: photoUrl, mask_image_url: dataUrl(maskPng, 'image/png') })
    const lamaUrl = (lama?.image as { url?: string } | undefined)?.url
    if (!lamaUrl) return null
    const cleared = await sharp(await download(lamaUrl)).resize(W, H, { fit: 'fill' }).jpeg({ quality: 95 }).toBuffer()
    const cleaned = await nanoBanana({ userId: o.userId, image: dataUrl(cleared), kind: o.kind ?? 'empty', lite: true, prompt: 'You are a professional real estate photo retoucher. In this photo of an empty room, furniture was digitally removed and left blurry smudges on the walls and floor. Clean them: make every smudged wall area a flat, plain wall freshly painted in the same color as the rest of that wall, from floor to ceiling, and where the floor is smudged continue the same floor with the same material, tiles and grid. Change nothing else: same walls, same half-height walls, same doors, same windows, same ceiling, same camera, same framing, same light. Do not add any furniture, tiles, decoration or object. Output one photorealistic photo, no text.' })
    // tre canali sempre (Nano Banana puo' rispondere in PNG con alfa)
    top = cleaned ? await sharp(Buffer.from(cleaned, 'base64')).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer() : await sharp(cleared).removeAlpha().raw().toBuffer()
    }
    // 4. composizione solo dentro la maschera (bordo sfumato): fuori i pixel sono quelli della foto
    const base = await sharp(photo).removeAlpha().raw().toBuffer()
    const alpha = await sharp(maskPng).blur(6).greyscale().raw().toBuffer()
    const out = Buffer.alloc(base.length)
    for (let i = 0, p = 0; i < alpha.length; i++, p += 3) {
      const a = alpha[i] / 255
      out[p] = base[p] + (top[p] - base[p]) * a
      out[p + 1] = base[p + 1] + (top[p + 1] - base[p + 1]) * a
      out[p + 2] = base[p + 2] + (top[p + 2] - base[p + 2]) * a
    }
    return sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 93 }).toBuffer()
  } catch (e) {
    console.error('emptyRoom', e)
    return null
  }
}
