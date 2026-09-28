import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { immobiliare, type Raw } from '@/lib/listingExtract'
import { headlessRead } from '@/lib/headlessRead'

// Pagina di un annuncio letta dal nostro server, nello stesso formato grezzo: testo, JSON incorporati, meta, immagini.
// 1. il nostro Chromium headless (lib/headlessRead): apre la pagina, scorre e clicca le parti nascoste. Gratis, va sui
//    siti che non bloccano l'automazione (agenzie, subito, portali minori);
// 2. se il sito blocca (immobiliare, idealista, casa...): ZenRows in modalita' automatica, servizio esterno con i suoi
//    proxy e browser (ZENROWS_API_KEY). ~0,025 $ e ~25 s a pagina (prova su immobiliare del 28/09/2026). Li' non si
//    clicca, ma i portali grandi mettono l'annuncio intero (descrizione, caratteristiche, spese) nei dati JSON della pagina.
// Solo pagine che sembrano annunci (prezzo + superficie): il server non diventa un proxy per qualsiasi pagina.
export type PageResult = { ok: true; raw: Raw; photos: string[]; title: string; via: 'headless' | 'zenrows'; fields?: Record<string, unknown> } | { ok: false; error: 'blocked' | 'not_a_listing' | 'invalid_url' }


async function zenrows(url: string): Promise<string | null> {
  const key = process.env.ZENROWS_API_KEY
  if (!key) return null
  try {
    const r = await fetch(`https://api.zenrows.com/v1/?apikey=${key}&url=${encodeURIComponent(url)}&mode=auto`, { signal: AbortSignal.timeout(150_000) })
    if (!r.ok) { console.error('zenrows', r.status, (await r.text()).slice(0, 200)); return null }
    return (await r.text()).slice(0, 5_000_000)
  } catch (e) { console.error('zenrows', e); return null }
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
// immagini senza doppioni, loghi e icone (anche per quelle trovate dal copione headless)
const cleanPhotos = (urls: string[]) => {
  const seen = new Set<string>()
  return urls.filter(u => /^https:\/\//.test(u) && !/logo|icon|avatar|sprite|placeholder|agency|agenzia|banner|badge/i.test(u)
    && !seen.has(u.split('?')[0]) && seen.add(u.split('?')[0])).slice(0, 40)
}

export async function fetchListingPage(url: string): Promise<PageResult> {
  if (!isPublicHttpsUrl(url)) return { ok: false, error: 'invalid_url' }
  // portali che bloccano sempre l'automazione (provato il 28/09/2026): dritti a ZenRows, senza perdere tempo col nostro browser
  const blocked = /(^|\.)(immobiliare\.it|idealista\.it|idealista\.com|casa\.it)$/i.test(new URL(url).hostname)
  const h = blocked ? null : await headlessRead(url)
  if (h && isPublicHttpsUrl(h.finalUrl)) {
    if (!isListing(h.raw.text ?? '')) return { ok: false, error: 'not_a_listing' }
    const photos = cleanPhotos(h.raw.images ?? [])
    return { ok: true, raw: h.raw, photos, title: h.raw.meta?.['og:title'] || h.raw.meta?.title || '', via: 'headless' }
  }
  const html = await zenrows(url)
  if (!html || html.length < 5000) return { ok: false, error: 'blocked' }
  const p = parseHtml(html)
  if (!isListing(p.raw.text ?? '')) return { ok: false, error: 'not_a_listing' }
  // immobiliare: le foto vere (tutte, grandi) dai dati dell'annuncio, non quelle trovate nell'HTML
  const imm = immobiliare(html)
  return { ok: true, ...p, photos: imm?.photos.length ? imm.photos : p.photos, title: imm?.fields.titolo || p.title, via: 'zenrows', fields: imm ? { ...imm.fields, _fonte: 'immobiliare' } : undefined }
}
