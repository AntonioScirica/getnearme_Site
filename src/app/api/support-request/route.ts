import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { email, type, message } = body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }
    if (!type || !['support', 'bug'].includes(type)) {
      return NextResponse.json({ error: 'Tipo richiesta non valido' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Messaggio troppo corto (min 10 caratteri)' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Messaggio troppo lungo (max 5000 caratteri)' }, { status: 400 });
    }

    // Call the Supabase Edge Function that handles emails (used by the Chrome Extension)
    const res = await fetch(`${supabaseUrl}/functions/v1/send-support-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        type: type,
        message: message.trim(),
        user_email: email.trim(),
        user_name: 'Utente Web App'
      })
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('Edge function failed to send email:', errorData);
      return NextResponse.json({ error: 'Failed to send email via edge function' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Support request error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
