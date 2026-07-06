import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cronSecret = Deno.env.get('BLOG_CRON_SECRET') || ''
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
      return jsonError('Forbidden', 403)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: due, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('status', 'scheduled')

    if (fetchError) {
      console.error('fetch due posts error:', fetchError)
      return jsonError('Failed to fetch due posts', 500)
    }

    if (!due || due.length === 0) {
      return jsonOk({ success: true, published: 0 })
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: now, updated_at: now })
      .in('id', due.map((p) => p.id))

    if (updateError) {
      console.error('publish update error:', updateError)
      return jsonError('Failed to publish posts', 500)
    }

    console.log(`[publish-blog-posts] published ${due.length} post(s)`)
    return jsonOk({ success: true, published: due.length, ids: due.map((p) => p.id) })
  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonError('Internal server error', 500)
  }
})

function jsonOk(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
