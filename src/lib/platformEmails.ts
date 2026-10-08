import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { button, email, eyebrow, features, planChoice, text, title, toText } from '@/lib/emailLayout'
import { PLAN_CREDITS } from '@/lib/credits'
import { photosFor, videosFor } from '@/lib/pricing'

// Email degli acquisti della piattaforma (le manda il webhook Stripe dei piani). Transazionali: niente consenso,
// partono a tutti i clienti. Un errore di invio non blocca il webhook (i crediti contano piu' dell'email).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const APP = 'https://agenteimmo.me/it/dashboard'
const NAMES = { starter: 'Starter', plus: 'Plus', pro: 'Pro' } as const
type Plan = keyof typeof NAMES
const hi = (n: string) => (n ? `Ciao ${n},` : 'Ciao,')
const day = (d: Date) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
const credits = (plan: Plan) => PLAN_CREDITS[plan] ?? 0
const choice = (plan: Plan, lead: string) => planChoice(lead, `${credits(plan)} crediti ogni mese, da usare come vuoi`, [`${photosFor(credits(plan))}`, 'foto arredate'], [`${videosFor(credits(plan))}`, 'video per i social'])
const withSite = (p: Plan) => p === 'plus' || p === 'pro'

export type PlatformEmail =
  | { kind: 'plan_started'; plan: Plan }
  | { kind: 'plan_changed'; plan: Plan }
  | { kind: 'pack'; credits: number }
  | { kind: 'cancel_scheduled'; plan: Plan; until: Date }
  | { kind: 'plan_ended' }
  | { kind: 'payment_failed'; plan: Plan }
  | { kind: 'affiliate_used'; code: string; credits: number; uses: number }
  | { kind: 'welcome'; credits: number }

