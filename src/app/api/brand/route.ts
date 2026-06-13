import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json();
    const { patch } = body;

    const { error: upsertErr } = await admin
      .from('user_brand')
      .upsert({ user_id: user.id, updated_at: new Date().toISOString(), ...patch }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('Error upserting brand:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: row } = await admin
      .from('user_brand')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!row) return NextResponse.json({ row: null, signed: {} });

    const LOGO_KEYS = ['logo_white_h', 'logo_white_v', 'logo_black_h', 'logo_black_v', 'logo_colored_h', 'logo_colored_v'];
    const signed: Record<string, string | null> = {};

    await Promise.all(LOGO_KEYS.map(async (k) => {
      const path = row[k] as string;
      if (!path) {
        signed[k] = null;
        return;
      }
      if (path.startsWith('http') || path.startsWith('data:')) {
        signed[k] = path;
        return;
      }
      const { data } = await admin.storage.from('user-brand').createSignedUrl(path, 3600 * 24);
      signed[k] = data?.signedUrl || null;
    }));

    return NextResponse.json({ row, signed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
