// Casa 3D, pipeline sul server (Vercel, Node): ritaglio della pianta, ridisegno "da CAD" con GPT Image,
// riconoscimento in TypeScript, controllo di Claude sulla sovrapposizione, correzioni. Una pianta per chiamata.
// Tempi misurati (05/10, in locale): ritaglio ~2 s, ridisegno 19 s (60-90 s nel prototipo), riconoscimento 1,5-8 s, controllo 5-15 s.
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import { gptImage } from '@/lib/gptImage'
import { planBox } from '@/lib/planCrop'
import { alignToOriginal, verifyFurniture } from './align'
import { applyFix, applyFurniture, applyLabels, guessRoomTypes } from './build'
import { claudeCheck } from './check'
import { overlayJpeg } from './overlay'
import type { Fix, RawPlan } from './types'
import { vectorizeImage } from './vectorize'
import { readMaterials } from './materials'
import { findOutdoor } from './outdoor'

// prompt severo del prototipo (tools/redraw.mjs, 04/10): la geometria non si tocca, restano solo muri, porte e finestre
export const REDRAW_PROMPT = `Redraw this floor plan as a clean architectural CAD wall plan seen from above. Keep exactly the same geometry, proportions, orientation, position and scale as the input: do not rotate, crop, move, mirror or straighten anything.
Drawing rules:
- Walls: solid pure black filled bands with their real thickness (exterior walls about 30 cm, interior partitions about 10 cm, at the same scale as the plan).
- Windows: the opening in the wall filled with flat light grey (#A0A0A0) across the full wall thickness, no other lines.
- Doors: an empty white gap in the wall, plus a thin black quarter-circle arc showing the door swing.
- Stairs: only thin outline lines.
Remove everything else: no furniture, no beds, no sofas, no tables, no bathroom fixtures (no toilet, sink, shower, bathtub), no kitchen counters, no text, no letters, no numbers, no dimension lines, no arrows, no hatching, no colours, no shadows, no floor textures, no paper texture, no frame or border.
Pure white background. Draw only the main dwelling; keep every wall, door and window of the original and do not add any new ones.`

export type RecognizeResult = {
  raw: RawPlan; crop: Buffer; cad: Buffer; overlay: Buffer; fix: Fix | null
  ms: { ritaglio: number; ridisegno: number; riconoscimento: number; controllo: number; allineamento: number; materiali: number; totale: number }; usd: number
}