function build(e: PlatformEmail, name: string): { subject: string; html: string } {
  switch (e.kind) {
    // benvenuto di chi si iscrive dal sito (08/10/2026: prima riceveva quello dell'estensione, con funzioni che qui non ci sono)
    case 'welcome': return { subject: e.credits ? `Benvenuto in Agente Immo: hai ${e.credits} crediti per provare` : 'Benvenuto in Agente Immo', html: email({
      preheader: e.credits ? `${photosFor(e.credits)} foto arredate o un video per i social, gratis.` : 'Foto arredate, video per i social e il tuo sito da agente.',
      body: eyebrow('Benvenuto') + title('Il tuo account è pronto')
        + text(`${hi(name)} benvenuto in Agente Immo.${e.credits ? ` Ti abbiamo regalato <strong style="color:#1d1d1f">${e.credits} crediti</strong> per provare tutto: bastano per ${photosFor(e.credits)} foto arredate oppure per un video Prima e dopo.` : ''}`)
        + features([
          ['Arreda o svuota una stanza', 'In chat carichi la foto e scrivi come la vuoi: in pochi secondi è pronta per l’annuncio.'],
          ['Crea un video per i social', 'Dalla stessa foto un reel prima e dopo, pronto per Instagram e TikTok.'],
          ['Prepara il tuo sito da agente', 'In Il mio sito scegli il modello e lo personalizzi. Con Plus e Pro va online al tuo indirizzo.'],
        ])
        + button(`${APP}#/staging`, 'Arreda la prima stanza', 'Ci vogliono pochi secondi'),
    }) }
    case 'plan_started': return { subject: `Benvenuto in Agente Immo ${NAMES[e.plan]}`, html: email({
      preheader: `Il tuo piano è attivo: ${credits(e.plan)} crediti pronti da usare.`,
      body: eyebrow('Piano attivo') + title(`Benvenuto in ${NAMES[e.plan]}`)
        + text(`${hi(name)} grazie per aver scelto Agente Immo. Il tuo piano è attivo e i crediti sono già nel tuo account. La fattura arriva a parte da Stripe.`)
        + choice(e.plan, `${NAMES[e.plan]} · si ricaricano ogni mese`)
        + features([
          ['Arreda una stanza', 'In chat carichi la foto e scrivi come la vuoi: in pochi secondi è pronta.'],
          ['Crea un video per i social', 'Dalla stessa foto un reel prima e dopo, pronto per Instagram e TikTok.'],
          withSite(e.plan) ? ['Pubblica il tuo sito', 'In Il mio sito scegli il modello e accendi il tuo indirizzo: le case in vetrina vanno online da sole.'] : ['Metti in vetrina i tuoi immobili', 'Foto, descrizione e report da mandare ai clienti, tutto in un posto.'],
        ])
        + button(`${APP}#/staging`, 'Inizia ora'),
    }) }
    case 'plan_changed': return { subject: `Ora hai Agente Immo ${NAMES[e.plan]}`, html: email({
      preheader: `Piano cambiato: ora hai ${credits(e.plan)} crediti ogni mese.`,
      body: eyebrow('Piano aggiornato') + title(`Ora hai ${NAMES[e.plan]}`)
        + text(`${hi(name)} il cambio di piano è fatto: da adesso i tuoi crediti sono quelli di ${NAMES[e.plan]}.${withSite(e.plan) ? ' Il tuo sito è incluso: lo pubblichi da Il mio sito.' : ''}`)
        + choice(e.plan, `${NAMES[e.plan]} · si ricaricano ogni mese`)
        + button(APP, 'Vai alla piattaforma'),
    }) }
    case 'pack': return { subject: `Hai ${e.credits} crediti in più`, html: email({
      preheader: 'I crediti del pacchetto non scadono con il mese.',
      body: eyebrow('Pacchetto acquistato') + title(`${e.credits} crediti in più`)
        + text(`${hi(name)} i crediti del pacchetto sono già nel tuo saldo e <strong style="color:#1d1d1f">non scadono</strong> con il rinnovo del mese: restano finché non li usi.`)
        + planChoice('Il tuo pacchetto', `${e.credits} crediti, da usare come vuoi`, [`${photosFor(e.credits)}`, 'foto arredate'], [`${videosFor(e.credits)}`, 'video per i social'])
        + button(`${APP}#/staging`, 'Usali ora'),
    }) }
    case 'cancel_scheduled': return { subject: 'Abbiamo ricevuto la tua disdetta', html: email({
      preheader: `Il piano resta attivo fino al ${day(e.until)}.`,
      body: eyebrow('Disdetta') + title('Il tuo piano resta attivo fino alla scadenza')
        + text(`${hi(name)} abbiamo ricevuto la disdetta di ${NAMES[e.plan]}. Non ti addebiteremo altro: puoi continuare a usare Agente Immo fino al <strong style="color:#1d1d1f">${day(e.until)}</strong>.`)
        + text('I crediti dei pacchetti che hai comprato restano nel tuo account anche dopo. Se cambi idea riattivi il piano con un clic, prima della scadenza.')
        + button(`${APP}#/piano`, 'Gestisci il piano'),
    }) }
    case 'plan_ended': return { subject: 'Il tuo piano Agente Immo è terminato', html: email({
      preheader: 'Le tue case e il tuo lavoro restano nel tuo account.',
      body: eyebrow('Piano terminato') + title('Il tuo piano è terminato')
        + text(`${hi(name)} il tuo abbonamento è terminato. I tuoi immobili, la Galleria e i crediti dei pacchetti che hai comprato restano nel tuo account.`)
        + text('Quando vuoi ripartire scegli di nuovo un piano: ritrovi tutto come l’hai lasciato.')
        + button(`${APP}#/piano?cambia=1`, 'Scegli un piano'),
    }) }
    // all'affiliato quando qualcuno usa il suo codice: anonima, niente nome ne' email di chi l'ha usato
    case 'affiliate_used': return { subject: `Qualcuno ha usato il tuo codice: +${e.credits} crediti`, html: email({
      preheader: `Il codice ${e.code} ti ha fatto guadagnare ${e.credits} crediti.`,
      body: eyebrow('Codice affiliato') + title(`+${e.credits} crediti per te`)
        + text(`${hi(name)} un agente ha appena usato il tuo codice <strong style="color:#1d1d1f;white-space:nowrap">${e.code}</strong>. I ${e.credits} crediti sono già nel tuo saldo e <strong style="color:#1d1d1f">non scadono</strong> con il mese.`)
        + planChoice('Con questi crediti fai', `${e.credits} crediti, da usare come vuoi`, [`${photosFor(e.credits)}`, 'foto arredate'], [`${videosFor(e.credits)}`, 'video per i social'])
        + text(`Finora il tuo codice è stato usato da <strong style="color:#1d1d1f">${e.uses} ${e.uses === 1 ? 'persona' : 'persone'}</strong>, per un totale di <strong style="color:#1d1d1f">${String(e.uses * e.credits).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} crediti</strong>. Continua a condividerlo: ogni agente che lo inserisce riceve crediti anche lui, e tu ne ricevi altri.`)
        + button(`${APP}#/staging`, 'Usa i tuoi crediti'),
    }) }
    case 'payment_failed': return { subject: 'Pagamento non riuscito: aggiorna la carta', html: email({
      preheader: 'Aggiorna il metodo di pagamento per non interrompere il piano.',
      body: eyebrow('Pagamento') + title('Il pagamento non è andato a buon fine')
        + text(`${hi(name)} non siamo riusciti a rinnovare il tuo piano ${NAMES[e.plan]}: la carta potrebbe essere scaduta o senza fondi. Stripe riproverà nei prossimi giorni.`)
        + text('Per non interrompere il piano aggiorna il metodo di pagamento da <strong style="color:#1d1d1f">Il tuo piano → Gestisci abbonamento</strong>.')
        + button(`${APP}#/piano`, 'Aggiorna il pagamento'),
    }) }
  }
}

export async function sendPlatformEmail(userId: string, e: PlatformEmail) {
  try {
    const [{ data: u }, { data: brand }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from('user_brand').select('display_name').eq('user_id', userId).maybeSingle(),
    ])
    const to = u.user?.email
    if (!to) return
    const meta = (u.user?.user_metadata ?? {}) as { full_name?: string; name?: string }
    const name = ((brand?.display_name as string | null) || meta.full_name || meta.name || '').trim().split(/\s+/)[0] ?? ''
    const { subject, html } = build(e, name)
    const r = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: 'Agente Immo <noreply@agenteimmo.me>', to, replyTo: 'info@agenteimmo.me', subject, html, text: toText(html) })
    if (r.error) console.error('email piattaforma', e.kind, r.error)
  } catch (err) {
    console.error('email piattaforma', e.kind, err)
  }
}

// anteprima (pagina delle email in locale)
export const previewPlatformEmail = (e: PlatformEmail) => build(e, 'Mario')
