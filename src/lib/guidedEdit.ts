import sharp from 'sharp'
import { runJob } from '@/lib/runpodImage'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/lib/ai'
import { editPlanPrompt, leftoverPrompt, removePrompt, removeInBoxPrompt, addFurniturePrompt, type EditPlan, type Box, type Zone } from '@/lib/stagingPrompts'

// Svuota, arreda e modifiche guidate da un piano del modello di visione. Qwen da solo non distingue fisso da mobile e inventa le cose nominate che non ci
// sono; sostituire i mobili in un colpo gli faceva reinventare la stanza (27/09). Quindi:
//   1. Claude (Opus) guarda la foto originale: cosa togliere (raggruppato per zona), cosa tenere, cosa rinnovare, cosa aggiungere e dove
//   2. Qwen toglie; Claude (Sonnet) controlla cosa e' rimasto e, se serve, secondo passaggio con la lista corta
//   3. (arredo) Qwen rinnova i fissi (es. ante della cucina) e aggiunge i pezzi nella stanza vuota
// Senza piano (il modello non risponde) torna image vuota: chi chiama usa il vecchio passaggio unico.
export async function guidedEdit(o: { userId: string; input: { image_base64: string } | { image_url: string }; reference?: string; task: 'empty' | 'furnish' | 'edit'; room: string; style: string; seed: number; planModel?: string }): Promise<{ image?: string; prompt?: string; plan?: EditPlan }> {
  const orig = 'image_base64' in o.input
    ? o.input.image_base64.split(',').pop() ?? ''
    : Buffer.from(await (await fetch(o.input.image_url, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')
  // foto reale di partenza (se questa e' gia' un risultato, es. dopo "Svuota"): il piano sa che stanza era e cosa c'era di fisso
  const ref = o.reference ? await toB64(o.reference) : null
  const plan = parsePlan(await askJson(o.userId, ref ? [ref, orig] : [orig], (ref ? REFERENCE_NOTE : '') + editPlanPrompt(o.room, o.task, o.style), o.planModel))
  // il modello a volte mette tra le cose da togliere la cucina, il forno o le pareti (27/09: cucina sostituita da un'isola):
  // i fissi non si tolgono mai, salvo "gli oggetti sopra" (quelli si' che vanno via); cambiarli e' compito di restyle
  // si guarda solo l'oggetto (prima di "on/in/against/near..."), non la posizione: "il divano sul lato sinistro del pavimento" va tolto
  const head = (r: string) => r.split(/\b(?:on|in|at|against|near|next to|by|under|beside|along|behind|to the|from|of the room)\b/i)[0]
  // "Svuota" toglie anche la cucina (stanza nuda): li' si blocca solo l'architettura
  // richiesta scritta ("togli la vasca"): si toglie cio' che chiede, niente filtro
  if (o.task !== 'edit') plan.remove = plan.remove.filter(r => !(o.task === 'empty' ? ARCH : FIXED).test(head(r)) || ON_TOP.test(head(r)))
  if (!plan.remove.length && !plan.add.length && !plan.restyle.length && !Object.values(plan.surfaces ?? {}).some(Boolean)) return {}
  let cur = orig, prompt = ''
  if (plan.remove.length) {
    prompt = removePrompt(plan)
    const r = await runJob({ image_base64: `data:image/jpeg;base64,${orig}`, prompt, seed: o.seed, steps: 12 })
    if (!r.output?.image_base64) return {}
    cur = r.output.image_base64
    // controllo (Opus) di cosa e' rimasto, con il riquadro di ogni oggetto; poi un passaggio per oggetto solo dentro
    // il suo riquadro (mark nel worker: fuori resta la foto). Al massimo 2 giri.
    // arredo: un giro solo (i mobili coprono il resto); svuota: due
    for (let k = 0; k < (o.task === 'empty' ? 2 : 1); k++) {
      // prima i piu' grandi: con 4 per giro prendeva un cappellino e lasciava tavolo e sedia (27/09)
      const left = parseLeft(await askJson(o.userId, [orig, cur], leftoverPrompt(plan.remove), FAST)).sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h).slice(0, 4)
      if (!left.length) break
      // oggetti grandi (>10% della foto): passaggio su tutta la foto con la lista corta (nel riquadro il modello riempie
      // con macchie sfocate: cucina e penisola, 27/09). Riquadro solo per gli oggetti piccoli.
      const big = left.filter(it => it.box.w * it.box.h > 0.1), small = left.filter(it => it.box.w * it.box.h <= 0.1)
      if (big.length) {
        prompt = removePrompt({ remove: big.map(it => it.what), keep: plan.keep })
        const r = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, seed: o.seed + 10 * (k + 1), steps: 12 })
        if (r.output?.image_base64) cur = r.output.image_base64
      }
      for (const [n, it] of small.entries()) {
        prompt = removeInBoxPrompt(it.what)
        const r = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, mark: it.box, seed: o.seed + 10 * (k + 1) + n + 1, steps: 12 })
        if (r.output?.image_base64) cur = await blendBox(cur, r.output.image_base64, it.box)
      }
    }
  }
  if (o.task !== 'empty' && (plan.add.length || plan.restyle.length || Object.values(plan.surfaces ?? {}).some(Boolean))) {
    // un passaggio sulla stanza vuota con la sua mappa di profondita' come guida: la struttura resta (prova del 27/09:
    // tiene finestre, porte, pareti e inquadratura meglio del solo testo e dei riquadri)
    prompt = addFurniturePrompt(plan)
    const a = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, control: 'depth', seed: o.seed + 1, steps: 12 })
    if (!a.output?.image_base64) return {}
    cur = a.output.image_base64
  }
  return { image: cur, prompt, plan }
}

