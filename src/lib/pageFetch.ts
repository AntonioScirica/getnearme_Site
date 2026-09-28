import { isPublicHttpsUrl } from '@/lib/safeUrl'
import type { Raw } from '@/lib/listingExtract'

// Pagina di un annuncio letta dal nostro server (quando l'agente non ha l'estensione), nello stesso formato
// grezzo dell'estensione: testo, JSON incorporati, meta, immagini.
// 1. richiesta diretta come un browser: basta per molti siti di agenzie;
// 2. se il sito blocca (403/429, captcha, pagina vuota): servizio di scraping con proxy, configurato con
//    SCRAPER_URL = indirizzo del servizio con {url} al posto dell'annuncio (es. ScraperAPI, ZenRows, ScrapingBee
//    con rendering JS e proxy italiani). Senza SCRAPER_URL resta solo la richiesta diretta.
// Solo pagine che sembrano annunci (prezzo + superficie): il server non diventa un proxy per qualsiasi pagina.
export type PageResult = { ok: true; raw: Raw; photos: string[]; title: string; via: 'direct' | 'scraper' } | { ok: false; error: 'blocked' | 'not_a_listing' | 'invalid_url' }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const BLOCKED = /captcha|are you a robot|verifica di sicurezza|access denied|attention required|pardon our interruption/i

async function get(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8' },
      redirect: 'follow', signal: AbortSignal.timeout(25_000),
    })
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('html')) return null
    return (await r.text()).slice(0, 3_000_000)
  } catch { return null }
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
  for (const u of [meta['og:image'], ...(flat.match(/https:\/\/[^"'\s)\\<>]+?\.(?:jpe?g|webp)(?:\?[^"'\s)\\<>]*)?/gi) ?? [])]) {
    if (!u || /logo|icon|avatar|sprite|placeholder|agency|agenzia|banner|badge/i.test(u)) continue
    const key = u.split('?')[0].replace(/\/[^/]*$/, '')
    if (seen.has(key)) continue
    seen.add(key); photos.push(u)
    if (photos.length >= 40) break
  }
  return { raw: { text, json, meta, images: photos }, photos, title: meta['og:title'] || title }
}

const looksReal = (h: string | null) => !!h && h.length > 5000 && !BLOCKED.test(h.slice(0, 20000))
const isListing = (text: string) => /[€$£]|\b(eur|euro)\b/i.test(text) && /\b(m²|m2|mq|metri quadr|sqm)/i.test(text)

export async function fetchListingPage(url: string): Promise<PageResult> {
  if (!isPublicHttpsUrl(url)) return { ok: false, error: 'invalid_url' }
  let html = await get(url), via: 'direct' | 'scraper' = 'direct'
  if (!looksReal(html) && process.env.SCRAPER_URL) {
    html = await get(process.env.SCRAPER_URL.replace('{url}', encodeURIComponent(url)))
    via = 'scraper'
  }
  if (!looksReal(html)) return { ok: false, error: 'blocked' }
  const p = parseHtml(html!)
  if (!isListing(p.raw.text ?? '')) return { ok: false, error: 'not_a_listing' }
  return { ok: true, ...p, via }
}
