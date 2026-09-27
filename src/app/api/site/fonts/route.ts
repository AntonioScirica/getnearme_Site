import { NextRequest } from 'next/server'
import { FONTS } from '@/lib/siteTemplates'

// Font dei titoli dei siti degli agenti da Google Fonts, ma serviti da noi: CSS e file passano di qui,
// i visitatori non contattano Google. Solo i font della lista FONTS; file solo da fonts.gstatic.com.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36' // per avere woff2
const CACHE = 'public, max-age=86400, s-maxage=2592000'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const file = q.get('file')
  if (file) {
    if (!/^[\w\-./]+\.woff2$/.test(file) || file.includes('..')) return new Response('bad request', { status: 400 })
    const r = await fetch(`https://fonts.gstatic.com/${file}`, { signal: AbortSignal.timeout(10000) }).catch(() => null)
    if (!r?.ok) return new Response('not found', { status: 404 })
    return new Response(r.body, { headers: { 'Content-Type': 'font/woff2', 'Cache-Control': `${CACHE}, immutable` } })
  }
  const fs = FONTS.filter(f => (q.get('ids') ?? '').split(',').includes(f.id))
  if (!fs.length) return new Response('', { headers: { 'Content-Type': 'text/css' } })
  const url = `https://fonts.googleapis.com/css2?${fs.map(f => `family=${f.family.replace(/ /g, '+')}:wght@${f.weight}`).join('&')}&display=swap`
  const css = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) }).then(r => (r.ok ? r.text() : '')).catch(() => '')
  const local = css.replace(/https:\/\/fonts\.gstatic\.com\/([^)'"\s]+)/g, (_, f) => `/api/site/fonts?file=${encodeURIComponent(f)}`)
  return new Response(local, { headers: { 'Content-Type': 'text/css', 'Cache-Control': css ? CACHE : 'no-store' } })
}
