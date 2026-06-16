import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamUserIds } from '@/lib/teamScope'

// Job video AI persistiti server-side (tabella ai_video_jobs). Il client crea la
// riga allo start del render; il cron process-batch-staging la finalizza (anche
// a browser chiuso). Qui: create (POST) + list own (GET). Letture/scritture via
// service role; l'identita' utente arriva dal Bearer token.

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const FN_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`
const CRON_SECRET = process.env.BATCH_STAGING_CRON_SECRET || ''

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

type Row = {
  id: string
  project_id: string | null
  title: string
  template: string
  aspect: string
  status: string
  progress: number
  ctx: Record<string, unknown>
  output_url: string | null
  error: string | null
  created_at: string
}

const toClient = (r: Row) => ({
  id: r.id,
  title: r.title,
  template: r.template,
  stage: r.status === 'done' ? 'done' : r.status === 'failed' ? 'failed' : 'render',
  progress: r.progress,
  ctx: r.ctx || {},
  outputUrl: r.output_url || undefined,
  error: r.error || undefined,
  projectId: r.project_id,
  aspect: r.aspect,
  createdAt: Date.parse(r.created_at) || Date.now(),
})

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Galleria condivisa col team (agenzia): video AI visibili a tutti i membri.
    const teamIds = await getTeamUserIds(admin, userId)
    const { data, error } = await admin
      .from('ai_video_jobs')
      .select('id, project_id, title, template, aspect, status, progress, ctx, output_url, error, created_at')
      .in('user_id', teamIds)
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      console.error('video-jobs GET error:', error)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
    return NextResponse.json({ jobs: (data || []).map(r => toClient(r as Row)) })
  } catch (err) {
    console.error('video-jobs GET exception:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    // Elimina solo la riga propria. L'MP4 su R2 (bucket del Lambda) viene potato
    // da cleanup-ai-videos entro 30gg: rimuovere la riga lo nasconde subito da
    // Media, lo storage si libera comunque.
    // Galleria condivisa: un membro del team può eliminare i video del team.
    const teamIds = await getTeamUserIds(admin, userId)
    const { error } = await admin
      .from('ai_video_jobs')
      .delete()
      .eq('id', id)
      .in('user_id', teamIds)

    if (error) {
      console.error('video-jobs DELETE error:', error)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('video-jobs DELETE exception:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const id = typeof body.id === 'string' ? body.id : null
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const status = body.status === 'done' ? 'done' : body.status === 'failed' ? 'failed' : 'rendering'
    const outputUrl = typeof body.outputUrl === 'string' && body.outputUrl.startsWith('http') ? body.outputUrl : null

    const { error } = await admin
      .from('ai_video_jobs')
      .upsert({
        id,
        user_id: userId,
        project_id: typeof body.projectId === 'string' ? body.projectId : null,
        title: typeof body.title === 'string' ? body.title.slice(0, 160) : '',
        template: typeof body.template === 'string' ? body.template.slice(0, 40) : '',
        aspect: body.aspect === 'landscape' ? 'landscape' : 'portrait',
        status,
        progress: status === 'done' ? 1 : (typeof body.progress === 'number' ? body.progress : 0.1),
        ctx: body.ctx && typeof body.ctx === 'object' ? body.ctx : {},
        output_url: outputUrl,
        quota_committed: status === 'done',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      console.error('video-jobs POST error:', error)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }

    // Render sincrono gia' completo allo start: la quota va committata subito
    // (il cron processa solo le righe 'rendering', quindi non passerebbe di qui).
    if (status === 'done' && CRON_SECRET) {
      try {
        await fetch(`${FN_BASE}/render-ai-video-final`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON_SECRET, 'x-user-id': userId },
          body: JSON.stringify({ mode: 'commit-quota', template: body.template, aiModel: (body.ctx as any)?.aiModel }),
        })
      } catch (e) {
        console.error('video-jobs commit-quota (sync) failed:', (e as Error)?.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('video-jobs POST exception:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
