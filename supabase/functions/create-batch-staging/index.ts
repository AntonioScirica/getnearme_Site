import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_STYLES = ['modern', 'nordic', 'industrial', 'boho', 'daynight', 'empty']
const MAX_PHOTOS = 30
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB base64

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Unauthorized', 401)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return jsonError('Unauthorized - invalid token', 401)
    }

    console.log(`[create-batch] user=${user.id}`)

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Parse body
    const body = await req.json()
    const { images, style, customPrompt } = body as {
      images: string[]
      style: string
      customPrompt?: string
    }

    // Validate
    if (!images || !Array.isArray(images) || images.length === 0) {
      return jsonError('No images provided', 400)
    }
    if (images.length > MAX_PHOTOS) {
      return jsonError(`Max ${MAX_PHOTOS} photos`, 400)
    }
    if (!style || !VALID_STYLES.includes(style)) {
      return jsonError('Invalid style', 400)
    }
    if (customPrompt && customPrompt.length > 2000) {
      return jsonError('Prompt too long', 400)
    }

    // Validate each image is a data URI and not too large
    for (let i = 0; i < images.length; i++) {
      if (!images[i].startsWith('data:image/')) {
        return jsonError(`Image ${i} is not a valid data URI`, 400)
      }
      if (images[i].length > MAX_IMAGE_SIZE) {
        return jsonError(`Image ${i} exceeds 10MB`, 400)
      }
    }

    // Deduct credits atomically
    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
      'deduct_batch_staging_credits',
      { p_user_id: user.id, p_count: images.length }
    )

    if (creditError) {
      console.error('[create-batch] credit error:', creditError)
      return jsonError('Credit check failed', 500)
    }

    if (!creditResult?.allowed) {
      console.log(`[create-batch] insufficient credits: remaining=${creditResult?.remaining}`)
      return new Response(
        JSON.stringify({
          error: 'Crediti insufficienti',
          quota_exhausted: true,
          remaining: creditResult?.remaining ?? 0,
          success: false,
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[create-batch] ${images.length} credits deducted, remaining=${creditResult.remaining}`)

    // Create batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batch_staging')
      .insert({
        user_id: user.id,
        style,
        custom_prompt: customPrompt || null,
        total_items: images.length,
        credits_charged: images.length,
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      console.error('[create-batch] insert error:', batchError)
      // Refund credits
      await supabaseAdmin.rpc('refund_batch_staging_credits', {
        p_user_id: user.id, p_count: images.length,
      })
      return jsonError('Failed to create batch', 500)
    }

    const batchId = batch.id
    console.log(`[create-batch] batch=${batchId}`)

    // Upload images to Storage and create item records
    const items: { batch_id: string; item_index: number; source_path: string }[] = []

    for (let i = 0; i < images.length; i++) {
      const dataUri = images[i]
      const base64 = dataUri.split(',')[1]
      if (!base64) {
        console.error(`[create-batch] invalid data URI for image ${i}`)
        continue
      }

      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const mimeMatch = dataUri.match(/^data:(image\/\w+);/)
      const ext = mimeMatch?.[1] === 'image/png' ? 'png' : 'jpg'
      const path = `${user.id}/${batchId}/source/${i}.${ext}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('batch-staging')
        .upload(path, bytes, {
          contentType: mimeMatch?.[1] || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error(`[create-batch] upload error for image ${i}:`, uploadError)
        continue
      }

      items.push({ batch_id: batchId, item_index: i, source_path: path })
    }

    if (items.length === 0) {
      // All uploads failed — refund and clean up
      await supabaseAdmin.from('batch_staging').delete().eq('id', batchId)
      await supabaseAdmin.rpc('refund_batch_staging_credits', {
        p_user_id: user.id, p_count: images.length,
      })
      return jsonError('All image uploads failed', 500)
    }

    // Insert item records
    const { error: itemsError } = await supabaseAdmin
      .from('batch_staging_items')
      .insert(items)

    if (itemsError) {
      console.error('[create-batch] items insert error:', itemsError)
      // Clean up
      await supabaseAdmin.storage.from('batch-staging').remove(items.map(it => it.source_path))
      await supabaseAdmin.from('batch_staging').delete().eq('id', batchId)
      await supabaseAdmin.rpc('refund_batch_staging_credits', {
        p_user_id: user.id, p_count: images.length,
      })
      return jsonError('Failed to create batch items', 500)
    }

    // If some uploads failed, adjust total_items and refund difference
    if (items.length < images.length) {
      const diff = images.length - items.length
      await supabaseAdmin
        .from('batch_staging')
        .update({ total_items: items.length, credits_charged: items.length })
        .eq('id', batchId)
      await supabaseAdmin.rpc('refund_batch_staging_credits', {
        p_user_id: user.id, p_count: diff,
      })
      console.log(`[create-batch] ${diff} uploads failed, refunded ${diff} credits`)
    }

    console.log(`[create-batch] done: batch=${batchId}, items=${items.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        batchId,
        itemCount: items.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[create-batch] unexpected:', (error as Error)?.message)
    return jsonError('Internal server error', 500)
  }
})

function jsonError(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
