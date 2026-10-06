import type { SocialId } from '@/lib/socialRules'

// Testo del post senza AI: schema fisso riempito coi dati dell'immobile. Lo usa social-caption quando il tetto
// giornaliero e' finito o l'AI non risponde, cosi' l'agente ha sempre un testo da copiare (deciso il 06/10/2026).
// ponytail: testi tutti uguali salvo i dati, i punti forti della descrizione li coglie solo l'AI
type F = Record<string, unknown>
const s = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '')
const num = (v: unknown) => Number(s(v).replace(/[^\d]/g, '')) || 0
const tag = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

// prime frasi della descrizione entro n caratteri, tagliate a frase intera
function intro(d: string, n: number) {
  const parts = d.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g) ?? []
  let out = ''
  for (const p of parts) { if ((out + p).length > n) break; out += p }
  return out.trim()
}

export function plainCaption(f: F, social: SocialId): string {
  const tipo = s(f.tipologia) || 'Immobile'
  const zona = s(f.zona)
  const rent = s(f.contratto) === 'Affitto'
  const head = `${tipo}${zona ? ` a ${zona}` : ''}`
  const stato = s(f.stato)
  const tel = s(f.telefono)
  const tags = [...new Set([...zona.split(',').map(tag), tag(tipo), f.stato ? tag(s(f.stato)) : rent ? 'casainaffitto' : 'casainvendita', 'immobiliare'].filter(t => t.length > 2))]

  if (stato === 'Venduto' || stato === 'Affittato') {
    const g = num(f.giorni)
    const lines = [`${stato}! ${head}${g ? `, ${stato.toLowerCase()} in ${g} giorni` : ''}.`, 'Grazie ai proprietari per la fiducia e a chi ha scelto questa casa.']
    if (social !== 'whatsapp') lines.push(tel ? `Hai una casa da ${rent ? 'affittare' : 'vendere'}? Chiamami al ${tel}.` : `Hai una casa da ${rent ? 'affittare' : 'vendere'}? Scrivimi.`)
    return [...lines, ...(social === 'whatsapp' ? [] : ['', tags.map(t => '#' + t).join(' ')])].join('\n')
  }

  const prezzo = num(f.prezzo)
  const dati = [
    prezzo ? `€ ${prezzo.toLocaleString('it-IT')}${rent ? ' al mese' : ''}` : '',
    num(f.mq) ? `${num(f.mq)} m²` : '',
    num(f.locali) ? `${num(f.locali)} locali` : '',
    num(f.bagni) ? `${num(f.bagni)} ${num(f.bagni) === 1 ? 'bagno' : 'bagni'}` : '',
  ].filter(Boolean).join(', ')
  const extra = [s(f.piano) ? `🏢 Piano ${s(f.piano)}` : '', s(f.classe_energetica) ? `⚡ Classe energetica ${s(f.classe_energetica)}` : ''].filter(Boolean)
  const cta = tel ? `📞 Per una visita chiamami al ${tel}` : '📩 Scrivimi per una visita'

  if (social === 'whatsapp') return [`🏡 ${head}`, dati, tel ? `Info e visite: ${tel}` : 'Scrivimi qui per info e visite'].filter(Boolean).join('\n')

  const body = intro(s(f.descrizione), social === 'facebook' || social === 'tiktok' ? 220 : 400)
  return [
    `🏡 ${head}`,
    dati ? `📐 ${dati}` : '',
    ...(social === 'tiktok' ? [] : extra),
    body ? `\n${body}` : '',
    '',
    cta,
    f.arredata === true ? 'Alcune immagini sono arredate virtualmente.' : '',
    '',
    tags.map(t => '#' + t).join(' '),
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n').trim()
}
