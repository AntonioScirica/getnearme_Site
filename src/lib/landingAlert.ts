import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'

// Tetto giornaliero della prova gratis raggiunto: una mail (una sola al giorno per foto e per video) con il recap di
// prove, spesa e iscritti arrivati dalla prova. Destinatario LANDING_ALERT_EMAIL su Vercel, predefinito info@agenteimmo.me.
export async function alertCapReached(admin: SupabaseClient, what: 'foto' | 'video', cap: number) {
  try {
    const day = new Date().toISOString().slice(0, 10)
    const tag = `${what}:${day}`
    const { count: sent } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', 'landing_cap_alert').eq('model', tag)
    if (sent) return
    await admin.from('ai_usage').insert({ user_id: null, kind: 'landing_cap_alert', provider: 'counter', model: tag, duration_ms: 0, cost_usd: 0, ok: true } as never)
    const since = new Date(Date.now() - 86_400_000).toISOString()
    const n = async (kind: string, extra?: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => { let q = base(kind); if (extra) q = extra(q); return (await q).count ?? 0 }
    const base = (kind: string) => admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('kind', kind)
    const [foto, video, iscritti24, iscrittiTot] = await Promise.all([
      n('landing_demo', q => q.eq('provider', 'counter').gte('created_at', since)),
      n('landing_demo_video', q => q.eq('provider', 'counter').gte('created_at', since)),
      n('landing_signup', q => q.gte('created_at', since)),
      n('landing_signup'),
    ])
    const { data: spesa } = await admin.from('ai_usage').select('cost_usd').is('user_id', null).neq('provider', 'counter').neq('provider', 'counter-fp').gte('created_at', since)
    const eur = ((spesa ?? []).reduce((t: number, r: { cost_usd: number | string }) => t + Number(r.cost_usd), 0) * 0.92).toFixed(2)
    const { data: signups } = await admin.from('ai_usage').select('user_id').eq('kind', 'landing_signup')
    const ids = (signups ?? []).map((r: { user_id: string }) => r.user_id).filter(Boolean)
    const { count: paganti } = ids.length ? await admin.from('platform_credits').select('user_id', { count: 'exact', head: true }).in('user_id', ids).neq('plan', 'none') : { count: 0 }
    const html = `<p>Oggi la prova gratis della landing ha raggiunto il tetto di <b>${cap} ${what === 'video' ? 'video' : 'foto'}</b>: fino a domani chi prova riceve "ci sono molte prove in corso".</p>
<ul>
<li>Prove ultime 24 ore: <b>${foto}</b> foto, <b>${video}</b> video</li>
<li>Spesa AI della prova ultime 24 ore: <b>${eur} €</b></li>
<li>Iscritti dalla prova: <b>${iscritti24}</b> nelle ultime 24 ore, <b>${iscrittiTot}</b> in tutto, di cui <b>${paganti ?? 0}</b> con un piano</li>
</ul>
<p>Il tetto si cambia su Vercel: LANDING_VIDEO_PER_DAY e LANDING_PHOTO_PER_DAY. Dettaglio giorno per giorno: supabase/queries/prova_landing.sql.</p>`
    if (!process.env.RESEND_API_KEY) { console.log('landing cap alert (senza Resend)', html.replace(/<[^>]+>/g, ' ')); return }
    await new Resend(process.env.RESEND_API_KEY).emails.send({ from: 'Agente Immo <noreply@agenteimmo.me>', to: process.env.LANDING_ALERT_EMAIL || 'info@agenteimmo.me', subject: `Prova gratis: tetto ${what} raggiunto (${iscritti24} iscritti nelle ultime 24 ore)`, html })
  } catch (e) {
    console.error('landing cap alert', e) // la mail non deve mai bloccare la prova
  }
}
