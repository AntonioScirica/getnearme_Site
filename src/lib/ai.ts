import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { AI_MOCK, mockDelay, mockFor } from './aiMock'

// Unico punto di accesso all'AI della piattaforma (describe, analyze): Claude, output sempre JSON
// validato dallo schema. (RunPod tolto il 28/09: niente piu' modelli self-hosted.)
//
// Ogni chiamata viene registrata in ai_usage (utente, tipo, durata, costo stimato = token x listino).

export type JsonSchema = Record<string, unknown>

type Args = { system: string; text: string; images?: string[]; schema: JsonSchema; maxTokens?: number; usage: { userId: string; kind: string } }
type Tokens = { input?: number; output?: number }
type Result<T> = { ok: true; data: T } | { ok: false; error: 'refused' | 'empty' | 'failed'; detail?: string }

export async function generateJson<T>(args: Args): Promise<Result<T>> {
  if (AI_MOCK) { await mockDelay(); return { ok: true, data: mockFor<T>(args.usage.kind) } } // niente costi, niente log
  const t0 = Date.now()
  const tokens: Tokens = {}
  const r = await viaClaude<T>(args, tokens)
  await logUsage(args.usage, false, Date.now() - t0, tokens, r.ok)
  return r
}

// prezzi per milione di token (listino Anthropic, verificato il 27/09/2026); modello non in tabella = Opus 5
const CLAUDE_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
}
let admin: ReturnType<typeof createClient> | null = null

// il secondo parametro (ex RunPod) non si usa piu': resta per non toccare i chiamanti
export async function logUsage(u: Args['usage'], _gpu: boolean, ms: number, tk: Tokens, ok: boolean, model?: string) {
  const gemini = !!model?.startsWith('gemini-')
  const openai = !!model?.startsWith('gpt-image')
  const cost = model?.endsWith('-free') ? 0 // quota gratuita di Gemini (lib/geminiFree)
    : openai
    ? (ok ? ({ low: 0.014, medium: 0.020, high: 0.06 }[u.kind === 'arreda' ? (process.env.GPT_IMAGE_QUALITY || 'low') : (process.env.GPT_EDIT_QUALITY || 'low')] ?? 0.02) : 0) // GPT Image 2.5 Sunburst, modifica di una foto 1536x1024: misurato dal campo usage il 28/09/2026 (bassa 0,014, media 0,020)
    : gemini
    ? (ok ? (model!.includes('lite') ? 0.034 : 0.067) : 0) // Nano Banana 2 / Lite a 1K: prezzo per immagine (listino Google, 27/09/2026)
    : (p => ((tk.input ?? 0) * p.input + (tk.output ?? 0) * p.output) / 1e6)(CLAUDE_USD_PER_MTOK[model ?? ''] ?? CLAUDE_USD_PER_MTOK['claude-opus-5'])
  try {
    admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await admin.from('ai_usage').insert({
      user_id: u.userId || null, kind: u.kind, // null = prova anonima dalla landing
      provider: gemini ? 'google' : openai ? 'openai' : 'anthropic',
      model: model ?? 'claude-opus-5',
      input_tokens: tk.input ?? null, output_tokens: tk.output ?? null,
      duration_ms: ms, cost_usd: Number(cost.toFixed(6)), ok,
    } as never)
  } catch (e) {
    console.error('ai_usage log failed:', e) // il tracciamento non deve mai bloccare la risposta
  }
}

let anthropic: Anthropic | null = null
async function viaClaude<T>({ system, text, images = [], schema, maxTokens = 8000 }: Args, tokens: Tokens): Promise<Result<T>> {
  anthropic ??= new Anthropic()
  const ask = (withPhotos: boolean) => anthropic!.messages.create({
    model: 'claude-opus-5',
    max_tokens: maxTokens,
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{
      role: 'user',
      content: [
        ...(withPhotos ? images.map(url => ({ type: 'image' as const, source: { type: 'url' as const, url } })) : []),
        { type: 'text' as const, text: withPhotos ? text : `${text}\n(Foto non disponibili per l'analisi.)` },
      ],
    }],
  })
  try {
    let res
    try {
      res = await ask(images.length > 0)
    } catch (e) {
      if (!(e instanceof Anthropic.BadRequestError) || !images.length) throw e
      res = await ask(false)
    }
    tokens.input = res.usage.input_tokens
    tokens.output = res.usage.output_tokens
    if (res.stop_reason === 'refusal') return { ok: false, error: 'refused' }
    const block = res.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') return { ok: false, error: 'empty' }
    return { ok: true, data: JSON.parse(block.text) }
  } catch (e) {
    return { ok: false, error: 'failed', detail: String(e) }
  }
}
