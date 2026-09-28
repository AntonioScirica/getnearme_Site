// Arredo con GPT Image 2 / 2.5 (OpenAI diretto), provato il 28/09/2026 sulle stesse foto di Nano Banana 2: stanza e inquadratura
// identiche, arredo realistico, 0,020 $ a foto a qualita' media e 0,014 $ a bassa (misurati dal campo usage) contro 0,067 $. Dal 28/09 e'
// l'unico modello per le foto (piattaforma, video e prova della landing); serve OPENAI_API_KEY. La fedelta' all'immagine di partenza in GPT Image 2 e'
// sempre alta (input_fidelity ignorato). La cucina fissa viene rifatta nello stile scelto tenendo posizione e layout (scelta del 28/09).
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'

// GPT Image 2.5 (8/9/2026): 'gpt-image-2.5-flare' veloce, 'gpt-image-2.5-sunburst' di precisione; stesso prezzo del 2. Scelta con GPT_IMAGE_MODEL.
const MODEL = process.env.GPT_IMAGE_MODEL || 'gpt-image-2.5-sunburst' // Sunburst: l'unico che ha tenuto la cucina com'era (prova del 28/09)
export const GPT_IMAGE_USD: Record<string, number> = { low: 0.014, medium: 0.020, high: 0.06 } // modifica di una foto 1536x1024, misurato dal campo usage il 28/09/2026 (la foto in ingresso pesa 920 token = 0,007 $ fissi)

// extra: altre immagini di riferimento (la copia con la zona in rosso); quality: livello per questa chiamata (predefinito GPT_IMAGE_QUALITY)
// mask: PNG RGBA della stessa misura della foto, trasparente dove modificare (inpainting nativo di OpenAI)
export async function gptImage(o: { userId: string; image: string; prompt: string; kind?: string; extra?: string[]; quality?: string; mask?: Buffer }): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false
  try {
    const src = o.image.startsWith('data:') ? Buffer.from(o.image.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(o.image, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).rotate().metadata()
    const size = width > height * 1.15 ? '1536x1024' : height > width * 1.15 ? '1024x1536' : '1024x1024'
    const png = await sharp(src).rotate().png().toBuffer()
    const form = new FormData()
    form.append('model', MODEL)
    form.append('image[]', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'photo.png')
    for (const [i, x] of (o.extra ?? []).entries()) {
      const b = x.startsWith('data:') ? Buffer.from(x.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(x, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
      form.append('image[]', new Blob([new Uint8Array(await sharp(b).rotate().png().toBuffer())], { type: 'image/png' }), `ref${i}.png`)
    }
    form.append('prompt', o.kind === 'arreda' ? `${o.prompt} If there is a fitted kitchen, restyle it in the same style: new fronts, handles, worktop and backsplash matching the chosen style, keeping exactly the same layout, position, size and the same appliances in the same places.` : o.prompt)
    if (o.mask) form.append('mask', new Blob([new Uint8Array(o.mask)], { type: 'image/png' }), 'mask.png')
    form.append('size', size)
    // GPT_IMAGE_QUALITY: 'low' (~0,005 $, provato il 28/09: quasi pari alla media), 'medium' (~0,041 $), 'high'
    form.append('quality', o.quality || process.env.GPT_IMAGE_QUALITY || 'low') // bassa: "top" anche per l'agente (28/09), 0,014 $
    form.append('output_format', 'jpeg')
    form.append('n', '1')
    const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(120_000) })
    const d = await r.json() as { data?: { b64_json?: string }[]; error?: { message?: string } }
    const out = d.data?.[0]?.b64_json ?? null
    ok = !!out
    if (!out) console.error('gpt image: nessuna immagine', r.status, d.error?.message ?? JSON.stringify(d).slice(0, 300))
    return out
  } catch (e) {
    console.error('gpt image', e)
    return null
  } finally {
    await logUsage({ userId: o.userId, kind: o.kind ?? 'photo_edit' }, false, Date.now() - t0, {}, ok, MODEL).catch(() => {})
  }
}
