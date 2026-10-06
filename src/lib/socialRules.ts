// Limiti del testo di ogni social (Condividi sui social: api/platform/social-caption e il contatore nel popup), 06/10/2026.
// Numeri controllati il 06/10/2026 (fonti terze, le pagine di aiuto ufficiali non danno tutto):
// - Instagram: didascalia 2.200, si vedono le prime ~125 prima di "altro". Hashtag: dal 12/2025 Instagram ne accetta 5
//   per post (prima 30), quindi tetto 5.
// - Facebook: limite tecnico 63.206, ma sopra ~500 il testo si chiude: consigliato breve, 1-3 hashtag.
// - WhatsApp stato: 700 (il limite del testo dello stato; la didascalia della foto ne regge di piu', si tiene il piu' stretto),
//   niente hashtag.
// - TikTok: 4.000 per foto e caroselli di foto, 2.200 per i video; 3-6 hashtag.
// - LinkedIn: 3.000, si vedono le prime ~210; 3 hashtag.
// Si conta per grafemi (quello che si vede: un'emoji = 1, spazi e a capo compresi).
export type SocialId = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok' | 'linkedin'
export type SocialRule = {
  max: number // limite tecnico (oltre, il social non pubblica o taglia)
  ideal?: number // lunghezza consigliata (Facebook): il contatore la mostra, il server non taglia li'
  visible?: number // caratteri visibili prima di "altro"
  tags: [number, number] // hashtag consigliati, minimo e massimo (il massimo e' garantito dal server)
}
export const SOCIAL_RULES: Record<SocialId, SocialRule> = {
  instagram: { max: 2200, visible: 125, tags: [3, 5] },
  facebook: { max: 63206, ideal: 500, tags: [1, 3] },
  whatsapp: { max: 700, tags: [0, 0] },
  tiktok: { max: 4000, tags: [3, 6] },
  linkedin: { max: 3000, visible: 210, tags: [3, 3] },
}
export const TIKTOK_VIDEO_MAX = 2200
export const ruleOf = (id: SocialId, video = false): SocialRule => (id === 'tiktok' && video ? { ...SOCIAL_RULES.tiktok, max: TIKTOK_VIDEO_MAX } : SOCIAL_RULES[id])

const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('it', { granularity: 'grapheme' }) : null
const graphemes = (s: string) => (seg ? Array.from(seg.segment(s), x => x.segment) : Array.from(s))
export const countChars = (s: string) => graphemes(s).length
const TAG = /(^|[^\p{L}\p{N}_&])#[\p{L}\p{N}_]+/gu
export const countTags = (s: string) => (s.match(TAG) ?? []).length

// Il testo entro le regole del social: hashtag oltre il massimo tolti (restano i primi), poi, se e' troppo lungo,
// il corpo si taglia a frase intera (gli hashtag in fondo restano).
export function fitCaption(text: string, rule: SocialRule): string {
  let n = 0
  let t = text.replace(TAG, (m, pre: string) => (++n > rule.tags[1] ? pre : m))
  t = t.split('\n').map(l => l.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.;:!?])/g, '$1').replace(/[ \t]+$/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (countChars(t) <= rule.max) return t
  // righe di soli hashtag in fondo: restano intere
  const lines = t.split('\n')
  let k = lines.length
  while (k > 0 && (lines[k - 1].trim() === '' || /^(\s*#[\p{L}\p{N}_]+)+\s*$/u.test(lines[k - 1]))) k--
  const tail = lines.slice(k).join('\n').trim()
  const room = rule.max - (tail ? countChars(tail) + 2 : 0)
  const g = graphemes(lines.slice(0, k).join('\n')).slice(0, Math.max(0, room))
  const cut = g.join('')
  // ultima fine di frase (. ! ? … o a capo) nel pezzo che ci sta; se non c'e' (frase enorme) si chiude all'ultima parola
  let at = -1
  for (const m of cut.matchAll(/[.!?…](?=\s|$)|\n/g)) at = m.index! + (m[0] === '\n' ? 0 : 1)
  const body = (at > room * 0.3 ? cut.slice(0, at) : cut.replace(/\s+\S*$/, '').replace(/[\s,;:]+$/, '') + (cut.length ? '…' : '')).trim()
  const out = tail && room > 0 ? `${body}\n\n${tail}` : body
  return countChars(out) <= rule.max ? out : graphemes(out).slice(0, rule.max).join('')
}

// ponytail: controllo minimo, `npx tsx src/lib/socialRules.ts`
if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('socialRules.ts')) {
  const ig = SOCIAL_RULES.instagram
  const tags = Array.from({ length: 9 }, (_, i) => `#tag${i}`).join(' ')
  const a = fitCaption(`Casa bella 🏡👨‍👩‍👧.\n\n${tags}`, ig)
  console.assert(countTags(a) === 5 && a.includes('#tag4') && !a.includes('#tag5'), 'hashtag', a)
  console.assert(countChars('👨‍👩‍👧 a') === 3, 'grafemi')
  const long = Array.from({ length: 200 }, (_, i) => `Frase numero ${i} 🌿.`).join(' ')
  const b = fitCaption(`${long}\n\n#casa #roma`, ig)
  console.assert(countChars(b) <= 2200 && b.endsWith('#casa #roma') && /\.\n\n#casa/.test(b), 'taglio', b.slice(-60))
  const w = fitCaption('Ciao #casa, scrivimi. #roma', SOCIAL_RULES.whatsapp)
  console.assert(w === 'Ciao, scrivimi.', 'whatsapp', w)
  console.log('ok')
}
