import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['it', 'en', 'es', 'fr', 'ru', 'uk'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'it';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|assets/|api/|metrics|.*\\..*).*)",
  ],
};
