import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { publicUrl } from '@/lib/r2'
import { PRICING } from '@/lib/pricing'
import { unsubUrl } from '@/lib/marketingEmail'

// Email dopo la prova gratis (una volta al giorno da cron-job.org, ?secret=<TRIAL_EMAILS_SECRET>):
// giorno 1 "La tua stanza arredata ti aspetta", giorno 3 "Le case arredate si vendono prima".
// Solo a chi ha fatto la prova con l'account, ha dato il consenso al marketing e non ha comprato (niente piano ne' crediti).
// Ogni email una volta sola: il segno e' una riga in ai_usage (kind trial_email_1 / trial_email_3).
export const dynamic = 'force-dynamic'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DAY = 86_400_000
const EXAMPLE = { before: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/landing/staging-prima.jpg', after: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/landing/staging-dopo.jpg' }

const shell = (inner: string, uid: string) => `<!doctype html><html><body style="margin:0;background:#f7f7f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:28px;overflow:hidden">
<tr><td align="center" style="padding:28px 32px 8px;text-align:center"><img src="https://agenteimmo.me/immo/logo-mark.png" width="36" height="36" alt="Agente Immo" style="vertical-align:middle"> <span style="font-size:18px;font-weight:800;vertical-align:middle">Agente <span style="color:#537eec">Immo</span></span></td></tr>
${inner}
</table>
<p style="font-size:12px;color:#999;max-width:560px;line-height:1.5;margin:18px auto 0">Ricevi questa email perché hai fatto la prova gratis su agenteimmo.me e hai accettato di ricevere novità e promozioni. <a href="${unsubUrl(uid)}" style="color:#999">Non voglio più ricevere queste email</a>.</p>
</td></tr></table></body></html>`
const button = (href: string, label: string) => `<a href="${href}" style="display:inline-block;background:#537eec;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 26px;border-radius:999px">${label}</a>`

function email1(name: string, photo: string | null, uid: string) {
  return shell(`
<tr><td style="padding:16px 32px 0"><h1 style="font-size:26px;line-height:1.2;margin:0">La tua stanza arredata ti aspetta</h1></td></tr>
<tr><td style="padding:14px 32px 0;font-size:16px;line-height:1.6;color:#444">Ciao ${name}, con la prova gratis hai arredato una stanza con Agente Immo in pochi secondi. Immagina di farlo per tutte le case che hai in vendita: foto arredate, video per i social e il tuo sito, da ${PRICING.starter} € al mese.</td></tr>
${photo ? `<tr><td style="padding:22px 32px 0"><img src="${photo}" width="496" alt="La tua stanza arredata" style="width:100%;border-radius:20px;display:block"></td></tr>` : ''}
<tr><td align="center" style="padding:26px 32px 32px;text-align:center">${button('https://agenteimmo.me/it/dashboard#/piano?cambia=1', 'Scegli il tuo piano')}</td></tr>`, uid)
}
function email3(name: string, photo: string | null, uid: string) {
  return shell(`
<tr><td style="padding:16px 32px 0"><h1 style="font-size:26px;line-height:1.2;margin:0">Le case arredate si vendono prima</h1></td></tr>
<tr><td style="padding:14px 32px 0;font-size:16px;line-height:1.6;color:#444">Ciao ${name}, un annuncio con le stanze arredate si fa notare di più sui portali. Con Agente Immo trasformi una stanza vuota in pochi secondi e ne fai un video pronto per Instagram. Il tuo account è già pronto: ti basta scegliere un piano.</td></tr>
${photo ? `<tr><td style="padding:22px 32px 0"><img src="${photo}" width="496" alt="La tua prova" style="width:100%;border-radius:20px;display:block"></td></tr>` : ''}
<tr><td align="center" style="padding:26px 32px 0;text-align:center">${button('https://agenteimmo.me/it/dashboard#/piano?cambia=1', 'Riprendi da dove eri rimasto')}</td></tr>
<tr><td style="padding:28px 32px 32px"><p style="font-size:13px;color:#888;margin:0 0 10px">Un altro esempio, prima e dopo:</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="padding-right:5px"><img src="${EXAMPLE.before}" width="243" alt="Prima" style="width:100%;border-radius:14px;display:block"></td><td width="50%" style="padding-left:5px"><img src="${EXAMPLE.after}" width="243" alt="Dopo" style="width:100%;border-radius:14px;display:block"></td></tr></table></td></tr>`, uid)
}

