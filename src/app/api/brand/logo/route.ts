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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const logoKey = formData.get('logoKey') as string;
    
    if (!file || !logoKey) return NextResponse.json({ error: 'bad request' }, { status: 400 });

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/svg+xml' ? 'svg' : 'png';
    const path = `${user.id}/${logoKey}_${Date.now()}.${ext}`;

    const { error: upErr } = await admin.storage.from('user-brand').upload(path, file, { contentType: file.type, upsert: true });
    
    if (upErr) {
      console.error('Error uploading logo:', upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Now upsert the DB path
    const { error: dbErr } = await admin.from('user_brand').upsert(
      { user_id: user.id, [logoKey]: path, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    if (dbErr) {
      console.error('Error updating DB with logo:', dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, path });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