export async function recognizeFloor(o: { userId: string; image: Buffer; areaM2?: number; cad?: Buffer; check?: boolean; photos?: string[] }): Promise<RecognizeResult> {
  const T0 = Date.now()
  const ms = { ritaglio: 0, ridisegno: 0, riconoscimento: 0, controllo: 0, allineamento: 0, materiali: 0, totale: 0 }
  let usd = 0
  // 1. solo l'appartamento (catastali con intestazione, timbri, cantina a parte), lato lungo almeno 1536 px
  let crop: Buffer
  if (o.cad) crop = await sharp(o.image).rotate().flatten({ background: '#ffffff' }).png().toBuffer()
  else {
    const t = Date.now()
    const box = await planBox(o.image, o.userId)
    crop = await (box ? sharp(o.image).rotate().extract(box) : sharp(o.image).rotate()).flatten({ background: '#ffffff' }).png().toBuffer()
    ms.ritaglio = Date.now() - t; usd += 0.005
  }
  const meta = await sharp(crop).metadata()
  const long = Math.max(meta.width ?? 0, meta.height ?? 0)
  if (long && long < 1536) crop = await sharp(crop).resize({ width: Math.round((meta.width ?? 0) * 1536 / long), height: Math.round((meta.height ?? 0) * 1536 / long), kernel: 'lanczos3' }).png().toBuffer()
  // 2. ridisegno da CAD (GPT Image a qualita' media, ~0,02 $): stessa misura del ritaglio
  let cad = o.cad
  if (!cad) {
    const t = Date.now()
    const out = await gptImage({ userId: o.userId, image: `data:image/png;base64,${crop.toString('base64')}`, prompt: REDRAW_PROMPT, kind: 'casa3d_ridisegno', quality: 'medium' })
    ms.ridisegno = Date.now() - t
    if (!out) throw new Error('redraw_failed')
    cad = await sharp(Buffer.from(out, 'base64')).png().toBuffer()
    usd += 0.02
  }
  // 3. riconoscimento (niente AI)
  const t3 = Date.now()
  const v = await vectorizeImage(cad, { areaM2: o.areaM2 })
  ms.riconoscimento = Date.now() - t3
  if (!v.plan.rooms.length) throw new Error('no_rooms')
  // 4. controllo di Claude sulla sovrapposizione nello stesso orientamento dell'originale
  const overlay = await overlayJpeg(v.plan, cad)
  let raw = v.plan, fix: Fix | null = null
  if (o.check !== false) {
    try {
      const c = await claudeCheck(crop, overlay, v.plan)
      ms.controllo = c.ms; usd += c.usage.usd
      await logUsage({ userId: o.userId, kind: 'casa3d_controllo' }, false, c.ms, { input: c.usage.input, output: c.usage.output }, true, 'claude-sonnet-5').catch(() => {})
      fix = c.fix
      raw = applyFix(v.plan, c.fix)
    } catch (e) {
      console.error('casa3d controllo', e) // senza controllo si va avanti: l'agente corregge a mano
    }
  }
  // la pianta (fatta sul ridisegno) torna sull'originale: allineamento e aggancio dei muri alle linee vere; poi le scritte
  // dell'originale (posizioni sull'originale, quindi dopo l'allineamento) che vincono sui tipi ipotizzati
  try {
    const ta = Date.now()
    raw = (await alignToOriginal(raw, crop)).raw
    ms.allineamento = Date.now() - ta
  } catch (e) { console.error('casa3d allineamento', e) }
  if (fix?.labels?.length) raw = applyLabels(raw, fix.labels)
  if (fix?.furniture?.length) {
    raw = applyFurniture(raw, fix.furniture) // mobili disegnati: nel 3D al loro posto
    try { raw = (await verifyFurniture(raw, crop)).raw } catch (e) { console.error('casa3d mobili', e) } // solo quelli con inchiostro sull'originale
  }
  // terrazzi e balconi tratteggiati o con la scritta fuori dalle stanze, che il ridisegno ha cancellato
  try { raw = (await findOutdoor(raw, crop)).raw } catch (e) { console.error('casa3d esterni', e) }
  raw = guessRoomTypes(raw)
  // materiali e colori dalle foto dell'immobile (una sola chiamata per casa: il chiamante passa le foto solo al primo piano)
  if (o.photos?.length) {
    const tm = Date.now()
    const m = await readMaterials(o.userId, o.photos)
    ms.materiali = Date.now() - tm
    if (m) { raw = { ...raw, materials: m }; usd += 0.015 }
  } // stanze senza tipo (niente controllo o stanza saltata): tipo ragionevole da confermare
  ms.totale = Date.now() - T0
  return { raw, crop, cad, overlay, fix, ms, usd }
}

// controlli minimi su una pianta che arriva dal browser (schermata di correzione)
export function validRaw(x: unknown): x is RawPlan {
  const p = x as RawPlan
  const pt = (q: unknown) => Array.isArray(q) && q.length === 2 && q.every(v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 500)
  return !!p && typeof p === 'object' && Array.isArray(p.walls) && Array.isArray(p.openings) && Array.isArray(p.rooms) && !!p.source
    && p.walls.length < 600 && p.openings.length < 300 && p.rooms.length < 120
    && p.walls.every(w => pt(w.a) && pt(w.b) && typeof w.t === 'number' && w.t > 0 && w.t < 1.5)
    && p.openings.every(o => pt(o.a) && pt(o.b) && typeof o.t === 'number' && ['door', 'entrance', 'varco', 'window'].includes(o.type))
    && p.rooms.every(r => Number.isInteger(r.id) && typeof r.type === 'string' && r.type.length < 20 && Array.isArray(r.poly) && r.poly.length < 400 && r.poly.every(pt) && pt(r.center) && typeof r.area === 'number')
}
