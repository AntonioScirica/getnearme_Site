import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { idealista, immobiliare, type Raw } from '@/lib/listingExtract'

// Pagina di un annuncio letta dal nostro server tramite ZenRows (servizio esterno con i suoi proxy e browser,
// ZENROWS_API_KEY), in modalita' automatica: sceglie da solo quanto "pesante" andare, anche per i portali che bloccano
// (immobiliare, idealista, casa). ~0,025 $ e 15-90 s a pagina sui portali (prove del 28/09/2026).
// Formato grezzo: testo, JSON incorporati, meta, immagini; immobiliare letto con precisione dai dati della pagina.
// Solo pagine che sembrano annunci (prezzo + superficie): il server non diventa un proxy per qualsiasi pagina.
export type PageResult = { ok: true; raw: Raw; photos: string[]; title: string; via: 'zenrows'; fields?: Record<string, unknown> } | { ok: false; error: 'blocked' | 'not_a_listing' | 'invalid_url' }


// Impostazioni di ZenRows per sito, nell'ordine in cui provarle (prove del 28/09/2026 su annunci veri):
// - immobiliare: modalita' automatica (15-90 s); con proxy premium italiani falliva;
// - idealista: browser + proxy premium italiani + attesa della descrizione (6 s); la modalita' automatica restituiva
//   la pagina di verifica, vuota, dopo 160 s;
// - altri siti: automatica, poi browser + premium con 3 s di attesa (JS caricato: legge anche le parti caricate dopo).
// Si passa alla successiva se la risposta e' vuota o una pagina di verifica: l'agente non vede niente.
const PREMIUM = 'js_render=true&premium_proxy=true&proxy_country=it'
function plans(url: string): string[] {
  const host = new URL(url).hostname
  if (/(^|\.)idealista\.(it|com)$/.test(host)) return [`${PREMIUM}&wait_for=${encodeURIComponent('.adCommentsLanguage, .comment')}`, 'mode=auto']
  if (/(^|\.)immobiliare\.it$/.test(host)) return ['mode=auto', `js_render=true&premium_proxy=true&wait=3000`]
  return ['mode=auto', `${PREMIUM}&wait=3000`]
}
// pagina vera: abbastanza HTML e testo con prezzo e superficie (le pagine di verifica hanno solo il titolo)
const real = (html: string) => html.length > 20_000 && isListing(parseHtml(html).raw.text ?? '')

// ZenRows a volte scade o risponde a vuoto (2 su 7 nelle prove): si gira sulle impostazioni finche' c'e' tempo,
// ogni tentativo al massimo 90 s, entro il tempo della funzione (read-listing, 200 s). Il browser poi ritenta a sua volta.
async function zenrows(url: string, budgetMs = 170_000): Promise<string | null> {
  const key = process.env.ZENROWS_API_KEY
  if (!key) return null
  const end = Date.now() + budgetMs, list = plans(url)
  let last: string | null = null
  for (let i = 0; end - Date.now() > 20_000 && i < 5; i++) {
    const q = list[i % list.length]
    try {
      // attesa di un elemento (wait_for): se c'e' risponde in pochi secondi, se no aspetterebbe fino alla fine, quindi 45 s
      const cap = q.includes('wait_for') ? 45_000 : 90_000
      const r = await fetch(`https://api.zenrows.com/v1/?apikey=${key}&url=${encodeURIComponent(url)}&${q}`, { signal: AbortSignal.timeout(Math.min(cap, end - Date.now())) })
      const html = r.ok ? await r.text() : ''
      if (r.ok && real(html)) return html.slice(0, 5_000_000)
      if (r.ok && html.length > 5000) last = html // pagina vera ma forse non un annuncio: si tiene per il controllo finale
      console.error('zenrows', q.slice(0, 30), r.status, html.length)
      if (r.status === 404 || r.status === 401 || r.status === 402) break // annuncio inesistente o account: ritentare non serve
    } catch (e) { console.error('zenrows', e) }
  }
  return last
}

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))

