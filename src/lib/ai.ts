import Anthropic from '@anthropic-ai/sdk'

// Unico punto di accesso all'AI della piattaforma (describe, analyze).
// Con AI_BASE_URL impostato (endpoint vLLM su RunPod, API compatibile OpenAI) usa il
// modello self-hosted: nessun costo per chiamata. Senza, ripiega su Claude finche'
// l'endpoint non e' pronto. Output sempre JSON validato dallo schema.
//
// Env: AI_BASE_URL (es. https://api.runpod.ai/v2/<endpoint>/openai/v1)
//      AI_MODEL    (es. Qwen/Qwen3-VL-32B-Instruct-AWQ)
//      AI_API_KEY  (RunPod API key)

export type JsonSchema = Record<string, unknown>

type Args = { system: string; text: string; images?: string[]; schema: JsonSchema; maxTokens?: number }
type Result<T> = { ok: true; data: T } | { ok: false; error: 'refused' | 'empty' | 'failed'; detail?: string }

export async function generateJson<T>(args: Args): Promise<Result<T>> {
  return process.env.AI_BASE_URL ? viaOpenAiCompat<T>(args) : viaClaude<T>(args)
}

// vLLM / RunPod: chat completions + response_format json_schema (guided decoding).
async function viaOpenAiCompat<T>({ system, text, images = [], schema, maxTokens = 8000 }: Args): Promise<Result<T>> {
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
    signal: AbortSignal.timeout(120_000),
  })
  try {
    let res = await call(body)
    // Il CDN del portale puo' rifiutare il download delle immagini: riprova solo testo.
    if (!res.ok && images.length) res = await call({ ...body, messages: [body.messages[0], { role: 'user', content: [{ type: 'text', text: `${text}\n(Foto non disponibili per l'analisi.)` }] }] })
    if (!res.ok) return { ok: false, error: 'failed', detail: `${res.status} ${(await res.text()).slice(0, 300)}` }
    const json = await res.json()
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
async function viaClaude<T>({ system, text, images = [], schema, maxTokens = 8000 }: Args): Promise<Result<T>> {
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
    if (res.stop_reason === 'refusal') return { ok: false, error: 'refused' }
    const block = res.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') return { ok: false, error: 'empty' }
    return { ok: true, data: JSON.parse(block.text) }
  } catch (e) {
    return { ok: false, error: 'failed', detail: String(e) }
  }
}
