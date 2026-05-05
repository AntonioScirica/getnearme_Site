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
    const { nome, email, nomeAgenzia, telefono, messaggio } = body;

    // Validate required fields
    if (!nome || typeof nome !== 'string' || nome.trim().length < 2) {
      return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }
    if (!nomeAgenzia || typeof nomeAgenzia !== 'string' || nomeAgenzia.trim().length < 2) {
      return NextResponse.json({ error: 'Nome agenzia richiesto' }, { status: 400 });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e; border-bottom: 3px solid #f59e0b; padding-bottom: 12px;">
          Nuova richiesta demo agenzia
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #666; width: 140px;"><strong>Nome:</strong></td>
            <td style="padding: 10px 0;">${escapeHtml(nome.trim())}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>Email:</strong></td>
            <td style="padding: 10px 0;"><a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #666;"><strong>Agenzia:</strong></td>
            <td style="padding: 10px 0;">${escapeHtml(nomeAgenzia.trim())}</td>
          </tr>
          ${telefono ? `<tr>
            <td style="padding: 10px 0; color: #666;"><strong>Telefono:</strong></td>
            <td style="padding: 10px 0;">${escapeHtml(String(telefono).trim())}</td>
          </tr>` : ''}
          ${messaggio ? `<tr>
            <td style="padding: 10px 0; color: #666; vertical-align: top;"><strong>Messaggio:</strong></td>
            <td style="padding: 10px 0;">${escapeHtml(String(messaggio).trim())}</td>
          </tr>` : ''}
        </table>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Inviato dal form demo di getnearme.it</p>
      </div>
    `;

    await resend.emails.send({
      from: 'GetNearMe <noreply@getnearme.it>',
      to: 'info@getnearme.it',
      replyTo: email.trim(),
      subject: `Nuova richiesta demo — ${nomeAgenzia.trim()}`,
      html: htmlBody,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Demo request error:', err);
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
