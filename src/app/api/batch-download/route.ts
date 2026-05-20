import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  const batch = req.nextUrl.searchParams.get('batch')
  const token = req.nextUrl.searchParams.get('token')

  if (!batch || !token) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 })
  }

  const { data: batchData, error: batchErr } = await supabase
    .from('batch_staging')
    .select('id, style, total_items, completed_items, failed_items, status, created_at')
    .eq('id', batch)
    .eq('download_token', token)
    .single()

  if (batchErr || !batchData) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: items } = await supabase
    .from('batch_staging_items')
    .select('item_index, result_path, status')
    .eq('batch_id', batch)
    .eq('status', 'completed')
    .order('item_index', { ascending: true })

  const completedItems = (items || []).filter(i => i.result_path)

  const photos = await Promise.all(
    completedItems.map(async (item) => {
      const { data } = await supabase.storage
        .from('batch-staging')
        .createSignedUrl(item.result_path!, 7 * 24 * 60 * 60)
      return {
        index: item.item_index,
        url: data?.signedUrl || null,
      }
    }),
  )

  return NextResponse.json({
    style: batchData.style,
    total: batchData.total_items,
    completed: batchData.completed_items,
    failed: batchData.failed_items,
    status: batchData.status,
    createdAt: batchData.created_at,
    photos: photos.filter(p => p.url),
  })
}
