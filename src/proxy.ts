import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['it', 'en', 'es', 'fr', 'ru', 'uk'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'it';

// Dominio vetrina degli agenti (es. agenteimmo.me/mario-rossi): serve il portfolio
// /it/a/<slug> senza prefissi. Configurabile perche' il dominio cambiera'.
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = request.headers.get('host')?.split(':')[0].replace(/^www\./, '');
  if (PORTFOLIO_HOST && host === PORTFOLIO_HOST) {
    // ponytail: la root del dominio vetrina rimanda al sito, landing dedicata quando servira'.
    if (pathname === '/') return NextResponse.redirect('https://getnearme.it/it', 307);
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}/a${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Controlla se il pathname inizia con un locale supportato
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect alla versione localizzata di default (it)
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json
     * - assets folder
     * - files with extensions (.png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|assets/|api/|metrics|nfc|.*\\..*).*)",
  ],
};