// controlli semplici (cosa e' rimasto, stanza uguale?): modello veloce; il piano resta a Opus
const FAST = 'claude-haiku-4-5-20251001'

const REFERENCE_NOTE = `Image 1 is the ORIGINAL photo of this room, as it really is. Image 2 is the current photo, already edited before (for example emptied): plan the edit on image 2, but it is the same room with the same purpose. If image 1 has fixed elements that image 2 lost (a fitted kitchen, bathroom fixtures, a TV wall unit), and the task is to furnish or restage, add them back in the same place in the style. Room type is decided by image 1.\n\n`
async function toB64(src: string): Promise<string> {
  return src.startsWith('data:') ? src.split(',').pop() ?? '' : Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')
}

// Fissi che non si tolgono mai (solo gli oggetti sopra): vedi il filtro in guidedEdit
const FIXED = /\b(kitchen|cabinets?|cupboards?|worktop|countertop|counter|backsplash|splashback|stove|hob|oven|hood|sink|tap|island|peninsula|appliances?|fridge|refrigerator|dishwasher|walls?|half[- ]wall|pillar|ceiling|windows?|doors?|radiators?|wardrobes?|built[- ]in|floor|tiles|curtains?|shelves|toilet|wc|bidet|wash ?basin|basin|vanity|shower|bath ?tub|sanitary)\b/i
// "Svuota" = stanza nuda (anche cucina e sanitari del bagno): si blocca solo l'architettura
const ARCH = /\b(walls?|half[- ]wall|pillar|ceiling|windows?|doors?|radiators?|wardrobes?|floor|tiles|curtains?)\b/i
// eccezione: l'oggetto stesso sono "gli oggetti / il disordine" (sopra un fisso), non la posizione ("sulla sinistra")
const ON_TOP = /\b(items?|objects?|things|clutter|everything|accessories)\b/i

