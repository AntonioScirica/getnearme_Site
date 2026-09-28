import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { immobiliare, type Raw } from '@/lib/listingExtract'

// Pagina di un annuncio letta dal nostro server tramite ZenRows (servizio esterno con i suoi proxy e browser,
// ZENROWS_API_KEY), in modalita' automatica: sceglie da solo quanto "pesante" andare, anche per i portali che bloccano
// (immobiliare, idealista, casa). ~0,025 $ e 15-90 s a pagina sui portali (prove del 28/09/2026).
// Formato grezzo: testo, JSON incorporati, meta, immagini; immobiliare letto con precisione dai dati della pagina.
// Solo pagine che sembrano annunci (prezzo + superficie): il server non diventa un proxy per qualsiasi pagina.
export type PageResult = { ok: true; raw: Raw; photos: string[]; title: string; via: 'zenrows'; fields?: Record<string, unknown> } | { ok: false; error: 'blocked' | 'not_a_listing' | 'invalid_url' }


// ZenRows a volte scade o risponde a vuoto (2 su 7 nelle prove del 28/09/2026): si ritenta finche' c'e' tempo,
// ogni tentativo al massimo 90 s, entro il tempo della funzione (read-listing, 200 s). Il browser poi ritenta a sua volta.
async function zenrows(url: string, budgetMs = 170_000): Promise<string | null> {
  const key = process.env.ZENROWS_API_KEY
  if (!key) return null
  const end = Date.now() + budgetMs
  while (end - Date.now() > 30_000) {
    try {
      const r = await fetch(`https://api.zenrows.com/v1/?apikey=${key}&url=${encodeURIComponent(url)}&mode=auto`, { signal: AbortSignal.timeout(Math.min(90_000, end - Date.now())) })
      const html = r.ok ? await r.text() : ''
      if (r.ok && html.length > 5000) return html.slice(0, 5_000_000)
      console.error('zenrows', r.status, html.slice(0, 200))
      if (r.status === 404 || r.status === 401 || r.status === 402) return null // annuncio inesistente o account: ritentare non serve
    } catch (e) { console.error('zenrows', e) }
  }
  return null
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

const isListing = (text: string) => /[€$£]|\b(eur|euro)\b/i.test(text) && /\b(m²|m2|mq|metri quadr|sqm)/i.test(text)

export async function fetchListingPage(url: string): Promise<PageResult> {
  if (!isPublicHttpsUrl(url)) return { ok: false, error: 'invalid_url' }
  const html = await zenrows(url)
  if (!html || html.length < 5000) return { ok: false, error: 'blocked' }
  const p = parseHtml(html)
  if (!isListing(p.raw.text ?? '')) return { ok: false, error: 'not_a_listing' }
  // immobiliare: le foto vere (tutte, grandi) dai dati dell'annuncio, non quelle trovate nell'HTML
  const imm = immobiliare(html)
  return { ok: true, ...p, photos: imm?.photos.length ? imm.photos : p.photos, title: imm?.fields.titolo || p.title, via: 'zenrows', fields: imm ? { ...imm.fields, _fonte: 'immobiliare' } : undefined }
}
