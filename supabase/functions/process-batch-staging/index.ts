import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { escapeHtml } from '../_shared/email-template.ts'

const STYLE_PROMPTS: Record<string, string> = {
  modern: "Edit this photo: identify every piece of furniture, fixture, and object in this room and replace each one with a modern contemporary version of the same item. Keep the same type of elements (if there is a table replace it with a modern table, if there are cabinets replace them with modern cabinets, if there is a bed replace it with a modern bed). Modern style: clean lines, neutral palette, accent colors, designer pieces, elegant lighting. DO NOT modify walls, doors, windows, ceiling, floor or any architectural element. DO NOT change the room layout or add different types of furniture. Photorealistic, 8k.",
  nordic: "Edit this photo: identify every piece of furniture, fixture, and object in this room and replace each one with a Scandinavian Nordic version of the same item. Keep the same type of elements (if there is a table replace it with a Nordic table, if there are cabinets replace them with Nordic cabinets, if there is a bed replace it with a Nordic bed). Nordic style: light oak/birch wood, white and grey palette, minimal functional pieces, wool/linen textiles, clean uncluttered look. DO NOT modify walls, doors, windows, ceiling, floor or any architectural element. DO NOT change the room layout or add different types of furniture. Photorealistic, 8k.",
  industrial: "Edit this image by transforming the existing interior into a Luxury Contemporary style version of itself. Identify every existing furniture piece, fixture, decor item, and object, and replace each one ONLY with a high-end luxury contemporary version of the SAME item category. STRICT RULES: Preserve the exact room function. Do NOT add new furniture categories or extra decorative objects. Do NOT add sofas, chairs, tables, or accessories that do not already exist in the original image. Keep the same layout and approximate object positions. Preserve the original object count and room proportions. Do NOT modify walls, windows, doors, ceiling, floor, or architecture. Preserve the original camera angle and natural room structure. Luxury Contemporary style: premium marble, travertine, brushed brass accents, smoked glass, dark walnut wood, oak finishes, soft ambient lighting, elegant textures, neutral luxury palette, sophisticated minimalist furniture, hotel-suite aesthetic, upscale residential interior design. Atmosphere: refined, elegant, warm luxury, architectural digest aesthetic, high-end real estate staging, modern luxury apartment design. Photorealistic, ultra realistic, cinematic interior lighting, highly detailed, architectural visualization quality, 8k.",
  boho: "Edit this photo: identify every piece of furniture, fixture, and object in this room and replace each one with a bohemian version of the same item. Keep the same type of elements (if there is a table replace it with a boho table, if there are cabinets replace them with boho cabinets, if there is a bed replace it with a boho bed). Bohemian style: rattan, wicker, macramé, natural wood, indoor plants, earthy tones, jute, bamboo, eclectic patterns. DO NOT modify walls, doors, windows, ceiling, floor or any architectural element. DO NOT change the room layout or add different types of furniture. Photorealistic, 8k.",
  daynight: "Analyze the lighting in this photo. If daytime: convert to nighttime — dark blue sky through windows, all light fixtures ON with warm glow and halos, deep shadows. If nighttime: convert to daytime — bright blue sky, natural sunlight through windows, morning light. CRITICAL: do NOT add, remove, move or change ANY object, furniture, door, window or wall. ONLY change lighting and sky. Photorealistic, 8k.",
  empty: "Edit this photo to show the room empty and unfurnished. KEEP EXACTLY AS-IS: all walls, all windows, all doors, ceiling, floor, baseboards, electrical outlets, radiators, light switches — these must remain identical in number, position, shape and color. REMOVE: all furniture, kitchen cabinets and appliances, bathroom fixtures, curtains, rugs, lamps, shelves, decorations, personal items. Show clean bare surfaces where objects were removed. DO NOT add or remove any door or window. Photorealistic, 8k."
}

