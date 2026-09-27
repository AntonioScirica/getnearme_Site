import { allSitePages } from '@/lib/portfolio'

// sitemap.xml del dominio vetrina (agenteimmo.me/sitemap.xml, riscritto in next.config): tutte le pagine dei siti degli agenti
export const revalidate = 3600

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export async function GET() {
  const pages = await allSitePages()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `<url><loc>${esc(p.url)}</loc>${p.lastModified ? `<lastmod>${new Date(p.lastModified).toISOString()}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, s-maxage=3600' } })
}
