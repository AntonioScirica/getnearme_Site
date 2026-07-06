import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GSC_SITE_URL = 'sc-domain:getnearme.it'
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

// Cadence ladder — the ONLY schedules adjust_blog_cadence() will accept.
// Hard ceiling at 3/day regardless of how good the data looks (see plan:
// "Volumi: ramp-up anti-penalizzazione" — spam-policy risk on a low-authority
// domain). Stepping only moves one rung at a time, in either direction.
const CADENCE_LADDER = ['0 8 * * *', '0 8,20 * * *', '0 6,12,18 * * *']
const MIN_POSTS_FOR_STEP_UP = [0, 14, 30] // published posts required before stepping to ladder[i]

// Heuristic keyword → pillar match, same pillars as the seed topics.
const PILLAR_KEYWORDS: Record<string, string[]> = {
  'ai-staging': ['staging', 'arred', 'ammobil'],
  'ai-video': ['video', 'filmato', 'ripresa'],
  'social-media': ['instagram', 'facebook', 'social', 'post'],
  'reports-analytics': ['report', 'valutazione', 'analisi', 'mercato'],
  'ai-avatar': ['avatar', 'presentazione personale'],
  'agency-productivity': ['agenzia', 'team', 'collaborator', 'produttivit'],
  'comparison-geo': ['migliori', 'confronto', 'vs ', 'strumenti ai'],
}
const BRANDED_TERMS = ['getnearme', 'get near me', 'loc8nearme']
const MAX_NEW_TOPICS_PER_RUN = 5
const MAX_QUEUED_BEFORE_SKIP = 10

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('BLOG_CRON_SECRET') || ''
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
      return jsonError('Forbidden', 403)
    }

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
    if (!serviceAccountJson) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON')
      return jsonError('GSC service account not configured', 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const accessToken = await getGoogleAccessToken(serviceAccountJson, GSC_SCOPE)

    const [blogPageRows, opportunityRows] = await Promise.all([
      queryGsc(accessToken, {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        dimensions: ['page'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }] }],
        rowLimit: 200,
      }),
      queryGsc(accessToken, {
        startDate: daysAgo(28),
        endDate: daysAgo(1),
        dimensions: ['query'],
        rowLimit: 500,
      }),
    ])

    // ── Indexation/traction proxy: % of posts published >=10 days ago that
    // have picked up ANY impressions. Cheap stand-in for a full per-URL
    // inspect_url sweep (rate-limited), good enough to steer cadence.
    const { data: publishedPosts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('status', 'published')
      .lte('published_at', daysAgo(10))

    const impressedSlugs = new Set(
      blogPageRows
        .filter((r) => (r.impressions || 0) > 0)
        .map((r) => (r.keys[0] as string).split('/blog/')[1]?.replace(/\/$/, ''))
        .filter(Boolean)
    )
    const eligiblePosts = publishedPosts || []
    const tractionRate = eligiblePosts.length > 0
      ? eligiblePosts.filter((p) => impressedSlugs.has(p.slug)).length / eligiblePosts.length
      : null

    // ── Cadence decision ──────────────────────────────────────────────────
    const { data: currentSchedule } = await supabase.rpc('get_blog_cadence')

    let currentIndex = currentSchedule ? CADENCE_LADDER.indexOf(currentSchedule) : 0
    if (currentIndex < 0) currentIndex = 0

    const { count: totalPublished } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    let newIndex = currentIndex
    let decision = 'hold'
    if (tractionRate !== null) {
      if (tractionRate >= 0.7 && currentIndex < CADENCE_LADDER.length - 1 && (totalPublished || 0) >= MIN_POSTS_FOR_STEP_UP[currentIndex + 1]) {
        newIndex = currentIndex + 1
        decision = 'step_up'
      } else if (tractionRate < 0.5 && currentIndex > 0) {
        newIndex = currentIndex - 1
        decision = 'step_down'
      }
    }

    const scheduleBefore = CADENCE_LADDER[currentIndex]
    const scheduleAfter = CADENCE_LADDER[newIndex]
    if (newIndex !== currentIndex) {
      const { error: cadenceError } = await supabase.rpc('adjust_blog_cadence', { new_schedule: scheduleAfter })
      if (cadenceError) console.error('adjust_blog_cadence failed:', cadenceError)
    }

    // ── Topic refill from real opportunity queries ───────────────────────
    const { count: queuedCount } = await supabase
      .from('blog_topics')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')

    const { data: existingTopics } = await supabase.from('blog_topics').select('target_keyword')
    const existingKeywords = new Set((existingTopics || []).map((t) => t.target_keyword.toLowerCase()))

    let topicsAdded = 0
    if ((queuedCount || 0) < MAX_QUEUED_BEFORE_SKIP) {
      const candidates = opportunityRows
        .filter((r) => {
          const q = (r.keys[0] as string).toLowerCase()
          if (BRANDED_TERMS.some((b) => q.includes(b))) return false
          if (existingKeywords.has(q)) return false
          return matchPillar(q) !== null
        })
        .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
        .slice(0, MAX_NEW_TOPICS_PER_RUN)

      for (const row of candidates) {
        const query = row.keys[0] as string
        const pillar = matchPillar(query.toLowerCase())!
        const { error: insertError } = await supabase.from('blog_topics').insert({
          title_hint: capitalize(query),
          target_keyword: query,
          pillar,
          product_hook: PILLAR_DEFAULT_HOOK[pillar],
        })
        if (!insertError) topicsAdded++
      }
    }

    await supabase.from('blog_strategy_log').insert({
      decision,
      schedule_before: scheduleBefore,
      schedule_after: scheduleAfter,
      topics_added: topicsAdded,
      metrics: {
        traction_rate: tractionRate,
        eligible_posts: eligiblePosts.length,
        total_published: totalPublished,
        queued_before_refill: queuedCount,
      },
    })

    return jsonOk({
      success: true,
      decision,
      schedule_before: scheduleBefore,
      schedule_after: scheduleAfter,
      traction_rate: tractionRate,
      topics_added: topicsAdded,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonError('Internal server error', 500)
  }
})

