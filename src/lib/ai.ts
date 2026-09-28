import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { AI_MOCK, mockDelay, mockFor } from './aiMock'

// Unico punto di accesso all'AI della piattaforma (describe, analyze).
// Con AI_BASE_URL impostato (endpoint vLLM su RunPod, API compatibile OpenAI) usa il
// modello self-hosted: nessun costo per chiamata. Senza, ripiega su Claude finche'
// l'endpoint non e' pronto. Output sempre JSON validato dallo schema.
//
// Env: AI_BASE_URL (es. https://api.runpod.ai/v2/<endpoint>/openai/v1)
//      AI_MODEL    (es. Qwen/Qwen3-VL-32B-Instruct-AWQ)
//      AI_API_KEY  (RunPod API key)
//      AI_GPU_USD_PER_HOUR (tariffa GPU serverless dell'endpoint, default 1.22 = fascia 48GB)
//
// Ogni chiamata viene registrata in ai_usage (utente, tipo, durata, costo stimato):
// su RunPod costo = durata reale (avvio incluso) x tariffa GPU; su Claude = token x listino.

export type JsonSchema = Record<string, unknown>

type Args = { system: string; text: string; images?: string[]; schema: JsonSchema; maxTokens?: number; usage: { userId: string; kind: string } }
type Tokens = { input?: number; output?: number }
type Result<T> = { ok: true; data: T } | { ok: false; error: 'refused' | 'empty' | 'failed'; detail?: string }

export async function generateJson<T>(args: Args): Promise<Result<T>> {
  if (AI_MOCK) { await mockDelay(); return { ok: true, data: mockFor<T>(args.usage.kind) } } // niente costi, niente log
  const runpod = !!process.env.AI_BASE_URL
  const t0 = Date.now()
  const tokens: Tokens = {}
  const r = runpod ? await viaOpenAiCompat<T>(args, tokens) : await viaClaude<T>(args, tokens)
  await logUsage(args.usage, runpod, Date.now() - t0, tokens, r.ok)
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

export async function logUsage(u: Args['usage'], runpod: boolean, ms: number, tk: Tokens, ok: boolean, model?: string) {
  const gpuPerHour = Number(process.env.AI_GPU_USD_PER_HOUR) || 1.22
  const gemini = !!model?.startsWith('gemini-')
  const cost = model?.endsWith('-free') ? 0 // quota gratuita di Gemini (lib/geminiFree)
    : gemini
    ? (ok ? (model!.includes('lite') ? 0.034 : 0.067) : 0) // Nano Banana 2 / Lite a 1K: prezzo per immagine (listino Google, 27/09/2026)
    : runpod
    ? (ms / 3_600_000) * gpuPerHour
    : (p => ((tk.input ?? 0) * p.input + (tk.output ?? 0) * p.output) / 1e6)(CLAUDE_USD_PER_MTOK[model ?? ''] ?? CLAUDE_USD_PER_MTOK['claude-opus-5'])
  try {
    admin ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await admin.from('ai_usage').insert({
      user_id: u.userId || null, kind: u.kind, // null = prova anonima dalla landing
      provider: gemini ? 'google' : runpod ? 'runpod' : 'anthropic',
      model: model ?? (runpod ? process.env.AI_MODEL : 'claude-opus-5'),
      input_tokens: tk.input ?? null, output_tokens: tk.output ?? null,
      duration_ms: ms, cost_usd: Number(cost.toFixed(6)), ok,
    } as never)
  } catch (e) {
    console.error('ai_usage log failed:', e) // il tracciamento non deve mai bloccare la risposta
  }
}

// vLLM / RunPod: chat completions + response_format json_schema (guided decoding).
async function viaOpenAiCompat<T>({ system, text, images = [], schema, maxTokens = 8000 }: Args, tokens: Tokens): Promise<Result<T>> {
  const body = {
    model: process.env.AI_MODEL,
    max_tokens: maxTokens,
    temperature: 0.3,
    response_format: { type: 'json_schema', json_schema: { name: 'output', schema, strict: true } },
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          ...images.map(url => ({ type: 'image_url', image_url: { url } })),
          { type: 'text', text },
        ],
      },
    ],
  }
  const call = async (b: typeof body) => fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY ?? ''}` },
    body: JSON.stringify(b),
    signal: AbortSignal.timeout(300_000), // ponytail: analisi lunghe su Qwen; in produzione (maxDuration 60) servira' un job asincrono
  })
  try {
    let res = await call(body)
    // Il CDN del portale puo' rifiutare il download delle immagini: riprova solo testo.
    if (!res.ok && images.length) res = await call({ ...body, messages: [body.messages[0], { role: 'user', content: [{ type: 'text', text: `${text}\n(Foto non disponibili per l'analisi.)` }] }] })
    if (!res.ok) return { ok: false, error: 'failed', detail: `${res.status} ${(await res.text()).slice(0, 300)}` }
    const json = await res.json()
    tokens.input = json.usage?.prompt_tokens
    tokens.output = json.usage?.completion_tokens
    const content = json.choices?.[0]?.message?.content
    if (!content) return { ok: false, error: 'empty' }
    return { ok: true, data: JSON.parse(stripThinking(content)) }
  } catch (e) {
    return { ok: false, error: 'failed', detail: String(e) }
  }
}

// I modelli Qwen "thinking" possono anteporre <think>...</think> al JSON.
const stripThinking = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

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
