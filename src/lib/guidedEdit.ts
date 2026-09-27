import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { runJob } from '@/lib/runpodImage'
import { logUsage } from '@/lib/ai'
import { editPlanPrompt, leftoverPrompt, removePrompt, addFurniturePrompt, type EditPlan } from '@/lib/stagingPrompts'

// Svuota e arreda guidati da Claude. Qwen da solo non distingue fisso da mobile e inventa le cose nominate che non ci
// sono; sostituire i mobili in un colpo gli faceva reinventare la stanza (27/09). Quindi:
//   1. Claude guarda la foto originale: cosa togliere (raggruppato per zona), cosa tenere, cosa rinnovare, cosa aggiungere e dove
//   2. Qwen toglie; Claude controlla cosa e' rimasto e, se serve, secondo passaggio con la lista corta
//   3. (arredo) Qwen rinnova i fissi (es. ante della cucina) e aggiunge i pezzi nella stanza vuota
// Senza piano (Claude non risponde) torna image vuota: chi chiama usa il vecchio passaggio unico.
export async function guidedEdit(o: { userId: string; input: { image_base64: string } | { image_url: string }; task: 'empty' | 'furnish'; room: string; style: string; seed: number }): Promise<{ image?: string; prompt?: string; plan?: EditPlan }> {
  const orig = 'image_base64' in o.input
    ? o.input.image_base64.split(',').pop() ?? ''
    : Buffer.from(await (await fetch(o.input.image_url, { signal: AbortSignal.timeout(20_000) })).arrayBuffer()).toString('base64')
  const plan = await ask(o.userId, [orig], editPlanPrompt(o.room, o.task, o.style))
  if (!plan.remove.length && !plan.add.length) return {}
  let cur = orig, prompt = ''
  if (plan.remove.length) {
    prompt = removePrompt(plan)
    const r = await runJob({ image_base64: `data:image/jpeg;base64,${orig}`, prompt, seed: o.seed, steps: 12 })
    if (!r.output?.image_base64) return {}
    cur = r.output.image_base64
    // controllo (Sonnet: lavoro semplice, piu' veloce) e fino a 2 passaggi sulla lista corta di cio' che e' rimasto
    for (let k = 0; k < 2; k++) {
      const left = (await ask(o.userId, [orig, cur], leftoverPrompt(plan.remove), 'claude-sonnet-5')).left ?? []
      if (!left.length) break
      prompt = removePrompt({ remove: left, keep: plan.keep })
      const again = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, seed: o.seed + 2 + k, steps: 12 })
      if (!again.output?.image_base64) break
      cur = again.output.image_base64
    }
  }
  if (o.task === 'furnish' && (plan.add.length || plan.restyle.length)) {
    prompt = addFurniturePrompt(plan)
    const a = await runJob({ image_base64: `data:image/jpeg;base64,${cur}`, prompt, seed: o.seed + 1, steps: 12 })
    if (!a.output?.image_base64) return {}
    cur = a.output.image_base64
  }
  return { image: cur, prompt, plan }
}

// Claude guarda la foto (o originale + risultato) e risponde in JSON. Errore = liste vuote (la richiesta non si blocca).
async function ask(userId: string, imagesB64: string[], text: string, model = 'claude-opus-5-5'): Promise<EditPlan & { left?: string[] }> {
  const t0 = Date.now()
  try {
    const imgs = await Promise.all(imagesB64.map(async b => (await sharp(Buffer.from(b, 'base64')).resize({ width: 1024, height: 1024, fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()).toString('base64')))
    const msg = await new Anthropic().messages.create({
      model, max_tokens: 4000,
      messages: [{ role: 'user', content: [...imgs.map(data => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data } })), { type: 'text', text }] }],
    })
    await logUsage({ userId, kind: 'staging_plan' }, false, Date.now() - t0, { input: msg.usage.input_tokens, output: msg.usage.output_tokens }, true, model)
    const txt = msg.content.find(c => c.type === 'text')?.text ?? ''
    const r = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1))
    const list = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string').slice(0, 12) : [])
    return { remove: list(r.remove), keep: list(r.keep), restyle: list(r.restyle), add: list(r.add), left: list(r.left) }
  } catch (e) {
    console.error('staging plan', e)
    return { remove: [], keep: [], restyle: [], add: [], left: [] }
  }
}
