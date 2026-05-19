import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
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

    const typeLabel = type === 'bug' ? 'Bug Report' : 'Supporto';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; border-bottom: 3px solid #f59e0b; padding-bottom: 12px;">
          Nuova richiesta ${escapeHtml(typeLabel)}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666; width: 140px;"><strong>Tipo:</strong></td>
            <td style="padding: 10px 0;">
              <span style="background: ${type === 'bug' ? '#fef2f2' : '#eff6ff'}; color: ${type === 'bug' ? '#dc2626' : '#2563eb'}; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                ${escapeHtml(typeLabel)}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 10px 0;"><a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666; vertical-align: top;"><strong>Messaggio:</strong></td>
            <td style="padding: 10px 0; white-space: pre-wrap;">${escapeHtml(message.trim())}</td>
          </tr>
        </table>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Inviato dal form assistenza di getnearme.it</p>
      </div>
    `;

    await resend.emails.send({
      from: 'GetNearMe <noreply@getnearme.it>',
      to: 'info@getnearme.it',
      replyTo: email.trim(),
      subject: `[${typeLabel}] Richiesta assistenza da ${email.trim()}`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Support request error:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