// Claude guarda la foto (o originale + risultato) e risponde in JSON. Opus per il piano, Sonnet per il controllo.
// Il nostro modello (qwen-analisi) e' stato provato il 27/09: liste incoerenti (su 4 prove una sola completa), scartato.
// Errore = liste vuote (la richiesta non si blocca: chi chiama ripiega sul passaggio unico).
async function askJson(userId: string, imagesB64: string[], text: string, model = 'claude-opus-5-5'): Promise<Record<string, unknown>> {
  const t0 = Date.now()
  try {
    const imgs = await Promise.all(imagesB64.map(async b => (await sharp(Buffer.from(b, 'base64')).resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()).toString('base64')))
    const msg = await new Anthropic().messages.create({
      model, max_tokens: 4000,
      messages: [{ role: 'user', content: [...imgs.map(data => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } })), { type: 'text', text }] }],
      // Opus 5.5 ragiona di nascosto (~900 token di thinking a piano, pagati come uscita): con effort basso niente
      // ragionamento, piano uguale (prova del 27/09), costo dimezzato
      ...(model.startsWith('claude-opus') ? { output_config: { effort: 'low' } } : {}),
    } as Anthropic.MessageCreateParamsNonStreaming) as Anthropic.Message
    await logUsage({ userId, kind: 'staging_plan' }, false, Date.now() - t0, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, model)
    const txt = msg.content.find(c => c.type === 'text')?.text ?? ''
    return JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  } catch (e) {
    console.error('staging plan', e)
    return {}
  }
}
const list = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string').slice(0, 12) : [])
const str = (x: unknown) => (typeof x === 'string' ? x.trim().slice(0, 300) : '')
const parsePlan = (r: Record<string, unknown>): EditPlan => {
  const s = (r.surfaces ?? {}) as Record<string, unknown>
  return { remove: list(r.remove), keep: list(r.keep), restyle: zones(r.restyle), add: zones(r.add), surfaces: { floor: str(s.floor), ceiling: str(s.ceiling), walls: str(s.walls) } }
}
// zone {what, box}; accetta anche stringhe (senza riquadro: si ripiega sul passaggio unico)
function zones(x: unknown): Zone[] {
  if (!Array.isArray(x)) return []
  return x.slice(0, 6).flatMap((it): Zone[] => typeof it === 'string' ? [{ what: it }] : typeof it?.what === 'string' ? [{ what: it.what, box: toBox(it.box, 0.03) }] : [])
}
// riquadro valido 0..1, allargato di pad per lato e tenuto dentro la foto
function toBox(b: { x?: unknown; y?: unknown; w?: unknown; h?: unknown } | undefined, pad: number): Box | undefined {
  if (!b || ![b.x, b.y, b.w, b.h].every(v => typeof v === 'number' && v >= 0 && v <= 1)) return undefined
  const [bx, by, bw, bh] = [b.x, b.y, b.w, b.h] as number[]
  if (bw < 0.02 || bh < 0.02) return undefined
  const x = Math.max(0, bx - pad), y = Math.max(0, by - pad)
  return { x, y, w: Math.min(1 - x, bw + 2 * pad), h: Math.min(1 - y, bh + 2 * pad) }
}
// oggetti rimasti con riquadro valido (0..1, allargato del 4% per lato e tenuto dentro la foto)
function parseLeft(r: Record<string, unknown>): { what: string; box: Box }[] {
  if (!Array.isArray(r.left)) return []
  return r.left.flatMap(it => {
    const what = typeof it?.what === 'string' ? it.what : '', box = toBox(it?.box, 0.04)
    return what && box ? [{ what, box }] : []
  })
}

// Incolla il risultato di un passaggio nel riquadro sulla foto di prima senza che si veda: il modello cambia un po' la luce
// dentro il riquadro (rettangolo piu' chiaro a meta' foto, 27/09). Si pareggia colore e luminosita' su una cornice interna
// del riquadro e si sfuma il bordo, fuori resta la foto di prima.
async function blendBox(prevB64: string, outB64: string, box: Box): Promise<string> {
  const prev = sharp(Buffer.from(prevB64, 'base64'))
  const { width: W = 0, height: H = 0 } = await prev.metadata()
  if (!W || !H) return outB64
  const [a, b] = await Promise.all([prev.removeAlpha().raw().toBuffer(), sharp(Buffer.from(outB64, 'base64')).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer()])
  const x0 = Math.round(box.x * W), y0 = Math.round(box.y * H), x1 = Math.min(W, Math.round((box.x + box.w) * W)), y1 = Math.min(H, Math.round((box.y + box.h) * H))
  const ring = Math.max(4, Math.round(Math.min(x1 - x0, y1 - y0) * 0.08)), feather = Math.max(6, Math.round(Math.min(x1 - x0, y1 - y0) * 0.12))
  const sa = [0, 0, 0], sb = [0, 0, 0]; let n = 0
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (Math.min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y) >= ring) continue
    const i = (y * W + x) * 3
    for (let c = 0; c < 3; c++) { sa[c] += a[i + c]; sb[c] += b[i + c] }
    n++
  }
  const gain = sa.map((v, c) => (n && sb[c] ? Math.min(1.25, Math.max(0.8, v / sb[c])) : 1))
  const res = Buffer.from(a)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const f = Math.min(1, Math.min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y) / feather)
    const i = (y * W + x) * 3
    for (let c = 0; c < 3; c++) res[i + c] = Math.round(a[i + c] * (1 - f) + Math.min(255, b[i + c] * gain[c]) * f)
  }
  return (await sharp(res, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toBuffer()).toString('base64')
}
