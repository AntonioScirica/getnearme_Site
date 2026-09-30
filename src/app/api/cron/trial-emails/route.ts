import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { publicUrl } from '@/lib/r2'
import { PRICING } from '@/lib/pricing'
import { unsubUrl } from '@/lib/marketingEmail'
import { beforeAfter, button, email, eyebrow, features, photo as photo_, text, title } from '@/lib/emailLayout'

// Email dopo la prova gratis (una volta al giorno da cron-job.org, ?secret=<TRIAL_EMAILS_SECRET>):
// giorno 1 "La tua stanza arredata ti aspetta", giorno 3 "Le case arredate si vendono prima".
// Solo a chi ha fatto la prova con l'account, ha dato il consenso al marketing e non ha comprato (niente piano ne' crediti).
// Ogni email una volta sola: il segno e' una riga in ai_usage (kind trial_email_1 / trial_email_3).
export const dynamic = 'force-dynamic'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DAY = 86_400_000
const EXAMPLE = { before: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/landing/staging-prima.jpg', after: 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/landing/staging-dopo.jpg' }

const hi = (name: string) => (name ? `Ciao ${name},` : 'Ciao,')
const PLANS = 'https://agenteimmo.me/it/dashboard#/piano?cambia=1'
const unsub = (uid: string) => `Ricevi questa email perché hai fatto la prova gratis su agenteimmo.me e hai accettato di ricevere novità e promozioni. <a href="${unsubUrl(uid)}" style="color:#9a9a9f">Non voglio più ricevere queste email</a>.`

// giorno 1: la sua stanza, e l'idea di farlo per tutte le case
function email1(name: string, photo: string | null, uid: string) {
  return email({
    preheader: 'Ora immagina tutte le case che hai in vendita, arredate così.',
    body: eyebrow('La tua prova')
      + title('La tua stanza arredata è pronta')
      + text(`${hi(name)} con la prova gratis hai arredato una stanza in pochi secondi. Immagina di farlo per <strong style="color:#1d1d1f">tutte le case che hai in vendita</strong>: foto arredate, video per i social e il tuo sito, in un posto solo.`)
      + (photo ? photo_(photo, 'La tua stanza arredata', 'La tua foto, arredata con Agente Immo') : '')
      + button(PLANS, 'Arreda tutte le tue case', `Da ${PRICING.starter} € al mese · disdici quando vuoi`),
    footer: unsub(uid),
  })
}
// giorno 3: cosa si fa con la piattaforma, poi un altro prima e dopo
function email3(name: string, photo: string | null, uid: string) {
  return email({
    preheader: 'Foto arredate, video e sito: tutto quello che serve al tuo annuncio.',
    body: eyebrow('Cosa puoi fare')
      + title('Le case arredate si vendono prima')
      + text(`${hi(name)} un annuncio con le stanze arredate si fa notare di più sui portali. Con Agente Immo lo prepari in pochi minuti, e il tuo account è già pronto.`)
      + features([
        ['Foto arredate in pochi secondi', 'Stanze vuote o datate diventano pronte per l’annuncio, nello stile che scegli.'],
        ['Video per Instagram e TikTok', 'Dalla stessa foto un reel prima e dopo, pronto da pubblicare.'],
        ['Il tuo sito da agente', 'Tutte le tue case online a un tuo indirizzo, da mandare ai clienti.'],
      ])
      + (photo ? photo_(photo, 'La tua prova', 'La stanza che hai arredato con la prova') : '')
      + button(PLANS, 'Riprendi da dove eri rimasto', `Da ${PRICING.starter} € al mese · disdici quando vuoi`)
      + beforeAfter(EXAMPLE.before, EXAMPLE.after, 'Un altro esempio'),
    footer: unsub(uid),
  })
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
      const { data: brand } = await admin.from('user_brand').select('display_name').eq('user_id', uid).maybeSingle()
      const name = ((brand?.display_name as string | null) || meta.full_name || meta.name || '').trim().split(/\s+/)[0] ?? ''
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