export async function GET(req: NextRequest) {
  // in locale: ?anteprima=1 o 3 mostra l'email con una foto d'esempio
  const preview = req.nextUrl.searchParams.get('anteprima')
  if (preview && process.env.NODE_ENV === 'development') return new NextResponse((preview === '3' ? email3 : email1)('Mario', EXAMPLE.after, '00000000-0000-0000-0000-000000000000'), { headers: { 'content-type': 'text/html; charset=utf-8' } })
  const dry = req.nextUrl.searchParams.has('dry') // ?dry=1: dice a chi manderebbe, senza mandare (in locale anche senza segreto)
  // segreto dedicato a questo cron (TRIAL_EMAILS_SECRET su Vercel), quello dei social vale lo stesso
  const secret = req.nextUrl.searchParams.get('secret')
  const okSecret = !!secret && [process.env.TRIAL_EMAILS_SECRET, process.env.CRON_SECRET].some(x => !!x && x === secret)
  if (!okSecret && !(dry && process.env.NODE_ENV === 'development')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const now = Date.now()
  const out: { uid: string; step: 1 | 3; sent: boolean; why?: string }[] = []
  for (const step of [1, 3] as const) {
    // prove fatte tra `step` e `step + 2` giorni fa (il cron gira ogni giorno: finestra larga contro i giri saltati)
    const { data: trials } = await admin.from('ai_usage').select('user_id, created_at').eq('kind', 'landing_demo').eq('provider', 'counter')
      .not('user_id', 'is', null).lte('created_at', new Date(now - step * DAY).toISOString()).gte('created_at', new Date(now - (step + 2) * DAY).toISOString())
    for (const uid of [...new Set((trials ?? []).map(t => t.user_id as string))]) {
      const { count: done } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('kind', `trial_email_${step}`)
      if (done) continue
      const { data: pc } = await admin.from('platform_credits').select('plan, balance').eq('user_id', uid).maybeSingle()
      if (pc && (pc.plan !== 'none' || (pc.balance ?? 0) > 0)) { out.push({ uid, step, sent: false, why: 'ha comprato' }); continue }
      const { data: u } = await admin.auth.admin.getUserById(uid)
      const meta = (u.user?.user_metadata ?? {}) as { marketing_consent?: boolean; full_name?: string; name?: string }
      if (!u.user?.email || !meta.marketing_consent) { out.push({ uid, step, sent: false, why: 'niente consenso' }); continue }
      const { data: ph } = await admin.from('ai_usage').select('model').eq('user_id', uid).eq('kind', 'landing_demo_photo').order('created_at', { ascending: false }).limit(1).maybeSingle()
      const photo = ph?.model ? publicUrl(ph.model as string) : null
      const name = (meta.full_name || meta.name || '').split(' ')[0] || 'agente'
      if (dry) { out.push({ uid, step, sent: false, why: 'prova (dry)' }); continue }
      const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: 'Agente Immo <noreply@agenteimmo.me>', to: u.user.email,
        subject: step === 1 ? 'La tua stanza arredata ti aspetta' : 'Le case arredate si vendono prima',
        html: step === 1 ? email1(name, photo, uid) : email3(name, photo, uid),
        headers: { 'List-Unsubscribe': `<${unsubUrl(uid)}>` },
      }).catch(e => ({ error: e }))
      const ok = !('error' in r && r.error)
      if (ok) await admin.from('ai_usage').insert({ user_id: uid, kind: `trial_email_${step}`, provider: 'resend', model: 'email', duration_ms: 0, cost_usd: 0, ok: true } as never)
      out.push({ uid, step, sent: ok })
    }
  }
  return NextResponse.json({ sent: out.filter(x => x.sent).length, out })
}
