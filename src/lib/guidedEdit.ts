import sharp from 'sharp'
import { runJob } from '@/lib/runpodImage'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/lib/ai'
import { editPlanPrompt, leftoverPrompt, removePrompt, removeInBoxPrompt, addFurniturePrompt, type EditPlan } from '@/lib/stagingPrompts'

// Svuota, arreda e modifiche guidate da un piano del modello di visione. Qwen da solo non distingue fisso da mobile e inventa le cose nominate che non ci
// sono; sostituire i mobili in un colpo gli faceva reinventare la stanza (27/09). Quindi:
//   1. Claude (Opus) guarda la foto originale: cosa togliere (raggruppato per zona), cosa tenere, cosa rinnovare, cosa aggiungere e dove
//   2. Qwen toglie; Claude (Sonnet) controlla cosa e' rimasto e, se serve, secondo passaggio con la lista corta
//   3. (arredo) Qwen rinnova i fissi (es. ante della cucina) e aggiunge i pezzi nella stanza vuota
// Senza piano (il modello non risponde) torna image vuota: chi chiama usa il vecchio passaggio unico.
export async function guidedEdit(o: { userId: string; input: { image_base64: string } | { image_url: string }; task: 'empty' | 'furnish' | 'edit'; room: string; style: string; seed: number }): Promise<{ image?: string; prompt?: string; plan?: EditPlan }> {
  const orig = 'image_base64' in o.input
    ? o.input.image_base64.split(',').pop() ?? ''
    : Buffer.from(await (await fetch(o.input.image_url, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')
  const plan = parsePlan(await askJson(o.userId, [orig], editPlanPrompt(o.room, o.task, o.style)))
  // il modello a volte mette tra le cose da togliere la cucina, il forno o le pareti (27/09: cucina sostituita da un'isola):
  // i fissi non si tolgono mai, salvo "gli oggetti sopra" (quelli si' che vanno via); cambiarli e' compito di restyle
  // si guarda solo l'oggetto (prima di "on/in/against/near..."), non la posizione: "il divano sul lato sinistro del pavimento" va tolto
  const head = (r: string) => r.split(/\b(?:on|in|at|against|near|next to|by|under|beside|along|behind|to the|from|of the room)\b/i)[0]
  // "Svuota" toglie anche la cucina (stanza nuda): li' si blocca solo l'architettura
  plan.remove = plan.remove.filter(r => !(o.task === 'empty' ? ARCH : FIXED).test(head(r)) || ON_TOP.test(head(r)))
  if (!plan.remove.length && !plan.add.length && !plan.restyle.length) return {}
  let cur = orig, prompt = ''
  if (plan.remove.length) {
    prompt = removePrompt(plan)
    const r = await runJob({ image_base64: `data:image/jpeg;base64,${orig}`, prompt, seed: o.seed, steps: 12 })
    if (!r.output?.image_base64) return {}
    cur = r.output.image_base64
    // controllo (Opus) di cosa e' rimasto, con il riquadro di ogni oggetto; poi un passaggio per oggetto solo dentro
    // il suo riquadro (mark nel worker: fuori resta la foto). Al massimo 2 giri.
    for (let k = 0; k < 2; k++) {
      const left = parseLeft(await askJson(o.userId, [orig, cur], leftoverPrompt(plan.remove))).slice(0, 4)
      if (!left.length) break
      for (const [n, it] of left.entries()) {
        prompt = removeInBoxPrompt(it.what)
        const r = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, mark: it.box, seed: o.seed + 10 * (k + 1) + n, steps: 12 })
        if (r.output?.image_base64) cur = r.output.image_base64
      }
    }
  }
  if (o.task !== 'empty' && (plan.add.length || plan.restyle.length)) {
    prompt = addFurniturePrompt(plan)
    const a = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, seed: o.seed + 1, steps: 12 }) // 28 passaggi: piu' dettaglio ma allarga l'inquadratura (27/09)
    if (!a.output?.image_base64) return {}
    cur = a.output.image_base64
  }
  return { image: cur, prompt, plan }
}

// Fissi che non si tolgono mai (solo gli oggetti sopra): vedi il filtro in guidedEdit
const FIXED = /\b(kitchen|cabinets?|cupboards?|worktop|countertop|counter|backsplash|splashback|stove|hob|oven|hood|sink|tap|island|peninsula|appliances?|fridge|refrigerator|dishwasher|walls?|half[- ]wall|pillar|ceiling|windows?|doors?|radiators?|wardrobes?|built[- ]in|floor|tiles|curtains?|shelves|toilet|wc|bidet|wash ?basin|basin|vanity|shower|bath ?tub|sanitary)\b/i
// architettura + sanitari: non si tolgono mai, nemmeno con "Svuota" (in bagno vanno via solo gli oggetti)
const ARCH = /\b(walls?|half[- ]wall|pillar|ceiling|windows?|doors?|radiators?|wardrobes?|floor|tiles|curtains?|toilet|wc|bidet|wash ?basin|basin|vanity|shower|bath ?tub|sanitary)\b/i
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
    })
    await logUsage({ userId, kind: 'staging_plan' }, false, Date.now() - t0, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, model)
    const txt = msg.content.find(c => c.type === 'text')?.text ?? ''
    return JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
  } catch (e) {
    console.error('staging plan', e)
    return {}
  }
}
const list = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string').slice(0, 12) : [])
const parsePlan = (r: Record<string, unknown>): EditPlan => ({ remove: list(r.remove), keep: list(r.keep), restyle: list(r.restyle), add: list(r.add) })
// oggetti rimasti con riquadro valido (0..1, allargato del 4% per lato e tenuto dentro la foto)
function parseLeft(r: Record<string, unknown>): { what: string; box: { x: number; y: number; w: number; h: number } }[] {
  if (!Array.isArray(r.left)) return []
  return r.left.flatMap(it => {
    const b = it?.box, what = typeof it?.what === 'string' ? it.what : ''
    if (!what || !b || ![b.x, b.y, b.w, b.h].every((v: unknown) => typeof v === 'number' && v >= 0 && v <= 1) || b.w < 0.02 || b.h < 0.02) return []
    const x = Math.max(0, b.x - 0.04), y = Math.max(0, b.y - 0.04)
    return [{ what, box: { x, y, w: Math.min(1 - x, b.w + 0.08), h: Math.min(1 - y, b.h + 0.08) } }]
  })
}
