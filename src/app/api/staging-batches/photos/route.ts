import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getR2SignedUrl } from '@/lib/s3'
import { getTeamUserIds } from '@/lib/teamScope'

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

async function resolveUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  if (path.startsWith('staging/')) return getR2SignedUrl(path)
  const { data } = await admin.storage.from('batch-staging').createSignedUrl(path, 604800)
  return data?.signedUrl || null
}

// Foto recenti cross-batch in UNA query (invece di 1 fetch per batch, che con
// decine/centinaia di batch rendeva Contenuti recenti e Galleria lentissimi).
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 500, 500)

  const teamIds = await getTeamUserIds(admin, userId)

  const { data: batches, error: batchesErr } = await admin
    .from('batch_staging')
    .select('id, project_id, created_at')
    .in('user_id', teamIds)

  if (batchesErr) return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  const batchIds = (batches || []).map(b => b.id)
  if (!batchIds.length) return NextResponse.json({ photos: [] })

  const batchMeta = new Map((batches || []).map(b => [b.id, b]))

  const { data: items, error: itemsErr } = await admin
    .from('batch_staging_items')
    .select('batch_id, item_index, result_path, source_path, status, error, created_at')
    .in('batch_id', batchIds)
    .not('result_path', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (itemsErr) return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })

  const photos = await Promise.all((items || []).map(async (item) => ({
    batchId: item.batch_id,
    projectId: batchMeta.get(item.batch_id)?.project_id ?? null,
    index: item.item_index,
    resultUrl: await resolveUrl(item.result_path),
    sourceUrl: await resolveUrl(item.source_path),
    status: item.status,
    error: item.error,
    createdAt: item.created_at,
  })))

  return NextResponse.json({ photos: photos.filter(p => p.resultUrl || p.status === 'failed') })
}