const PILLAR_DEFAULT_HOOK: Record<string, string> = {
  'ai-staging': 'AI home staging',
  'ai-video': 'AI video listing',
  'social-media': 'Template post social',
  'reports-analytics': 'Report PDF brandizzati',
  'ai-avatar': 'Avatar AI video',
  'agency-productivity': 'Piani multi-seat',
  'comparison-geo': 'Piattaforma all-in-one',
}

function matchPillar(query: string): string | null {
  for (const [pillar, keywords] of Object.entries(PILLAR_KEYWORDS)) {
    if (keywords.some((k) => query.includes(k))) return pillar
  }
  return null
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }

async function queryGsc(accessToken: string, body: Record<string, unknown>): Promise<GscRow[]> {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  )
  if (!res.ok) {
    const errorText = await res.text()
    console.error('GSC query error:', res.status, errorText)
    // Throw rather than return [] — a transient auth/API failure must not
    // look like "zero impressions" to the cadence logic below, which would
    // misread it as bad traction and step the schedule down for no reason.
    throw new Error(`gsc_query_${res.status}`)
  }
  const data = await res.json()
  return (data.rows || []) as GscRow[]
}

async function getGoogleAccessToken(serviceAccountKeyJson: string, scope: string): Promise<string> {
  const key = JSON.parse(serviceAccountKeyJson)
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: key.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const b64url = (input: ArrayBuffer | string): string => {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
    let binary = ''
    bytes.forEach((b) => { binary += String.fromCharCode(b) })
    return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claimSet))}`

  const pemBody = key.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const binaryDer = Uint8Array.from(atob(pemBody), (c: string) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned))
  const jwt = `${unsigned}.${b64url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    console.error('Google token exchange failed:', tokenRes.status, await tokenRes.text())
    throw new Error('google_token_exchange_failed')
  }
  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
