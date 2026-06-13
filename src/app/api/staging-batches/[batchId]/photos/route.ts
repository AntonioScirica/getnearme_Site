import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getR2SignedUrl, deleteFromR2 } from '@/lib/s3'

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const resolvedParams = await params;
  const batchId = resolvedParams.batchId;
  const userId = await getUserId(req)
  
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 1. Verify batch belongs to user
  const { data: batch, error: batchErr } = await admin
    .from('batch_staging')
    .select('id, user_id')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  
  if (batch.user_id !== userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 2. Fetch ALL items for this batch (completed and failed)
  const { data: items, error: itemsErr } = await admin
    .from('batch_staging_items')
    .select('item_index, result_path, source_path, status, error')
    .eq('batch_id', batchId)
    .order('item_index', { ascending: true })

  if (itemsErr) {
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }

  const validItems = items || [];

  // 3. Create signed URLs (7 days = 604800 seconds)
  const photos = await Promise.all(
    validItems.map(async (item) => {
      let resultUrl = null;
      let sourceUrl = null;

      if (item.result_path) {
        if (item.result_path.startsWith('http') || item.result_path.startsWith('data:')) {
          resultUrl = item.result_path;
        } else if (item.result_path.startsWith('staging/')) {
          resultUrl = await getR2SignedUrl(item.result_path);
        } else {
          const { data } = await admin.storage
            .from('batch-staging')
            .createSignedUrl(item.result_path, 604800)
          resultUrl = data?.signedUrl || null;
        }
      }
      
      if (item.source_path) {
        if (item.source_path.startsWith('http') || item.source_path.startsWith('data:')) {
          sourceUrl = item.source_path;
        } else if (item.source_path.startsWith('staging/')) {
          sourceUrl = await getR2SignedUrl(item.source_path);
        } else {
          const { data } = await admin.storage
            .from('batch-staging')
            .createSignedUrl(item.source_path, 604800)
          sourceUrl = data?.signedUrl || null;
        }
      }

      return {
        index: item.item_index,
        resultUrl,
        sourceUrl,
        status: item.status,
        error: item.error,
      }
    }),
  )

  return NextResponse.json({
    photos: photos.filter(p => p.resultUrl || p.status === 'failed')
  })
}

// Elimina una foto (item) dal batch. Se il batch resta senza item, elimina anche il batch.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const index = body?.index
  if (typeof index !== 'number') return NextResponse.json({ error: 'missing_index' }, { status: 400 })

  // Verifica proprietà del batch
  const { data: batch } = await admin
    .from('batch_staging')
    .select('id, user_id')
    .eq('id', batchId)
    .single()
  if (!batch) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (batch.user_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  // Recupera l'item per cancellare anche gli oggetti R2
  const { data: item } = await admin
    .from('batch_staging_items')
    .select('result_path, source_path')
    .eq('batch_id', batchId)
    .eq('item_index', index)
    .single()

  if (item) {
    for (const p of [item.result_path, item.source_path]) {
      if (p && typeof p === 'string' && p.startsWith('staging/')) await deleteFromR2(p)
    }
  }

  await admin.from('batch_staging_items').delete().eq('batch_id', batchId).eq('item_index', index)

  // Se non restano item, elimina il batch (così la sezione sparisce)
  const { count } = await admin
    .from('batch_staging_items')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', batchId)
  if ((count ?? 0) === 0) {
    await admin.from('batch_staging').delete().eq('id', batchId)
  }

  return NextResponse.json({ success: true, batchEmpty: (count ?? 0) === 0 })
}
