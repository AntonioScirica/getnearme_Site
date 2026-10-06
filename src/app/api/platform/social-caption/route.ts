import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateJson, overDailyCap } from '@/lib/ai'
import { geminiFreeJson } from '@/lib/geminiFree'
import { deepProfanity } from '@/lib/profanity'
import { fitCaption, ruleOf, SOCIAL_RULES, type SocialId } from '@/lib/socialRules'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const maxDuration = 60

// Testo del post social di un immobile (Condividi sui social, scheda dell'immobile). Gratis per l'agente: prima Gemini a
// quota gratuita (costo 0), se manca la chiave o la quota e' finita Haiku 4.5. Un testo e' ~1.500 token in entrata e ~400 in
// uscita, cioe' ~0,4 centesimi di dollaro con Haiku: sotto il centesimo, non vale un credito (deciso il 05/10/2026).
// Tetto giornaliero per utente, come per Riscrivi.
// Il testo cambia col social scelto nel popup (una richiesta per social, il client tiene la copia).
// Limiti di ogni social (lib/socialRules): passati all'AI e garantiti qui (hashtag in eccesso tolti, taglio a frase intera).
const TONE: Record<SocialId, string> = {
  instagram: 'Instagram: emoji sobrie.',
  facebook: 'Facebook: tono cordiale, poche emoji, testo breve che si legga senza aprire "altro".',
  whatsapp: "Stato di WhatsApp: BREVE, al massimo 4 righe, una o due emoji, niente hashtag, l'invito a scrivere qui.",
  tiktok: 'TikTok: breve e diretto, al massimo 5 righe di testo prima degli hashtag.',
  linkedin: 'LinkedIn: tono professionale, al massimo 2 emoji in tutto, punti forti in elenco con trattino corto, hashtag professionali (esempio #immobiliare #realestate e la citta\').',
}
const it = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
function rulesText(id: SocialId, video: boolean) {
  const r = ruleOf(id, video)
  const len = r.ideal ? `stai sotto i ${it(r.ideal)} caratteri in tutto` : `al massimo ${it(Math.min(r.max, id === 'whatsapp' ? 600 : 1200))} caratteri in tutto (limite del social ${it(r.max)}, spazi ed emoji compresi)`
  const tags = r.tags[1] === 0 ? 'niente hashtag' : r.tags[0] === r.tags[1] ? `esattamente ${r.tags[1]} hashtag in fondo` : `da ${r.tags[0]} a ${r.tags[1]} hashtag in fondo, mai di piu'`
  const vis = r.visible ? ` Si vedono solo i primi ${r.visible} caratteri prima di "altro": la prima riga, entro ${r.visible} caratteri, e' la frase piu' forte (tipologia, zona e il punto di forza principale).` : ''
  return `${TONE[id]} Regole: ${len}; ${tags}.${vis}`
}
const SYSTEM = `Sei un agente immobiliare italiano che scrive il testo di un post social per una casa della sua agenzia.
Rispondi SOLO con un oggetto JSON con la chiave "testo".
- Italiano, tono da agente di zona: cordiale, concreto, credibile, niente superlativi da pubblicità.
- Struttura: una riga d'apertura forte con tipologia, zona e il punto di forza principale; una riga con prezzo, metri quadri e locali; 3 o 4 punti forti presi SOLO dai dati e dalla descrizione (uno per riga, ognuno con una emoji sobria all'inizio, ad esempio 🏡 📐 🛏️ 🛁 🌿 ☀️ 🚗 📍); una riga d'invito a scrivere o chiamare per una visita; una riga vuota; gli hashtag in minuscolo con la città, la zona e la tipologia (esempio #casamilano #navigli #trilocale).
- Non inventare nulla che non sia nei dati. Se c'e' il telefono, mettilo nell'invito.
- Se arredata e' vera, aggiungi prima degli hashtag la riga "Alcune immagini sono arredate virtualmente."
- Niente em dash e niente trattini a meta' frase, usa virgole. Prezzi sempre scritti cosi': € 260.000. Niente link.
- In fondo ai dati c'e' il social con le sue regole (lunghezza, righe visibili, emoji, numero di hashtag): valgono sopra quelle qui sopra e vanno rispettate alla lettera.`
const SCHEMA = { type: 'object', properties: { testo: { type: 'string' } }, required: ['testo'], additionalProperties: false }
type Out = { testo: string }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: { fields?: Record<string, unknown>; social?: string; video?: boolean }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const text = JSON.stringify(b.fields ?? null)
  if (!b.fields || typeof b.fields !== 'object' || text.length > 12000) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (await overDailyCap(data.user.id, ['social_caption'], Number(process.env.SOCIAL_CAPTION_DAILY_LIMIT) || 40)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })

  const social: SocialId = typeof b.social === 'string' && b.social in SOCIAL_RULES ? b.social as SocialId : 'instagram'
  const video = b.video === true // TikTok: 2.200 caratteri se il post e' il video, 4.000 per le foto
  // testi dei portali con entita' HTML (&nbsp; &amp;): si decodificano prima di darli all'AI
  // (il client li pulisce gia', qui e' la rete di sicurezza): numeriche (&#8211; &#x2019;) e le nominate piu' comuni;
  // il carattere torna dentro una stringa JSON, quindi virgolette e barre si riscrivono con l'escape
  const NAMED: Record<string, string> = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: ' ', gt: ' ', ndash: ',', mdash: ',', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026', euro: '\u20ac', agrave: '\u00e0', egrave: '\u00e8', eacute: '\u00e9', igrave: '\u00ec', ograve: '\u00f2', ugrave: '\u00f9', deg: '\u00b0', sup2: '\u00b2' }
  const ent = (m: string, n: string) => {
    const cp = n[0] === '#' ? Number(n[1] === 'x' || n[1] === 'X' ? '0x' + n.slice(2) : n.slice(1)) : 0
    const c = n[0] === '#' ? String.fromCodePoint(cp > 31 && cp <= 0x10ffff ? cp : 32) : NAMED[n.toLowerCase()]
    if (c === undefined) return m
    const v = c === '\u00a0' || c === '\u2013' || c === '\u2014' ? (c === '\u00a0' ? ' ' : ',') : c
    return JSON.stringify(v).slice(1, -1)
  }
  let plain = text
  for (let k = 0; k < 2; k++) plain = plain.replace(/&(#x?[0-9a-f]{1,6}|[a-z]{2,8}\d?);/gi, ent)
  plain = plain.replace(/<[^>]{0,200}>/g, ' ')
  const input = `Dati dell'immobile (JSON):\n${plain}\n\nSocial: ${social}. ${rulesText(social, video)}`
  const ok = (o: Partial<Out> | null): o is Out => !!o && typeof o.testo === 'string' && !!o.testo.trim() && !deepProfanity(o)
  // prezzi sempre "€ 260.000" e niente " - " a meta' riga (i punti elenco a inizio riga restano)
  const euro = (n: string) => `€ ${Number(n.replace(/\D/g, '')).toLocaleString('it-IT')}`
  const clean = (s: string) => s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/(\S) - (\S)/g, '$1, $2')
    .replace(/€\s*(\d{1,3}(?:[.\s]\d{3})+|\d{4,})/g, (_, n) => euro(n))
    .replace(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,})\s*(?:€|euro\b|EUR\b)/gi, (_, n) => euro(n))
    .trim()
  const fit = (s: string) => fitCaption(clean(s), ruleOf(social, video))

  const free = await geminiFreeJson<Out>({ system: SYSTEM, text: input, userId: data.user.id, kind: 'social_caption', maxTokens: 1500 })
  if (ok(free)) return NextResponse.json({ testo: fit(free.testo) })
  const r = await generateJson<Out>({ system: SYSTEM, text: input, schema: SCHEMA, maxTokens: 1200, usage: { userId: data.user.id, kind: 'social_caption' }, model: 'claude-haiku-4-5-20251001' })
  if (!r.ok || !ok(r.data)) { console.error('social-caption', r.ok ? 'vuoto' : `${r.error} ${r.detail ?? ''}`.slice(0, 400)); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }
  return NextResponse.json({ testo: fit(r.data.testo) })
}
