import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const WORD_COUNT_MIN = 800
const WORD_COUNT_MAX = 1600

const QUALITY_PROMPT = `Sei un editor SEO che valuta un articolo scritto per agenti immobiliari italiani. Valuta SOLO gli aspetti richiesti.

Rispondi ESCLUSIVAMENTE con un oggetto JSON valido:
{
  "seo_score": <1-10, qualita di title/keyword/struttura per la SEO>,
  "italian_language_quality": <1-10, grammatica e naturalezza del testo>,
  "has_direct_answer_opening": <true/false, il primo paragrafo risponde alla query in modo diretto senza preamboli>,
  "no_false_claims_about_getnearme": <true/false, l'articolo NON inventa prezzi, integrazioni o feature che GetNearMe non ha (staging AI, video AI, template social, avatar AI, report PDF, piani multi-seat sono le feature reali)>,
  "summary": "<giudizio sintetico in una frase>"
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

    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      console.error('Missing GROQ_API_KEY')
      return jsonError('AI service not configured', 500)
    }

    const { postId } = await req.json()
    if (!postId) return jsonError('Missing postId', 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, content_markdown, faq_items, pillar, product_hook')
      .eq('id', postId)
      .single()

    if (fetchError || !post) {
      return jsonError('Post not found', 404)
    }

    const deterministic = runDeterministicChecks(post)

    const groqResponse = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: QUALITY_PROMPT },
          { role: 'user', content: `Valuta questo articolo:\n\n"""${post.content_markdown.slice(0, 8000)}"""` },
        ],
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(20000),
    })

    let llmResult = { seo_score: 5, italian_language_quality: 5, has_direct_answer_opening: false, no_false_claims_about_getnearme: true, summary: '' }
    if (groqResponse.ok) {
      const groqData = await groqResponse.json()
      const rawText = groqData?.choices?.[0]?.message?.content
      if (rawText) llmResult = parseLlmResult(rawText)
    } else {
      console.error('Groq API error:', groqResponse.status, await groqResponse.text())
    }

    const criteria = { ...deterministic, ...llmResult }

    const hardGateFailed =
      !deterministic.word_count_ok ||
      !deterministic.has_product_hook ||
      !llmResult.no_false_claims_about_getnearme

    const overallScore = hardGateFailed ? 0 : (
      0.25 * llmResult.seo_score +
      0.20 * llmResult.italian_language_quality +
      0.15 * (llmResult.has_direct_answer_opening ? 10 : 0) +
      0.15 * (deterministic.has_faq_section ? 10 : 0) +
      0.15 * (deterministic.has_h2_structure ? 10 : 0) +
      0.10 * (deterministic.geo_table_ok ? 10 : 0)
    )

    const roundedScore = Math.round(overallScore * 10) / 10

    let newStatus: string
    if (roundedScore >= 8.0) newStatus = 'scheduled'
    else if (roundedScore >= 5.0) newStatus = 'pending_review'
    else newStatus = 'rejected'

    const qualityResult = { score: roundedScore, criteria, summary: llmResult.summary }

    await supabase
      .from('blog_posts')
      .update({
        status: newStatus,
        quality_score: roundedScore,
        quality_result: qualityResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    // Rejected drafts get one retry: their topic goes back to the queue so
    // the next cron cycle regenerates from scratch rather than dead-ending.
    if (newStatus === 'rejected') {
      const { data: rejectedPost } = await supabase
        .from('blog_posts')
        .select('topic_id')
        .eq('id', postId)
        .single()
      if (rejectedPost?.topic_id) {
        await supabase.from('blog_topics').update({ status: 'queued' }).eq('id', rejectedPost.topic_id)
      }
    }

    return jsonOk({ success: true, postId, status: newStatus, score: roundedScore, quality_result: qualityResult })
  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonError('Internal server error', 500)
  }
})

function runDeterministicChecks(post: { content_markdown: string; faq_items: unknown; pillar: string; product_hook: string }) {
  const md = post.content_markdown || ''
  const wordCount = md.trim().split(/\s+/).filter(Boolean).length
  const h2Count = (md.match(/^##\s+/gm) || []).length
  const faqItems = Array.isArray(post.faq_items) ? post.faq_items : []
  const hasTable = /\|.*-{3,}.*\|/.test(md)
  // Hook check is intentionally loose (mentions the feature name) — the LLM
  // check for genuine/specific tie-in happens implicitly via seo_score/summary.
  const hasHook = md.toLowerCase().includes(post.product_hook.toLowerCase().split(' ')[0])

  return {
    word_count: wordCount,
    word_count_ok: wordCount >= WORD_COUNT_MIN && wordCount <= WORD_COUNT_MAX,
    has_h2_structure: h2Count >= 3,
    has_faq_section: faqItems.length >= 3,
    geo_table_ok: post.pillar === 'comparison-geo' ? hasTable : true,
    has_product_hook: hasHook,
  }
}

function parseLlmResult(rawText: string) {
  try {
    let jsonStr = rawText.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }
    const parsed = JSON.parse(jsonStr)
    return {
      seo_score: clampScore(parsed.seo_score),
      italian_language_quality: clampScore(parsed.italian_language_quality),
      has_direct_answer_opening: Boolean(parsed.has_direct_answer_opening),
      no_false_claims_about_getnearme: parsed.no_false_claims_about_getnearme !== false,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
    }
  } catch (e) {
    console.error('Failed to parse quality-check response:', e, 'Raw:', rawText.slice(0, 300))
    return { seo_score: 5, italian_language_quality: 5, has_direct_answer_opening: false, no_false_claims_about_getnearme: true, summary: 'Valutazione non disponibile' }
  }
}

function clampScore(value: unknown): number {
  return Math.min(10, Math.max(1, Math.round(Number(value) || 5)))
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
