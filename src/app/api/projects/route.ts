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

  const { data: projects, error } = await admin
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }

  // Convert to camelCase format expected by the frontend
  const formattedProjects = projects?.map(p => ({
    id: p.id,
    nome: p.nome,
    addr: p.addr,
    prezzo: p.prezzo,
    mq: p.mq,
    bagni: p.bagni,
    camere: p.camere,
    titolo: p.titolo,
    cover: p.cover,
    icons: p.icons,
    createdAt: p.created_at,
  })) || []

  return NextResponse.json({ projects: formattedProjects })
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

  const { nome, addr, prezzo, mq, bagni, camere, titolo, cover, icons } = body

  if (!nome) {
    return NextResponse.json({ error: 'missing_name' }, { status: 400 })
  }

  const { data: project, error } = await admin
    .from('projects')
    .insert({
      user_id: userId,
      nome,
      addr: addr || '',
      prezzo: typeof prezzo === 'number' ? prezzo : 0,
      mq: typeof mq === 'number' ? mq : 0,
      bagni: typeof bagni === 'number' ? bagni : 0,
      camere: typeof camere === 'number' ? camere : 0,
      titolo: titolo || '',
      cover: cover || '',
      icons: icons || { prezzo: 'euro', mq: 'maximize-2', camere: 'bed', bagni: 'bath' },
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'internal_server_error', details: error.message }, { status: 500 })
  }

  const formattedProject = {
    id: project.id,
    nome: project.nome,
    addr: project.addr,
    prezzo: project.prezzo,
    mq: project.mq,
    bagni: project.bagni,
    camere: project.camere,
    titolo: project.titolo,
    cover: project.cover,
    icons: project.icons,
    createdAt: project.created_at,
  }

  return NextResponse.json({ project: formattedProject })
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { id, nome, addr, prezzo, mq, bagni, camere, titolo, cover, icons } = body

  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  }

  const updates: any = { updated_at: new Date().toISOString() }
  if (nome !== undefined) updates.nome = nome
  if (addr !== undefined) updates.addr = addr
  if (prezzo !== undefined) updates.prezzo = typeof prezzo === 'number' ? prezzo : 0
  if (mq !== undefined) updates.mq = typeof mq === 'number' ? mq : 0
  if (bagni !== undefined) updates.bagni = typeof bagni === 'number' ? bagni : 0
  if (camere !== undefined) updates.camere = typeof camere === 'number' ? camere : 0
  if (titolo !== undefined) updates.titolo = titolo
  if (cover !== undefined) updates.cover = cover
  if (icons !== undefined) updates.icons = icons

  const { data: project, error } = await admin
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'internal_server_error', details: error.message }, { status: 500 })
  }

  const formattedProject = {
    id: project.id,
    nome: project.nome,
    addr: project.addr,
    prezzo: project.prezzo,
    mq: project.mq,
    bagni: project.bagni,
    camere: project.camere,
    titolo: project.titolo,
    cover: project.cover,
    icons: project.icons,
    createdAt: project.created_at,
  }

  return NextResponse.json({ project: formattedProject })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await admin
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'internal_server_error', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
