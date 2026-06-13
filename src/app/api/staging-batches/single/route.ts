import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadUrlToR2 } from '@/lib/s3'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { projectId, style, customPrompt, sourceUrl, resultUrl } = await req.json()

    // 1. Create a batch record
    const { data: batch, error: batchErr } = await admin
      .from('batch_staging')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        style: style || 'custom',
        custom_prompt: customPrompt || null,
        status: 'completed',
        total_items: 1,
        completed_items: 1,
        failed_items: 0,
      })
      .select('id')
      .single()

    if (batchErr || !batch) {
      console.error('Error creating batch:', batchErr)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }

    // 2. Upload to Cloudflare R2 if it's a valid remote URL
    let finalResultPath = resultUrl || null;
    let finalSourcePath = sourceUrl || null;

    if (resultUrl && resultUrl.startsWith('http')) {
      const key = `staging/${batch.id}/result.jpg`;
      await uploadUrlToR2(resultUrl, key);
      finalResultPath = key;
    }

    if (sourceUrl && sourceUrl.startsWith('http')) {
      const key = `staging/${batch.id}/source.jpg`;
      await uploadUrlToR2(sourceUrl, key);
      finalSourcePath = key;
    }

    // 3. Create the batch item record using the R2 keys
    const { error: itemErr } = await admin
      .from('batch_staging_items')
      .insert({
        batch_id: batch.id,
        item_index: 0,
        source_path: finalSourcePath,
        result_path: finalResultPath,
        status: 'completed',
      })

    if (itemErr) {
      console.error('Error creating batch item:', itemErr)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, batchId: batch.id })
  } catch (err) {
    console.error('single batch api error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