export function parseHtml(html: string): { raw: Raw; photos: string[]; title: string } {
  const meta: Record<string, string> = {}
  for (const m of html.matchAll(/<meta\s+[^>]*(?:property|name)=["'](og:[\w:]+|description)["'][^>]*>/gi)) {
    const c = m[0].match(/content=["']([^"']*)["']/i)?.[1]
    if (c) meta[m[1]] = decode(c).slice(0, 1000)
  }
  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim()
  meta.title = title
  const json = [...html.matchAll(/<script[^>]*type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi), ...html.matchAll(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(t => t.length > 50).join('\n').slice(0, 150_000)
  const text = decode(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim().slice(0, 60_000)
  // immagini come l'estensione: og:image e URL jpg/webp nell'HTML (gallerie caricate dopo), senza loghi e icone
  const flat = html.replace(/\\u002F/gi, '/').replace(/\\\//g, '/')
  const seen = new Set<string>(), photos: string[] = []
  // anche le immagini senza estensione (CDN con parametri, es. subito): src, data-src e la taglia piu' grande di srcset
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].flatMap(m => {
    const at = (n: string) => m[0].match(new RegExp(`\\s${n}=["']([^"']+)["']`, 'i'))?.[1]
    const set = (at('srcset') || at('data-srcset'))?.split(',').map(x => x.trim().split(' ')[0]).filter(Boolean) ?? []
    return [set[set.length - 1], at('data-src'), at('src')].filter((u): u is string => !!u && u.startsWith('https://')).map(decode)
  })
  for (const u of [meta['og:image'], ...imgs, ...(flat.match(/https:\/\/[^"'\s)\\<>]+?\.(?:jpe?g|webp)(?:\?[^"'\s)\\<>]*)?/gi) ?? [])]) {
    if (!u || /logo|icon|avatar|sprite|placeholder|agency|agenzia|banner|badge|\.svg|\.gif/i.test(u)) continue
    // stessa foto in piu' taglie: su immobiliare cambia l'ultimo pezzo (/image/ID/xxl.jpg), altrove l'ID e' l'ultimo pezzo
    const path = u.split('?')[0], last = path.split('/').pop() ?? ''
    const key = /[0-9a-f]{8,}|\d{6,}/i.test(last) ? path.replace(/\.(jpe?g|webp|png)$/i, '') : path.replace(/\/[^/]*$/, '')
    if (seen.has(key)) continue
    seen.add(key); photos.push(u)
    if (photos.length >= 40) break
  }
  return { raw: { text, json, meta, images: photos }, photos, title: meta['og:title'] || title }
}

const isListing = (text: string) => /[€$£]|\b(eur|euro)\b/i.test(text) && /\b(m²|m2|mq|metri quadr|sqm)/i.test(text)

export async function fetchListingPage(url: string): Promise<PageResult> {
  if (!isPublicHttpsUrl(url)) return { ok: false, error: 'invalid_url' }
  const html = await zenrows(url)
  if (!html || html.length < 5000) return { ok: false, error: 'blocked' }
  const p = parseHtml(html)
  if (!isListing(p.raw.text ?? '')) return { ok: false, error: 'not_a_listing' }
  // portali letti con precisione: campi e foto vere (tutte, grandi) dai dati dell'annuncio, non dall'HTML generico
  const imm = immobiliare(html), ide = imm ? null : idealista(html)
  const portal = imm ? { ...imm, fonte: 'immobiliare' } : ide ? { ...ide, fonte: 'idealista' } : null
  return {
    ok: true, ...p, via: 'zenrows',
    photos: portal?.photos.length ? portal.photos : p.photos,
    title: portal?.fields.titolo || p.title,
    fields: portal ? { ...portal.fields, _fonte: portal.fonte } : undefined,
  }
}
