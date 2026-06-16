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

// Registra un export (post/video) in export_events: alimenta i counter delle metrics.
// export_type: 'post_png' | 'post_video' | 'staging_photo' | 'staging_video' | 'pdf_report' | 'zone_analysis'
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const exportType = String(body.export_type || '').trim()
    const ALLOWED = new Set(['post_png', 'post_video', 'staging_photo', 'staging_video', 'pdf_report', 'zone_analysis'])
    if (!ALLOWED.has(exportType)) {
      return NextResponse.json({ error: 'invalid_export_type' }, { status: 400 })
    }

    const row: Record<string, unknown> = {
      user_id: userId,
      export_type: exportType,
      width: typeof body.width === 'number' ? body.width : null,
      height: typeof body.height === 'number' ? body.height : null,
      format: body.format ? String(body.format).slice(0, 40) : null,
      template: body.template ? String(body.template).slice(0, 80) : null,
    }

    const { error } = await admin.from('export_events').insert(row)
    if (error) {
      console.error('track-export insert error:', error)
      return NextResponse.json({ error: 'internal_error' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('track-export error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
