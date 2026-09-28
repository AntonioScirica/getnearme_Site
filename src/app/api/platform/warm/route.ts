import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Pre-accensione delle GPU RunPod quando l'agente mostra l'intenzione di usarle (apre Migliora,
// incolla un link, passa su "Sistema con AI"): il worker parte mentre l'utente e' ancora sulla
// pagina e resta acceso idleTimeout (60 s) dopo l'ultima richiesta. Job minimo, asincrono (/run):
// la risposta non aspetta l'avvio. Costo di un avvio a vuoto: ~20 s (foto) o ~3,5 min (analisi) di GPU.
const RUNPOD = 'https://api.runpod.ai/v2'
const ENDPOINTS: Record<string, { id?: string; input: Record<string, unknown> }> = {
  // vLLM: 1 token. L'id sta nell'URL OpenAI-compatibile (.../v2/<id>/openai/v1).
  analysis: { id: process.env.AI_BASE_URL?.match(/\/v2\/([^/]+)\//)?.[1], input: { prompt: 'ok', sampling_params: { max_tokens: 1 } } },
  // (le foto dal 28/09 le fa GPT Image: il worker foto non si scalda piu')
}
// ponytail: throttle in memoria per istanza (basta per non accodare decine di job); per piu'
// istanze o per contare gli avvii servira' uno stato condiviso.
const last: Record<string, number> = {}
const THROTTLE_MS = 45_000

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { target } = await req.json().catch(() => ({}))
  const ep = ENDPOINTS[target as string]
  if (!ep) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (process.env.NEXT_PUBLIC_AI_MOCK === '1' || !ep.id || !process.env.RUNPOD_API_KEY) return NextResponse.json({ ok: true, skipped: true })
  if (Date.now() - (last[target] ?? 0) < THROTTLE_MS) return NextResponse.json({ ok: true, throttled: true })
  last[target] = Date.now()

  const r = await fetch(`${RUNPOD}/${ep.id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` },
    body: JSON.stringify({ input: ep.input }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  return NextResponse.json({ ok: !!r?.ok })
}
