// Email con la valutazione della casa (pagina /it/quanto-vale-la-mia-casa): intervallo, valore centrale, euro al m²,
// da dove vengono i prezzi (zona OMI e semestre) e le correzioni applicate. Blocchi di emailLayout piu' due righe su misura.
import { email, eyebrow, title, text, button, ps, toText } from '@/lib/emailLayout'
import { DISCLAIMER, eur, type Place, type ValuationInput, type ValuationResult } from '@/lib/valuation'

const BLUE = '#537eec'
const INK = '#1d1d1f'
const FONT = "'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const TIPO: Record<ValuationInput['tipo'], string> = { appartamento: 'Appartamento', attico: 'Attico', villa: 'Villa o villino', schiera: 'Villetta a schiera' }
const STATO: Record<ValuationInput['stato'], string> = { da_ristrutturare: 'da ristrutturare', buono: 'in buono stato', ristrutturato: 'ristrutturata da poco', nuovo: 'nuova costruzione' }

// blocco blu col valore: minimo, centrale, massimo
const range = (r: ValuationResult) => `<tr><td style="padding:26px 28px 0"><table width="100%" cellpadding="0" cellspacing="0" style="background:${BLUE};background-image:linear-gradient(135deg,#5f8af2,#4a6fe0);border-radius:24px">
<tr><td align="center" style="padding:26px 22px 0;font-family:${FONT};text-align:center"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8)">Valore stimato</div>
<div style="font-size:38px;font-weight:800;letter-spacing:-.02em;color:#ffffff;line-height:1.15;padding-top:6px">${eur(r.value)}</div>
<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,.85);padding-top:4px">circa ${eur(r.eurMq)} al m² per ${r.mq} m²</div></td></tr>
<tr><td style="padding:18px 18px 20px"><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="48%" style="background:#ffffff;border-radius:18px;padding:14px 16px;font-family:${FONT};text-align:center"><div style="font-size:12px;font-weight:700;color:#8a8a8f">MINIMO</div><div style="font-size:22px;font-weight:800;color:${INK};padding-top:2px">${eur(r.min)}</div></td>
<td width="4%"></td>
<td width="48%" style="background:#ffffff;border-radius:18px;padding:14px 16px;font-family:${FONT};text-align:center"><div style="font-size:12px;font-weight:700;color:#8a8a8f">MASSIMO</div><div style="font-size:22px;font-weight:800;color:${INK};padding-top:2px">${eur(r.max)}</div></td>
</tr></table></td></tr></table></td></tr>`

// tabella delle correzioni (+5%, -8%...)
const factorRows = (r: ValuationResult) => {
  const rows = r.factors.length ? r.factors : [{ label: 'Nessuna correzione: casa nella media della zona', pct: 0 }]
  return `<tr><td style="padding:22px 40px 0"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;border-radius:22px">
<tr><td colspan="2" style="padding:18px 20px 6px;font-family:${FONT};font-size:14px;font-weight:800;color:${INK}">Le correzioni applicate</td></tr>
${rows.map(f => `<tr><td style="padding:6px 0 6px 20px;font-family:${FONT};font-size:14px;color:#55555a">${esc(f.label)}</td><td align="right" style="padding:6px 20px 6px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${f.pct > 0 ? '#1a7f4b' : f.pct < 0 ? '#c0392b' : '#8a8a8f'};white-space:nowrap"> ${f.pct > 0 ? '+' : ''}${f.pct}%</td></tr>`).join('')}
<tr><td colspan="2" style="height:14px;line-height:14px;font-size:0">&nbsp;</td></tr></table></td></tr>`
}

