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
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')

  let query = admin.from('media').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: media, error } = await query

  if (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }

  return NextResponse.json({ media })
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { project_id, url, type } = body

  if (!url || !type) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const { data: media, error } = await admin
    .from('media')
    .insert({
      user_id: userId,
      project_id: project_id || null,
      url,
      type
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating media:', error)
    return NextResponse.json({ error: 'internal_server_error', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ media })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await admin
    .from('media')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'internal_server_error', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
