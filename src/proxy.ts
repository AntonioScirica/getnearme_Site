import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isReserved } from "@/lib/reservedPaths";

const locales = ['it', 'en', 'es', 'fr', 'ru', 'uk'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'it';

// agenteimmo.me: piattaforma e siti degli agenti sullo stesso dominio.
// /<lingua>/... = pagine della piattaforma; /<slug>/... = sito dell'agente (riscritto su /it/a/<slug>/...).
// Il vecchio dominio (getnearme.it) rimanda qui con 301, stesso percorso (le /api non passano dal proxy: estensione e webhook restano vivi).
const PORTFOLIO_HOST = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
const OLD_HOST = 'getnearme.it';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = request.headers.get('host')?.split(':')[0].replace(/^www\./, '');
  if (PORTFOLIO_HOST && host === OLD_HOST) {
    return NextResponse.redirect(`https://${PORTFOLIO_HOST}${pathname}${request.nextUrl.search}`, 301);
  }

  // Controlla se il pathname inizia con un locale supportato
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  const first = pathname.split('/')[1] ?? '';
  if (PORTFOLIO_HOST && host === PORTFOLIO_HOST && !pathnameHasLocale && first && !isReserved(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}/a${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect alla versione localizzata. Solo la home senza lingua segue il browser: italiano (o nessuna lingua,
  // come i crawler) -> /it, qualsiasi altra lingua -> /en. Il resto va sempre in italiano.
  const url = request.nextUrl.clone();
  const accept = request.headers.get('accept-language')?.trim().toLowerCase() ?? '';
  const lang = pathname === '/' && accept && !accept.startsWith('it') ? 'en' : defaultLocale;
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;

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