// da dove vengono i prezzi: zona OMI, media delle zone del comune, oppure prezzo medio del comune (riserva)
function source(r: ValuationResult) {
  const o = r.omi, b = `<strong style="color:${INK}">Da dove vengono i prezzi.</strong> `
  const sup = o.superficie === 'netta' ? ' (superficie netta)' : ''
  if (o.media) return `${b}Il prezzo medio OMI delle abitazioni nel comune di ${esc(o.comune)} è di ${eur(o.media)} al m² (${esc(o.semestre)}). Non avendo ancora i prezzi della singola zona, consideriamo un margine del 15% in più e in meno, da ${eur(o.min)} a ${eur(o.max)} al m², e poi applichiamo le correzioni qui sotto. Fonte: ${esc(o.fonte)}.`
  const where = o.level === 'zona' ? `nella zona OMI ${esc(o.zona)}${o.zonaDescr ? ` (${esc(o.zonaDescr.toLowerCase())})` : ''} di ${esc(o.comune)}` : `nel comune di ${esc(o.comune)} (media delle zone)`
  return `${b}Le quotazioni OMI dell'Agenzia delle Entrate (${esc(o.semestre)}) danno per ${esc(o.tipologia.toLowerCase())} ${where} da ${eur(o.min)} a ${eur(o.max)} al m²${sup}, per case in stato normale. Su questi valori abbiamo applicato le correzioni qui sotto. Fonte: ${esc(o.fonte)}.`
}

const where = (i: ValuationInput, p: Place) => `<strong style="color:${INK}">${esc(i.address)}</strong>${i.address.toLowerCase().includes(p.comune.toLowerCase()) ? '' : ` (${esc(p.comune)})`}`

export function valuationEmail(o: { input: ValuationInput; place: Place; result: ValuationResult | null; name: string; consentAgents: boolean }) {
  const { input: i, place, result: r } = o
  const hi = o.name ? `Ciao ${esc(o.name.split(' ')[0])},` : 'Ciao,'
  const what = `${TIPO[i.tipo]} di ${i.mq} m², ${i.locali === 5 ? '5 o più' : i.locali} ${i.locali === 1 ? 'locale' : 'locali'}, ${STATO[i.stato]}`
  const agent = o.consentAgents
    ? text(`<strong style="color:${INK}">Vuoi vendere?</strong> Ci hai chiesto di essere ricontattato: un agente immobiliare della tua zona che lavora con Agente Immo potrà scriverti o chiamarti per vedere la casa e darti un prezzo preciso, senza impegno.`)
    : ''
  const body = r
    ? eyebrow('Valutazione gratuita')
      + title('Quanto vale la tua casa')
      + text(`${hi} ecco la stima per ${where(i, place)}: ${esc(what)}.`)
      + range(r)
      + text(source(r))
      + factorRows(r)
      + text(`<span style="font-size:14px">${DISCLAIMER} Il prezzo vero dipende anche da cose che da qui non vediamo: luce, vista, rumore, spese condominiali, documenti in regola. Per un prezzo preciso serve un sopralluogo.</span>`)
      + agent
      + button('https://agenteimmo.me/it/quanto-vale-la-mia-casa', 'Valuta un\'altra casa')
      + ps('Le quotazioni OMI sono pubbliche e aggiornate ogni sei mesi: sono il riferimento pubblico più usato per farsi una prima idea del valore di una casa.')
    : eyebrow('Valutazione gratuita')
      + title('Abbiamo ricevuto la tua richiesta')
      + text(`${hi} per ${where(i, place)} non abbiamo ancora le quotazioni OMI della zona, quindi non possiamo darti una stima affidabile in automatico. Non inventiamo prezzi: preferiamo dirtelo.`)
      + (o.consentAgents ? agent : text('Se vuoi, rispondi a questa email: ti aiutiamo a capire il valore della casa in un altro modo.'))
  const html = email({ preheader: r ? `Tra ${eur(r.min)} e ${eur(r.max)}: la stima della tua casa e come l'abbiamo calcolata.` : 'Abbiamo ricevuto la tua richiesta di valutazione.', body, footer: 'Ricevi questa email perché hai chiesto una valutazione su agenteimmo.me.' })
  return { subject: r ? `La tua casa vale circa ${eur(r.value)}` : 'La tua richiesta di valutazione', html, text: toText(html) }
}
