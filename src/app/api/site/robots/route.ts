// robots.txt del dominio vetrina (agenteimmo.me/robots.txt, riscritto in next.config)
export function GET() {
  const host = process.env.NEXT_PUBLIC_PORTFOLIO_HOST
  return new Response(`User-agent: *\nAllow: /\n${host ? `\nSitemap: https://${host}/sitemap.xml\n` : ''}`, { headers: { 'Content-Type': 'text/plain' } })
}
