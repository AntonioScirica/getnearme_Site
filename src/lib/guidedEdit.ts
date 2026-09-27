import sharp from 'sharp'
import { runJob } from '@/lib/runpodImage'
import { generateJson } from '@/lib/ai'
import { editPlanPrompt, leftoverPrompt, removePrompt, addFurniturePrompt, type EditPlan } from '@/lib/stagingPrompts'

// Svuota, arreda e modifiche guidate da un piano del modello di visione. Qwen da solo non distingue fisso da mobile e inventa le cose nominate che non ci
// sono; sostituire i mobili in un colpo gli faceva reinventare la stanza (27/09). Quindi:
//   1. il modello di visione guarda la foto originale: cosa togliere (raggruppato per zona), cosa tenere, cosa rinnovare, cosa aggiungere e dove
//   2. Qwen toglie; il modello di visione controlla cosa e' rimasto e, se serve, secondo passaggio con la lista corta
//   3. (arredo) Qwen rinnova i fissi (es. ante della cucina) e aggiunge i pezzi nella stanza vuota
// Senza piano (il modello non risponde) torna image vuota: chi chiama usa il vecchio passaggio unico.
export async function guidedEdit(o: { userId: string; input: { image_base64: string } | { image_url: string }; task: 'empty' | 'furnish' | 'edit'; room: string; style: string; seed: number }): Promise<{ image?: string; prompt?: string; plan?: EditPlan }> {
  const orig = 'image_base64' in o.input
    ? o.input.image_base64.split(',').pop() ?? ''
    : Buffer.from(await (await fetch(o.input.image_url, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')
  const plan = await ask(o.userId, [orig], editPlanPrompt(o.room, o.task, o.style))
  // il modello a volte mette tra le cose da togliere la cucina, il forno o le pareti (27/09: cucina sostituita da un'isola):
  // i fissi non si tolgono mai, salvo "gli oggetti sopra" (quelli si' che vanno via); cambiarli e' compito di restyle
  // si guarda solo l'oggetto (prima di "on/in/against/near..."), non la posizione: "il divano sul lato sinistro del pavimento" va tolto
  const head = (r: string) => r.split(/\b(?:on|in|at|against|near|next to|by|under|beside|along|behind|to the|from|of the room)\b/i)[0]
  plan.remove = plan.remove.filter(r => !FIXED.test(head(r)) || ON_TOP.test(r))
  if (!plan.remove.length && !plan.add.length && !plan.restyle.length) return {}
  let cur = orig, prompt = ''
  if (plan.remove.length) {
    prompt = removePrompt(plan)
    const r = await runJob({ image_base64: `data:image/jpeg;base64,${orig}`, prompt, seed: o.seed, steps: 12 })
    if (!r.output?.image_base64) return {}
    cur = r.output.image_base64
    // controllo e fino a 2 passaggi sulla lista corta di cio' che e' rimasto
    for (let k = 0; k < 2; k++) {
      const left = (await ask(o.userId, [orig, cur], leftoverPrompt(plan.remove))).left ?? []
      if (!left.length) break
      prompt = removePrompt({ remove: left, keep: plan.keep })
      const again = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, seed: o.seed + 2 + k, steps: 12 })
      if (!again.output?.image_base64) break
      cur = again.output.image_base64
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

// Il nostro modello di visione (qwen-analisi su RunPod, via generateJson: niente Claude, niente costi a token) guarda la foto
// (o originale + risultato) e risponde in JSON con le liste. Errore = liste vuote (la richiesta non si blocca).
const FIXED = /\b(kitchen|cabinets?|cupboards?|worktop|countertop|counter|backsplash|splashback|stove|hob|oven|hood|sink|tap|island|peninsula|appliances?|fridge|refrigerator|dishwasher|walls?|half[- ]wall|pillar|ceiling|windows?|doors?|radiators?|wardrobes?|built[- ]in|floor|tiles|curtains?|shelves)\b/i
const ON_TOP = /\b(items?|objects?|things|clutter|on (the|top)|above)\b/i
const LIST = { type: 'array', items: { type: 'string' } }
const SCHEMA = { type: 'object', additionalProperties: false, required: ['remove', 'keep', 'restyle', 'add', 'left'], properties: { remove: LIST, keep: LIST, restyle: LIST, add: LIST, left: LIST } }
async function ask(userId: string, imagesB64: string[], text: string): Promise<EditPlan & { left?: string[] }> {
  const empty = { remove: [], keep: [], restyle: [], add: [], left: [] }
  try {
    const images = await Promise.all(imagesB64.map(async b => `data:image/jpeg;base64,${(await sharp(Buffer.from(b, 'base64')).resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()).toString('base64')}`))
    const r = await generateJson<EditPlan & { left: string[] }>({
      system: 'You plan edits of real estate photos for an AI image editor. Answer only with the JSON asked. Fields not requested are empty lists.',
      text, images, schema: SCHEMA, maxTokens: 2000, usage: { userId, kind: 'staging_plan' },
    })
    if (!r.ok) { console.error('staging plan', r.error, r.detail); return empty }
    const list = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string').slice(0, 12) : [])
    return { remove: list(r.data.remove), keep: list(r.data.keep), restyle: list(r.data.restyle), add: list(r.data.add), left: list(r.data.left) }
  } catch (e) {
    console.error('staging plan', e)
    return empty
  }
}