const MAX_RETRIES = 3
const POLL_MAX_ATTEMPTS = 50
const POLL_INTERVAL_MS = 1000
const DOWNLOAD_PAGE_BASE = 'https://www.getnearme.it/it/download'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  try {
    // Verify cron secret
    const cronSecret = Deno.env.get('BATCH_STAGING_CRON_SECRET') || ''
    if (req.headers.get('x-cron-secret') !== cronSecret) {
      // Also allow service_role JWT
      const authHeader = req.headers.get('authorization') || ''
      let isServiceRole = false
      if (authHeader.startsWith('Bearer ')) {
        try {
          const payload = JSON.parse(atob(authHeader.slice(7).split('.')[1]))
          isServiceRole = payload.role === 'service_role'
        } catch (_) { /* invalid JWT */ }
      }
      if (!isServiceRole) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const PARALLEL = 3

    // Pick next pending items (up to PARALLEL)
    const { data: items, error: fetchError } = await supabase
      .from('batch_staging_items')
      .select('id, batch_id, item_index, source_path, status, retry_count')
      .in('status', ['pending', 'failed'])
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(PARALLEL)

    if (fetchError) {
      console.error('[process-batch] fetch error:', fetchError)
      return json({ processed: 0, error: 'fetch_failed' })
    }

    if (!items || items.length === 0) {
      const stuckCount = await checkStuckBatches(supabase, supabaseUrl, serviceRoleKey, resendApiKey)
      return json({ processed: 0, stuckChecked: stuckCount })
    }

    console.log(`[process-batch] picked ${items.length} items`)

    // Group items by batch
    const batchIds = [...new Set(items.map(i => i.batch_id))]
    const batches: Record<string, any> = {}
    for (const bid of batchIds) {
      const { data: b } = await supabase
        .from('batch_staging')
        .select('id, user_id, style, custom_prompt, status, total_items, completed_items, failed_items')
        .eq('id', bid)
        .in('status', ['pending', 'processing'])
        .single()
      if (b) batches[bid] = b
    }

    // Filter to items with valid batches
    const validItems = items.filter(i => batches[i.batch_id])
    if (validItems.length === 0) {
      return json({ processed: 0 })
    }

    // Mark all items processing + batches processing
    await Promise.all(validItems.map(item =>
      supabase.from('batch_staging_items')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', item.id)
    ))
    for (const bid of batchIds) {
      if (batches[bid]?.status === 'pending') {
        await supabase.from('batch_staging')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', bid)
      }
    }

    // Build prompt helper
    const perspectiveInstructions = `STRICT RULES: The room structure must be IDENTICAL to the input — same walls, same doors, same windows, same arches, same ceiling, same floor. Do NOT add new rooms, openings, arches, extensions or architectural features. Do NOT extend or expand the visible space. The photo must show the SAME room from the SAME angle. Replace ALL existing furniture and objects throughout the ENTIRE room. Every single piece of original furniture must be removed and replaced — nothing from the original furnishing should remain visible, especially in corners, edges, and along walls.`

    function buildPrompt(batch: any): string {
      if (batch.custom_prompt?.trim()) {
        return `${perspectiveInstructions} Edit this interior photo following the user's instructions below (the user may write in any language — interpret accordingly and apply the described changes). User instructions: "${batch.custom_prompt}". Apply these changes while keeping the overall structure, perspective and architectural elements of the image. Photorealistic result, 8k interior photography.`
      }
      const stylePrompt = STYLE_PROMPTS[batch.style] || STYLE_PROMPTS.modern
      const isDayNight = batch.style === 'daynight'
      return isDayNight ? stylePrompt : `${perspectiveInstructions} ${stylePrompt}`
    }

    // Process all items in parallel
    const results = await Promise.allSettled(validItems.map(async (item) => {
      const batch = batches[item.batch_id]
      const prompt = buildPrompt(batch)

      const { data: signedData } = await supabase.storage
        .from('batch-staging')
        .createSignedUrl(item.source_path, 600)

      if (!signedData?.signedUrl) {
        console.error(`[process-batch] no signed URL for ${item.source_path}`)
        await markItemFailed(supabase, item, batch, 'source_not_found')
        return 'source_not_found'
      }

      const result = await callNanoBanana(replicateToken!, signedData.signedUrl, prompt)

      if (result.success && result.outputUrl) {
        const resultBytes = await downloadImage(result.outputUrl)
        if (resultBytes) {
          const resultPath = `${batch.user_id}/${batch.id}/result/${item.item_index}.png`
          const { error: uploadError } = await supabase.storage
            .from('batch-staging')
            .upload(resultPath, resultBytes, {
              contentType: 'image/png',
              upsert: true,
            })

          if (uploadError) {
            console.error(`[process-batch] result upload error:`, uploadError)
            await markItemFailed(supabase, item, batch, 'upload_failed')
            return 'upload_failed'
          }

          await supabase.from('batch_staging_items').update({
            status: 'completed',
            result_path: resultPath,
            replicate_id: result.predictionId,
            completed_at: new Date().toISOString(),
          }).eq('id', item.id)

          await supabase.rpc('increment_batch_counter', {
            p_batch_id: batch.id,
            p_column: 'completed_items',
          })

          // Delete source image to save space
          await supabase.storage.from('batch-staging').remove([item.source_path]).catch(console.error)

          console.log(`[process-batch] item=${item.id} completed`)
          return 'completed'
        } else {
          await markItemFailed(supabase, item, batch, 'download_failed')
          return 'download_failed'
        }
      } else {
        await markItemFailed(supabase, item, batch, result.error || 'generation_failed')
        return 'generation_failed'
      }
    }))

    // Check completion for all affected batches
    for (const bid of batchIds) {
      if (batches[bid]) {
        await checkBatchCompletion(supabase, batches[bid], supabaseUrl, serviceRoleKey, resendApiKey)
      }
    }

    // Self-chain if more items pending
    await selfChain(supabaseUrl, cronSecret)

    const processed = results.filter(r => r.status === 'fulfilled').length
    return json({ processed, total: validItems.length })

  } catch (error) {
    console.error('[process-batch] unexpected:', (error as Error)?.message)
    return json({ processed: 0, error: 'unexpected' })
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callNanoBanana(
  token: string,
  imageUrl: string,
  prompt: string,
): Promise<{ success: boolean; outputUrl?: string; predictionId?: string; error?: string }> {
  const MAX_PREDICTION_RETRIES = 2

  for (let retry = 0; retry <= MAX_PREDICTION_RETRIES; retry++) {
    if (retry > 0) console.log(`[nano-banana] retry ${retry}/${MAX_PREDICTION_RETRIES}`)

    const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          image_input: [imageUrl],
          aspect_ratio: "match_input_image",
          resolution: "4K",
          output_format: "png",
          safety_filter_level: "block_only_high",
        }
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[nano-banana] API error (attempt ${retry + 1}):`, res.status, errText)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break
      continue
    }

    const prediction = await res.json()

    if (prediction.status === 'succeeded' && prediction.output) {
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return { success: true, outputUrl, predictionId: prediction.id }
    }

    // Poll
    let predictionFailed = false
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

      const statusRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!statusRes.ok) continue

      const statusData = await statusRes.json()

      if (statusData.status === 'succeeded') {
        const outputUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
        return { success: true, outputUrl, predictionId: prediction.id }
      }

      if (statusData.status === 'failed' || statusData.status === 'canceled') {
        predictionFailed = true
        break
      }
    }

    if (!predictionFailed) {
      console.error(`[nano-banana] timeout (attempt ${retry + 1})`)
    }
  }

  return { success: false, error: 'generation_failed' }
}

async function downloadImage(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return new Uint8Array(buffer)
  } catch (e) {
    console.error('[download] error:', (e as Error)?.message)
    return null
  }
}

async function markItemFailed(
  supabase: ReturnType<typeof createClient>,
  item: { id: string; retry_count: number; source_path?: string },
  batch: { id: string; failed_items: number },
  error: string,
) {
  const newRetryCount = item.retry_count + 1
  const isFinalFailure = newRetryCount >= MAX_RETRIES

  await supabase
    .from('batch_staging_items')
    .update({
      status: isFinalFailure ? 'failed' : 'failed',
      retry_count: newRetryCount,
      error,
      completed_at: isFinalFailure ? new Date().toISOString() : null,
    })
    .eq('id', item.id)

  if (isFinalFailure) {
    await supabase.rpc('increment_batch_counter', {
      p_batch_id: batch.id,
      p_column: 'failed_items',
    })

    if (item.source_path) {
      await supabase.storage.from('batch-staging').remove([item.source_path]).catch(console.error)
    }
  }

  console.log(`[process-batch] item=${item.id} failed (retry ${newRetryCount}/${MAX_RETRIES}): ${error}`)
}

async function checkBatchCompletion(
  supabase: ReturnType<typeof createClient>,
  batch: { id: string; user_id: string; total_items: number },
  supabaseUrl: string,
  serviceRoleKey: string,
  resendApiKey: string | undefined,
) {
  // Re-read batch to get latest counts
  const { data: current } = await supabase
    .from('batch_staging')
    .select('completed_items, failed_items, total_items, email_sent, user_id, style')
    .eq('id', batch.id)
    .single()

  if (!current) return

  const done = current.completed_items + current.failed_items
  if (done < current.total_items) return
  if (current.email_sent) return

  console.log(`[process-batch] batch=${batch.id} complete: ${current.completed_items} ok, ${current.failed_items} failed`)

  // Refund credits for failed items
  if (current.failed_items > 0) {
    await supabase.rpc('refund_batch_staging_credits', {
      p_user_id: current.user_id,
      p_count: current.failed_items,
    })
    await supabase
      .from('batch_staging')
      .update({ credits_refunded: current.failed_items })
      .eq('id', batch.id)
  }

  // Set final status
  const finalStatus = current.failed_items === 0
    ? 'completed'
    : current.completed_items === 0
      ? 'failed'
      : 'partial'

  await supabase
    .from('batch_staging')
    .update({ status: finalStatus, email_sent: true, updated_at: new Date().toISOString() })
    .eq('id', batch.id)

  // Get download token for download page URL
  const { data: tokenData } = await supabase
    .from('batch_staging')
    .select('download_token')
    .eq('id', batch.id)
    .single()

  const downloadUrl = tokenData?.download_token
    ? `${DOWNLOAD_PAGE_BASE}?batch=${batch.id}&token=${tokenData.download_token}`
    : ''

  // Get user email
  const { data: userData } = await supabase.auth.admin.getUserById(current.user_id)
  const userEmail = userData?.user?.email

  if (!userEmail || !resendApiKey) {
    console.error(`[process-batch] no email or resend key for batch=${batch.id}`)
    return
  }

  // Build email
  await sendCompletionEmail(
    resendApiKey,
    userEmail,
    current.style,
    current.total_items,
    current.completed_items,
    current.failed_items,
    downloadUrl,
  )
}

async function sendCompletionEmail(
  resendApiKey: string,
  email: string,
  style: string,
  total: number,
  completed: number,
  failed: number,
  downloadUrl: string,
) {
  const downloadButton = downloadUrl
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:8px;background:#2563EB;text-align:center;">
          <a href="${downloadUrl}" style="display:block;padding:12px 22px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Scarica le foto</a>
        </td></tr>
      </table>`
    : '<p style="font-size:13px;color:#dc2626;">Errore nel generare il link di download.</p>'

  const failedNote = failed > 0
    ? `<p style="margin:0 0 16px;color:#dc2626;">${failed} foto non riuscite, crediti rimborsati.</p>`
    : ''

  const subject = `Le tue foto AI sono pronte`
  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
</head>
<body style="margin:0;padding:0;background:#f4f5f7;">
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f5f7;">Le tue foto AI sono pronte. Scaricale subito.</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">

        <tr>
          <td style="padding:0;">
            <img src="https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/email-assets/stripe_header.png" alt="GetNearMe" width="560" style="display:block;width:100%;height:auto;border:0;">
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 16px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1F2937;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;">Ciao,</p>
            <p style="margin:0 0 16px;">le tue ${completed} foto con stile <strong>${escapeHtml(style)}</strong> sono pronte.</p>
            ${failedNote}
            <p style="margin:0 0 16px;">Puoi scaricarle subito e iniziare a usarle per i tuoi annunci, contenuti social o presentazioni immobiliari.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 18px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:13px;color:#374151;border-bottom:1px solid #e5e7eb;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="font-size:13px;color:#6b7280;">Foto elaborate</td><td style="font-size:13px;color:#1F2937;text-align:right;">${completed} di ${total}</td></tr>
                    <tr><td style="padding-top:10px;font-size:13px;color:#6b7280;">Stile</td><td style="padding-top:10px;font-size:13px;color:#1F2937;text-align:right;">${escapeHtml(style)}</td></tr>
                    <tr><td style="padding-top:10px;font-size:13px;color:#6b7280;">Formato</td><td style="padding-top:10px;font-size:13px;color:#1F2937;text-align:right;">PNG</td></tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 18px 18px;">
                  ${downloadButton}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 32px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
              <tr><td style="padding:14px 18px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:13px;line-height:1.5;color:#92400e;">
                Il link di download resterà attivo per <strong>24 ore</strong>. Dopo la scadenza il file non sarà più disponibile.
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 32px 24px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;color:#4b5563;">
            Buon lavoro,
            <p style="margin:8px 0 0;font-size:14px;color:#111827;font-weight:600;">Il team di GetNearMe</p>
          </td>
        </tr>

        <tr>
          <td style="padding:18px 32px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 12px 12px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">
            GetNearMe<br>
            Hai ricevuto questa email perché hai richiesto delle foto AI dall'estensione.<br>
            <a href="https://www.getnearme.it/legal/privacy" style="color:#6b7280;text-decoration:underline;">Privacy</a> · <a href="https://www.getnearme.it/legal/terms" style="color:#6b7280;text-decoration:underline;">Termini</a> · info@getnearme.it
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GetNearMe <noreply@getnearme.it>',
      to: [email],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[email] send failed:`, res.status, errText)
  } else {
    console.log(`[email] sent to ${email}`)
  }
}

async function checkStuckBatches(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string,
  resendApiKey: string | undefined,
): Promise<number> {
  const { data: stuck, error: stuckErr } = await supabase
    .from('batch_staging')
    .select('id, user_id, total_items, completed_items, failed_items, style')
    .in('status', ['pending', 'processing'])
    .eq('email_sent', false)

  if (stuckErr) {
    console.error('[process-batch] stuck query error:', stuckErr)
    return 0
  }
  if (!stuck || stuck.length === 0) return 0

  console.log(`[process-batch] checking ${stuck.length} potentially stuck batches`)
  let finalized = 0

  for (const batch of stuck) {
    const done = batch.completed_items + batch.failed_items
    console.log(`[process-batch] batch=${batch.id} done=${done}/${batch.total_items}`)
    if (done >= batch.total_items) {
      console.log(`[process-batch] found stuck batch=${batch.id}, finalizing`)
      await checkBatchCompletion(supabase, batch, supabaseUrl, serviceRoleKey, resendApiKey)
      finalized++
    }
  }
  return finalized
}

async function selfChain(supabaseUrl: string, cronSecret: string) {
  try {
    fetch(`${supabaseUrl}/functions/v1/process-batch-staging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
      body: '{}',
    }).catch(() => {})
  } catch (_) {}
}

function json(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
