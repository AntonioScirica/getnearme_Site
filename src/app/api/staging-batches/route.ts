import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: batches, error } = await admin
    .from('batch_staging')
    .select('id, style, custom_prompt, status, total_items, completed_items, failed_items, project_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }

  // Convert snake_case to camelCase
  const formattedBatches = batches?.map(b => ({
    id: b.id,
    style: b.style,
    customPrompt: b.custom_prompt,
    status: b.status,
    totalItems: b.total_items,
    completedItems: b.completed_items,
    failedItems: b.failed_items,
    projectId: b.project_id,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  })) || []

  return NextResponse.json({ batches: formattedBatches })
}
