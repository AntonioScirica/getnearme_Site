import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['it', 'en', 'es', 'fr', 'ru', 'uk'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'it';

const languageMapping: Record<string, Locale> = {
  it: "it",
  en: "en",
  es: "es",
  fr: "fr",
  ru: "ru",
  uk: "uk",
  ua: "uk",
};

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get("accept-language");
  
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, priority = "q=1"] = lang.trim().split(";");
        const q = parseFloat(priority.replace("q=", "")) || 1;
        return { code: code.split("-")[0].toLowerCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    for (const { code } of languages) {
      if (languageMapping[code]) {
        return languageMapping[code];
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Controlla se il pathname inizia con un locale supportato
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect alla versione localizzata
  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  
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
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|assets/|.*\\..*).*)",
  ],
};

