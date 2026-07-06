import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages'
// The older claude-3-haiku-20240307 (still referenced elsewhere in this
// codebase) 404s on this account as of 2026 — deprecated/retired. Current
// Haiku model instead; long-form Italian quality beats the Groq 8b model
// used for the cheaper quality-check pass.
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'

const SITE_URL = 'https://www.getnearme.it/it'

const SYSTEM_PROMPT = `Sei un content writer esperto di real estate tech, scrivi per agenti immobiliari italiani (non per acquirenti/venditori privati). Il tuo obiettivo e scrivere un articolo che:
1. Risponda in modo diretto alla query dell'utente nelle primissime 2-3 frasi, senza preamboli o frasi di marketing prima della risposta vera.
2. Sia strutturato con almeno 3 sezioni H2 (markdown "## ").
3. Includa una sezione finale "## Domande frequenti" con almeno 3 domande e risposte concrete (usate poi per uno schema FAQPage).
4. Includa la keyword target in modo naturale nel primo paragrafo, in almeno un H2, nel titolo SEO e nello slug.
5. Contenga un riferimento esplicito e specifico (non generico) alla feature di GetNearMe indicata come "product_hook", con un link markdown verso ${SITE_URL}.
6. Se il pillar e "comparison-geo", includa almeno una tabella comparativa in markdown (sintassi GFM con "|---|").
7. Sia lungo tra 800 e 1600 parole, in italiano corretto e naturale, senza ripetizioni.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido, nessun testo fuori dal JSON, nessun blocco \`\`\`:
{
  "title": "<titolo H1 dell'articolo>",
  "seo_title": "<title tag, max 60 caratteri, include la keyword target>",
  "seo_description": "<meta description, max 155 caratteri>",
  "slug": "<slug-kebab-case-in-italiano-senza-accenti>",
  "content_markdown": "<corpo dell'articolo in markdown, include gli H2 e la sezione FAQ>",
  "faq_items": [{"question": "...", "answer": "..."}]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('BLOG_CRON_SECRET') || ''
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
      return jsonError('Forbidden', 403)
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      console.error('Missing ANTHROPIC_API_KEY')
      return jsonError('AI service not configured', 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Atomic pop — safe even if the cron fires twice concurrently.
    const { data: topic, error: popError } = await supabase.rpc('pop_blog_topic').single()
    if (popError) {
      console.error('pop_blog_topic error:', popError)
      return jsonError('Failed to pop topic', 500)
    }
    if (!topic || !topic.id) {
      console.log('[generate-blog-post] topic queue empty')
      return jsonOk({ success: true, generated: false, reason: 'no_queued_topics' })
    }

    const { count: remaining } = await supabase
      .from('blog_topics')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')

    const userPrompt = `title_hint: ${topic.title_hint}
target_keyword: ${topic.target_keyword}
pillar: ${topic.pillar}
product_hook: ${topic.product_hook}

Scrivi l'articolo seguendo esattamente le istruzioni di sistema.`

    // Everything from here on operates on an already-popped topic. ANY
    // failure in this block (Anthropic call throwing, parse failure, insert
    // failure) must requeue the topic — otherwise it's silently lost
    // ("used" forever with no post to show for it, as happened during manual
    // testing when the model id was briefly wrong).
    let inserted: { id: string } | null = null
    try {
      const draft = await callAnthropic(SYSTEM_PROMPT, userPrompt, anthropicApiKey)
      const parsed = parseDraft(draft)
      if (!parsed) throw new Error('failed_to_parse_ai_draft')

      const { data, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          topic_id: topic.id,
          slug: parsed.slug,
          locale: 'it',
          title: parsed.title,
          seo_title: parsed.seo_title,
          seo_description: parsed.seo_description,
          content_markdown: parsed.content_markdown,
          faq_items: parsed.faq_items,
          pillar: topic.pillar,
          product_hook: topic.product_hook,
          status: 'generated',
        })
        .select('id')
        .single()

      if (insertError || !data) throw new Error(`insert_failed: ${insertError?.message}`)
      inserted = data
    } catch (genError) {
      console.error('generation failed, requeueing topic:', genError)
      await supabase.from('blog_topics').update({ status: 'queued' }).eq('id', topic.id)
      return jsonError(`Failed to generate draft: ${(genError as Error)?.message || genError}`, 500)
    }

    const postId = inserted!.id

    // Fire the quality gate right away — same cron cycle, separate function
    // so its own retry/timeout tuning stays independent of generation.
    const qcResponse = await fetch(`${supabaseUrl}/functions/v1/quality-check-blog-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': cronSecret },
      body: JSON.stringify({ postId }),
    })
    const qcResult = qcResponse.ok ? await qcResponse.json() : { error: await qcResponse.text() }

    return jsonOk({
      success: true,
      generated: true,
      postId,
      topics_remaining: remaining ?? null,
      quality_check: qcResult,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonError('Internal server error', 500)
  }
})

async function callAnthropic(system: string, user: string, apiKey: string): Promise<string> {
  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    // Long-form generation is slow — generous but bounded timeout so a stuck
    // cron invocation fails fast instead of hanging the scheduler.
    signal: AbortSignal.timeout(90000),
  })
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error:', response.status, errorText.slice(0, 500))
    throw new Error(`anthropic_${response.status}`)
  }
  const data = await response.json()
  const rawText = data?.content?.[0]?.text
  if (!rawText) throw new Error('anthropic_empty')
  return String(rawText)
}

type ParsedDraft = {
  title: string
  seo_title: string
  seo_description: string
  slug: string
  content_markdown: string
  faq_items: { question: string; answer: string }[]
}

function parseDraft(rawText: string): ParsedDraft | null {
  try {
    let jsonStr = rawText.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }
    const parsed = JSON.parse(jsonStr)

    if (!parsed.title || !parsed.slug || !parsed.content_markdown) return null

    const slug = String(parsed.slug)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const faqItems = Array.isArray(parsed.faq_items)
      ? parsed.faq_items
          .filter((f: any) => f?.question && f?.answer)
          .map((f: any) => ({ question: String(f.question), answer: String(f.answer) }))
      : []

    return {
      title: String(parsed.title).slice(0, 200),
      seo_title: String(parsed.seo_title || parsed.title).slice(0, 70),
      seo_description: String(parsed.seo_description || '').slice(0, 160),
      slug,
      // faq_items already carries this content and renders as its own
      // accordion + FAQPage JSON-LD — strip the trailing "## Domande
      // frequenti" section out of the markdown body so it doesn't render
      // twice on the page (once as flat text, once as the accordion).
      content_markdown: stripFaqSection(String(parsed.content_markdown)),
      faq_items: faqItems,
    }
  } catch (e) {
    console.error('Failed to parse AI draft:', e, 'Raw:', rawText.slice(0, 500))
    return null
  }
}

function stripFaqSection(markdown: string): string {
  // Cuts everything from the FAQ heading onward (any level, common phrasing).
  return markdown
    .replace(/\n#{2,3}\s*(domande frequenti|faq)[\s\S]*$/i, '')
    .trimEnd()
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
